'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
      {/* ✅ CSS للطباعة */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #result-content,
          #result-content * {
            visibility: visible;
          }
          #result-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8" dir="rtl">
        <div id="result-content" className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 text-center">
            <div className="w-24 h-24 rounded-full bg-primary text-white font-bold grid place-items-center text-4xl mx-auto mb-4">
              TJ
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد جداً' : '📚 يحتاج مراجعة'}
            </h1>
            <p className="text-2xl font-bold text-gray-700 mb-2">{percentage}%</p>
            <p className="text-lg text-gray-600">
              حصلت على {score} من {total} نقطة
            </p>
          </div>

          {/* Progress Circle */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
            <div className="flex justify-center mb-4">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                <circle
                  cx="100" cy="100" r="80" fill="none"
                  stroke={percentage >= 60 ? '#10b981' : '#ef4444'}
                  strokeWidth="20"
                  strokeDasharray={`${(percentage / 100) * 502} 502`}
                  transform="rotate(-90 100 100)"
                  strokeLinecap="round"
                />
                <text x="100" y="100" fontSize="40" fontWeight="bold" textAnchor="middle" dy="15" fill="#1e7850">
                  {percentage}%
                </text>
              </svg>
            </div>
            <div className="text-center">
              <div className="flex justify-center gap-8 mt-6">
                <div>
                  <p className="text-3xl font-bold text-green-600">{score}</p>
                  <p className="text-gray-600">صحيح ✅</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{total - score}</p>
                  <p className="text-gray-600">خاطئ ❌</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 no-print">
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

          {/* Attempt History */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-primary mb-4">📈 تاريخ المحاولات</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-right font-bold">التاريخ</th>
                    <th className="px-4 py-2 text-right font-bold">الدرجة</th>
                    <th className="px-4 py-2 text-right font-bold">الإجمالي</th>
                    <th className="px-4 py-2 text-right font-bold">النسبة %</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-right">
                      {new Date(attempt.date).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-green-600">{score}</td>
                    <td className="px-4 py-2 text-right font-bold">{total}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={`font-bold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {percentage}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
