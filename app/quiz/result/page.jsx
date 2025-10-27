'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

/* ============================
   Helpers (بدون مكتبات)
   ============================ */
const toEN = (s = '') => String(s).replace(
  /[٠-٩۰-۹]/g,
  d => '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹'.indexOf(d) < 10
    ? String('0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)])
    : String('0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d) - 10])
);
const n = v => Number.isFinite(+v) ? +v : 0;

const formatDMY = (dateLike) => {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  const yr  = String(d.getFullYear());
  // RTL مع أرقام إنجليزية
  return `${day} ${mon} ${yr}`;
};

function computeTotals(attempt) {
  let total =
    n(attempt?.questionsCount) ||
    (Array.isArray(attempt?.questions) ? attempt.questions.length : 0) ||
    (n(attempt?.correctCount) + n(attempt?.wrongCount)) ||
    n(attempt?.scoreMax) || n(attempt?.max);

  let correct = 0;

  if (Number.isFinite(attempt?.correctCount)) {
    correct = n(attempt.correctCount);
  } else if (Array.isArray(attempt?.questions) && Array.isArray(attempt?.answers)) {
    correct = attempt.questions.reduce((acc, q, i) => acc + (attempt.answers[i] === q?.answer ? 1 : 0), 0);
  } else if (attempt?.score != null) {
    const s = n(attempt.score);
    if (total && s <= total) correct = s;            // score = عدد صحيح
    else if (total && s > 1 && s <= 100) correct = Math.round((s / 100) * total); // score = %
    else if (total && s > 0 && s < 1) correct = Math.round(s * total);            // score = 0..1
    else correct = s;
  }

  const wrong = Math.max(total - correct, 0);
  let percentage = 0;
  if (Number.isFinite(attempt?.scorePercent)) percentage = Math.round(n(attempt.scorePercent));
  else if (Number.isFinite(attempt?.percentage)) percentage = Math.round(n(attempt.percentage));
  else percentage = total ? Math.round((correct / total) * 100) : 0;

  if (percentage > 100 && total) percentage = Math.round((correct / total) * 100);

  return { total, correct, wrong, percentage };
}

function buildStats(attempt) {
  const stats = { byQuestion: [], bySection: {}, bySub: {} };
  if (!Array.isArray(attempt?.questions)) return stats;
  const ans = Array.isArray(attempt.answers) ? attempt.answers : [];
  attempt.questions.forEach((q, i) => {
    const isCorrect = ans[i] === q?.answer;
    const section = q?.section || 'غير محدد';
    const sub = q?.subsection || q?.subSection || 'غير محدد';
    const key = `${section} | ${sub}`;
    stats.byQuestion.push({
      idx: i + 1,
      text: q?.question || '',
      section, sub,
      correct: isCorrect ? 1 : 0,
      wrong: isCorrect ? 0 : 1
    });
    stats.bySection[section] ??= { correct: 0, wrong: 0 };
    stats.bySection[section][isCorrect ? 'correct' : 'wrong']++;
    stats.bySub[key] ??= { correct: 0, wrong: 0, section, sub };
    stats.bySub[key][isCorrect ? 'correct' : 'wrong']++;
  });
  return stats;
}

/* Canvas charts */
function drawBars(canvas, labels, good, bad, primary = '#1e7850', danger = '#dc2626') {
  if (!canvas || !labels?.length) return;
  const DPR = window.devicePixelRatio || 1;
  const W = 720, H = 320, pad = 36;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(1, ...good, ...bad);
  const step = (W - pad * 2) / labels.length;
  const bw = step / 2.2;

  // grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

  labels.forEach((lb, i) => {
    const x = pad + i * step + 8;
    const hg = (good[i] / max) * (H - pad * 2);
    const hb = (bad[i] / max) * (H - pad * 2);
    ctx.fillStyle = danger;  ctx.fillRect(x, H - pad - hb, bw, hb);
    ctx.fillStyle = primary; ctx.fillRect(x + bw + 4, H - pad - hg, bw, hg);

    ctx.fillStyle = '#556';
    ctx.font = '11px Cairo, system-ui';
    ctx.save(); ctx.translate(x, H - pad + 12); ctx.rotate(-0.6); ctx.fillText(lb, 0, 0); ctx.restore();
  });
}

function drawLine(canvas, labels, values, color = '#1e40af') {
  if (!canvas || !labels?.length) return;
  const DPR = window.devicePixelRatio || 1;
  const W = 720, H = 320, pad = 36;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(1, ...values);
  const min = Math.min(0, ...values);
  const sx = (W - pad * 2) / Math.max(1, labels.length - 1);
  const sy = (H - pad * 2) / Math.max(1, max - min);

  // axis
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.stroke();

  // line
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + i * sx;
    const y = H - pad - (v - min) * sy;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // labels
  ctx.fillStyle = '#556'; ctx.font = '11px Cairo, system-ui';
  labels.forEach((lb, i) => {
    const x = pad + i * sx;
    ctx.save(); ctx.translate(x - 10, H - pad + 12); ctx.rotate(-0.6); ctx.fillText(lb, 0, 0); ctx.restore();
  });
}

/* صغيرة لتصدير CSV/PNG/PDF */
function download(filename, content, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function openPrintWithImages(title, images = [], extraHtml = '') {
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.write(`
    <html dir="rtl"><head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body{font-family:Cairo,system-ui,-apple-system,Segoe UI,Roboto; padding:24px}
        .img{margin:12px 0; width:100%; max-width:900px}
        table{border-collapse:collapse; width:100%; margin-top:16px}
        td,th{border:1px solid #ddd; padding:8px; text-align:center}
        h1{color:#1e7850}
      </style>
    </head><body>
      <h1>${title}</h1>
      ${images.map(src => `<img class="img" src="${src}" />`).join('')}
      ${extraHtml}
      <script>setTimeout(()=>window.print(), 300);</script>
    </body></html>
  `);
  w.document.close();
}

/* ============================
   الرسوم (كمبونات صغيرة)
   ============================ */
function Bars({ labels = [], good = [], bad = [] }) {
  const ref = useRef(null);
  useEffect(() => { drawBars(ref.current, labels, good, bad); }, [labels, good, bad]);
  return <canvas ref={ref} className="w-full block" />;
}
function LineChart({ labels = [], values = [] }) {
  const ref = useRef(null);
  useEffect(() => { drawLine(ref.current, labels, values); }, [labels, values]);
  return <canvas ref={ref} className="w-full block" />;
}

/* ============================
   الصفحة
   ============================ */
function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('id');

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showQ, setShowQ] = useState(false);
  const [showSec, setShowSec] = useState(false);
  const [showProg, setShowProg] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem('quizAttempts');
      if (!data) { setLoading(false); return; }
      const attempts = JSON.parse(data);
      if (!Array.isArray(attempts) || attempts.length === 0) { setLoading(false); return; }
      let found = null;
      if (attemptId) {
        found = attempts.find(a => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId));
      }
      if (!found) found = attempts[attempts.length - 1];
      setAttempt(found); setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [attemptId]);

  const { total, correct, wrong, percentage } = useMemo(
    () => computeTotals(attempt || {}),
    [attempt]
  );

  const stats = useMemo(() => buildStats(attempt || {}), [attempt]);

  const history = useMemo(() => {
    const arr = JSON.parse(localStorage.getItem('quizAttempts') || '[]')
      .filter(a => a?.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-12);
    return arr.map(a => ({ label: formatDMY(a.date), value: computeTotals(a).percentage }));
  }, []);

  /* تصدير CSV */
  const exportCSV = () => {
    const rows = [
      ['Index','Section','Subsection','Correct','Wrong']
    ];
    stats.byQuestion.forEach(q => rows.push([q.idx, q.section, q.sub, q.correct, q.wrong]));
    const csv = rows.map(r => r.join(',')).join('\n');
    download(`questions-stats-${Date.now()}.csv`, csv, 'text/csv');
  };

  /* حفظ الرسوم على شكل صور/طباعة PDF */
  const exportCharts = (asPdf = false) => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const imgs = canvases.map(c => c.toDataURL('image/png'));
    if (asPdf) {
      openPrintWithImages('Tajweedy Report Charts', imgs);
    } else {
      imgs.forEach((src, i) => {
        const a = document.createElement('a');
        a.href = src; a.download = `chart-${i + 1}.png`; a.click();
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 text-lg">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-3xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">لا توجد نتائج</h2>
          <p className="text-gray-600 mb-6">يرجى إكمال الاختبار أولاً</p>
          <Link href="/quiz" className="inline-block bg-[#1e7850] text-white px-6 py-3 rounded-full font-bold hover:bg-[#155c3e]">
            بدء اختبار جديد
          </Link>
        </div>
      </div>
    );
  }

  /* دوائر النسبة */
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 relative" dir="rtl">
      {/* Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] z-0">
        <div className="w-[800px] h-[800px] relative">
          <Image src="/logo.png" alt="Watermark" fill className="object-contain" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md">
          <Link href="/" className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold">🏠 الرئيسية</Link>
          <Link href="/quiz" className="px-4 py-2 rounded-xl bg-[#1e7850] text-white font-bold">⬅️ العودة للاختبار</Link>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e7850] mb-2">🎓 نتيجة الاختبار</h1>
          <p className="text-gray-600 text-lg">{formatDMY(attempt.date)}</p>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="relative w-64 h-64 mx-auto">
              <svg className="transform -rotate-90" width="256" height="256">
                <circle cx="128" cy="128" r="80" stroke="#e5e7eb" strokeWidth="20" fill="none" />
                <circle
                  cx="128" cy="128" r="80" stroke="#10b981" strokeWidth="20" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-extrabold text-[#1e7850]">{toEN(percentage)}%</p>
                  <p className="text-gray-600 mt-2 text-lg">
                    {percentage >= 80 ? '🎉 ممتاز' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200 flex flex-col items-center justify-center text-center">
                <p className="text-green-800 font-semibold text-xl mb-2">✅ إجابات صحيحة</p>
                <p className="text-5xl font-extrabold text-green-600 leading-none">{toEN(correct)}</p>
              </div>
              <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-200 flex flex-col items-center justify-center text-center">
                <p className="text-red-800 font-semibold text-xl mb-2">❌ إجابات خاطئة</p>
                <p className="text-5xl font-extrabold text-red-600 leading-none">{toEN(wrong)}</p>
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200 flex flex-col items-center justify-center text-center">
                <p className="text-blue-800 font-semibold text-xl mb-2">📝 إجمالي الأسئلة</p>
                <p className="text-5xl font-extrabold text-blue-600 leading-none">{toEN(total)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <button onClick={() => setShowQ(true)}   className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 rounded-2xl">📋 إحصاءات الأسئلة</button>
          <button onClick={() => setShowSec(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-2xl">📊 الأقسام</button>
          <button onClick={() => setShowProg(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl">📈 التقدّم</button>
          <button onClick={() => window.print()}     className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl">🖨️ طباعة</button>
          <button onClick={exportCSV}                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl">CSV ⬇️</button>
        </div>

        {/* Charts snapshot/export */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => exportCharts(false)} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">تحميل الرسوم PNG</button>
          <button onClick={() => exportCharts(true)}  className="px-4 py-2 rounded-xl bg-[#1e7850] text-white font-bold">تصدير PDF</button>
        </div>

        {/* Modals */}
        {showQ && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">إحصاءات الأسئلة</h3>
                <button onClick={() => setShowQ(false)} className="px-3 py-2 rounded-xl bg-gray-100 font-bold">إغلاق ✖️</button>
              </div>
              <div className="max-h-[70vh] overflow-auto space-y-3">
                {stats.byQuestion.length ? stats.byQuestion.map((q) => (
                  <div key={q.idx} className="border rounded-2xl p-4">
                    <div className="mb-2 text-gray-700">
                      <b className="font-amiri">قال تعالى:</b> {q.text ? `«${q.text.slice(0, 160)}»` : `سؤال ${q.idx}`}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">القسم: {q.section} — الجزء الفرعي: {q.sub}</div>
                    <div className="flex gap-6">
                      <span className="text-green-700">✅ صحيح: <b>{toEN(q.correct)}</b></span>
                      <span className="text-red-600">❌ خطأ: <b>{toEN(q.wrong)}</b></span>
                      <span className="text-blue-700">النسبة: <b>{toEN(q.correct ? 100 : 0)}%</b></span>
                    </div>
                  </div>
                )) : <p className="text-gray-500">لا توجد أسئلة</p>}
              </div>
            </div>
          </div>
        )}

        {showSec && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">الأقسام والأجزاء الفرعية</h3>
                <button onClick={() => setShowSec(false)} className="px-3 py-2 rounded-xl bg-gray-100 font-bold">إغلاق ✖️</button>
              </div>

              <Bars
                labels={Object.values(stats.bySub).map(v => `${v.section} | ${v.sub}`)}
                good={Object.values(stats.bySub).map(v => v.correct)}
                bad={Object.values(stats.bySub).map(v => v.wrong)}
              />

              <div className="mt-4 grid gap-2">
                {Object.entries(stats.bySection).map(([name, v]) => (
                  <div key={name} className="border rounded-xl p-3 flex items-center justify-between">
                    <b>{name}</b>
                    <span className="text-sm text-gray-600">
                      صحيح: <b className="text-[#1e7850]">{toEN(v.correct)}</b> — خطأ: <b className="text-red-600">{toEN(v.wrong)}</b>
                    </span>
                  </div>
                ))}
                {!Object.keys(stats.bySection).length && <p className="text-gray-500">لا توجد بيانات</p>}
              </div>
            </div>
          </div>
        )}

        {showProg && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-5xl rounded-3xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">متابعة تقدّم المتدرّب</h3>
                <button onClick={() => setShowProg(false)} className="px-3 py-2 rounded-xl bg-gray-100 font-bold">إغلاق ✖️</button>
              </div>

              <LineChart
                labels={history.map(h => h.label)}
                values={history.map(h => h.value)}
              />

              <ul className="mt-3 space-y-2">
                {history.map((h, i) => (
                  <li key={i} className="border rounded-xl p-3 flex items-center justify-between">
                    <span className="font-mono" dir="ltr">{toEN(h.label)}</span>
                    <b className="text-[#1e7850]">{toEN(h.value)}%</b>
                  </li>
                ))}
                {!history.length && <p className="text-gray-500">لا توجد محاولات</p>}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
