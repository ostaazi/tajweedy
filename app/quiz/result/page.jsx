'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ----------------------- Utilities ----------------------- */
const COLORS = {
  primary: '#1e7850',
  primaryDark: '#155c3e',
  blue: '#2563eb',
  red: '#ef4444',
  gray: '#64748b',
};

const toEN = (s = '') =>
  String(s).replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);

const formatDMY = (dateLike) => {
  const d = dateLike ? new Date(dateLike) : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-GB', { month: 'long' }).slice(0, 3);
  const yr = d.getFullYear();
  return `${day} ${mon} ${yr}`;
};

function chartURL(config) {
  const base = 'https://quickchart.io/chart';
  return `${base}?c=${encodeURIComponent(JSON.stringify(config))}&backgroundColor=transparent&devicePixelRatio=2`;
}

async function loadJsPDF() {
  if (typeof window === 'undefined') return null;
  if (window.jspdf?.jsPDF) return window.jspdf.jsPDF;
  await new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.onload = res; s.onerror = rej; document.body.appendChild(s);
  });
  return window.jspdf?.jsPDF || null;
}
async function urlToDataURL(url) {
  try {
    const r = await fetch(url, { cache: 'no-cache' });
    const b = await r.blob();
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(b);
    });
  } catch { return null; }
}
async function saveOrShareBlob(blob, filename, title = 'Tajweedy') {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ title, files: [file] }); return; } catch {}
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
const toCSV = (rows) =>
  rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

/* ----------------------- Modal ----------------------- */
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
            <button onClick={onClose} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 print:hidden">✖ إغلاق</button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto print:max-h-none">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------- Page ----------------------- */
