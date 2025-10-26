'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get('id');
  
  const [attempt, setAttempt] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('');

  useEffect(() => {
    if (attemptId) {
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a => a.id === Number(attemptId));
      setAttempt(found);
    }
  }, [attemptId]);

  if (!attempt) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل النتائج...</p>
        </div>
      </div>
    );
  }

  const percentage = attempt.score;
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const reportUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/result?id=${attemptId}`;

  const generateQRCode = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // Simple QR placeholder (you can use qrcode library later)
    ctx.fillStyle = '#1e7850';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', 64, 64);
    
    return canvas.toDataURL();
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* العلامة المائية */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Image 
          src="/logo.png" 
          alt="Watermark" 
          width={600} 
          height={600}
          className="object-contain"
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Link href="/quiz" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2">
            <span>←</span> اختبار جديد
          </Link>
          <div className="w-16 h-16 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">
            🎓 تقرير أداء الاختبار
          </h1>
          <p className="text-gray-600">
            {new Date(attempt.date).toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Student & Teacher Info */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                👤 اسم المتدرب
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1e7850] focus:outline-none text-lg"
                placeholder="أدخل اسمك..."
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-lg">
                👨‍🏫 اسم المدرب (اختياري)
              </label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1e7850] focus:outline-none text-lg"
                placeholder="أدخل اسم المدرب..."
              />
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Circular Progress */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="transform -rotate-90" width="256" height="256">
                <circle
                  cx="128"
                  cy="128"
                  r="80"
                  stroke="#e5e7eb"
                  strokeWidth="20"
                  fill="none"
                />
                <circle
                  cx="128"
                  cy="128"
                  r="80"
                  stroke="#10b981"
                  strokeWidth="20"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-[#1e7850]">{attempt.score}%</p>
                  <p className="text-gray-600 mt-2 text-lg">النسبة النهائية</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200">
                <p className="text-green-800 font-semibold text-xl mb-2">✅ إجابات صحيحة</p>
                <p className="text-5xl font-bold text-green-600">{attempt.correctCount}</p>
              </div>
              
              <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-200">
                <p className="text-red-800 font-semibold text-xl mb-2">❌ إجابات خاطئة</p>
                <p className="text-5xl font-bold text-red-600">
                  {attempt.questionsCount - attempt.correctCount}
                </p>
              </div>

              <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200">
                <p className="text-blue-800 font-semibold text-xl mb-2">📝 إجمالي الأسئلة</p>
                <p className="text-5xl font-bold text-blue-600">{attempt.questionsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-blue-500 text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-md"
          >
            {showDetails ? '📤 إخفاء التفاصيل' : '📥 عرض التفاصيل'}
          </button>

          <button
            onClick={() => window.print()}
            className="bg-gray-500 text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-gray-600 transition-all shadow-md"
          >
            🖨️ طباعة التقرير
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(reportUrl);
              alert('تم نسخ الرابط!');
            }}
            className="bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-[#155c3e] transition-all shadow-md"
          >
            🔗 نسخ الرابط
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-[#1e7850] rounded-2xl flex items-center justify-center">
                <p className="text-white font-bold text-center text-sm">QR Code<br/>Placeholder</p>
              </div>
              <div>
                <p className="text-gray-700 font-semibold text-lg mb-1">📱 مسح للوصول للتقرير</p>
                <p className="text-gray-500 text-sm">امسح الرمز للوصول السريع</p>
              </div>
            </div>
            
            <div className="w-20 h-20 relative">
              <Image src="/logo.png" alt="Tajweedy" fill className="object-contain" />
            </div>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 font-amiri">
              📊 تفاصيل الإجابات
            </h2>
            <div className="space-y-6">
              {attempt.questions.map((question, index) => {
                const userAnswer = attempt.answers[index];
                const isCorrect = userAnswer === question.answer;
                return (
                  <div
                    key={index}
                    className={`p-6 rounded-2xl border-2 ${
                      isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <span className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 font-amiri leading-relaxed">
                          {question.question}
                        </p>
                        <p className="text-base text-gray-500">{question.section}</p>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = userAnswer === optIndex + 1;
                        const isCorrectAnswer = question.answer === optIndex + 1;
                        return (
                          <div key={optIndex} className={`p-4 rounded-lg text-lg ${
                            isCorrectAnswer ? 'bg-green-100 border-2 border-green-500' :
                            isUserAnswer ? 'bg-red-100 border-2 border-red-500' :
                            'bg-white border border-gray-200'
                          }`}>
                            <span className="font-semibold">
                              {['أ', 'ب', 'ج', 'د'][optIndex]}.
                            </span>{' '}
                            {option}
                            {isCorrectAnswer && <span className="float-left text-green-600 font-bold text-xl">✓</span>}
                            {isUserAnswer && !isCorrectAnswer && <span className="float-left text-red-600 font-bold text-xl">✗</span>}
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                      <p className="text-lg font-semibold text-gray-700 mb-2">💡 التفسير:</p>
                      <p className="text-base md:text-lg text-gray-600 leading-relaxed">{question.explain}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          button {
            display: none !important;
          }
          .fixed {
            position: absolute;
          }
        }
      `}</style>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent"></div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
