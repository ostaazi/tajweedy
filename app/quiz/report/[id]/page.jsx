'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export default function ResultPage() {
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [qrSrc, setQrSrc] = useState('');

  // استرجاع نتيجة المستخدم من التخزين المحلي
  useEffect(() => {
    const lastAttempt = JSON.parse(localStorage.getItem('quizAttempts') || '[]').slice(-1)[0];
    if (lastAttempt) {
      setScore(lastAttempt.score || 0);
      setTotal(lastAttempt.total || 0);
    }
  }, []);

  const percentage = total ? Math.round((score / total) * 100) : 0;

  // رابط التقرير الفعلي
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !total) return '';
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const latestId = attempts?.slice(-1)[0]?.id || '';
    return `${window.location.origin}/quiz/report/${latestId}`;
  }, [total]);

  // توليد رمز QR تلقائيًا من خدمات خارجية آمنة
  useEffect(() => {
    if (!reportUrl) return;
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(reportUrl)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(reportUrl)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=250`,
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
      img.src = candidate;
      img.referrerPolicy = 'no-referrer';
    };

    tryNext();
    return () => { cancelled = true; };
  }, [reportUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50 p-6" dir="rtl">
      <div className="max-w-3xl mx-auto text-center">

        <h1 className="text-3xl font-bold text-green-700 mb-6">نتيجة الاختبار 🎓</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-6">
            <p className="text-green-800 font-bold mb-2">إجابات صحيحة ✅</p>
            <p className="text-5xl font-bold">{score}</p>
          </div>

          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6">
            <p className="text-red-800 font-bold mb-2">إجابات خاطئة ❌</p>
            <p className="text-5xl font-bold">{total - score}</p>
          </div>

          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-6">
            <p className="text-blue-800 font-bold mb-2">إجمالي الأسئلة 📝</p>
            <p className="text-5xl font-bold">{total}</p>
          </div>
        </div>

        <div className="bg-green-700 text-white rounded-3xl p-8 mb-6">
          <p className="text-8xl font-bold mb-3">{percentage}%</p>
          <p className="text-lg">
            {percentage >= 80 ? '🎉 ممتاز جداً!' : percentage >= 60 ? '👏 أداء جيد' : '📖 حاول مرة أخرى'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl"
          >
            طباعة 🖨️
          </button>

          <Link
            href={reportUrl}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center"
          >
            التفاصيل 📄
          </Link>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'تقرير التجويد',
                  text: `حصلت على ${percentage}% في اختبار التجويد`,
                  url: reportUrl,
                });
              } else {
                navigator.clipboard.writeText(reportUrl);
                alert('تم نسخ الرابط!');
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl"
          >
            مشاركة 📤
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(reportUrl);
              alert('تم نسخ الرابط!');
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl"
          >
            نسخ 🔗
          </button>
        </div>

        {/* ✅ QR Code Section */}
        <div className="bg-white border-2 border-green-200 rounded-3xl shadow-md p-8 text-center">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-center items-center gap-2">
            <span>📱</span> رمز الاستجابة السريع للوصول السريع
          </h2>

          {qrSrc ? (
            <div className="flex justify-center">
              <img
                src={qrSrc}
                alt="QR Code"
                className="w-52 h-52 border-4 border-green-400 rounded-2xl shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <p className="text-gray-500 mt-4">جارٍ توليد الكود...</p>
          )}

          <p className="mt-4 text-gray-600 text-sm">
            امسح الكود باستخدام كاميرا الهاتف أو تطبيق قارئ QR 📸
          </p>

          <div className="mt-6 flex flex-col items-center">
            <img src="/logo.png" alt="Tajweedy Logo" className="w-20 opacity-80" />
            <p className="text-gray-700 font-bold mt-2">Tajweedy التجويد التفاعلي</p>
          </div>
        </div>
      </div>
    </div>
  );
}
