'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const attemptId = params.id;
  
  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');

  useEffect(() => {
    if (attemptId) {
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a => a.id === attemptId);
      setAttempt(found);

      // Check for saved names
      const savedUserName = localStorage.getItem('userName');
      const savedTrainerName = localStorage.getItem('trainerName');
      if (savedUserName) setUserName(savedUserName);
      if (savedTrainerName) setTrainerName(savedTrainerName);
    }
  }, [attemptId]);

  const saveNames = () => {
    if (userName) localStorage.setItem('userName', userName);
    if (trainerName) localStorage.setItem('trainerName', trainerName);
  };

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-xl text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const score = attempt.score;
  const total = attempt.total;
  const percentage = Math.round((score / total) * 100);
  const reportUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz/report/${attemptId}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
              <span className="text-white text-3xl font-bold">TJ</span>
            </div>
            <Link 
              href="/quiz"
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
            >
              <span>اختبار جديد</span>
              <span className="text-2xl">←</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-center text-primary mb-2 flex items-center justify-center gap-3">
            🎓 تقرير أداء الاختبار
          </h1>
          <p className="text-center text-gray-600 text-lg">
            {new Date(attempt.date).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Name Input Section */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">
                👤 اسم المتدرب
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسمك..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-lg font-bold text-gray-700 mb-2">
                👨‍🏫 اسم المدرب (اختياري)
              </label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسم المدرب..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Score Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 text-lg mb-2">✅ إجابات صحيحة</p>
            <p className="text-5xl font-bold text-green-600">{score}</p>
          </div>
          
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 text-lg mb-2">❌ إجابات خاطئة</p>
            <p className="text-5xl font-bold text-red-600">{total - score}</p>
          </div>
          
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 text-lg mb-2">📝 إجمالي الأسئلة</p>
            <p className="text-5xl font-bold text-blue-600">{total}</p>
          </div>
        </div>

        {/* Percentage Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-card-hover p-8 mb-6 text-center">
          <p className="text-white text-2xl mb-4">النسبة المئوية</p>
          <p className="text-8xl font-bold text-white">{percentage}%</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            🖨️ طباعة
          </button>
          
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reportUrl)}`;
              link.download = 'qr-code.png';
              link.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            📥 التفاصيل
          </button>
          
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'تقرير الاختبار',
                  text: `حصلت على ${percentage}% في اختبار التجويد!`,
                  url: reportUrl
                });
              } else {
                navigator.clipboard.writeText(reportUrl);
                alert('تم نسخ الرابط!');
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            📤 مشاركة
          </button>
          
          <button
            onClick={() => window.open(reportUrl, '_blank')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            🔗 نسخ
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl shadow-card p-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4 flex items-center justify-center gap-2">
            <span className="text-4xl">📱</span>
            رمز الاستجابة للتقرير
            <span className="text-xl bg-green-100 text-green-700 px-3 py-1 rounded-full">امسح</span>
          </h2>
          
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-4 border-primary rounded-2xl shadow-lg">
              {reportUrl && (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reportUrl)}`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              )}
            </div>
          </div>
          
          <p className="text-gray-600 text-sm bg-green-50 border border-green-200 rounded-xl p-4 inline-block">
            📸 امسح الكود للوصول السريع إلى التقرير
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="bg-primary/10 rounded-2xl p-4">
              <p className="text-primary font-bold">Tajweedy</p>
              <p className="text-sm text-gray-600">التجويد التفاعلي</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
