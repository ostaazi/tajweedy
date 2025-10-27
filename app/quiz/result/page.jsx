'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* ============ أدوات عامة ============ */
function toEnglishDigits(input = '') {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
    '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}
function formatDate(d) {
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2,'0');
  const month = String(dt.getMonth()+1).padStart(2,'0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}
function formatTime(d) {
  const dt = new Date(d);
  const h = String(dt.getHours()).padStart(2,'0');
  const m = String(dt.getMinutes()).padStart(2,'0');
  return `${h}:${m}`;
}

/* ============ مكون QR مدمج ============ */
function QrCode({ value, size = 250 }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;

    const logo = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '';
    const services = [
      `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=${size}&centerImageUrl=${encodeURIComponent(logo)}&centerImageSizeRatio=0.25&margin=2`,
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(value)}`
    ];

    let i = 0, stopped = false;
    const tryNext = () => {
      if (stopped) return;
      if (i >= services.length) { setError(true); return; }
      const url = services[i++];
      const img = new Image();
      img.onload = () => { if (!stopped) setSrc(url); };
      img.onerror = () => !stopped && tryNext();
      img.referrerPolicy = 'no-referrer';
      img.src = url;
    };
    tryNext();
    return () => { stopped = true; };
  }, [value, size]);

  if (!value) return null;

  return (
    <div className="text-center my-4">
      {error ? (
        <p className="text-gray-500">تعذّر توليد رمز الاستجابة</p>
      ) : (
        <>
          <img
            src={src}
            alt="QR Code"
            className="mx-auto rounded-xl border-4 border-green-300 shadow"
            style={{ width: size, height: size }}
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = src;
              a.download = 'Tajweedy_QR.png';
              a.click();
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white font-bold rounded-xl no-print"
          >
            تحميل QR 📥
          </button>
        </>
      )}
    </div>
  );
}

/* ============ الصفحة ============ */
function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams?.get('id');

  const [attempt, setAttempt] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [user, setUser] = useState({ name: 'اسم المتدرب' });
  const [loading, setLoading] = useState(true);

  // نص QR شامل كل التفاصيل + الرابط
  const [qrText, setQrText] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser({ name: userData.name || 'اسم المتدرب' });

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    setAllAttempts([...attempts].sort((a,b)=>new Date(b.date)-new Date(a.date)));

    const found = attemptId ? attempts.find(a => String(a?.id) === String(attemptId)) : null;
    setAttempt(found || null);
    setLoading(false);
  }, [attemptId]);

  // ابنِ payload النصي للـ QR (متعدد الأسطر) + الرابط المباشر
  useEffect(() => {
    if (!attemptId || !attempt || typeof window === 'undefined') { setQrText(''); return; }

    const origin = window.location.origin;
    const link = `${origin}/quiz/result?id=${attemptId}`;

    const score = Number(attempt.score ?? 0);
    const total = Number(attempt.total ?? 0);
    const pct = total ? Math.round((score/total)*100) : 0;
    const dateStr = `${formatDate(attempt.date || Date.now())} ${formatTime(attempt.date || Date.now())}`;
    const code = `TJ-${toEnglishDigits(attemptId)}`;
    const type = attempt.type || 'اختبار';
    const name = user?.name || 'اسم المتدرب';

    // نص واضح ومضغوط – مناسب للتطبيقات عند المسح
    const text =
`Tajweedy Result
Name: ${name}
Type: ${type}
Code: ${code}
Date: ${dateStr}
Score: ${toEnglishDigits(score)}/${toEnglishDigits(total)} (${toEnglishDigits(pct)}%)
Link: ${link}`;

    setQrText(text);
  }, [attemptId, attempt, user?.name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد بيانات</p>
          <Link href="/quiz" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl">
            ← اختبار جديد
          </Link>
        </div>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const examType = attempt.type || 'اختبار';
  const examName = attempt.name || 'اختبار التجويد';
  const examCode = `TJ-${toEnglishDigits(attemptId)}`;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        * { font-family: 'Cairo', sans-serif !important; }
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body * { visibility: hidden; }
          #result-print-area, #result-print-area * { visibility: visible; }
          #result-print-area { position: absolute; left:0; top:0; width:100%; background:#fff; padding:20px; }
          .no-print { display: none !important; }
          .bg-gradient-to-br { background: #fff !important; }
          .shadow-lg { box-shadow: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8" dir="rtl">
        <div id="result-print-area" className="max-w-4xl mx-auto">

          {/* شعار واسم */}
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Tajweedy Logo" className="w-20 h-20 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-primary mb-2">Tajweedy - التجويد الذكي</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h2>
            <p className="text-lg text-gray-600">
              <strong>النوع:</strong> {examType} | <strong>الاسم:</strong> {examName} | <strong>الكود:</strong> {examCode}
            </p>
          </div>

          {/* النتيجة */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 text-center">
            <h1 className="text-2xl font-bold text-primary mb-3">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد جداً' : '📚 يحتاج مراجعة'}
            </h1>
            <p className="text-3xl font-bold text-gray-700 mb-2">{toEnglishDigits(percentage)}%</p>
            <p className="text-lg text-gray-600">
              حصلت على {toEnglishDigits(score)} من {toEnglishDigits(total)} نقطة
            </p>
            <p className="text-base text-primary mt-2">
              {formatDate(attempt.date || Date.now())} | {formatTime(attempt.date || Date.now())}
            </p>
          </div>

          {/* 🔳 QR بالتفاصيل + الرابط */}
          {qrText && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
              <h2 className="text-xl font-bold text-primary mb-3">رمز الاستجابة السريع 📱</h2>
              <QrCode value={qrText} size={240} />
              <p className="text-sm text-gray-600 mt-2">يمتلك البيانات الأساسية + الرابط لفتح النتيجة مباشرة</p>
            </div>
          )}

          {/* الأزرار */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
            <button onClick={() => window.print()} className="bg-gray-600 text-white font-bold py-3 px-4 rounded-2xl">
              🖨️ طباعة
            </button>
            <Link href={`/quiz/report?id=${attemptId}`} className="bg-blue-600 text-white font-bold py-3 px-4 rounded-2xl text-center">
              📊 التقرير الكامل
            </Link>
            <Link href="/" className="bg-gray-800 text-white font-bold py-3 px-4 rounded-2xl text-center">
              🏠 الرئيسية
            </Link>
            <Link href="/quiz" className="bg-primary text-white font-bold py-3 px-4 rounded-2xl text-center">
              🔄 اختبار جديد
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
