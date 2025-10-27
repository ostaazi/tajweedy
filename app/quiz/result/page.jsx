'use client';

import { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

/* ============== Helpers ============== */
const toEnglishDigits = (s='') =>
  String(s).replace(/[٠-٩۰-۹]/g, (d) => '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹'.indexOf(d) <= 9
    ? '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]
    : '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)-10]);

const num = (x) => Number.isFinite(+x) ? +x : 0;

const formatDateDMY = (dateLike) => {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const day = String(d.getDate()).padStart(2,'0');
  const mon = d.toLocaleString('en-GB',{month:'short'});
  const yr  = String(d.getFullYear());
  return `${day} ${mon} ${yr}`;
};

const computeTotals = (attempt) => {
  let total =
    num(attempt?.questionsCount) ||
    (Array.isArray(attempt?.questions) ? attempt.questions.length : 0) ||
    (num(attempt?.correctCount) + num(attempt?.wrongCount)) ||
    num(attempt?.scoreMax || attempt?.max || 0);

  let correct = 0;
  if (Number.isFinite(attempt?.correctCount)) {
    correct = num(attempt.correctCount);
  } else if (Array.isArray(attempt?.questions) && Array.isArray(attempt?.answers)) {
    correct = attempt.questions.reduce((acc, q, i) => acc + (attempt.answers[i] === q?.answer ? 1 : 0), 0);
  } else if (attempt?.score != null) {
    const s = num(attempt.score);
    if (total && s <= total) correct = s;
    else if (total && s > 1 && s <= 100) correct = Math.round((s/100)*total);
    else if (total && s > 0 && s < 1) correct = Math.round(s*total);
    else correct = s;
  }
  const wrong = Math.max(total - correct, 0);
  let percentage = 0;
  if (Number.isFinite(attempt?.scorePercent)) percentage = Math.round(num(attempt.scorePercent));
  else if (Number.isFinite(attempt?.percentage)) percentage = Math.round(num(attempt.percentage));
  else percentage = total ? Math.round((correct/total)*100) : 0;
  if (percentage > 100 && total) percentage = Math.round((correct/total)*100);
  return { total, correct, wrong, percentage };
};

const buildStats = (attempt) => {
  const stats = { byQuestion: [], bySection: {}, history: [] };
  const ans = Array.isArray(attempt?.answers) ? attempt.answers : [];
  const qs  = Array.isArray(attempt?.questions) ? attempt.questions : [];
  qs.forEach((q, i) => {
    const ok = ans[i] === q?.answer;
    const section = q?.section || 'غير محدد';
    stats.byQuestion.push({
      label: q?.title || q?.question?.slice(0, 24) || `سؤال ${i+1}`,
      section,
      text: q?.question || '',
      correct: ok ? 1 : 0,
      wrong:   ok ? 0 : 1,
    });
    stats.bySection[section] ??= { correct:0, wrong:0 };
    stats.bySection[section][ok ? 'correct' : 'wrong']++;
  });

  const list = JSON.parse(localStorage.getItem('quizAttempts') || '[]')
    .filter(a => a?.date)
    .sort((a,b)=> new Date(a.date)-new Date(b.date))
    .slice(-12);
  stats.history = list.map(a => ({ label: formatDateDMY(a.date), value: computeTotals(a).percentage }));
  return stats;
};

const drawBars = (canvas, labels, good, bad, options={}) => {
  if (!canvas || !labels?.length) return;
  const DPR = window.devicePixelRatio || 1;
  const width = options.width || 680, height = options.height || 300, pad = 36;
  canvas.width = width * DPR; canvas.height = height * DPR;
  canvas.style.width = width+'px'; canvas.style.height = height+'px';
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,width,height);
  const max = Math.max(1, ...good, ...bad);
  const step = (width - pad*2)/labels.length;
  const bw = step/2.2;

  labels.forEach((lb, i) => {
    const x = pad + i*step + 8;
    const hg = (good[i]/max)*(height-pad*2);
    const hb = (bad[i]/max)*(height-pad*2);
    ctx.fillStyle = '#dc2626';  ctx.fillRect(x, height-pad-hb, bw, hb);
    ctx.fillStyle = '#1e7850';  ctx.fillRect(x+bw+4, height-pad-hg, bw, hg);
    ctx.fillStyle = '#556'; ctx.font = '11px Cairo, system-ui';
    ctx.save(); ctx.translate(x, height-pad+12); ctx.rotate(-0.6); ctx.fillText(lb,0,0); ctx.restore();
  });
  ctx.strokeStyle='#e5e7eb'; ctx.beginPath(); ctx.moveTo(pad,height-pad); ctx.lineTo(width-pad,height-pad); ctx.stroke();
};

const drawLine = (canvas, labels, values, color='#1e40af', options={}) => {
  if (!canvas || !labels?.length) return;
  const DPR = window.devicePixelRatio || 1;
  const width = options.width || 680, height = options.height || 300, pad = 36;
  canvas.width = width * DPR; canvas.height = height * DPR;
  canvas.style.width = width+'px'; canvas.style.height = height+'px';
  const ctx = canvas.getContext('2d'); ctx.scale(DPR, DPR);
  ctx.clearRect(0,0,width,height);

  const max = Math.max(1, ...values), min = Math.min(0, ...values);
  const sx = (width-pad*2)/Math.max(1, labels.length-1);
  const sy = (height-pad*2)/Math.max(1, max-min);

  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
  values.forEach((v,i)=> {
    const x = pad + i*sx;
    const y = height - pad - (v-min)*sy;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  ctx.fillStyle='#556'; ctx.font='11px Cairo, system-ui';
  labels.forEach((lb,i)=>{ const x=pad+i*sx; ctx.save(); ctx.translate(x-10,height-pad+12); ctx.rotate(-0.6); ctx.fillText(lb,0,0); ctx.restore(); });
  ctx.strokeStyle='#e5e7eb'; ctx.beginPath(); ctx.moveTo(pad,height-pad); ctx.lineTo(width-pad,height-pad); ctx.stroke();
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};
const exportCSV = (rows, filename) => {
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], {type:'text/csv;charset=utf-8;'}), filename);
};
const exportCanvasPNG = (canvas, filename) => {
  if (!canvas) return;
  canvas.toBlob(blob => blob && downloadBlob(blob, filename));
};

