'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ===================== Helpers: digits & date ===================== */
function toEnglishDigits(input = '') {
  const map = { '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9' };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}
function formatDateDMY(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  const yr  = String(d.getFullYear());
  return `${day} ${mon} ${yr}`; // 27 Oct 2025
}
function formatTime24(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  return `${hh}:${mm}:${ss}`;
}

/* ===================== Helpers: attempt aggregation ===================== */
function unifyNumbers(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

function computeTotals(attempt) {
  const total =
    unifyNumbers(attempt?.total) ||
    unifyNumbers(attempt?.questionsCount) ||
    (Array.isArray(attempt?.questions) ? attempt.questions.length : 0) ||
    unifyNumbers(attempt?.correctCount) + unifyNumbers(attempt?.wrongCount);

  let correct = 0;
  if (typeof attempt?.correctCount === 'number') correct = attempt.correctCount;
  else if (Array.isArray(attempt?.questions) && Array.isArray(attempt?.answers)) {
    correct = attempt.questions.reduce(
      (acc, q, i) => acc + (attempt.answers[i] === q?.answer ? 1 : 0), 0
    );
  } else if (Number.isInteger(attempt?.score) && total) {
    // بعض النسخ كانت تخزّن score كعدد الإجابات الصحيحة
    correct = attempt.score;
  }

  const wrong = Math.max(total - correct, 0);

  const percentage =
    Number.isFinite(attempt?.scorePercent) ? Math.round(attempt.scorePercent) :
    Number.isFinite(attempt?.percentage)   ? Math.round(attempt.percentage)   :
    total ? Math.round((correct / total) * 100) : 0;

  return { total, correct, wrong, percentage };
}

/* ===================== Helpers: stats builder ===================== */
function buildStats(attempt) {
  const stats = {
    byQuestion: [],   // [{label, correct, wrong}]
    bySection: {},    // { [section]: {correct, wrong} }
    bySub: {},        // { [section|sub]: {correct, wrong, section, sub} }
  };
  if (!Array.isArray(attempt?.questions)) return stats;

  const ans = Array.isArray(attempt.answers) ? attempt.answers : [];
  attempt.questions.forEach((q, i) => {
    const isCorrect = ans[i] === q?.answer;
    const section   = q?.section || 'غير محدد';
    const sub       = q?.subsection || q?.subSection || 'غير محدد';
    const keySub    = `${section} | ${sub}`;

    stats.byQuestion.push({
      label: q?.title || q?.question?.slice(0, 18) || `سؤال ${i + 1}`,
      correct: isCorrect ? 1 : 0,
      wrong:   isCorrect ? 0 : 1,
    });

    stats.bySection[section] ??= { correct: 0, wrong: 0 };
    stats.bySection[section][isCorrect ? 'correct' : 'wrong']++;

    stats.bySub[keySub] ??= { correct: 0, wrong: 0, section, sub };
    stats.bySub[keySub][isCorrect ? 'correct' : 'wrong']++;
  });

  return stats;
}

/* ===================== Simple chart (canvas 2d) ===================== */
function drawBarChart(canvas, labels, good, bad, primary = '#1e7850', danger = '#dc2626') {
  if (!canvas) return;
  const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const width = 680, height = 300, pad = 36;
  canvas.width = width * DPR; canvas.height = height * DPR;
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, width, height);
  const max = Math.max(1, ...good, ...bad);
  const barW = (width - pad * 2) / labels.length / 1.6;
  labels.forEach((lb, i) => {
    const x = pad + i * ((width - pad * 2) / labels.length) + 12;
    const hg = (good[i] / max) * (height - pad * 2);
    const hb = (bad[i] / max) * (height - pad * 2);
    // bad
    ctx.fillStyle = danger; ctx.fillRect(x, height - pad - hb, barW, hb);
    // good
    ctx.fillStyle = primary; ctx.fillRect(x + barW + 4, height - pad - hg, barW, hg);
    // label
    ctx.fillStyle = '#475569'; ctx.font = '11px Cairo, system-ui';
    ctx.save(); ctx.translate(x, height - pad + 12); ctx.rotate(-0.6);
    ctx.fillText(lb, 0, 0); ctx.restore();
  });
  // axis
  ctx.strokeStyle = '#e5e7eb'; ctx.beginPath();
  ctx.moveTo(pad, height - pad); ctx.lineTo(width - pad, height - pad); ctx.stroke();
}

