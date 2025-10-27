'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(///g, '/');
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function ResultContent() {
  const searchParams = useSearchParams();
  const attemptId = searchParams?.get('id');

  const [attempt, setAttempt] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const [user, setUser] = useState({ name: 'اسم المتدرب', signature: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage (assume stored during login)
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser({ name: userData.name || 'اسم المتدرب', signature: userData.signature || null });

    if (!attemptId) {
      setLoading(false);
      return;
    }

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(a => String(a?.id) === String(attemptId));
    setAttempt(found);

    // All attempts for the user (assume all are for current user)
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
  const examType = attempt.type || 'اختبار'; // Assume 'اختبار' or 'تدريب'
  const duration = attempt.duration || '30 دقيقة'; // Assume from attempt data
  const examName = attempt.name || 'اختبار التجويد';
  const examCode = attempt.code || `TJ-${toEnglishDigits(attemptId)}`;
  const reportLink = `${window.location.origin}/quiz/report/${attemptId}`;

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        body {
          font-family: 'Cairo', sans-serif !important;
        }

        .quranic-text {
          font-family: 'Traditional Arabic', serif !important; /* For Quranic verses and surah names */
        }

        @media screen {
          .min-h-screen {
            min-height: 100vh;
          }
          
          .watermark {
            background-image: url('/logo-large.png'); /* Path to large logo for watermark */
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.1;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
          }
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

          html, body {
            background: white !important;
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
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
            left: 15mm;
            top: 15mm;
            width: 180mm;
            max-height: 267mm;
            background: white;
            padding: 0;
            margin: 0;
            overflow: hidden;
            font-family: 'Cairo', sans-serif !important;
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

          /* Watermark in print */
          #result-print-area::before {
            content: '';
            background-image: url('/logo-large.png');
            background-size: 100px 100px;
            background-repeat: repeat;
            opacity: 0.1;
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            z-index: -1;
          }

          /* Footer in print */
          .footer-print {
            position: fixed;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 5mm;
          }

          .signature-area {
            margin-top: 20mm;
            text-align: right;
          }

          .qr-code {
            display: inline-block;
            margin-left: 10mm;
          }
        }
      `}</style>

      <div className="watermark"></div>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8 relative z-10" dir="rtl">
        <div id="result-print-area" className="max-w-4xl mx-auto">
          {/* Header with Logo and Project Name */}
          <div className="text-center mb-8">
            <Image
              src="/logo.png" // Path to logo
              alt="Tajweedy Logo"
              width={100}
              height={100}
              className="mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-primary mb-2">Tajweedy التجويد الذكي</h1>
          </div>

          {/* Trainee Name and Exam Info - Large and Clear */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">{user.name}</h2>
            <p className="text-xl text-gray-600 mb-4">
              <strong>نوع الاختبار:</strong> {examType} | <strong>اسم الاختبار:</strong> {examName} | 
              <strong>مدة الاختبار:</strong> {duration} | <strong>كود الاختبار:</strong> {examCode}
            </p>
          </div>

          {/* Result Header */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد جداً' : '📚 يحتاج مراجعة'}
            </h1>
            <p className="text-4xl font-bold text-gray-700 mb-2">{toEnglishDigits(percentage)}%</p>
            <p className="text-xl text-gray-600">
              حصلت على {toEnglishDigits(score)} من {toEnglishDigits(total)} نقطة
            </p>
            <p className="text-lg text-primary mt-2">
              تاريخ الاختبار: {formatDate(attempt.date)} | التوقيت: {formatTime(attempt.date)}
            </p>
          </div>

          {/* Progress Circle - Larger */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
            <div className="flex justify-center mb-6">
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
                <text x="100" y="100" fontSize="40" fontWeight="bold" textAnchor="middle" dy="12" fill="#1e7850">
                  {toEnglishDigits(percentage)}%
                </text>
              </svg>
            </div>
            <div className="text-center">
              <div className="flex justify-center gap-12">
                <div>
                  <p className="text-3xl font-bold text-green-600">{toEnglishDigits(score)}</p>
                  <p className="text-gray-600 text-base">صحيح ✅</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">{toEnglishDigits(total - score)}</p>
                  <p className="text-gray-600 text-base">خاطئ ❌</p>
                </div>
              </div>
            </div>
          </div>

          {/* All Attempts History Table */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4">📈 سجل جميع المحاولات</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-base">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-right font-bold">التاريخ</th>
                    <th className="px-4 py-3 text-right font-bold">التوقيت</th>
                    <th className="px-4 py-3 text-right font-bold">الدرجة</th>
                    <th className="px-4 py-3 text-right font-bold">الإجمالي</th>
                    <th className="px-4 py-3 text-right font-bold">النسبة %</th>
                  </tr>
                </thead>
                <tbody>
                  {allAttempts.map((att, index) => {
                    const attScore = att.score ?? 0;
                    const attTotal = att.total ?? 0;
                    const attPercentage = attTotal ? Math.round((attScore / attTotal) * 100) : 0;
                    return (
                      <tr key={index} className="border-b">
                        <td className="px-4 py-3 text-right">{formatDate(att.date)}</td>
                        <td className="px-4 py-3 text-right">{formatTime(att.date)}</td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">{toEnglishDigits(attScore)}</td>
                        <td className="px-4 py-3 text-right font-bold">{toEnglishDigits(attTotal)}</td>
                        <td className="px-4 py-3 text-right">
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

          {/* Signature Area (for print) */}
          <div className="signature-area no-print hidden print:block">
            <div className="flex justify-between items-center mb-4">
              <div className="qr-code">
                {/* QR Code Placeholder - Use QR library like qrcode.react in real impl */}
                <div className="w-20 h-20 bg-gray-200 flex items-center justify-center text-sm">QR Code</div>
                <p className="text-xs mt-1">رابط التقرير: {reportLink}</p>
              </div>
              <div>
                <p className="text-right">توقيع المدرب:</p>
                {user.signature ? (
                  <Image src={user.signature} alt="Signature" width={150} height={50} className="ml-auto" />
                ) : (
                  <div className="w-40 h-20 border-b-2 border-gray-400 ml-auto"></div> // Electronic signature placeholder
                )}
                <p className="text-right text-sm">اسم المدرب</p>
              </div>
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

          {/* Print Footer */}
          <div className="footer-print print:block hidden">
            <p><strong>اسم الاختبار:</strong> {examName} | <strong>التاريخ:</strong> {formatDate(attempt.date)} | 
               <strong>التوقيت:</strong> {formatTime(attempt.date)} | <strong>كود الاختبار:</strong> {examCode}</p>
            <p><strong>اسم المتدرب:</strong> {user.name} | <strong>رابط التقرير:</strong> {reportLink}</p>
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
