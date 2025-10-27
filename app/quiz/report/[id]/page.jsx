'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ========= Utilities: digits + date ========= */
function toEnglishDigits(input = '') {
  const map = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9','۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}
function formatDateEnRtl(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = String(d.getFullYear());
  return `${day} ${month} ${year}`;
}

export default function ReportPage() {
  const params = useParams();
  const attemptId = params?.id;

  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  /* ===== Load attempt & names ===== */
  useEffect(() => {
    if (!attemptId) { setLoading(false); return; }
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(a => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId));
    if (found) setAttempt(found);

    setUserName(localStorage.getItem('userName') || '');
    setTrainerName(localStorage.getItem('trainerName') || '');
    setLoading(false);
  }, [attemptId]);

  /* ===== Build report URL on client ===== */
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !attemptId) return '';
    return `${window.location.origin}/quiz/report/${attemptId}`;
  }, [attemptId]);

  /* ===== QR with multi-fallback (no libs) ===== */
  useEffect(() => {
    if (!reportUrl) return;
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reportUrl)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(reportUrl)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=300`
    ];
    let i = 0, cancelled = false;
    const tryNext = () => {
      if (cancelled) return;
      if (i >= services.length) { setQrSrc(''); return; }
      const candidate = services[i++];
      const img = new Image();
      img.onload = () => { if (!cancelled) setQrSrc(candidate); };
      img.onerror = () => { if (!cancelled) tryNext(); };
      img.referrerPolicy = 'no-referrer';
      img.crossOrigin = 'anonymous';
      img.src = candidate;
    };
    tryNext();
    return () => { cancelled = true; };
  }, [reportUrl]);

  const saveNames = () => {
    if (userName) localStorage.setItem('userName', userName);
    if (trainerName) localStorage.setItem('trainerName', trainerName);
  };

  /* ===== Loading state ===== */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-green-50">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent" />
      </div>
    );
  }

  /* ===== Not found ===== */
  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد محاولة</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على تقرير مطابق لهذا المعرّف</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl">🏠 الصفحة الرئيسية</Link>
            <Link href="/quiz" className="bg-[#1e7850] hover:bg-[#155c3e] text-white font-bold py-3 px-6 rounded-xl">← العودة للاختبار</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ===== Data ===== */
  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-8" dir="rtl">
      {/* Global Style: Fonts + Print */}
      <style jsx global>{`
        /* Google Fonts for screen (Cairo + Amiri) */
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');

        html, body {
          font-family: 'Cairo', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
        }

        /* Quran / Surah only: Amiri */
        .font-amiri { font-family: 'Amiri', 'Cairo', serif; }

        /* Print tuning */
        @page {
          size: A4;
          margin: 14mm;
        }
        @media print {
          html, body {
            direction: rtl;
            unicode-bidi: plaintext;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background: #fff !important;
          }
          /* Watermark over entire page, very light */
          body::before {
            content: "";
            position: fixed;
            inset: 0;
            background: url('/logo.png') center center / 85% 85% no-repeat;
            opacity: 0.07;
            z-index: 0;
          }
          /* Ensure our content stays above the watermark */
          #printArea { position: relative; z-index: 1; }
          /* Hide interactive-only elements */
          .no-print { display: none !important; }
          /* Show any print-only if needed */
          .only-print { display: block !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto" id="printArea">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 no-print">
              <Link href="/" className="px-4 py-2 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-800">🏠 الرئيسية</Link>
              <Link href="/quiz" className="px-4 py-2 rounded-xl bg-[#1e7850] text-white font-bold hover:bg-[#155c3e]">← العودة للاختبار</Link>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#1e7850] text-white font-bold grid place-items-center text-2xl">TJ</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] text-center mb-2">🎓 تقرير أداء الاختبار</h1>
          <p className="text-center text-gray-600 text-lg">
            {formatDateEnRtl(attempt.date || Date.now())}
          </p>
        </div>

        {/* Names */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">👤 اسم المتدرب</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسمك..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-[#1e7850] focus:outline-none no-print:bg-white"
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
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-[#1e7850] focus:outline-none no-print:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border-4 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 text-lg font-bold mb-2">✅ إجابات صحيحة</p>
            <p className="text-6xl font-extrabold text-green-600">{toEnglishDigits(score)}</p>
          </div>
          <div className="bg-red-50 border-4 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 text-lg font-bold mb-2">❌ إجابات خاطئة</p>
            <p className="text-6xl font-extrabold text-red-600">{toEnglishDigits(total - score)}</p>
          </div>
          <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 text-lg font-bold mb-2">📝 إجمالي الأسئلة</p>
            <p className="text-6xl font-extrabold text-blue-600">{toEnglishDigits(total)}</p>
          </div>
        </div>

        {/* Percentage */}
        <div className="bg-gradient-to-br from-[#1e7850] to-[#155c3e] rounded-3xl shadow-md p-8 mb-6 text-center text-white">
          <p className="text-2xl font-bold mb-3">النسبة المئوية</p>
          <p className="text-9xl font-extrabold mb-1">{toEnglishDigits(percentage)}%</p>
          <p className="text-white/90 text-lg">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6 no-print">
          <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl transition-all">🖨️ طباعة / تصدير PDF</button>
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
          <Link href="/" className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl transition-all text-center">🏠 الرئيسية</Link>
          <Link href="/quiz" className="bg-[#1e7850] hover:bg-[#155c3e] text-white font-bold py-3 px-4 rounded-2xl transition-all text-center">← العودة للاختبار</Link>
        </div>

        {/* QR */}
        <div className="bg-white rounded-3xl shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold text-[#1e7850] mb-6 flex items-center justify-center gap-3">
            <span className="text-5xl">📱</span>
            رمز الاستجابة السريع
          </h2>
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white border-4 border-[#1e7850] rounded-3xl shadow-lg">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-72 h-72"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
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
