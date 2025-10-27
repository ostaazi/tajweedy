'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(a => String(a?.id) === String(attemptId));

    if (found) {
      setAttempt(found);
    }

    setLoading(false);
  }, [attemptId]);

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

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html, body {
            background: white !important;
            height: 100% !important;
            max-height: 100% !important;
          }

          body * {
            visibility: hidden;
          }

          #result-print-area,
          #result-print-area * {
            visibility: visible;
          }

          #result-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-height: 100vh;
            background: white;
            padding: 0;
            margin: 0;
            overflow: hidden;
          }

          .no-print {
            display: none !important;
          }

          .bg-gradient-to-br {
            background: white !important;
          }

          .shadow-lg {
            box-shadow: none !important;
          }

          .min-h-screen {
            min-height: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8" dir="rtl">
        <div id="result-print-area" className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4 text-center">
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

          {/* Progress Circle */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-4">
            <div className="flex justify-center mb-3">
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="70" fill="none" stroke="#e5e7eb" strokeWidth="18"/>
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
            <div className="text-center">
              <div className="flex justify-center gap-8 mt-4">
                <div>
                  <p className="text-2xl font-bold text-green-600">{toEnglishDigits(score)}</p>
                  <p className="text-gray-600 text-sm">صحيح ✅</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{toEnglishDigits(total - score)}</p>
                  <p className="text-gray-600 text-sm">خاطئ ❌</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attempt History */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-4">
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
                      {new Date(attempt.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
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

          {/* Buttons */}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