function drawLineChart(canvas, labels, values, color = '#1e40af') {
  if (!canvas) return;
  const DPR = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const width = 680, height = 300, pad = 36;
  canvas.width = width * DPR; canvas.height = height * DPR;
  canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, width, height);

  const max = Math.max(1, ...values), min = Math.min(0, ...values);
  const sx = (width - pad * 2) / Math.max(1, labels.length - 1);
  const sy = (height - pad * 2) / Math.max(1, max - min);

  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + i * sx;
    const y = height - pad - (v - min) * sy;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#475569'; ctx.font = '11px Cairo, system-ui';
  labels.forEach((lb, i) => {
    const x = pad + i * sx;
    ctx.save(); ctx.translate(x - 10, height - pad + 12); ctx.rotate(-0.6);
    ctx.fillText(lb, 0, 0); ctx.restore();
  });
  ctx.strokeStyle = '#e5e7eb'; ctx.beginPath();
  ctx.moveTo(pad, height - pad); ctx.lineTo(width - pad, height - pad); ctx.stroke();
}

/* ===================== Small utilities ===================== */
function downloadCsv(filename, rows) {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}
function openPrintHtml(title, html) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!win) return;
  win.document.write(`
    <html dir="rtl">
      <head>
        <meta charSet="utf-8"/>
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          body{font-family:Cairo,system-ui;-webkit-print-color-adjust:exact;print-color-adjust:exact;margin:24px}
          h1{color:#1e7850}
          .wm{position:fixed;inset:0;background:url('/logo.png') center/60% no-repeat;opacity:.07;z-index:-1}
          .meta{margin:12px 0;padding:8px 12px;border:1px solid #e5e7eb;border-radius:12px}
        </style>
      </head>
      <body>
        <div class="wm"></div>
        ${html}
        <script>window.print();</script>
      </body>
    </html>
  `);
  win.document.close();
}

