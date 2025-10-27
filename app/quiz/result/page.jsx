'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ====================== أدوات عامة ====================== */
function Modal({ open, title, actions, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:static print:p-0">
      <div className="absolute inset-0 bg-black/40 print:hidden" onClick={onClose} />
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-xl p-6 print:shadow-none print:rounded-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#1e7850]">{title}</h3>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 print:hidden"
            >
              ✖ إغلاق
            </button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto print:max-h-none">{children}</div>
      </div>
    </div>
  );
}

// QuickChart helper (بدون مكتبات)
function chartURL(config) {
  const base = 'https://quickchart.io/chart';
  const c = encodeURIComponent(JSON.stringify(config));
  return `${base}?c=${c}&backgroundColor=transparent&devicePixelRatio=2`;
}

// تحميل jsPDF من CDN فقط عند الحاجة
async function loadJsPDF() {
  if (typeof window === 'undefined') return null;
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src =
      'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.onload = res;
    s.onerror = rej;
    document.body.appendChild(s);
  });
  return window.jspdf?.jsPDF || null;
}

// جلب صورة كـ DataURL لإدراجها في PDF
async function urlToDataURL(url) {
  try {
    const resp = await fetch(url, { cache: 'no-cache' });
    const blob = await resp.blob();
    return await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// مشاركة/تنزيل ملف Blob
async function saveOrShareBlob(blob, filename, title = 'Tajweedy') {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title, files: [file] });
      return;
    } catch {
      /* تجاهل وإلى التنزيل */
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// CSV بسيط
function toCSV(rows) {
  const esc = (v) =>
    `"${String(v ?? '').replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

/* ====================== الهوية اللونية ====================== */
const COLORS = {
  primary: '#1e7850',
  primaryDark: '#155c3e',
  blue: '#2563eb',
  red: '#ef4444',
  gray: '#64748b',
};

/* ====================== الصفحة ====================== */
export default function ResultPage() {
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [qrSrc, setQrSrc] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);

  // Modals
  const [openQ, setOpenQ] = useState(false);
  const [openSec, setOpenSec] = useState(false);
  const [openProg, setOpenProg] = useState(false);

  // Chart URLs
  const [chartBest, setChartBest] = useState('');
  const [chartWorst, setChartWorst] = useState('');
  const [chartSections, setChartSections] = useState('');
  const [chartTimeline, setChartTimeline] = useState('');

  // حمل آخر محاولة + الكل من localStorage
  useEffect(() => {
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    setAllAttempts(attempts);
    const last = attempts[attempts.length - 1];
    if (last) {
      setAttempt(last);
      setAttemptId(last.id || '');
      setScore(Number(last.score || 0));
      setTotal(Number(last.total || 0));
    }
  }, []);

  const percentage = total ? Math.round((score / total) * 100) : 0;

  // رابط التقرير
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !attemptId) return '';
    return `${window.location.origin}/quiz/report/${attemptId}`;
  }, [attemptId]);

  // QR مع شعار
  useEffect(() => {
    if (!reportUrl || typeof window === 'undefined') return;
    const logo = `${window.location.origin}/logo.png`;
    const services = [
      `https://quickchart.io/qr?text=${encodeURIComponent(
        reportUrl
      )}&size=300&centerImageUrl=${encodeURIComponent(
        logo
      )}&centerImageSizeRatio=0.25&margin=2`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=300&margin=2`,
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        reportUrl
      )}`,
    ];
    let i = 0;
    const tryNext = () => {
      if (i >= services.length) return setQrSrc('');
      const url = services[i++];
      const img = new Image();
      img.onload = () => setQrSrc(url);
      img.onerror = tryNext;
      img.referrerPolicy = 'no-referrer';
      img.src = url;
    };
    tryNext();
  }, [reportUrl]);

  /* ------------------ تجميع الإحصاءات ------------------ */
  const aggregates = useMemo(() => {
    const byQ = new Map();
    const bySec = new Map();
    const timeline = [];

    for (const att of allAttempts) {
      const qs = Array.isArray(att?.questions) ? att.questions : [];
      const ans = Array.isArray(att?.answers) ? att.answers : [];
      const n = Math.min(qs.length, ans.length);

      timeline.push({
        id: att.id,
        date: att.date,
        score: Number(att.score || 0),
        total: Number(att.total || n || 0),
      });

      for (let i = 0; i < n; i++) {
        const q = qs[i] || {};
        const user = Number(ans[i]);
        const correct = Number(q?.answer);
        const isRight = user === correct;

        const keyQ = (q?.question || `سؤال ${i + 1}`).trim();
        if (!byQ.has(keyQ))
          byQ.set(keyQ, {
            section: q?.section || 'غير محدد',
            subsection: q?.subsection || 'غير محدد',
            right: 0,
            wrong: 0,
          });
        byQ.get(keyQ)[isRight ? 'right' : 'wrong']++;

        const keyS = (q?.section || 'غير محدد').trim();
        if (!bySec.has(keyS))
          bySec.set(keyS, { right: 0, wrong: 0, subs: new Map() });
        const s = bySec.get(keyS);
        s[isRight ? 'right' : 'wrong']++;
        const sub = (q?.subsection || 'غير محدد').trim();
        if (!s.subs.has(sub)) s.subs.set(sub, { right: 0, wrong: 0 });
        s.subs.get(sub)[isRight ? 'right' : 'wrong']++;
      }
    }

    const qArr = Array.from(byQ.entries()).map(([question, v]) => {
      const total = v.right + v.wrong;
      return {
        question,
        section: v.section,
        subsection: v.subsection,
        right: v.right,
        wrong: v.wrong,
        total,
        pct: total ? Math.round((v.right / total) * 100) : 0,
      };
    });

    qArr.sort((a, b) => (a.pct === b.pct ? b.total - a.total : b.pct - a.pct));

    const sArr = Array.from(bySec.entries()).map(([section, v]) => {
      const total = v.right + v.wrong;
      const subs = Array.from(v.subs.entries()).map(([subsection, r]) => {
        const t = r.right + r.wrong;
        return {
          subsection,
          right: r.right,
          wrong: r.wrong,
          total: t,
          pct: t ? Math.round((r.right / t) * 100) : 0,
        };
      });
      subs.sort((a, b) => b.pct - a.pct);
      return {
        section,
        right: v.right,
        wrong: v.wrong,
        total,
        pct: total ? Math.round((v.right / total) * 100) : 0,
        subs,
      };
    });
    sArr.sort((a, b) => b.pct - a.pct);

    const tl = timeline
      .map((t) => ({
        ...t,
        pct: t.total ? Math.round((t.score / t.total) * 100) : 0,
      }))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

    return { qArr, sArr, tl };
  }, [allAttempts]);

  /* ------------------ توليد الروابط البيانية ------------------ */
  useEffect(() => {
    if (aggregates.qArr.length) {
      const best = aggregates.qArr.slice(0, 10).reverse();
      setChartBest(
        chartURL({
          type: 'bar',
          data: {
            labels: best.map((q) => (q.question.length > 22 ? q.question.slice(0, 22) + '…' : q.question)),
            datasets: [{ data: best.map((q) => q.pct), backgroundColor: COLORS.primary, borderRadius: 8 }],
          },
          options: {
            indexAxis: 'y',
            plugins: { legend: { display: false }, title: { display: true, text: 'أفضل 10 أسئلة', color: COLORS.primaryDark } },
            scales: { x: { min: 0, max: 100 }, y: {} },
          },
        })
      );

      const worst = [...aggregates.qArr]
        .sort((a, b) => a.pct - b.pct || b.total - a.total)
        .slice(0, 10)
        .reverse();
      setChartWorst(
        chartURL({
          type: 'bar',
          data: {
            labels: worst.map((q) => (q.question.length > 22 ? q.question.slice(0, 22) + '…' : q.question)),
            datasets: [{ data: worst.map((q) => q.pct), backgroundColor: COLORS.red, borderRadius: 8 }],
          },
          options: {
            indexAxis: 'y',
            plugins: { legend: { display: false }, title: { display: true, text: 'أضعف 10 أسئلة', color: COLORS.primaryDark } },
            scales: { x: { min: 0, max: 100 }, y: {} },
          },
        })
      );
    } else {
      setChartBest('');
      setChartWorst('');
    }

    if (aggregates.sArr.length) {
      const top = aggregates.sArr.slice(0, 8);
      setChartSections(
        chartURL({
          type: 'bar',
          data: {
            labels: top.map((s) => (s.section.length > 18 ? s.section.slice(0, 18) + '…' : s.section)),
            datasets: [
              { label: 'صحيح', data: top.map((s) => s.right), backgroundColor: COLORS.primary, stack: 'tot', borderRadius: 6 },
              { label: 'خطأ', data: top.map((s) => s.wrong), backgroundColor: COLORS.red, stack: 'tot', borderRadius: 6 },
            ],
          },
          options: {
            plugins: { title: { display: true, text: 'الأقسام (صحيح/خطأ)', color: COLORS.primaryDark } },
            scales: { x: {}, y: {} },
          },
        })
      );
    } else {
      setChartSections('');
    }

    if (aggregates.tl.length) {
      setChartTimeline(
        chartURL({
          type: 'line',
          data: {
            labels: aggregates.tl.map((t, i) =>
              t.date ? new Date(t.date).toLocaleDateString('ar-EG') : `محاولة ${i + 1}`
            ),
            datasets: [
              { label: 'النسبة %', data: aggregates.tl.map((t) => t.pct), fill: false, borderColor: COLORS.blue, tension: 0.3 },
            ],
          },
          options: {
            plugins: { title: { display: true, text: 'تقدّم المتدرّب', color: COLORS.primaryDark } },
            scales: { y: { min: 0, max: 100 }, x: {} },
          },
        })
      );
    } else {
      setChartTimeline('');
    }
  }, [aggregates]);

  /* ------------------ تصدير CSV ------------------ */
  const exportQuestionsCSV = async () => {
    const rows = [
      ['السؤال', 'القسم', 'الجزء الفرعي', 'صحيح', 'خطأ', 'المجموع', 'النسبة %'],
      ...aggregates.qArr.map((q) => [
        q.question,
        q.section,
        q.subsection,
        q.right,
        q.wrong,
        q.total,
        q.pct,
      ]),
    ];
    const csv = toCSV(rows);
    await saveOrShareBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'tajweedy-questions.csv', 'إحصاءات الأسئلة');
  };

  const exportSectionsCSV = async () => {
    const rows = [['القسم', 'الجزء الفرعي', 'صحيح', 'خطأ', 'المجموع', 'النسبة %']];
    for (const s of aggregates.sArr) {
      if (!s.subs.length) rows.push([s.section, '-', s.right, s.wrong, s.total, s.pct]);
      for (const sub of s.subs) {
        rows.push([s.section, sub.subsection, sub.right, sub.wrong, sub.total, sub.pct]);
      }
    }
    const csv = toCSV(rows);
    await saveOrShareBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'tajweedy-sections.csv', 'إحصاءات الأقسام');
  };

  const exportTimelineCSV = async () => {
    const rows = [['التاريخ', 'الدرجة', 'الإجمالي', 'النسبة %']];
    aggregates.tl.forEach((t) => {
      rows.push([
        t.date ? new Date(t.date).toLocaleString('ar-EG') : '',
        t.score,
        t.total,
        t.pct,
      ]);
    });
    const csv = toCSV(rows);
    await saveOrShareBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), 'tajweedy-progress.csv', 'تقدّم المتدرّب');
  };

  /* ------------------ تصدير PDF ------------------ */
  const exportChartsPDF = async () => {
    const jsPDF = await loadJsPDF();
    if (!jsPDF) return alert('تعذر تحميل مُصدّر PDF. أعد المحاولة.');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 36;

    const addTitle = (t) => {
      doc.setTextColor(30, 120, 80);
      doc.setFontSize(14);
      doc.text(t, pageW / 2, margin, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    const addChart = async (title, url) => {
      doc.addPage();
      addTitle(title);
      const data = await urlToDataURL(url);
      if (data) {
        const w = pageW - margin * 2;
        const h = (w * 9) / 16;
        doc.addImage(data, 'PNG', margin, margin + 12, w, h, undefined, 'FAST');
      } else {
        doc.text('تعذّر تحميل الرسم.', margin, margin + 30);
      }
    };

    // صفحة أولى: غلاف
    addTitle('إحصاءات Tajweedy');
    doc.setFontSize(12);
    doc.text(`التقرير: ${reportUrl || '-'}`, margin, margin + 28);
    doc.text(`النتيجة: ${score}/${total} — ${percentage}%`, margin, margin + 46);

    if (chartBest) await addChart('أفضل الأسئلة', chartBest);
    if (chartWorst) await addChart('أضعف الأسئلة', chartWorst);
    if (chartSections) await addChart('الأقسام (صحيح/خطأ)', chartSections);
    if (chartTimeline) await addChart('تقدّم المتدرّب', chartTimeline);

    const blob = doc.output('blob');
    await saveOrShareBlob(blob, 'tajweedy-stats.pdf', 'إحصاءات Tajweedy');
  };

  const handleDownloadQR = () => {
    if (!qrSrc) return alert('⚠️ لم يتم توليد الكود بعد.');
    const a = document.createElement('a');
    a.href = qrSrc;
    a.download = `tajweedy-qr-${attemptId || 'report'}.png`;
    a.click();
  };

  /* ====================== واجهة المستخدم ====================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* شريط علوي */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="px-4 py-2 rounded-xl bg-white border text-[#1e7850] font-bold hover:bg-green-50">
            🏠 الصفحة الرئيسية
          </Link>
          <Link href="/quiz" className="px-4 py-2 rounded-xl bg-white border text-[#2563eb] font-bold hover:bg-blue-50">
            ↩️ العودة للاختبار
          </Link>
        </div>

        {/* نتائج */}
        <h1 className="text-3xl font-bold text-[#1e7850] mb-6 text-center">نتيجة الاختبار 🎓</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-6 text-center">
            <p className="text-green-800 font-bold mb-2">إجابات صحيحة ✅</p>
            <p className="text-5xl font-bold">{score}</p>
          </div>
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6 text-center">
            <p className="text-red-800 font-bold mb-2">إجابات خاطئة ❌</p>
            <p className="text-5xl font-bold">{Math.max(0, total - score)}</p>
          </div>
          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-6 text-center">
            <p className="text-blue-800 font-bold mb-2">إجمالي الأسئلة 📝</p>
            <p className="text-5xl font-bold">{total}</p>
          </div>
        </div>

        {/* النسبة */}
        <div className="bg-[#1e7850] text-white rounded-3xl p-8 mb-6 text-center shadow">
          <p className="text-8xl font-bold mb-3">{percentage}%</p>
          <p className="text-lg">
            {percentage >= 80 ? '🎉 ممتاز جداً!' : percentage >= 60 ? '👏 أداء جيد' : '📖 يحتاج مراجعة'}
          </p>
        </div>

        {/* أزرار عامة */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl">طباعة 🖨️</button>
          {reportUrl ? (
            <Link href={reportUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-center">التفاصيل 📄</Link>
          ) : (
            <button disabled className="bg-blue-400 text-white font-bold py-3 rounded-2xl opacity-60">التفاصيل 📄</button>
          )}
          <button onClick={() => setOpenQ(true)} className="bg-white border-2 border-blue-200 hover:bg-blue-50 rounded-2xl font-bold">إحصاءات الأسئلة 📊</button>
          <button onClick={() => setOpenSec(true)} className="bg-white border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl font-bold">الأقسام 🧭</button>
          <button onClick={() => setOpenProg(true)} className="bg-white border-2 border-purple-200 hover:bg-purple-50 rounded-2xl font-bold">التقدّم 📈</button>
        </div>

        {/* QR */}
        <div className="bg-white border-2 border-green-200 rounded-3xl shadow-md p-8 text-center mb-10">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-center items-center gap-2">
            <span>📱</span> رمز الاستجابة السريع للوصول السريع
          </h2>
          {qrSrc ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <img src={qrSrc} alt="QR Code" className="w-56 h-56 border-4 border-green-400 rounded-2xl shadow-lg" referrerPolicy="no-referrer" />
              <button onClick={handleDownloadQR} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl mt-3">
                تحميل QR 📥
              </button>
            </div>
          ) : (
            <p className="text-gray-500 mt-4">جارٍ توليد الكود…</p>
          )}
          <p className="mt-4 text-gray-600 text-sm">امسح الكود باستخدام كاميرا الهاتف أو تطبيق قارئ QR 📸</p>
        </div>
      </div>

      {/* نافذة: الأسئلة */}
      <Modal
        open={openQ}
        title="إحصاءات الأسئلة"
        onClose={() => setOpenQ(false)}
        actions={
          <>
            <button onClick={() => window.print()} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 print:hidden">🖨️ طباعة</button>
            <button onClick={exportQuestionsCSV} className="px-3 py-1 rounded-lg bg-[#1e7850] text-white print:hidden">CSV ⬇</button>
            <button onClick={exportChartsPDF} className="px-3 py-1 rounded-lg bg-blue-600 text-white print:hidden">PDF ⬇</button>
          </>
        }
      >
        {chartBest && <img src={chartBest} alt="أفضل الأسئلة" className="w-full mb-6" />}
        {chartWorst && <img src={chartWorst} alt="أضعف الأسئلة" className="w-full" />}
      </Modal>

      {/* نافذة: الأقسام */}
      <Modal
        open={openSec}
        title="الأقسام والأجزاء الفرعية"
        onClose={() => setOpenSec(false)}
        actions={
          <>
            <button onClick={() => window.print()} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 print:hidden">🖨️ طباعة</button>
            <button onClick={exportSectionsCSV} className="px-3 py-1 rounded-lg bg-[#1e7850] text-white print:hidden">CSV ⬇</button>
            <button onClick={exportChartsPDF} className="px-3 py-1 rounded-lg bg-blue-600 text-white print:hidden">PDF ⬇</button>
          </>
        }
      >
        {chartSections && <img src={chartSections} alt="الأقسام" className="w-full mb-6" />}
        <div className="grid md:grid-cols-2 gap-3">
          {aggregates.sArr.slice(0, 8).map((s, idx) => (
            <div key={idx} className="border rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{s.section}</span>
                <span className="text-sm text-gray-600">النسبة: {s.pct}%</span>
              </div>
              {s.subs.slice(0, 6).map((sub, i2) => (
                <div key={i2} className="flex items-center justify-between text-sm border-b last:border-0 py-1">
                  <span>{sub.subsection}</span>
                  <span className="text-gray-600">
                    صحيح {sub.right} / خطأ {sub.wrong} — {sub.pct}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Modal>

      {/* نافذة: التقدّم */}
      <Modal
        open={openProg}
        title="متابعة تقدّم المتدرّب"
        onClose={() => setOpenProg(false)}
        actions={
          <>
            <button onClick={() => window.print()} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 print:hidden">🖨️ طباعة</button>
            <button onClick={exportTimelineCSV} className="px-3 py-1 rounded-lg bg-[#1e7850] text-white print:hidden">CSV ⬇</button>
            <button onClick={exportChartsPDF} className="px-3 py-1 rounded-lg bg-blue-600 text-white print:hidden">PDF ⬇</button>
          </>
        }
      >
        {chartTimeline && <img src={chartTimeline} alt="الزمن" className="w-full mb-6" />}
        <div className="space-y-2">
          {aggregates.tl.map((t, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b py-1">
              <span className="font-semibold">
                {t.date ? new Date(t.date).toLocaleString('ar-EG') : `محاولة ${i + 1}`}
              </span>
              <span className="text-gray-600">
                درجة: {t.score}/{t.total} — {t.pct}%
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
