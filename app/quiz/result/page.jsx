'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

/* تحويل الأرقام العربية/الفارسية إلى إنجليزية */
function toEnglishDigits(input = '') {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
    '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}

function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams?.get('id');

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- QR ---
  const [qrSrc, setQrSrc] = useState('');
  const [qrError, setQrError] = useState(false);

  // تحميل محاولة واحدة من localStorage
  useEffect(() => {
    try {
      if (!attemptId) {
        setLoading(false);
        return;
      }
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a => String(a?.id) === String(attemptId));
      if (found) setAttempt(found);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  // توليد رابط صورة QR (مع شعـار وفولبـاك)
  useEffect(() => {
    if (!attemptId || typeof window === 'undefined') return;

    const targetUrl = `${window.location.origin}/quiz/result?id=${encodeURIComponent(
      attemptId
    )}`;
    const logo = `${window.location.origin}/logo.png`;

    const services = [
      // QuickChart مع وضع الشعار في الوسط
      `https://quickchart.io/qr?text=${encodeURIComponent(
        targetUrl
      )}&size=300&centerImageUrl=${encodeURIComponent(
        logo
      )}&centerImageSizeRatio=0.25&margin=2`,
      // QuickChart بدون شعار
      `https://quickchart.io/qr?text=${encodeURIComponent(targetUrl)}&size=300&margin=2`,
      // qrserver
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        targetUrl
      )}`,
      // Google Charts (احتياطي)
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
        targetUrl
      )}`,
    ];

    let i = 0;
    let stopped = false;

    const tryNext = () => {
      if (stopped) return;
      if (i >= services.length) {
        setQrSrc('');
        setQrError(true);
        return;
      }
      const url = services[i++];
      const img = new Image();
      img.onload = () => {
        if (!stopped) {
          setQrSrc(url);
          setQrError(false);
        }
      };
      img.onerror = () => {
        if (!stopped) tryNext();
      };
      img.referrerPolicy = 'no-referrer';
      img.src = url;
    };

    tryNext();
    return () => {
      stopped = true;
    };
  }, [attemptId]);

  const handleDownloadQR = () => {
    if (!qrSrc) return alert('⚠️ لم يتم توليد الكود بعد.');
    const a = document.createElement('a');
    a.href = qrSrc;
    a.download = `tajweedy-qr-${attemptId}.png`;
    a.click();
  };

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
        <div className="text-center bg-white rounded-3xl shadow-lg p-8">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد بيانات</p>
          <Link href="/quiz" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl">
            ← اختبار جديد
          </Link>
        </div>
      </div>
    );
  }

  const score = Number(attempt.score ?? 0);
  const total = Number(attempt.total ?? 0);
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <>
      {/* قواعد الطباعة — تمنع الصفحة البيضاء الثانية */}
      <style jsx global>{`
        @media screen { .min-h-screen { min-height: 100vh; } }

        @media print {
          @page { size: A4 portrait; margin: 10mm; }

          html, body {
            background: #fff !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body > * { display: none !important; }
          #result-print-area { display: block !important; }

          #result-print-area {
            position: static !important;
            max-width: 190mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: #fff !important;
          }

          #result-print-area > * { margin: 0 0 8mm 0 !important; }
          #result-print-area > *:last-child { margin-bottom: 0 !important; }

          .card, .avoid-break { break-inside: avoid; page-break-inside: avoid; }
          .no-print { display: none !important; }
          .bg-gradient-to-br { background: #fff !important; }
          .shadow-lg { box-shadow: none !important; }
          .min-h-screen { min-height: auto !important; height: auto !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8" dir="rtl">
        <div id="result-print-area" className="max-w-4xl mx-auto">

          {/* رأس الصفحة */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 text-center card">
            <div className="w-20 h-20 rounded-full bg-primary text-white font-bold grid place-items-center text-3xl mx-auto mb-3">
              TJ
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد جداً' : '📚 يحتاج مراجعة'}
            </h1>
            <p className="text-2xl font-bold text-gray-700 mb-1">{toEnglishDigits(percentage)}%</p>
            <p className="text-base text-gray-600">
              حصلت على {toEnglishDigits(score)} من {toEnglishDigits(total)} نقطة
            </p>
          </div>

          {/* دائرة النسبة */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 card">
            <div className="flex justify-center mb-3">
              <svg width="180" height="180" viewBox="0 0 180 180" aria-label="final percentage">
                <circle cx="90" cy="90" r="70" fill="none" stroke="#e5e7eb" strokeWidth="18" />
                <circle
                  cx="90" cy="90" r="70" fill="none"
                  stroke={percentage >= 60 ? '#10b981' : '#ef4444'}
                  strokeWidth="18"
                  strokeDasharray={`${(percentage / 100) * 440} 440`}
                  transform="rotate(-90 90 90)"
                  strokeLinecap="round"
                />
                <text x="90" y="90" fontSize="36" fontWeight="bold" textAnchor="middle" dy="12" fill="#1e7850">
                  {toEnglishDigits(percentage)}%
                </text>
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mt-4 text-center">
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-3">
                <p className="text-green-800 font-semibold">صحيح ✅</p>
                <p className="text-3xl font-bold text-green-600">{toEnglishDigits(score)}</p>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3">
                <p className="text-red-800 font-semibold">خاطئ ❌</p>
                <p className="text-3xl font-bold text-red-600">{toEnglishDigits(Math.max(0, total - score))}</p>
              </div>
              <div className="col-span-2 bg-blue-50 border-2 border-blue-200 rounded-2xl p-3">
                <p className="text-blue-800 font-semibold">إجمالي الأسئلة 📝</p>
                <p className="text-3xl font-bold text-blue-600">{toEnglishDigits(total)}</p>
              </div>
            </div>
          </div>

          {/* سجل المحاولة */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-4 card">
            <h2 className="text-xl font-bold text-primary mb-3">📈 تاريخ المحاولات</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-right font-bold">التاريخ</th>
                    <th className="px-3 py-2 text-right font-bold">الدرجة</th>
                    <th className="px-3 py-2 text-right font-bold">الإجمالي</th>
                    <th className="px-3 py-2 text-right font-bold">النسبة %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 text-right">
                      {attempt.date
                        ? new Date(attempt.date).toLocaleDateString('ar-EG', {
                            year: 'numeric', month: 'short', day: 'numeric'
                          })
                        : '-'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-green-600">{toEnglishDigits(score)}</td>
                    <td className="px-3 py-2 text-right font-bold">{toEnglishDigits(total)}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={`font-bold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {toEnglishDigits(percentage)}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 text-center card">
            <h2 className="text-lg font-bold text-primary mb-4">رمز الاستجابة السريع</h2>
            {qrSrc && !qrError ? (
              <>
                <img
                  src={qrSrc}
                  alt="QR Code للنتيجة"
                  referrerPolicy="no-referrer"
                  className="mx-auto w-48 h-48 border-4 border-green-300 rounded-2xl"
                />
                <button
                  onClick={handleDownloadQR}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl no-print"
                >
                  تحميل QR 📥
                </button>
              </>
            ) : (
              <p className="text-gray-500">تعذّر توليد رمز QR — حاول تحديث الصفحة</p>
            )}
            <p className="text-gray-500 mt-2 text-sm">امسح للوصول السريع إلى نتيجة الاختبار</p>
          </div>

          {/* أزرار التحكم — لا تُطبع */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
            <button
              onClick={() => window.print()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl flex items-center justify-center gap-2"
            >
              🖨️ طباعة
            </button>

            <Link
              href={`/quiz/report/${attemptId}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl text-center flex items-center justify-center"
            >
              📊 التقرير الكامل
            </Link>

            <Link
              href="/"
              className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl text-center flex items-center justify-center"
            >
              🏠 الرئيسية
            </Link>

            <Link
              href="/quiz"
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-2xl text-center flex items-center justify-center"
            >
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
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
