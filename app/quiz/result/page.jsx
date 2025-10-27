'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

/* ----------------------- Utilities ----------------------- */
const COLORS = {
  primary: '#1e7850',
  primaryDark: '#155a3c',
  correct: '#10b981',
  wrong: '#ef4444'
};

function toEnglishDigits(input = '') {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
    '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}

function formatDateEnRtl(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = String(d.getFullYear());
  return `${day} ${month} ${year}`;
}

/* ----------------------- Main Component ----------------------- */
export default function QuizResultPage() {
  const [attemptId, setAttemptId] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  // جلب المحاولة
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) { setLoading(false); return; }
    setAttemptId(id);
    
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(
      a => String(a?.id) === String(id) || Number(a?.id) === Number(id)
    );
    if (found) setAttempt(found);
    setLoading(false);
  }, []);

  // حساب الإحصاءات
  const aggregates = useMemo(() => {
    if (!attempt?.responses) return { qArr: [], sArr: [], tl: [] };

    const qMap = {};
    const sMap = {};

    attempt.responses.forEach(r => {
      const qKey = r.question || 'غير محدد';
      const sKey = r.section || 'غير محدد';
      const subKey = r.subsection || '';

      // Aggregation by Question
      if (!qMap[qKey]) {
        qMap[qKey] = { question: qKey, section: r.section, subsection: subKey, right: 0, wrong: 0, total: 0 };
      }
      qMap[qKey].total++;
      if (r.correct) qMap[qKey].right++; else qMap[qKey].wrong++;

      // Aggregation by Section
      if (!sMap[sKey]) {
        sMap[sKey] = { section: sKey, subs: {}, right: 0, wrong: 0, total: 0 };
      }
      sMap[sKey].total++;
      if (r.correct) sMap[sKey].right++; else sMap[sKey].wrong++;

      // Subsection
      if (subKey) {
        if (!sMap[sKey].subs[subKey]) {
          sMap[sKey].subs[subKey] = { subsection: subKey, right: 0, wrong: 0, total: 0 };
        }
        sMap[sKey].subs[subKey].total++;
        if (r.correct) sMap[sKey].subs[subKey].right++; else sMap[sKey].subs[subKey].wrong++;
      }
    });

    const qArr = Object.values(qMap).map(q => ({
      ...q,
      pct: q.total ? Math.round((q.right / q.total) * 100) : 0
    }));

    const sArr = Object.values(sMap).map(s => ({
      section: s.section,
      right: s.right,
      wrong: s.wrong,
      total: s.total,
      pct: s.total ? Math.round((s.right / s.total) * 100) : 0,
      subs: Object.values(s.subs).map(sub => ({
        ...sub,
        pct: sub.total ? Math.round((sub.right / sub.total) * 100) : 0
      }))
    }));

    // Timeline
    const allAttempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const tl = allAttempts
      .filter(a => a?.score !== undefined && a?.total !== undefined)
      .map(a => ({
        id: a.id,
        date: a.date || Date.now(),
        score: a.score,
        total: a.total,
        pct: a.total ? Math.round((a.score / a.total) * 100) : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    return { qArr, sArr, tl };
  }, [attempt]);

  // ✅ حفظ aggregates في localStorage
  useEffect(() => {
    if (aggregates && (aggregates.qArr?.length > 0 || aggregates.sArr?.length > 0)) {
      localStorage.setItem('tajweedyAggregates', JSON.stringify(aggregates));
      console.log('✅ Aggregates saved to localStorage:', aggregates);
    }
  }, [aggregates]);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No attempt
  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد نتيجة</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على محاولة مطابقة</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl">🏠 الصفحة الرئيسية</Link>
            <Link href="/quiz" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl">← اختبار جديد</Link>
          </div>
        </div>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/" className="px-4 py-2 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-800">🏠 الرئيسية</Link>
              <Link href="/quiz" className="px-4 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark">← اختبار جديد</Link>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary text-white font-bold grid place-items-center text-2xl">TJ</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">🎓 نتيجة الاختبار</h1>
          <p className="text-center text-gray-600 text-lg">{formatDateEnRtl(attempt.date || Date.now())}</p>
        </div>

        {/* Ring Chart */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 text-center">
          <h2 className="text-2xl font-bold text-primary mb-6">النسبة المئوية</h2>
          <div className="flex justify-center mb-6">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
              <circle
                cx="100" cy="100" r="80" fill="none"
                stroke={percentage >= 60 ? COLORS.correct : COLORS.wrong}
                strokeWidth="20"
                strokeDasharray={`${(percentage / 100) * 502} 502`}
                transform="rotate(-90 100 100)"
                strokeLinecap="round"
              />
              <text x="100" y="100" fontSize="40" fontWeight="bold" textAnchor="middle" dy="15" fill={COLORS.primary}>{toEnglishDigits(percentage)}%</text>
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-700">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
          <p className="text-gray-600 mt-2">
            {toEnglishDigits(score)} / {toEnglishDigits(total)} — {percentage >= 60 ? 'نتيجة رائعة!' : 'استمر في التعلم!'}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Link href={`/quiz/report/${attemptId}`} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl text-center">📊 التقرير الكامل</Link>
          <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl">🖨️ طباعة</button>
          <Link href="/quiz" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-2xl text-center">🔄 اختبار جديد</Link>
          <Link href="/" className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl text-center">🏠 الرئيسية</Link>
        </div>

      </div>
    </div>
  );
}
