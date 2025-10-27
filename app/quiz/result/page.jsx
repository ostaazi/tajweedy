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

    if (!attemptId) {
      setLoading(false);
      return;
    }

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(a => String(a?.id) === String(attemptId));
    setAttempt(found);
    setAllAttempts(attempts.sort((a, b) => new Date(b.date) - new Date(a.date)));

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
  const examType = attempt.type || 'اختبار';
  const examName = attempt.name || 'اختبار التجويد';
  const examCode = `TJ-${toEnglishDigits(attemptId)}`;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
          font-family: 'Cairo', sans-serif !important;
        }

        /* Watermark background for screen */
        .watermark-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-image: url('/logo.png');
          background-size: 400px 400px;
          background-repeat: repeat;
          background-position: center;
          opacity: 0.1;
          z-index: 0;
          pointer-events: none;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            background: white;
            padding: 20px;
          }

          /* Watermark for print */
          #result-print-area::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            background-image: url('/logo.png');
            background-size: 400px 400px;
            background-repeat: repeat;
            background-position: center;
            opacity: 0.1;
            z-index: -1;
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
        }
      `}</style>

      {/* Watermark Background */}
      <div className="watermark-bg"></div>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8 relative z-10" dir="rtl">
        <div id="result-print-area" className="max-w-4xl mx-auto">
          
          {/* Header with Real Logo */}
          <div className="text-center mb-6">
            <img 
              src="/logo.png" 
              alt="Tajweedy Logo" 
              className="w-24 h-24 mx-auto mb-3 object-contain"
            />
            <h1 className="text-3xl font-bold text-primary mb-2">Tajweedy - التجويد الذكي</h1>
          </div>

          {/* Trainee Name and Exam Info */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{user.name}</h2>
            <p className="text-lg text-gray-600">
              <strong>النوع:</strong> {examType} | <strong>الاسم:</strong> {examName} | <strong>الكود:</strong> {examCode}
            </p>
          </div>

          {/* Result Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5 text-center">
            <h1 className="text-2xl font-bold text-primary mb-3">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد جداً' : '📚 يحتاج مراجعة'}
            </h1>
            <p className="text-3xl font-bold text-gray-700 mb-2">{toEnglishDigits(percentage)}%</p>
            <p className="text-lg text-gray-600">
              حصلت على {toEnglishDigits(score)} من {toEnglishDigits(total)} نقطة
            </p>
            <p className="text-base text-primary mt-2">
              {formatDate(attempt.date)} | {formatTime(attempt.date)}
            </p>
          </div>

          {/* Progress Circle */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-5">
            <div className="flex justify-center mb-4">
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
              <div className="flex justify-center gap-10">
                <div>
                  <p className="text-2xl font-bold text-green-600">{toEnglishDigits(score)}</p>
                  <p className="text-gray-600">صحيح ✅</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{toEnglishDigits(total - score)}</p>
                  <p className="text-gray-600">خاطئ ❌</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attempts History */}
          <div className="bg-white rounded-3xl shadow-lg p-5 mb-5">
            <h2 className="text-xl font-bold text-primary mb-3">📈 سجل المحاولات</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-right font-bold">التاريخ</th>
                    <th className="px-3 py-2 text-right font-bold">التوقيت</th>
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
                      <tr key={index} className="border-b">
                        <td className="px-3 py-2 text-right">{formatDate(att.date)}</td>
                        <td className="px-3 py-2 text-right">{formatTime(att.date)}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-600">{toEnglishDigits(attScore)}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`font-bold ${attPercentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
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
