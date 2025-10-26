'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import QRCode from 'react-qr-code';

export default function ReportPage() {
  const params = useParams();
  const attemptId = params.id;
  
  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  useEffect(() => {
    if (attemptId) {
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a => a.id === attemptId);
      setAttempt(found);

      // Check for saved name
      const savedName = localStorage.getItem('userName');
      if (savedName) {
        setUserName(savedName);
      }
    }
  }, [attemptId]);

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
  const reportUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/quiz/report/${attemptId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-card p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <Image src="/logo.png" alt="Tajweedy" width={80} height={80} className="rounded-2xl" />
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
                placeholder="أدخل اسم المدرب..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-card-hover p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            {/* Percentage Circle */}
            <div className="relative">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="#ffffff"
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${percentage * 5.53} 553`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-bold text-white">{percentage}%</span>
                <span className="text-white text-lg">النسبة المئوية</span>
              </div>
            </div>

            {/* Stats */}
            <div className="text-center md:text-right space-y-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-white/80 text-lg">✅ إجابات صحيحة</p>
                <p className="text-5xl font-bold text-white">{score}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-white/80 text-lg">❌ إجابات خاطئة</p>
                <p className="text-5xl font-bold text-white">{total - score}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-white/80 text-lg">📝 إجمالي الأسئلة</p>
                <p className="text-5xl font-bold text-white">{total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl shadow-card p-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">📱 مشاركة التقرير</h2>
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white border-4 border-primary rounded-2xl">
              <QRCode
                value={reportUrl}
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#1e7850"
              />
            </div>
          </div>
          <p className="text-gray-600 text-sm">امسح الكود للوصول إلى التقرير</p>
        </div>

        {/* Print Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => window.print()}
            className="bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-2xl text-xl transition-all transform hover:scale-105"
          >
            🖨️ طباعة التقرير
          </button>
        </div>
      </div>
    </div>
  );
}
