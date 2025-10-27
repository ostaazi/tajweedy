'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const attemptIdRaw = params?.id;
  const attemptId = Array.isArray(attemptIdRaw) ? attemptIdRaw[0] : (attemptIdRaw ?? '').toString();

  const [attempt, setAttempt] = useState(null);
  const [userName, setUserName] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) { setLoading(false); return; }
    try {
      const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
      const found = attempts.find(a => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId));
      if (found) setAttempt(found);
      setUserName(localStorage.getItem('userName') || '');
      setTrainerName(localStorage.getItem('trainerName') || '');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  // 🔽 توليد QR بدون حزمة "qrcode"
  useEffect(() => {
    if (!attemptId || typeof window === 'undefined') return;
    const url = `${window.location.origin}/quiz/report/${attemptId}`;
    const services = [
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(url)}`,
      `https://quickchart.io/qr?text=${encodeURIComponent(url)}&size=300`,
    ];
    let i = 0; let cancelled = false;
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent" />
    </div>
  );

  if (!attempt) return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <p className="text-2xl font-bold mb-2">❌ لا توجد محاولة</p>
        <p className="text-gray-600 mb-6">لا يوجد تقرير بهذا المعرّف.</p>
        <Link href="/quiz" className="inline-block bg-[#1e7850] text-white px-6 py-3 rounded-xl">← العودة للاختبار</Link>
      </div>
    </div>
  );

  const reportUrl = typeof window !== 'undefined' ? `${window.location.origin}/quiz/report/${attemptId}` : '';
  const score = attempt.score ?? attempt.correctCount ?? 0;
  const total = attempt.total ?? attempt.questionsCount ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الهيدر، الإحصاءات، الأزرار ... (نفس تصميمك) */}

        {/* منطقة QR */}
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <h2 className="text-3xl font-bold text-[#1e7850] mb-6">📱 رمز الاستجابة السريع</h2>
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
              <div className={`${qrSrc ? 'hidden' : 'flex'} w-72 h-72 items-center justify-center flex-col gap-3 text-gray-500`}>
                <span className="text-5xl">⚠️</span>
                <p>تعذّر توليد رمز QR الآن</p>
                <p className="text-xs break-all">{reportUrl}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 inline-block">
            <p className="font-bold">📸 امسح الكود للوصول السريع</p>
          </div>
        </div>
      </div>
    </div>
  );
}
