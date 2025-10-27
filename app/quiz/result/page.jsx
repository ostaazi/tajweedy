// app/quiz/result/page.js - الكود الكامل في ملف واحد (مع إصلاح خطأ البناء الثابت)
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// جعل الصفحة ديناميكية لتجنب static generation (حل الخطأ في Vercel)
export const dynamic = 'force-dynamic';

/* ============ أدوات مساعدة عامة ============ */
function toEnglishDigits(input = '') {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
    '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(date) {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/* ============ مكون QR CODE ============ */
function QrCode({ value, size = 250 }) {
  const [src, setSrc] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!value) return;

    const logo = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '';
    const services = [
      `https://quickchart.io/qr?text=${encodeURIComponent(value)}&size=${size}&centerImageUrl=${encodeURIComponent(
        logo
      )}&centerImageSizeRatio=0.25&margin=2`,
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(value)}`
    ];

    let i = 0;
    let stopped = false;
    const tryNext = () => {
      if (stopped) return;
      if (i >= services.length) {
        setError(true);
        return;
      }
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

  const downloadQr = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = 'Tajweedy_QR.png';
    a.click();
  };

  return (
    <div className="text-center my-4">
      {error ? (
        <p className="text-gray-500">تعذّر تحميل رمز الاستجابة</p>
      ) : src ? (
        <>
          <img
            src={src}
            alt="QR Code"
            className="mx-auto rounded-xl border-4 border-green-300 shadow"
            style={{ width: size, height: size }}
            referrerPolicy="no-referrer"
          />
          <button
            onClick={downloadQr}
            className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl no-print transition-colors"
          >
            تحميل QR 📥
          </button>
        </>
      ) : (
        <p className="text-gray-500">جارٍ توليد رمز الاستجابة…</p>
      )}
    </div>
  );
}

/* ============ المحتوى الرئيسي ============ */
function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams?.get('id');

  const [attempt, setAttempt] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [user, setUser] = useState({ name: 'اسم المتدرب' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser({ name: userData.name || 'اسم المتدرب' });

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    setAllAttempts(attempts.sort((a, b) => new Date(b.date) - new Date(a.date)));

    if (attemptId) {
      const found = attempts.find(a => String(a?.id) === String(attemptId));
      if (found) {
        setAttempt(found);
        console.log('✅ محاولة محملة:', found);
      } else {
        console.warn('⚠️ لم يتم العثور على محاولة لـ ID:', attemptId);
      }
    }
    setLoading(false);
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد بيانات</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على نتيجة الاختبار</p>
          <Link href="/quiz" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl inline-block">
            ← اختبار جديد
          </Link>
        </div>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const examType = attempt.type === 'periodic' ? 'اختبار دوري' : attempt.type === 'therapeutic' ? 'تدريب علاجي' : 'اختبار';
  const examName = attempt.name || 'اختبار التجويد';
  const examCode = `TJ-${toEnglishDigits(attemptId)}`;
  const qrValue = typeof window !== 'undefined'
    ? `${window.location.origin}/quiz/result?id=${attemptId}`
    : '';

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
          #result-print-area { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 20px; }
          .no-print { display: none !important; }
          .bg-gradient-to-br { background: white !important; }
          .shadow-lg { box-shadow: none !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8 relative" dir="rtl">
        <div id="result-print-area" className="max-w-4xl mx-auto">
          {/* شعار وبيانات المتدرب */}
          <div className="text-center mb-6">
            <img src="/logo.png" alt="Tajweedy Logo" className="w-20 h-20 mx-auto mb-2 object-contain" />
            <h1 className="text-2xl font-bold text-green-600 mb-2">Tajweedy - التجويد الذكي</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h2>
            <p className="text-lg text-gray-600">
              <strong>النوع:</strong> {examType} | <strong>الاسم:</strong> {examName} | <strong>الكود:</strong> {examCode}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {formatDate(attempt.date)} | {formatTime(attempt.date)}
            </p>
          </div>

          {/* النسبة ونتيجة الاختبار */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 text-center">
            <h1 className="text-2xl font-bold text-green-600 mb-3">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد جداً' : '📚 يحتاج مراجعة'}
            </h1>
            <p className="text-3xl font-bold text-gray-700 mb-2">{toEnglishDigits(percentage)}%</p>
            <p className="text-lg text-gray-600">
              حصلت على {toEnglishDigits(score)} من {toEnglishDigits(total)} نقطة
            </p>
          </div>

          {/* 🔳 QR CODE هنا */}
          {qrValue && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 page-break-after">
              <h2 className="text-xl font-bold text-green-600 mb-3">رمز الاستجابة السريع 📱</h2>
              <QrCode value={qrValue} size={220} />
              <p className="text-sm text-gray-600">امسح للوصول إلى تقريرك مباشرة</p>
            </div>
          )}

          {/* سجل المحاولات */}
          {allAttempts.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-5 mb-5">
              <h2 className="text-xl font-bold text-green-600 mb-3">📈 سجل المحاولات</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2 text-right font-bold">التاريخ</th>
                      <th className="px-3 py-2 text-right font-bold">الوقت</th>
                      <th className="px-3 py-2 text-right font-bold">الدرجة</th>
                      <th className="px-3 py-2 text-right font-bold">النسبة %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allAttempts.map((att, index) => {
                      const attScore = att.score ?? 0;
                      const attTotal = att.total ?? 0;
                      const attPercentage = attTotal ? Math.round((attScore / attTotal) * 100) : 0;
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-3 py-2 text-right">{formatDate(att.date)}</td>
                          <td className="px-3 py-2 text-right">{formatTime(att.date)}</td>
                          <td className="px-3 py-2 text-right font-bold text-green-600">{toEnglishDigits(attScore)}</td>
                          <td className="px-3 py-2 text-right font-bold">
                            <span className={attPercentage >= 60 ? 'text-green-600' : 'text-red-600'}>
                              {toEnglishDigits(attPercentage)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* الأزرار */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print mt-6">
            <button 
              onClick={() => window.print()} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl transition-colors"
            >
              🖨️ طباعة
            </button>
            <Link 
              href={`/quiz/report/${attemptId}`} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl text-center transition-colors"
            >
              📊 التقرير الكامل
            </Link>
            <Link 
              href="/" 
              className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-2xl text-center transition-colors"
            >
              🏠 الرئيسية
            </Link>
            <Link 
              href="/quiz" 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-2xl text-center transition-colors"
            >
              🔄 اختبار جديد
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ============ الصفحة الكاملة مع Suspense ============ */
export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
