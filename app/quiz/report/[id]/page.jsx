'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const attemptIdRaw = params?.id;
  const attemptId = Array.isArray(attemptIdRaw)
    ? attemptIdRaw[0]
    : (attemptIdRaw ?? '').toString();

  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  // تحميل بيانات المحاولة
  useEffect(() => {
    if (!attemptId) { setLoading(false); return; }

    try {
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(
        (a) => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId)
      );
      if (found) setAttempt(found);
      setUserName(localStorage.getItem('userName') || '');
      setTrainerName(localStorage.getItem('trainerName') || '');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  // توليد QR من خدمات خارجية (بدون qrcode)
  useEffect(() => {
    if (!attemptId || typeof window === 'undefined') return;

    const url = `${window.location.origin}/quiz/report/${attemptId}`;
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(url)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300`,
    ];

    let i = 0;
    let cancelled = false;

    const tryNext = () => {
      if (cancelled) return;
      if (i >= services.length) { setQrSrc(''); return; }

      const candidate = services[i++];
      const img = new Image();
      img.onload = () => { if (!cancelled) setQrSrc(candidate); };
      img.onerror = () => { if (!cancelled) tryNext(); };
      img.referrerPolicy = 'no-referrer';
      img.src = candidate;
    };

    tryNext();
    return () => { cancelled = true; };
  }, [attemptId]);

  const saveNames = () => {
    try {
      if (userName) localStorage.setItem('userName', userName);
      if (trainerName) localStorage.setItem('trainerName', trainerName);
    } catch {}
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-green-50 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent" />
      </div>
    );

  if (!attempt)
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-6">
        <div>
          <p className="text-2xl font-bold mb-2">❌ لا توجد محاولة</p>
          <p className="text-gray-600 mb-6">لا يوجد تقرير بهذا المعرّف.</p>
          <Link
            href="/quiz"
            className="inline-block bg-[#1e7850] hover:bg-[#155c3e] text-white px-6 py-3 rounded-xl"
          >
            ← العودة للاختبار
          </Link>
        </div>
      </div>
    );

  const reportUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/quiz/report/${attemptId}`
      : '';

  const score = attempt.score ?? attempt.correctCount ?? 0;
  const total = attempt.total ?? attempt.questionsCount ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* العنوان */}
        <div className="bg-white rounded-3xl shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-20 h-20 bg-[#1e7850] rounded-2xl flex items-center justify-center">
              <span className="text-white text-3xl font-bold">TJ</span>
            </div>
            <Link
              href="/quiz"
              className="flex items-center gap-2 text-[#1e7850] hover:text-[#155c3e] font-bold text-lg"
            >
              <span>اختبار جديد</span>
              <span className="text-2xl">←</span>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-center text-[#1e7850] mb-2">
            🎓 تقرير أداء الاختبار
          </h1>
          <p className="text-center text-gray-600 text-lg">
            {new Date(attempt.date || Date.now()).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* أسماء المستخدمين */}
        <div className="bg-white rounded-3xl shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-lg font-bold text-gray-700 mb-2">👤 اسم المتدرب</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسمك..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-[#1e7850] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-lg font-bold text-gray-700 mb-2">👨‍🏫 اسم المدرب (اختياري)</label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                onBlur={saveNames}
                placeholder="أدخل اسم المدرب..."
                className="w-full px-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-[#1e7850] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* الإحصاءات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border-4 border-green-200 rounded-2xl p-6 text-center">
            <p className="text-green-700 text-lg font-bold mb-2">✅ إجابات صحيحة</p>
            <p className="text-6xl font-bold text-green-600">{score}</p>
          </div>
          <div className="bg-red-50 border-4 border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 text-lg font-bold mb-2">❌ إجابات خاطئة</p>
            <p className="text-6xl font-bold text-red-600">{Math.max(total - score, 0)}</p>
          </div>
          <div className="bg-blue-50 border-4 border-blue-200 rounded-2xl p-6 text-center">
            <p className="text-blue-700 text-lg font-bold mb-2">📝 إجمالي الأسئلة</p>
            <p className="text-6xl font-bold text-blue-600">{total}</p>
          </div>
        </div>

        {/* النسبة المئوية */}
        <div className="bg-gradient-to-br from-[#1e7850] to-[#155c3e] rounded-3xl shadow p-8 mb-6 text-center text-white">
          <p className="text-2xl font-bold mb-4">النسبة المئوية</p>
          <p className="text-9xl font-bold mb-2">{percentage}%</p>
          <p className="text-white/80 text-lg">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
        </div>

        {/* الأزرار */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105"
          >
            🖨️ طباعة
          </button>
          <button
            onClick={() => {
              if (qrSrc) {
                const a = document.createElement('a');
                a.href = qrSrc;
                a.download = 'qr-code.png';
                a.click();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all transform hover:scale-105"
          >
            📥 تحميل QR
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'تقرير الاختبار',
                  text: `حصلت على ${percentage}% في اختبار التجويد!`,
                  url: reportUrl,
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

        {/* QR Code */}
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <h2 className="text-3xl font-bold text-[#1e7850] mb-6 flex items-center justify-center gap-3">
            <span className="text-5xl">📱</span> رمز الاستجابة السريع
          </h2>
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-white border-4 border-[#1e7850] rounded-3xl shadow-lg">
              {qrSrc ? (
                <img
                  src={qrSrc}
                  alt="QR Code"
                  className="w-72 h-72"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fb = e.currentTarget.nextElementSibling;
                    if (fb) fb.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div
                className={`${
                  qrSrc ? 'hidden' : 'flex'
                } w-72 h-72 items-center justify-center flex-col gap-3 text-gray-500`}
              >
                <span className="text-5xl">⚠️</span>
                <p>تعذّر توليد رمز QR الآن</p>
                <p className="text-xs break-all">{reportUrl}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 inline-block">
            <p className="text-gray-700 text-lg font-bold mb-2">
              📸 امسح الكود للوصول السريع
            </p>
            <p className="text-sm text-gray-600">استخدم كاميرا الهاتف أو تطبيق قارئ QR</p>
          </div>
        </div>
      </div>
    </div>
  );
}
