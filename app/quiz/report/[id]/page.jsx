'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ======================= Helpers: Digits / Dates / jsPDF / Fonts / Watermark / Save ======================= */

// تحويل أي أرقام عربية/هندية إلى إنجليزية ASCII
function toEnglishDigits(input = '') {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
    '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}

// تاريخ إنجليزي Day–Mon–Year مع بقاء الصفحة RTL
function formatDateEnRtl(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = String(d.getFullYear());
  return `${day} ${month} ${year}`;
}

// تحميل jsPDF + autoTable من CDN (بدون NPM)
async function loadJsPDF() {
  if (typeof window === 'undefined') return null;
  if (!window.jspdf?.jsPDF) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload = res; s.onerror = rej; document.body.appendChild(s);
    });
  }
  if (!window.jspdf?.jsPDF?.API?.autoTable) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.1/dist/jspdf.plugin.autotable.min.js';
      s.onload = res; s.onerror = rej; document.body.appendChild(s);
    });
  }
  return window.jspdf?.jsPDF || null;
}

// تحميل Cairo + Amiri وإعدادهما لـ jsPDF مع RTL
async function ensureBrandFonts(doc) {
  if (doc.__brandFontsReady) return;
  // Cairo
  try {
    const r1 = await fetch('/fonts/Cairo-Regular.ttf', { cache: 'force-cache' });
    const b1 = await r1.arrayBuffer();
    const f1 = btoa(String.fromCharCode(...new Uint8Array(b1)));
    doc.addFileToVFS('Cairo-Regular.ttf', f1);
    doc.addFont('Cairo-Regular.ttf', 'Cairo', 'normal');
  } catch {}
  // Amiri (للقرآن والسور)
  try {
    const r2 = await fetch('/fonts/Amiri-Regular.ttf', { cache: 'force-cache' });
    const b2 = await r2.arrayBuffer();
    const f2 = btoa(String.fromCharCode(...new Uint8Array(b2)));
    doc.addFileToVFS('Amiri-Regular.ttf', f2);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
  } catch {}
  try { doc.setFont('Cairo', 'normal'); } catch {}
  if (typeof doc.setR2L === 'function') doc.setR2L(true);
  doc.__brandFontsReady = true;
}

function useCairo(doc){ try { doc.setFont('Cairo', 'normal'); } catch {} }
function useAmiri(doc){ try { doc.setFont('Amiri', 'normal'); } catch {} }

// رسم علامة مائية (صورة الشعار) تغطي الصفحة بشفافية ~7%
async function drawWatermark(doc, options = {}) {
  const { opacity = 0.07, imgPath = '/logo.png' } = options;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  try {
    const resp = await fetch(imgPath, { cache: 'force-cache' });
    const blob = await resp.blob();
    const dataUrl = await new Promise((resolve) => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob);
    });
    let gs;
    try {
      // @ts-ignore
      gs = new doc.GState({ opacity });
      doc.setGState(gs);
    } catch {}
    const targetW = pageW * 0.9;
    const targetH = pageH * 0.9;
    const x = (pageW - targetW) / 2;
    const y = (pageH - targetH) / 2;
    doc.addImage(dataUrl, 'PNG', x, y, targetW, targetH, undefined, 'FAST');
    if (gs) { doc.setDrawColor(0,0,0); doc.setTextColor(0,0,0); }
  } catch {}
}

// حفظ/مشاركة Blob
async function saveOrShareBlob(blob, filename = 'report.pdf', shareTitle = 'Report') {
  try {
    const file = new File([blob], filename, { type: blob.type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: shareTitle, text: shareTitle });
      return;
    }
  } catch {}
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ======================= الصفحة ======================= */

