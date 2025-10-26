'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
//import QRCode from 'qrcode.react';

export default function ReportPage() {
  const params = useParams();
  const attemptId = params.id;
  
  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    if (attemptId) {
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a => a.id === Number(attemptId));
      setAttempt(found);
      
      // Check for saved name
      const savedName = localStorage.getItem('userName');
      if (savedName) {
        setUserName(savedName);
      } else {
        setShowNameInput(true);
      }
    }
  }, [attemptId]);

  const handleSaveName = () => {
    if (userName.trim()) {
      localStorage.setItem('userName', userName);
      setShowNameInput(false);
    }
  };

  if (!attempt) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent"></div>
      </div>
    );
  }

  const reportUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/quiz/report/${attemptId}`
    : '';

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-5 z-0">
        <Image src="/logo.png" alt="Watermark" width={600} height={600} className="object-contain" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 print-area">
        {/* Name Input Modal */}
        {showNameInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 no-print">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                أدخل اسمك
              </h3>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold mb-4"
              />
              <button
                onClick={handleSaveName}
                className="w-full bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold hover:bg-[#155c3e] transition-all"
              >
                حفظ
              </button>
            </div>
          </div>
        )}

        {/* Report Header */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-20 h-20 relative">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold text-[#1e7850] font-amiri">
                تقرير اختبار أحكام التجويد
              </h1>
              <p className="text-gray-600 mt-2">
                منصة تجويدي - Tajweedy Platform
              </p>
            </div>
            <div className="w-20 h-20">
              <QRCode value={reportUrl} size={80} />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-1">اسم المتدرب</p>
                <p className="text-xl font-bold text-gray-800">{userName || 'غير محدد'}</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">تاريخ الاختبار</p>
                <p className="text-xl font-bold text-gray-800">
                  {new Date(attempt.date).toLocaleString('ar-SA')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">النتيجة</p>
                <p className="text-4xl font-bold text-[#1e7850]">{attempt.score}%</p>
              </div>
              <div>
                <p className="text-gray-600 mb-1">الأسئلة الصحيحة</p>
                <p className="text-4xl font-bold text-green-600">
                  {attempt.correctCount} / {attempt.questionsCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 font-amiri">
            تفاصيل الأسئلة
          </h2>

          <div className="space-y-4">
            {attempt.questions.map((question, index) => {
              const userAnswer = attempt.answers[index];
              const isCorrect = userAnswer === question.answer;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border ${
                    isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 mb-1">{question.question}</p>
                      <p className="text-sm text-gray-600">
                        إجابتك: {question.options[userAnswer - 1]} {isCorrect ? '✓' : '✗'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600 font-semibold">
                          الإجابة الصحيحة: {question.options[question.answer - 1]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 no-print">
          <Link
            href="/quiz"
            className="flex-1 bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold hover:bg-[#155c3e] transition-all shadow-md text-center"
          >
            اختبار جديد
          </Link>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-gray-500 text-white px-6 py-4 rounded-full font-bold hover:bg-gray-600 transition-all shadow-md"
          >
            🖨️ طباعة التقرير
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