/* ===================== Stats modal (reusable) ===================== */
function StatsModal({ open, onClose, title, headerRight, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl p-4 md:p-6 shadow-xl relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">{title}</h3>
          <div className="flex items-center gap-3">
            {headerRight}
            <button onClick={onClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 font-bold">إغلاق ✖️</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ===================== Page ===================== */
export default function ReportPage() {
  const params = useParams();
  const attemptId = params?.id;

  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [openBySection, setOpenBySection] = useState(false);
  const [openBySub, setOpenBySub]       = useState(false);
  const [openProgress, setOpenProgress] = useState(false);

  const saveTimer = useRef(null);

  /* -------- Fetch attempt & names -------- */
  useEffect(() => {
    const run = () => {
      if (!attemptId) { setLoading(false); return; }
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a =>
        String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId)
      );
      if (found) setAttempt(found);
      setUserName(localStorage.getItem('userName') || '');
      setTrainerName(localStorage.getItem('trainerName') || '');
      setLoading(false);
    };
    run();
  }, [attemptId]);

  /* -------- Report URL (client only) -------- */
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !attemptId) return '';
    return `${window.location.origin}/quiz/report/${attemptId}`;
  }, [attemptId]);

  /* -------- Build QR (fallback through services) -------- */
  useEffect(() => {
    if (!reportUrl) return;
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reportUrl)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(reportUrl)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=300`,
    ];
    let i = 0, cancelled = false;
    const tryNext = () => {
      if (cancelled) return;
      if (i >= services.length) { setQrSrc(''); return; }
      const candidate = services[i++];
      const img = new Image();
      img.onload = () => !cancelled && setQrSrc(candidate);
      img.onerror = () => !cancelled && tryNext();
      img.referrerPolicy = 'no-referrer';
      img.src = candidate;
    };
    tryNext();
    return () => { cancelled = true; };
  }, [reportUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent" />
      </div>
    );
  }
  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد محاولة</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على تقرير مطابق لهذا المعرّف</p>
          <Link href="/quiz" className="bg-[#1e7850] hover:bg-[#155c3e] text-white font-bold py-3 px-6 rounded-xl inline-block">
            ← العودة للاختبار
          </Link>
        </div>
      </div>
    );
  }

  const printedAt = new Date();
  const { total, correct, wrong, percentage } = computeTotals(attempt);
  const stats = buildStats(attempt);

  /* -------- Progress data (from attempts history if موجود) -------- */
  const history = useMemo(() => {
    const arr = JSON.parse(localStorage.getItem('quizAttempts') || '[]')
      .filter(a => a?.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12);
    return arr.map(a => ({
      label: formatDateDMY(a.date),
      value: computeTotals(a).percentage,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8" dir="rtl">
      {/* Watermark */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.07] -z-10" style={{backgroundImage:"url('/logo.png')", backgroundRepeat:'no-repeat', backgroundPosition:'center', backgroundSize:'60%'}}/>

      <div className="max-w-5xl mx-auto">
        {/* Header with actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold">🏠 الرئيسية</Link>
          <Link href="/quiz" className="px-4 py-2 rounded-xl bg-[#1e7850] text-white font-bold">⬅️ العودة للاختبار</Link>
        </div>

        {/* Title */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e7850] text-center mb-2">🎓 تقرير أداء الاختبار</h1>
          <p className="text-center text-gray-600 text-lg">
            <span dir="ltr" className="inline-block font-mono">
              {toEnglishDigits(formatDateDMY(attempt.date))}
            </span>
          </p>
        </div>

        {/* Meta (names, printed info, url/id) */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-2">👤 اسم المتدرب</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => {
                  const v = e.target.value; setUserName(v);
                  clearTimeout(saveTimer.current);
                  saveTimer.current = setTimeout(() => localStorage.setItem('userName', v), 300);
                }}
                placeholder="أدخل اسمك..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1e7850] outline-none"
              />
            </div>
            <div>
              <label className="block font-bold mb-2">👨‍🏫 اسم المدرّب (اختياري)</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => {
                  const v = e.target.value; setTrainerName(v);
                  clearTimeout(saveTimer.current);
                  saveTimer.current = setTimeout(() => localStorage.setItem('trainerName', v), 300);
                }}
                placeholder="أدخل اسم المدرّب..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1e7850] outline-none"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="px-4 py-3 rounded-xl bg-gray-50 border">
              <div className="text-gray-500 text-sm">Printed on</div>
              <div className="font-bold">
                <span dir="ltr" className="inline-block font-mono">
                  {toEnglishDigits(`${formatDateDMY(printedAt)} — ${formatTime24(printedAt)}`)}
                </span>
              </div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-gray-50 border col-span-2">
              <div className="text-gray-500 text-sm">Report URL</div>
              <div className="font-mono text-sm break-all" dir="ltr">{reportUrl}</div>
            </div>
          </div>
        </div>

        {/* Score blocks */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 font-bold mb-2">✅ إجابات صحيحة</p>
            <p className="text-6xl font-extrabold text-green-600">{toEnglishDigits(correct)}</p>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-bold mb-2">❌ إجابات خاطئة</p>
            <p className="text-6xl font-extrabold text-red-600">{toEnglishDigits(wrong)}</p>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 font-bold mb-2">📝 إجمالي الأسئلة</p>
            <p className="text-6xl font-extrabold text-blue-600">{toEnglishDigits(total)}</p>
          </div>
        </div>

        {/* Percentage card */}
        <div className="bg-gradient-to-br from-[#1e7850] to-[#155c3e] rounded-3xl shadow p-8 mb-6 text-center text-white">
          <p className="text-2xl font-bold mb-3">النسبة المئوية</p>
          <p className="text-9xl font-extrabold mb-1">{toEnglishDigits(percentage)}%</p>
          <p className="text-white/80 text-lg">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => window.print()} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl">🖨️ طباعة</button>
          <button onClick={() => setOpenBySection(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl">📊 الأقسام</button>
          <button onClick={() => setOpenBySub(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl">🧩 الأجزاء الفرعية</button>
          <button onClick={() => setOpenProgress(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-2xl">📈 التقدّم</button>
        </div>

        {/* QR block */}
        <div className="bg-white rounded-3xl shadow p-8 text-center mb-10">
          <h2 className="text-3xl font-extrabold text-[#1e7850] mb-6 flex items-center justify-center gap-2">
            <span className="text-4xl">📱</span> رمز الاستجابة السريع
          </h2>
          <div className="flex justify-center mb-4">
            <div className="p-6 bg-white border-4 border-[#1e7850] rounded-3xl shadow-lg">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-72 h-72"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                <div className="w-72 h-72 flex items-center justify-center text-gray-400">تعذّر توليد QR</div>
              )}
            </div>
          </div>
          <button
            onClick={() => { if (!qrSrc) return; const a = document.createElement('a'); a.href = qrSrc; a.download = 'qr-code.png'; a.click(); }}
            className="bg-[#1e7850] hover:bg-[#155c3e] text-white font-bold py-3 px-6 rounded-2xl"
          >
            📥 تحميل QR
          </button>
          <p className="text-gray-600 mt-4">📸 امسح الكود للوصول السريع إلى التقرير</p>
        </div>
      </div>

      {/* ============ Modals ============ */}
      {/* By Section */}
      <StatsModal
        open={openBySection}
        onClose={() => setOpenBySection(false)}
        title="إحصاءات الأقسام"
        headerRight={(
          <>
            <button
              onClick={() => {
                const rows = [['القسم','صحيح','خطأ']];
                Object.entries(stats.bySection).forEach(([k, v]) => rows.push([k, v.correct, v.wrong]));
                downloadCsv('by-section.csv', rows);
              }}
              className="px-3 py-2 rounded-xl bg-green-600 text-white font-bold"
            >CSV ⬇️</button>
            <button
              onClick={() => {
                const cnv = document.getElementById('chart-by-section');
                const img = cnv ? cnv.toDataURL('image/png') : '';
                openPrintHtml('By Section', `
                  <h1>إحصاءات الأقسام</h1>
                  <div class="meta"><b>Student:</b> ${userName || '-'} &nbsp; | &nbsp; <b>Trainer:</b> ${trainerName || '-'}</div>
                  ${img ? `<img src="${img}" style="width:100%;max-width:780px"/>` : '<p>No chart</p>'}
                `);
              }}
              className="px-3 py-2 rounded-xl bg-gray-800 text-white font-bold"
            >طباعة</button>
          </>
        )}
      >
        <CanvasBars
          id="chart-by-section"
          labels={Object.keys(stats.bySection)}
          good={Object.values(stats.bySection).map(v => v.correct)}
          bad={Object.values(stats.bySection).map(v => v.wrong)}
        />
        <SectionList data={stats.bySection}/>
      </StatsModal>

      {/* By Sub */}
      <StatsModal
        open={openBySub}
        onClose={() => setOpenBySub(false)}
        title="الأقسام والأجزاء الفرعية"
        headerRight={(
          <>
            <button
              onClick={() => {
                const rows = [['القسم','الجزء الفرعي','صحيح','خطأ']];
                Object.values(stats.bySub).forEach(({section, sub, correct, wrong}) => rows.push([section, sub, correct, wrong]));
                downloadCsv('by-sub.csv', rows);
              }}
              className="px-3 py-2 rounded-xl bg-green-600 text-white font-bold"
            >CSV ⬇️</button>
            <button
              onClick={() => {
                const cnv = document.getElementById('chart-by-sub');
                const img = cnv ? cnv.toDataURL('image/png') : '';
                openPrintHtml('By Subsections', `
                  <h1>الأقسام والأجزاء الفرعية</h1>
                  <div class="meta"><b>Student:</b> ${userName || '-'} &nbsp; | &nbsp; <b>Trainer:</b> ${trainerName || '-'}</div>
                  ${img ? `<img src="${img}" style="width:100%;max-width:780px"/>` : '<p>No chart</p>'}
                `);
              }}
              className="px-3 py-2 rounded-xl bg-gray-800 text-white font-bold"
            >طباعة</button>
          </>
        )}
      >
        <CanvasBars
          id="chart-by-sub"
          labels={Object.values(stats.bySub).map(v => `${v.section} | ${v.sub}`)}
          good={Object.values(stats.bySub).map(v => v.correct)}
          bad={Object.values(stats.bySub).map(v => v.wrong)}
        />
        <SubList data={stats.bySub}/>
      </StatsModal>

      {/* Progress */}
      <StatsModal
        open={openProgress}
        onClose={() => setOpenProgress(false)}
        title="متابعة تقدّم المتدرّب"
        headerRight={(
          <>
            <button
              onClick={() => {
                const rows = [['التاريخ','النسبة %']];
                history.forEach(r => rows.push([r.label, r.value]));
                downloadCsv('progress.csv', rows);
              }}
              className="px-3 py-2 rounded-xl bg-green-600 text-white font-bold"
            >CSV ⬇️</button>
            <button
              onClick={() => {
                const cnv = document.getElementById('chart-progress');
                const img = cnv ? cnv.toDataURL('image/png') : '';
                openPrintHtml('Progress', `
                  <h1>متابعة تقدّم المتدرّب</h1>
                  <div class="meta"><b>Student:</b> ${userName || '-'} &nbsp; | &nbsp; <b>Trainer:</b> ${trainerName || '-'}</div>
                  ${img ? `<img src="${img}" style="width:100%;max-width:780px"/>` : '<p>No chart</p>'}
                `);
              }}
              className="px-3 py-2 rounded-xl bg-gray-800 text-white font-bold"
            >طباعة</button>
          </>
        )}
      >
        <CanvasLine
          id="chart-progress"
          labels={history.map(h => h.label)}
          values={history.map(h => h.value)}
        />
        <ul className="mt-4 space-y-2">
          {history.map((h, i) => (
            <li key={i} className="border rounded-xl p-3 flex items-center justify-between">
              <span className="font-mono" dir="ltr">{toEnglishDigits(h.label)}</span>
              <span className="font-bold text-[#1e7850]">{toEnglishDigits(h.value)}%</span>
            </li>
          ))}
          {history.length === 0 && <p className="text-gray-500">لا توجد محاولات سابقة كافية</p>}
        </ul>
      </StatsModal>
    </div>
  );
}

/* ===================== Small presentational components ===================== */
function CanvasBars({ id, labels = [], good = [], bad = [] }) {
  const ref = useRef(null);
  useEffect(() => {
    drawBarChart(ref.current, labels.map(toEnglishDigits), good, bad);
  }, [labels, good, bad]);
  return <canvas id={id} ref={ref} className="w-full block" />;
}

function CanvasLine({ id, labels = [], values = [] }) {
  const ref = useRef(null);
  useEffect(() => { drawLineChart(ref.current, labels.map(toEnglishDigits), values); }, [labels, values]);
  return <canvas id={id} ref={ref} className="w-full block" />;
}

function SectionList({ data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="mt-4 grid gap-3">
      {entries.map(([name, v]) => (
        <div key={name} className="border rounded-xl p-3 flex items-center justify-between">
          <div className="font-bold">{name}</div>
          <div className="text-sm text-gray-600">
            صحيح: <b className="text-[#1e7850]">{toEnglishDigits(v.correct)}</b> —
            خطأ: <b className="text-red-600">{toEnglishDigits(v.wrong)}</b>
          </div>
        </div>
      ))}
      {entries.length === 0 && <p className="text-gray-500">لا توجد بيانات كافية</p>}
    </div>
  );
}

function SubList({ data }) {
  const entries = Object.values(data || {});
  return (
    <div className="mt-4 grid gap-3">
      {entries.map((v, i) => (
        <div key={i} className="border rounded-xl p-3">
          <div className="font-bold mb-1">{v.section} — <span className="text-gray-600">{v.sub}</span></div>
          <div className="text-sm text-gray-600">
            صحيح: <b className="text-[#1e7850]">{toEnglishDigits(v.correct)}</b> —
            خطأ: <b className="text-red-600">{toEnglishDigits(v.wrong)}</b>
          </div>
        </div>
      ))}
      {entries.length === 0 && <p className="text-gray-500">لا توجد بيانات كافية</p>}
    </div>
  );
              }