/* ============== Canvas components ============== */
function CanvasBars({ labels=[], good=[], bad=[], id='bars' }) {
  const ref = useRef(null);
  useEffect(()=>{ drawBars(ref.current, labels, good, bad); },[labels,good,bad]);
  return <canvas id={id} ref={ref} className="w-full block" />;
}
function CanvasLine({ labels=[], values=[], id='line' }) {
  const ref = useRef(null);
  useEffect(()=>{ drawLine(ref.current, labels, values); },[labels,values]);
  return <canvas id={id} ref={ref} className="w-full block" />;
}

/* ============== Page ============== */
function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('id');

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('');

  // Modals
  const [openQ, setOpenQ] = useState(false);
  const [openS, setOpenS] = useState(false);
  const [openP, setOpenP] = useState(false);

  // QR
  const [qrSrc, setQrSrc] = useState('');
  const [qrFail, setQrFail] = useState(false);

  useEffect(() => {
    try {
      const data = localStorage.getItem('quizAttempts');
      setStudentName(localStorage.getItem('userName') || '');
      setTeacherName(localStorage.getItem('trainerName') || '');

      if (!data) { setLoading(false); return; }
      const attempts = JSON.parse(data);
      if (!Array.isArray(attempts) || attempts.length === 0) { setLoading(false); return; }

      let found = null;
      if (attemptId) found = attempts.find(a => String(a?.id)===String(attemptId) || Number(a?.id)===Number(attemptId));
      if (!found) found = attempts[attempts.length-1];

      setAttempt(found || null);
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  }, [attemptId]);

  // رابط التقرير
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const id = attemptId || attempt?.id;
    return id ? `${window.location.origin}/quiz/report/${id}` : window.location.href;
  }, [attemptId, attempt]);

  // إنشاء QR (بدون مكتبات)
  useEffect(() => {
    if (!reportUrl) return;
    setQrFail(false);
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(reportUrl)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=600x600&chl=${encodeURIComponent(reportUrl)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=600`,
    ];
    let i = 0, cancelled = false;
    const tryNext = () => {
      if (cancelled) return;
      if (i >= services.length) { setQrSrc(''); setQrFail(true); return; }
      const src = services[i++];
      const img = new Image();
      img.onload = () => !cancelled && setQrSrc(src);
      img.onerror = () => !cancelled && tryNext();
      img.referrerPolicy = 'no-referrer';
      img.src = src;
    };
    tryNext();
    return () => { cancelled = true; };
  }, [reportUrl]);

  const saveNames = () => {
    if (studentName) localStorage.setItem('userName', studentName);
    if (teacherName) localStorage.setItem('trainerName', teacherName);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4"></div>
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

  const { total, correct, wrong, percentage } = computeTotals(attempt);
  const stats = buildStats(attempt);
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const csvQuestions = [
    ['#','القسم','السؤال','صحيح','خطأ']
  ].concat(stats.byQuestion.map((q,i)=>[i+1,q.section,q.text.replace(/\n/g,' '),q.correct,q.wrong]));
  const csvSections = [
    ['القسم','صحيح','خطأ','النسبة %']
  ].concat(Object.entries(stats.bySection).map(([k,v])=>[k,v.correct,v.wrong, (v.correct+v.wrong? Math.round((v.correct/(v.correct+v.wrong))*100):0)]));

  const barsSecRefId = 'bars-sec';
  const lineProgRefId = 'line-prog';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 relative" dir="rtl">
      {/* Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.07] z-0">
        <div className="w-[820px] h-[820px] relative">
          <Image src="/logo.png" alt="Watermark" fill className="object-contain" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md">
          <Link href="/" className="px-4 py-2 rounded-xl bg-gray-800 text-white font-bold">🏠 الرئيسية</Link>
          <Link href="/quiz" className="px-4 py-2 rounded-xl bg-[#1e7850] text-white font-bold">⬅️ العودة للاختبار</Link>
        </div>

        {/* Title + Date */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e7850] mb-2">🎓 نتيجة الاختبار</h1>
          <p className="text-gray-600 text-lg">{formatDateDMY(attempt.date)}</p>
        </div>

        {/* Names */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-lg">👤 اسم المتدرّب</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                onBlur={saveNames}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1e7850] focus:outline-none text-lg"
                placeholder="أدخل اسمك..."
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-lg">👨‍🏫 اسم المدرب (اختياري)</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                onBlur={saveNames}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1e7850] focus:outline-none text-lg"
                placeholder="أدخل اسم المدرب..."
              />
            </div>
          </div>
        </div>

        {/* Circle + Cards */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* دائرة النسبة */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="transform -rotate-90" width="256" height="256">
                <circle cx="128" cy="128" r="80" stroke="#e5e7eb" strokeWidth="20" fill="none" />
                <circle
                  cx="128" cy="128" r="80" stroke="#1e7850" strokeWidth="20" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-extrabold text-[#1e7850]">{toEnglishDigits(percentage)}%</p>
                  <p className="text-gray-600 mt-2 text-lg">{percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}</p>
                </div>
              </div>
            </div>

            {/* بطاقات الأرقام */}
            <div className="space-y-4">
              <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200">
                <p className="text-green-800 font-semibold text-xl mb-2 text-center">✅ إجابات صحيحة</p>
                <div className="flex items-center justify-center">
                  <p className="text-5xl font-extrabold text-green-600">{toEnglishDigits(correct)}</p>
                </div>
              </div>
              <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-200">
                <p className="text-red-800 font-semibold text-xl mb-2 text-center">❌ إجابات خاطئة</p>
                <div className="flex items-center justify-center">
                  <p className="text-5xl font-extrabold text-red-600">{toEnglishDigits(wrong)}</p>
                </div>
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200">
                <p className="text-blue-800 font-semibold text-xl mb-2 text-center">📝 إجمالي الأسئلة</p>
                <div className="flex items-center justify-center">
                  <p className="text-5xl font-extrabold text-blue-600">{toEnglishDigits(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* أزرار أساسية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <button onClick={()=>setOpenQ(true)} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 rounded-2xl">📋 إحصاءات الأسئلة</button>
          <button onClick={()=>setOpenS(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl">📊 الأقسام</button>
          <button onClick={()=>setOpenP(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl">📈 التقدّم</button>
          <button onClick={()=>window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-2xl">🖨️ طباعة/ PDF</button>
        </div>

        {/* QR Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 mb-8">
          <h3 className="text-2xl font-extrabold text-[#1e7850] text-center mb-4">رمز الاستجابة السريع للوصول السريع 📱</h3>

          <div className="flex items-center justify-center">
            <div className="relative">
              {/* إطار حول QR */}
              <div className="p-3 rounded-2xl border-4 border-emerald-600 bg-white shadow-lg">
                {qrSrc && !qrFail ? (
                  <div className="relative w-[320px] h-[320px]">
                    <img
                      src={qrSrc}
                      alt="QR"
                      className="w-[320px] h-[320px] rounded-md"
                      referrerPolicy="no-referrer"
                      onError={() => setQrFail(true)}
                    />
                    {/* شعار في المنتصف */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white shadow ring-2 ring-emerald-700 flex items-center justify-center overflow-hidden">
                        <Image src="/logo.png" alt="Tajweedy" width={56} height={56} className="object-contain" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-[320px] h-[320px] flex items-center justify-center text-gray-500">تعذّر توليد QR</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center">
            <button
              onClick={() => {
                if (!qrSrc) return;
                const a = document.createElement('a');
                a.href = qrSrc;
                a.download = 'tajweedy-qr.png';
                a.click();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl"
            >
              ⬇ تحميل QR
            </button>
          </div>

          <p className="text-center text-gray-600 mt-4">📸 امسح الكود باستخدام كاميرا الهاتف أو قارئ QR</p>

          {/* توقيع صغير أسفل القسم */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="w-12 h-12 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div className="text-right">
              <p className="text-[#1e7850] font-bold">Tajweedy</p>
              <p className="text-gray-500 text-sm">التجويد التفاعلي</p>
            </div>
          </div>
        </div>

        {/* ===== Modals ===== */}
        {openQ && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">إحصاءات الأسئلة</h3>
                <div className="flex gap-2">
                  <button onClick={()=>exportCSV(csvQuestions,'questions.csv')} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold">CSV ⬇</button>
                  <button onClick={()=>setOpenQ(false)} className="px-3 py-2 rounded-xl bg-gray-100 font-bold">إغلاق ✖️</button>
                </div>
              </div>
              <div className="space-y-3 max-h-[70vh] overflow-auto">
                {stats.byQuestion.length ? stats.byQuestion.map((q,i)=>(
                  <div key={i} className="border rounded-2xl p-3">
                    <div className="font-bold mb-1">قال تعالى: {q.text ? `«${q.text.slice(0,140)}»` : q.label}</div>
                    <div className="text-sm text-gray-600 mb-2">القسم: {q.section}</div>
                    <div className="flex gap-6 text-sm">
                      <span className="text-green-700">✅ صحيح: <b>{toEnglishDigits(q.correct)}</b></span>
                      <span className="text-red-600">❌ خطأ: <b>{toEnglishDigits(q.wrong)}</b></span>
                      <span className="text-blue-700">النسبة: <b>{toEnglishDigits(q.correct ? 100 : 0)}%</b></span>
                    </div>
                  </div>
                )) : <p className="text-gray-500">لا توجد أسئلة</p>}
              </div>
            </div>
          </div>
        )}

        {openS && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">الأقسام</h3>
                <div className="flex gap-2">
                  <button onClick={()=>exportCSV(csvSections,'sections.csv')} className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold">CSV ⬇</button>
                  <button onClick={()=>exportCanvasPNG(document.getElementById(barsSecRefId),'sections.png')} className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold">PNG ⬇</button>
                  <button onClick={()=>setOpenS(false)} className="px-3 py-2 rounded-xl bg-gray-100 font-bold">إغلاق ✖️</button>
                </div>
              </div>
              <CanvasBars
                id={barsSecRefId}
                labels={Object.keys(stats.bySection)}
                good={Object.values(stats.bySection).map(v=>v.correct)}
                bad={Object.values(stats.bySection).map(v=>v.wrong)}
              />
            </div>
          </div>
        )}

        {openP && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-3xl p-4 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-2xl md:text-3xl font-extrabold text-[#1e7850]">متابعة التقدّم</h3>
                <div className="flex gap-2">
                  <button
                    onClick={()=>exportCSV([['التاريخ','%']].concat(stats.history.map(h=>[h.label,h.value])),'progress.csv')}
                    className="px-3 py-2 rounded-xl bg-blue-600 text-white font-bold">CSV ⬇</button>
                  <button onClick={()=>exportCanvasPNG(document.getElementById(lineProgRefId),'progress.png')} className="px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold">PNG ⬇</button>
                  <button onClick={()=>setOpenP(false)} className="px-3 py-2 rounded-xl bg-gray-100 font-bold">إغلاق ✖️</button>
                </div>
              </div>
              <CanvasLine
                id={lineProgRefId}
                labels={stats.history.map(h=>h.label)}
                values={stats.history.map(h=>h.value)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== Suspense Wrapper ============== */
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent"></div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
              }