export default function ReportPage() {
  const params = useParams();
  const attemptId = params?.id;

  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  // جلب المحاولة + أسماء محفوظة
  useEffect(() => {
    const run = () => {
      if (!attemptId) { setLoading(false); return; }
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(
        a => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId)
      );
      if (found) setAttempt(found);
      setUserName(localStorage.getItem('userName') || '');
      setTrainerName(localStorage.getItem('trainerName') || '');
      setLoading(false);
    };
    run();
  }, [attemptId]);

  // رابط التقرير (على العميل)
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !attemptId) return '';
    return `${window.location.origin}/quiz/report/${attemptId}`;
  }, [attemptId]);

  // توليد QR بخدمات متعددة بدون مكتبات
  useEffect(() => {
    if (!reportUrl) return;
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reportUrl)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(reportUrl)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=300`
    ];
    let i = 0; let cancelled = false;
    const tryNext = () => {
      if (cancelled) return;
      if (i >= services.length) { setQrSrc(''); return; }
      const candidate = services[i++];
      const img = new Image();
      img.onload = () => { if (!cancelled) setQrSrc(candidate); };
      img.onerror = () => { if (!cancelled) tryNext(); };
      img.referrerPolicy = 'no-referrer';
      img.src = candidate;
    };
    tryNext();
    return () => { cancelled = true; };
  }, [reportUrl]);

  const saveNames = () => {
    if (userName) localStorage.setItem('userName', userName);
    if (trainerName) localStorage.setItem('trainerName', trainerName);
  };

  // تصدير PDF شامل (Cairo افتراضي + Amiri لآيات/سور)
  const exportFullPDF = async () => {
    const jsPDF = await loadJsPDF();
    if (!jsPDF) return alert('تعذّر تحميل مُصدِّر PDF.');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 36;
    const brand = [30, 120, 80];

    await ensureBrandFonts(doc);                 // Cairo + Amiri
    await drawWatermark(doc, { imgPath: '/logo.png', opacity: 0.07 });
    useCairo(doc);

    const addTitle = (t) => {
      doc.setTextColor(...brand);
      doc.setFontSize(16);
      useCairo(doc);
      doc.text(t, pageW / 2, margin, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    };

    const trainee   = userName || localStorage.getItem('userName') || '—';
    const trainer   = trainerName || localStorage.getItem('trainerName') || '—';
    const attemptNo = toEnglishDigits(attemptId || '—');
    const nowTxt    = formatDateEnRtl(new Date());
    const link      = reportUrl || (typeof window !== 'undefined' ? window.location.href : '—');

    // الغلاف
    addTitle('تقرير وإحصاءات Tajweedy');
    doc.setFontSize(12); useCairo(doc);
    doc.text(`المتدرّب: ${trainee}`,               margin, margin + 24, { align: 'left' });
    doc.text(`المدرّب: ${trainer}`,                margin, margin + 42, { align: 'left' });
    doc.text(`رقم المحاولة: ${attemptNo}`,         margin, margin + 60, { align: 'left' });
    doc.text(`التاريخ: ${nowTxt}`,                 margin, margin + 78, { align: 'left' });
    doc.text(`رابط التقرير/الطباعة:`,              margin, margin + 96, { align: 'left' });
    const linkLines = doc.splitTextToSize(link, pageW - margin * 2);
    doc.text(linkLines,                              margin, margin + 114, { align: 'left' });

    // QR داخلي
    try {
      const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(link)}&size=300&margin=2`;
      const r = await fetch(qrUrl, { cache: 'no-cache' });
      const bl = await r.blob();
      const data = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(bl); });
      const box = 140;
      doc.addImage(data, 'PNG', pageW - margin - box, margin + 16, box, box, undefined, 'FAST');
      doc.setFontSize(10); useCairo(doc);
      doc.text('QR للوصول السريع', pageW - margin - box + 10, margin + 16 + box + 14, { align: 'left' });
    } catch {}

    // ملخص الدرجات
    const score = toEnglishDigits(String(attempt?.score ?? 0));
    const total = toEnglishDigits(String(attempt?.total ?? 0));
    const pct   = toEnglishDigits(String(attempt?.total ? Math.round((attempt.score / attempt.total) * 100) : 0));
    doc.setDrawColor(...brand);
    doc.line(margin, margin + 150, pageW - margin, margin + 150);
    doc.setFontSize(14); useCairo(doc);
    doc.text(`النتيجة: ${score}/${total} — ${pct}%`, margin, margin + 170, { align: 'left' });

    // === جداول الإحصاءات (عند توفر aggregates في localStorage) ===
    const aggregates = (() => {
      try { return JSON.parse(localStorage.getItem('tajweedyAggregates') || '{}'); } catch { return {}; }
    })();

    const AMIRI_TAG = '⟪Q⟫';
    const isQuranCell = (txt) => typeof txt === 'string' && txt.startsWith(AMIRI_TAG);
    const stripTag = (txt) => (typeof txt === 'string' ? txt.replace(AMIRI_TAG, '') : txt);

    // جدول الأسئلة
    doc.addPage(); await drawWatermark(doc, { imgPath: '/logo.png', opacity: 0.07 });
    addTitle('جدول الأسئلة');
    const qRows = (aggregates?.qArr || []).map(q => ([
      q.question || '—',
      q.section || '—',
      q.subsection || '—',
      toEnglishDigits(q.right ?? 0),
      toEnglishDigits(q.wrong ?? 0),
      toEnglishDigits(q.total ?? 0),
      toEnglishDigits(q.pct ?? 0)
    ]));
    doc.autoTable({
      startY: margin + 16,
      styles: { font: 'Cairo', fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [30,120,80], halign: 'right' },
      theme: 'grid',
      head: [['السؤال', 'القسم', 'الجزء الفرعي', 'صحيح', 'خطأ', 'المجموع', 'النسبة %']],
      body: qRows.map(r => [stripTag(r[0]), stripTag(r[1]), stripTag(r[2]), r[3], r[4], r[5], r[6]]),
      didParseCell: (data) => {
        const { cell, column } = data;
        if ((column.index === 0 || column.index === 1) && isQuranCell(cell.raw)) {
          cell.styles.font = 'Amiri';
        }
      },
      columnStyles: { 0: { cellWidth: 230 } }
    });

    // جدول الأقسام والأجزاء الفرعية
    doc.addPage(); await drawWatermark(doc, { imgPath: '/logo.png', opacity: 0.07 });
    addTitle('جدول الأقسام والأجزاء الفرعية');
    const secRows = [];
    (aggregates?.sArr || []).forEach(s => {
      if (!s?.subs?.length) {
        secRows.push([
          s.section || '—', '—',
          toEnglishDigits(s.right ?? 0),
          toEnglishDigits(s.wrong ?? 0),
          toEnglishDigits(s.total ?? 0),
          toEnglishDigits(s.pct ?? 0)
        ]);
      } else {
        s.subs.forEach(sub => {
          secRows.push([
            s.section || '—',
            sub.subsection || '—',
            toEnglishDigits(sub.right ?? 0),
            toEnglishDigits(sub.wrong ?? 0),
            toEnglishDigits(sub.total ?? 0),
            toEnglishDigits(sub.pct ?? 0)
          ]);
        });
      }
    });
    doc.autoTable({
      startY: margin + 16,
      styles: { font: 'Cairo', fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [30,120,80], halign: 'right' },
      theme: 'grid',
      head: [['القسم', 'الجزء الفرعي', 'صحيح', 'خطأ', 'المجموع', 'النسبة %']],
      body: secRows.map(r => [stripTag(r[0]), stripTag(r[1]), r[2], r[3], r[4], r[5]]),
      didParseCell: (data) => {
        const { cell, column } = data;
        if ((column.index === 0 || column.index === 1) && isQuranCell(cell.raw)) {
          cell.styles.font = 'Amiri';
        }
      },
      columnStyles: { 0: { cellWidth: 180 }, 1: { cellWidth: 160 } }
    });

    // جدول خط الزمن
    doc.addPage(); await drawWatermark(doc, { imgPath: '/logo.png', opacity: 0.07 });
    addTitle('تقدّم المتدرّب (زمنيًا)');
    const tlRows = (aggregates?.tl || []).map(t => ([
      formatDateEnRtl(t.date || Date.now()),
      toEnglishDigits(t.score ?? 0),
      toEnglishDigits(t.total ?? 0),
      toEnglishDigits(t.pct ?? 0),
      toEnglishDigits(t.id ?? '')
    ]));
    doc.autoTable({
      startY: margin + 16,
      styles: { font: 'Cairo', fontSize: 9, halign: 'right' },
      headStyles: { fillColor: [30,120,80], halign: 'right' },
      theme: 'grid',
      head: [['التاريخ', 'الدرجة', 'الإجمالي', 'النسبة %', 'رقم المحاولة']],
      body: tlRows
    });

    const blob = doc.output('blob');
    await saveOrShareBlob(blob, 'tajweedy-stats.pdf', 'Tajweedy Stats');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد محاولة</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على تقرير مطابق لهذا المعرّف</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl">🏠 الصفحة الرئيسية</Link>
            <Link href="/quiz" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl">← العودة للاختبار</Link>
          </div>
        </div>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="px-4 py-2 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-800">🏠 الرئيسية</Link>
              <Link href="/quiz" className="px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark">← العودة للاختبار</Link>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary text-white font-bold grid place-items-center text-2xl">
              TJ
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">🎓 تقرير أداء الاختبار</h1>
          <p className="text-center text-gray-600 text-lg">
            {formatDateEnRtl(attempt.date || Date.now())}
          </p>
        </div>

        {/* Names */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">👤 اسم المتدرب</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسمك..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">👨‍🏫 اسم المدرب (اختياري)</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسم المدرب..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border-4 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 text-lg font-bold mb-2">✅ إجابات صحيحة</p>
            <p className="text-6xl font-bold text-green-600">{toEnglishDigits(score)}</p>
          </div>
          <div className="bg-red-50 border-4 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 text-lg font-bold mb-2">❌ إجابات خاطئة</p>
            <p className="text-6xl font-bold text-red-600">{toEnglishDigits(total - score)}</p>
          </div>
          <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 text-lg font-bold mb-2">📝 إجمالي الأسئلة</p>
            <p className="text-6xl font-bold text-blue-600">{toEnglishDigits(total)}</p>
          </div>
        </div>

        {/* Percentage */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-card-hover p-8 mb-6 text-center text-white">
          <p className="text-2xl font-bold mb-3">النسبة المئوية</p>
          <p className="text-9xl font-extrabold mb-1">{toEnglishDigits(percentage)}%</p>
          <p className="text-white/90 text-lg">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl transition-all">🖨️ طباعة</button>
          <button
            onClick={() => { if (qrSrc) { const a=document.createElement('a'); a.href=qrSrc; a.download='qr-code.png'; a.click(); } }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl transition-all"
          >📥 تحميل QR</button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title:'تقرير الاختبار', text:`حصلت على ${percentage}% في اختبار التجويد!`, url: reportUrl });
              } else { navigator.clipboard.writeText(reportUrl); alert('تم نسخ الرابط!'); }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-2xl transition-all"
          >📤 مشاركة</button>
          <button onClick={() => { navigator.clipboard.writeText(reportUrl); alert('تم نسخ الرابط!'); }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-2xl transition-all"
          >🔗 نسخ</button>
          <button onClick={exportFullPDF}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl transition-all"
          >⬇️ تصدير PDF</button>
          <Link href="/" className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl transition-all text-center">🏠 الرئيسية</Link>
        </div>

        {/* QR */}
        <div className="bg-white rounded-3xl shadow-card p-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center justify-center gap-3">
            <span className="text-5xl">📱</span>
            رمز الاستجابة السريع
          </h2>
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white border-4 border-primary rounded-3xl shadow-lg">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-72 h-72"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                />
              ) : null}
              <div className={`${qrSrc ? 'hidden' : 'flex'} w-72 h-72 items-center justify-center flex-col gap-4 text-gray-500`}>
                <span className="text-5xl">⚠️</span>
                <p className="text-center">تعذّر توليد رمز QR</p>
                <p className="text-xs text-gray-400 break-all">{reportUrl}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 inline-block">
            <p className="text-gray-700 text-lg font-bold mb-2">📸 امسح الكود للوصول السريع</p>
            <p className="text-sm text-gray-600">استخدم كاميرا الهاتف أو تطبيق قارئ QR</p>
          </div>
        </div>

      </div>
    </div>
  );
}
