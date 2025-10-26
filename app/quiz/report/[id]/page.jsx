'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const attemptId = params?.id;
  
  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  // جلب المحاولة مع تطبيع الـ id
  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      return;
    }

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(a =>
      String(a?.id) === String(attemptId) ||
      Number(a?.id) === Number(attemptId)
    );
    
    if (found) setAttempt(found);

    const savedUserName = localStorage.getItem('userName') || '';
    const savedTrainerName = localStorage.getItem('trainerName') || '';
    setUserName(savedUserName);
    setTrainerName(savedTrainerName);

    setLoading(false);
  }, [attemptId]);

  // بناء QR Code بعد توفر attemptId
  useEffect(() => {
    if (!attemptId || typeof window === 'undefined') return;
    
    const url = `${window.location.origin}/quiz/report/${attemptId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    
    setQrSrc(qrUrl);
  }, [attemptId]);

  const saveNames = () => {
    if (userName) localStorage.setItem('userName', userName);
    if (trainerName) localStorage.setItem('trainerName', trainerName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد محاولة</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على تقرير مطابق لهذا المعرّف</p>
          <Link 
            href="/quiz"
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl"
          >
            ← العودة للاختبار
          </Link>
        </div>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const reportUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/quiz/report/${attemptId}`
    : '';

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
              className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-bold text-lg"
            >
              <span>اختبار جديد</span>
              <span className="text-2xl">←</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-center text-primary mb-2">
            🎓 تقرير أداء الاختبار
          </h1>
          <p className="text-center text-gray-600 text-lg">
            {new Date(attempt.date || Date.now()).toLocaleDateString('ar-EG', {
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
          <div className="bg-green-50 border-4 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 text-lg font-bold mb-2">✅ إجابات صحيحة</p>
            <p className="text-6xl font-bold text-green-600">{score}</p>
          </div>
          
          <div className="bg-red-50 border-4 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 text-lg font-bold mb-2">❌ إجابات خاطئة</p>
            <p className="text-6xl font-bold text-red-600">{total - score}</p>
          </div>
          
          <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 text-lg font-bold mb-2">📝 إجمالي الأسئلة</p>
            <p className="text-6xl font-bold text-blue-600">{total}</p>
          </div>
        </div>

        {/* Percentage Card */}
        <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-card-hover p-8 mb-6 text-center">
          <p className="text-white text-2xl font-bold mb-4">النسبة المئوية</p>
          <p className="text-9xl font-bold text-white mb-2">{percentage}%</p>
          <p className="text-white/80 text-lg">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105"
          >
            🖨️ طباعة
          </button>
          
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = qrSrc;
              link.download = 'qr-code.png';
              link.click();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105"
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
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105"
          >
            📤 مشاركة
          </button>
          
          <button
            onClick={() => {
              navigator.clipboard.writeText(reportUrl);
              alert('تم نسخ الرابط!');
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105"
          >
            🔗 نسخ
          </button>
        </div>

        {/* QR Code Section */}
        <div className="bg-white rounded-3xl shadow-card p-8 text-center">
          <h2 className="text-3xl font-bold text-primary mb-6 flex items-center justify-center gap-3">
            <span className="text-5xl">📱</span>
            رمز الاستجابة السريع
          </h2>
          
          <div className="flex justify-center mb-6">
            {qrSrc ? (
              <div className="p-6 bg-white border-4 border-primary rounded-3xl shadow-lg">
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-72 h-72"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-72 h-72 items-center justify-center text-gray-400 flex-col gap-4">
                  <span className="text-6xl">⚠️</span>
                  <p className="text-lg">تعذر تحميل QR Code</p>
                </div>
              </div>
            ) : (
              <div className="w-72 h-72 flex items-center justify-center border-4 border-dashed border-gray-300 rounded-3xl">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 inline-block">
            <p className="text-gray-700 text-lg font-bold mb-2">📸 امسح الكود للوصول السريع</p>
            <p className="text-sm text-gray-600">استخدم كاميرا الهاتف أو تطبيق قارئ QR</p>
          </div>

          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <div className="flex items-center justify-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
                <span className="text-white text-2xl font-bold">TJ</span>
              </div>
              <div className="text-right">
                <p className="text-primary font-bold text-xl">Tajweedy</p>
                <p className="text-gray-600">التجويد التفاعلي</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
