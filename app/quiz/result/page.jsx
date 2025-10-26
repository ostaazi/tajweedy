'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptId = searchParams.get('id');
  
  const [attempt, setAttempt] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const chartData = [
    { name: 'صحيح', value: attempt.correctCount, color: '#10b981' },
    { name: 'خطأ', value: attempt.questionsCount - attempt.correctCount, color: '#ef4444' }
  ];

  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Link href="/quiz" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2">
            <span>←</span> اختبار جديد
          </Link>
          <div className="w-12 h-12 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">
            نتيجة الاختبار
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

        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Donut Chart */}
            <div className="relative">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              {/* Score in center */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-[#1e7850]">{attempt.score}%</p>
                  <p className="text-gray-600 mt-2">النسبة النهائية</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                <p className="text-green-800 font-semibold text-lg">✅ إجابات صحيحة</p>
                <p className="text-4xl font-bold text-green-600 mt-2">{attempt.correctCount}</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
                <p className="text-red-800 font-semibold text-lg">❌ إجابات خاطئة</p>
                <p className="text-4xl font-bold text-red-600 mt-2">
                  {attempt.questionsCount - attempt.correctCount}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                <p className="text-blue-800 font-semibold text-lg">📝 إجمالي الأسئلة</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">{attempt.questionsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-blue-500 text-white px-6 py-4 rounded-full font-bold hover:bg-blue-600 transition-all shadow-md"
          >
            {showDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
          </button>
          
          <button
            onClick={() => router.push(`/quiz/report/${attempt.id}`)}
            className="bg-purple-500 text-white px-6 py-4 rounded-full font-bold hover:bg-purple-600 transition-all shadow-md"
          >
            📄 التقرير الكامل
          </button>

          <button
            onClick={() => window.print()}
            className="bg-gray-500 text-white px-6 py-4 rounded-full font-bold hover:bg-gray-600 transition-all shadow-md"
          >
            🖨️ طباعة
          </button>
        </div>

        {/* Detailed Results */}
        {showDetails && (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 font-amiri">
              تفاصيل الإجابات
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
                    {/* Question Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <span
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-800 mb-2 font-amiri">
                          {question.question}
                        </p>
                        <p className="text-sm text-gray-500">{question.section}</p>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => {
                        const isUserAnswer = userAnswer === optIndex + 1;
                        const isCorrectAnswer = question.answer === optIndex + 1;

                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg ${
                              isCorrectAnswer
                                ? 'bg-green-100 border-2 border-green-500'
                                : isUserAnswer
                                ? 'bg-red-100 border-2 border-red-500'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <span className="font-semibold">
                              {['أ', 'ب', 'ج', 'د'][optIndex]}.
                            </span>{' '}
                            {option}
                            {isCorrectAnswer && (
                              <span className="float-left text-green-600 font-bold">✓</span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span className="float-left text-red-600 font-bold">✗</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-1">💡 التفسير:</p>
                      <p className="text-sm text-gray-600">{question.explain}</p>
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
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
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