export default function ResultPage() {
  const [attempt, setAttempt] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [qrSrc, setQrSrc] = useState('');
  const [attemptId, setAttemptId] = useState('');

  // modals
  const [openQ, setOpenQ] = useState(false);
  const [openSec, setOpenSec] = useState(false);
  const [openProg, setOpenProg] = useState(false);

  // charts
  const [chartBest, setChartBest] = useState('');
  const [chartWorst, setChartWorst] = useState('');
  const [chartSections, setChartSections] = useState('');
  const [chartTimeline, setChartTimeline] = useState('');

  // load last attempt
  useEffect(() => {
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    setAllAttempts(attempts);
    const last = attempts[attempts.length - 1];
    if (last) { setAttempt(last); setAttemptId(last.id || ''); }
  }, []);

  // robust totals
  const totals = useMemo(() => {
    if (!attempt) return { score: 0, total: 0, correct: 0, wrong: 0, percentage: 0 };
    let total = Number(attempt.total ?? attempt.questions?.length ?? 0);
    let correct = Number(attempt.correctCount ?? attempt.score ?? 0);
    if (Array.isArray(attempt.questions) && Array.isArray(attempt.answers)) {
      correct = attempt.questions.reduce((a, q, i) => a + (attempt.answers[i] === q?.answer ? 1 : 0), 0);
      total = attempt.questions.length;
    }
    const wrong = Math.max(total - correct, 0);
    const percentage = total ? Math.round((correct / total) * 100) : 0;
    return { score: correct, total, correct, wrong, percentage };
  }, [attempt]);

  const { correct, wrong, total, percentage } = totals;

  // report URL
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !attemptId) return '';
    return `${window.location.origin}/quiz/report/${attemptId}`;
  }, [attemptId]);

  // QR (with brand center)
  useEffect(() => {
    if (!reportUrl || typeof window === 'undefined') return;
    const logo = `${window.location.origin}/logo.png`;
    const urls = [
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=360&centerImageUrl=${encodeURIComponent(logo)}&centerImageSizeRatio=0.25&margin=2`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=360&margin=2`,
      `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(reportUrl)}`
    ];
    let i = 0;
    const tryNext = () => {
      if (i >= urls.length) return setQrSrc('');
      const u = urls[i++]; const im = new Image();
      im.onload = () => setQrSrc(u); im.onerror = tryNext; im.referrerPolicy = 'no-referrer'; im.src = u;
    };
    tryNext();
  }, [reportUrl]);

  /* ---------- aggregates ---------- */
  const aggregates = useMemo(() => {
    const byQ = new Map(); const bySec = new Map(); const tl = [];
    for (const att of allAttempts) {
      const qs = Array.isArray(att?.questions) ? att.questions : [];
      const ans = Array.isArray(att?.answers) ? att.answers : [];
      const n = Math.min(qs.length, ans.length);
      tl.push({ date: att.date, total: Number(att.total || n || 0), score: Number(att.score || 0) });

      for (let i = 0; i < n; i++) {
        const q = qs[i] || {}; const user = Number(ans[i]); const ok = user === Number(q?.answer);
        const keyQ = (q?.question || `سؤال ${i + 1}`).trim();
        if (!byQ.has(keyQ)) byQ.set(keyQ, { section: q?.section || 'غير محدد', subsection: q?.subsection || 'غير محدد', right: 0, wrong: 0 });
        byQ.get(keyQ)[ok ? 'right' : 'wrong']++;

        const sec = (q?.section || 'غير محدد').trim();
        if (!bySec.has(sec)) bySec.set(sec, { right: 0, wrong: 0, subs: new Map() });
        const s = bySec.get(sec);
        s[ok ? 'right' : 'wrong']++;
        const sub = (q?.subsection || 'غير محدد').trim();
        if (!s.subs.has(sub)) s.subs.set(sub, { right: 0, wrong: 0 });
        s.subs.get(sub)[ok ? 'right' : 'wrong']++;
      }
    }
    const qArr = Array.from(byQ.entries()).map(([question, v]) => {
      const t = v.right + v.wrong;
      return { question, section: v.section, subsection: v.subsection, right: v.right, wrong: v.wrong, total: t, pct: t ? Math.round((v.right / t) * 100) : 0 };
    }).sort((a, b) => (a.pct === b.pct ? b.total - a.total : b.pct - a.pct));

    const sArr = Array.from(bySec.entries()).map(([section, v]) => {
      const total = v.right + v.wrong;
      const subs = Array.from(v.subs.entries()).map(([subsection, r]) => {
        const t = r.right + r.wrong;
        return { subsection, right: r.right, wrong: r.wrong, total: t, pct: t ? Math.round((r.right / t) * 100) : 0 };
      }).sort((a, b) => b.pct - a.pct);
      return { section, right: v.right, wrong: v.wrong, total, pct: total ? Math.round((v.right / total) * 100) : 0, subs };
    }).sort((a, b) => b.pct - a.pct);

    const timeline = tl.map(t => ({ ...t, pct: t.total ? Math.round((t.score / t.total) * 100) : 0 }))
      .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    return { qArr, sArr, timeline };
  }, [allAttempts]);

  /* ---------- build chart urls ---------- */
  useEffect(() => {
    if (aggregates.qArr.length) {
      const best = aggregates.qArr.slice(0, 10).reverse();
      setChartBest(chartURL({
        type: 'bar',
        data: { labels: best.map(q => q.question.length > 22 ? q.question.slice(0, 22) + '…' : q.question),
          datasets: [{ data: best.map(q => q.pct), backgroundColor: COLORS.primary, borderRadius: 8 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false }, title: { display: true, text: 'أفضل 10 أسئلة', color: COLORS.primaryDark } }, scales: { x: { min: 0, max: 100 } } }
      }));
      const worst = [...aggregates.qArr].sort((a, b) => a.pct - b.pct || b.total - a.total).slice(0, 10).reverse();
      setChartWorst(chartURL({
        type: 'bar',
        data: { labels: worst.map(q => q.question.length > 22 ? q.question.slice(0, 22) + '…' : q.question),
          datasets: [{ data: worst.map(q => q.pct), backgroundColor: COLORS.red, borderRadius: 8 }] },
        options: { indexAxis: 'y', plugins: { legend: { display: false }, title: { display: true, text: 'أضعف 10 أسئلة', color: COLORS.primaryDark } }, scales: { x: { min: 0, max: 100 } } }
      }));
    } else { setChartBest(''); setChartWorst(''); }

    if (aggregates.sArr.length) {
      const top = aggregates.sArr.slice(0, 8);
      setChartSections(chartURL({
        type: 'bar',
        data: {
          labels: top.map(s => s.section.length > 18 ? s.section.slice(0, 18) + '…' : s.section),
          datasets: [
            { label: 'صحيح', data: top.map(s => s.right), backgroundColor: COLORS.primary, stack: 's', borderRadius: 6 },
            { label: 'خطأ', data: top.map(s => s.wrong), backgroundColor: COLORS.red, stack: 's', borderRadius: 6 },
          ]
        },
        options: { plugins: { title: { display: true, text: 'الأقسام (صحيح/خطأ)', color: COLORS.primaryDark } } }
      }));
    } else setChartSections('');

    if (aggregates.timeline.length) {
      setChartTimeline(chartURL({
        type: 'line',
        data: {
          labels: aggregates.timeline.map(t => t.date ? formatDMY(t.date) : ''),
          datasets: [{ label: 'النسبة %', data: aggregates.timeline.map(t => t.pct), borderColor: COLORS.blue, fill: false, tension: 0.3 }]
        },
        options: { plugins: { title: { display: true, text: 'تقدّم المتدرّب', color: COLORS.primaryDark } }, scales: { y: { min: 0, max: 100 } } }
      }));
    } else setChartTimeline('');
  }, [aggregates]);

  /* ---------- export ---------- */
  const exportQuestionsCSV = async () => {
    const rows = [['السؤال','القسم','الجزء الفرعي','صحيح','خطأ','المجموع','%']];
    aggregates.qArr.forEach(q => rows.push([q.question,q.section,q.subsection,q.right,q.wrong,q.total,q.pct]));
    await saveOrShareBlob(new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }), 'tajweedy-questions.csv');
  };
  const exportSectionsCSV = async () => {
    const rows = [['القسم','الجزء الفرعي','صحيح','خطأ','المجموع','%']];
    for (const s of aggregates.sArr) {
      if (!s.subs.length) rows.push([s.section,'-',s.right,s.wrong,s.total,s.pct]);
      for (const sub of s.subs) rows.push([s.section,sub.subsection,sub.right,sub.wrong,sub.total,sub.pct]);
    }
    await saveOrShareBlob(new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }), 'tajweedy-sections.csv');
  };
  const exportTimelineCSV = async () => {
    const rows = [['التاريخ','الدرجة','الإجمالي','%']];
    aggregates.timeline.forEach(t => rows.push([formatDMY(t.date), t.score, t.total, t.pct]));
    await saveOrShareBlob(new Blob([toCSV(rows)], { type: 'text/csv;charset=utf-8' }), 'tajweedy-progress.csv');
  };
  const exportChartsPDF = async () => {
    const jsPDF = await loadJsPDF(); if (!jsPDF) return alert('تعذّر إنشاء PDF الآن.');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth(); const M = 36;
    const add = async (title, url) => {
      doc.addPage();
      doc.setTextColor(30,120,80); doc.setFontSize(14);
      doc.text(title, W/2, M, { align: 'center' }); doc.setTextColor(0,0,0);
      const data = await urlToDataURL(url);
      if (data) { const w = W - M*2, h = (w*9)/16; doc.addImage(data,'PNG',M,M+12,w,h,'','FAST'); }
    };
    doc.setFontSize(12);
    doc.text(`Report: ${reportUrl || '-'}`, M, M);
    doc.text(`Score: ${correct}/${total} — ${percentage}%`, M, M+18);
    if (chartBest) await add('أفضل الأسئلة', chartBest);
    if (chartWorst) await add('أضعف الأسئلة', chartWorst);
    if (chartSections) await add('الأقسام (صحيح/خطأ)', chartSections);
    if (chartTimeline) await add('تقدّم المتدرّب', chartTimeline);
    await saveOrShareBlob(doc.output('blob'), 'tajweedy-stats.pdf');
  };

  const downloadQR = () => {
    if (!qrSrc) return alert('لم يتم توليد الكود بعد');
    const a = document.createElement('a');
    a.href = qrSrc; a.download = `tajweedy-qr-${attemptId || 'report'}.png`; a.click();
  };

  /* ----------------------- UI ----------------------- */
  // ring geometry (two ألوان مثل اللقطات)
  const R = 96, C = 2 * Math.PI * R;
  const gLen = (Math.min(percentage, 100) / 100) * C;
  const rLen = C - gLen;

  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_0_0,#f3faf6_0,transparent_40%),radial-gradient(circle_at_100%_100%,#edf7f1_0,transparent_40%)] from-white to-green-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* Top bar */}
        <div className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Tajweedy" className="w-10 h-10" />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/quiz" className="px-4 py-2 rounded-xl border text-[color:var(--tw-prose-bullets,#1e7850)] text-[#1e7850] font-bold hover:bg-green-50">↩️ اختبار جديد</Link>
          </div>
        </div>

        {/* Title + date */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e7850]">نتيجة الاختبار 🎓</h1>
          <p className="text-gray-500 mt-1">{formatDMY(attempt?.date)}</p>
        </div>

        {/* Summary with centered numbers */}
        <div className="bg-white rounded-3xl shadow p-6 md:p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* ring */}
            <div className="relative w-64 h-64 mx-auto">
              <svg width="256" height="256" className="-rotate-90">
                <circle cx="128" cy="128" r={R} stroke="#e5e7eb" strokeWidth="20" fill="none" />
                {/* wrong (red) */}
                <circle cx="128" cy="128" r={R} stroke={COLORS.red} strokeWidth="20" fill="none"
                        strokeDasharray={`${rLen} ${C}`} strokeLinecap="round" />
                {/* correct (green) */}
                <circle cx="128" cy="128" r={R} stroke={COLORS.primary} strokeWidth="20" fill="none"
                        strokeDasharray={`${gLen} ${C}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl md:text-7xl font-extrabold text-[#1e7850]">{toEN(percentage)}%</p>
                  <p className="text-gray-600 mt-1">النسبة النهائية</p>
                </div>
              </div>
            </div>

            {/* cards */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-green-800 font-semibold mb-2">إجابات صحيحة ✅</p>
                <p className="text-5xl font-extrabold text-green-700 leading-none">{toEN(correct)}</p>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-red-800 font-semibold mb-2">إجابات خاطئة ❌</p>
                <p className="text-5xl font-extrabold text-red-600 leading-none">{toEN(wrong)}</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <p className="text-blue-800 font-semibold mb-2">إجمالي الأسئلة 📝</p>
                <p className="text-5xl font-extrabold text-blue-600 leading-none">{toEN(total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl">🖨️ طباعة</button>
          {reportUrl
            ? <Link href={reportUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-center">📄 التفاصيل</Link>
            : <button disabled className="bg-blue-400 text-white font-bold py-3 rounded-2xl opacity-60">📄 التفاصيل</button>}
          <button onClick={() => setOpenQ(true)} className="bg-white border-2 border-blue-200 hover:bg-blue-50 rounded-2xl font-bold">📊 إحصاءات الأسئلة</button>
          <button onClick={() => setOpenSec(true)} className="bg-white border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl font-bold">🧭 الأقسام</button>
          <button onClick={() => setOpenProg(true)} className="bg-white border-2 border-purple-200 hover:bg-purple-50 rounded-2xl font-bold">📈 التقدّم</button>
        </div>

        {/* QR */}
        <div className="bg-white border-2 border-green-200 rounded-3xl shadow p-8 text-center mb-10">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-center items-center gap-2"><span>📱</span> رمز الاستجابة السريع للوصول السريع</h2>
          {qrSrc ? (
            <div className="flex flex-col items-center gap-3">
              <img src={qrSrc} alt="QR" className="w-56 h-56 border-4 border-green-400 rounded-2xl shadow-lg" referrerPolicy="no-referrer" />
              <button onClick={downloadQR} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl">📥 تحميل QR</button>
            </div>
          ) : <p className="text-gray-500">جارٍ توليد الكود…</p>}
          <p className="mt-4 text-gray-600 text-sm">امسح الكود باستخدام كاميرا الهاتف أو تطبيق قارئ QR 📸</p>
        </div>

        {/* Modals */}
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
            {aggregates.sArr.slice(0, 8).map((s, i) => (
              <div key={i} className="border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{s.section}</span>
                  <span className="text-sm text-gray-600">النسبة: {s.pct}%</span>
                </div>
                {s.subs.slice(0, 6).map((sub, j) => (
                  <div key={j} className="flex items-center justify-between text-sm border-b last:border-0 py-1">
                    <span>{sub.subsection}</span>
                    <span className="text-gray-600">صحيح {sub.right} / خطأ {sub.wrong} — {sub.pct}%</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Modal>

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
            {aggregates.timeline.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b py-1">
                <span className="font-semibold">{formatDMY(t.date)}</span>
                <span className="text-gray-600">درجة: {t.score}/{t.total} — {t.pct}%</span>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    </section>
  );
}
