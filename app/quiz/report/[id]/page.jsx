'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ======================= Helpers ======================= */

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

const COLORS = {
  primary: '#1e7850',
  primaryDark: '#155a3c',
  correct: '#10b981',
  wrong: '#ef4444'
};

/* ======================= Main Component ======================= */

export default function QuizReportPage() {
  const params = useParams();
  const attemptId = params?.id;

  const [attempt, setAttempt] = useState(null);
  const [qrSrc, setQrSrc] = useState('');
  const [loading, setLoading] = useState(true);

  // حساب aggregates مباشرة من attempt.responses
  const aggregates = useMemo(() => {
    if (!attempt?.responses || attempt.responses.length === 0) {
      return { qArr: [], sArr: [], tl: [] };
    }

    const qMap = {};
    const sMap = {};

    attempt.responses.forEach(r => {
      const qKey = r.question || 'غير محدد';
      const sKey = r.section || 'غير محدد';
      const subKey = r.subsection || '';

      // By Question
      if (!qMap[qKey]) {
        qMap[qKey] = { 
          question: qKey, 
          section: r.section, 
          subsection: subKey, 
          right: 0, 
          wrong: 0, 
          total: 0 
        };
      }
      qMap[qKey].total++;
      if (r.correct) qMap[qKey].right++; else qMap[qKey].wrong++;

      // By Section
      if (!sMap[sKey]) {
        sMap[sKey] = { 
          section: sKey, 
          subs: {}, 
          right: 0, 
          wrong: 0, 
          total: 0 
        };
      }
      sMap[sKey].total++;
      if (r.correct) sMap[sKey].right++; else sMap[sKey].wrong++;

      // By Subsection
      if (subKey) {
        if (!sMap[sKey].subs[subKey]) {
          sMap[sKey].subs[subKey] = { 
            subsection: subKey, 
            right: 0, 
            wrong: 0, 
            total: 0 
          };
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
      subs: Object.values(s.subs || {}).map(sub => ({
        ...sub,
        pct: sub.total ? Math.round((sub.right / sub.total) * 100) : 0
      })).filter(sub => sub.total > 0)
    })).filter(s => s.total > 0);

    return { qArr, sArr, tl: [] };
  }, [attempt]);

  // جلب المحاولة
  useEffect(() => {
    if (!attemptId) { 
      setLoading(false); 
      return; 
    }

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(
      a => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId)
    );
    
    if (found) {
      setAttempt(found);
      console.log('✅ Attempt loaded:', found);
    } else {
      console.warn('⚠️ No attempt found for ID:', attemptId);
    }

    setLoading(false);
  }, [attemptId]);

  // توليد QR Code
  useEffect(() => {
    if (!attemptId) return;
    const reportUrl = `${window.location.origin}/quiz/report/${attemptId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}`;
    setQrSrc(qrUrl);
  }, [attemptId]);

  // دالة تصدير PDF
  const handleExportPDF = () => {
    window.print();
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // No attempt
  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد بيانات</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على محاولة</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl">🏠 الرئيسية</Link>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href={`/quiz/result?id=${attemptId}`} className="px-4 py-2 rounded-xl bg-gray-600 text-white font-bold hover:bg-gray-700">
                ← رجوع
              </Link>
              <Link href="/" className="px-4 py-2 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-800">
                🏠 الرئيسية
              </Link>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-primary text-white font-bold grid place-items-center text-2xl">TJ</div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-2">📊 التقرير الكامل</h1>
          <p className="text-center text-gray-600 text-lg">{formatDateEnRtl(attempt.date || Date.now())}</p>
        </div>

        {/* النسبة المئوية */}
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
              <text x="100" y="100" fontSize="40" fontWeight="bold" textAnchor="middle" dy="15" fill={COLORS.primary}>
                {toEnglishDigits(percentage)}%
              </text>
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-700">
            {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج مراجعة'}
          </p>
          <p className="text-gray-600 mt-2">
            {toEnglishDigits(score)} / {toEnglishDigits(total)}
          </p>
        </div>

        {/* QR Code */}
        {qrSrc && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
            <h2 className="text-xl font-bold text-primary mb-4">رمز الاستجابة السريع</h2>
            <img src={qrSrc} alt="QR Code" className="mx-auto w-48 h-48" />
            <p className="text-gray-600 mt-3 text-sm">امسح للوصول إلى التقرير</p>
          </div>
        )}

        {/* إحصاءات الأسئلة */}
        {aggregates.qArr && aggregates.qArr.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4">📝 إحصاءات الأسئلة</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-right font-bold">السؤال</th>
                    <th className="px-4 py-2 text-right font-bold">القسم</th>
                    <th className="px-4 py-2 text-right font-bold">صحيح</th>
                    <th className="px-4 py-2 text-right font-bold">خاطئ</th>
                    <th className="px-4 py-2 text-right font-bold">إجمالي</th>
                    <th className="px-4 py-2 text-right font-bold">النسبة %</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.qArr.map((q, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-right">{q.question}</td>
                      <td className="px-4 py-2 text-right">{q.section || '-'}</td>
                      <td className="px-4 py-2 text-right text-green-600 font-bold">{toEnglishDigits(q.right)}</td>
                      <td className="px-4 py-2 text-right text-red-600 font-bold">{toEnglishDigits(q.wrong)}</td>
                      <td className="px-4 py-2 text-right font-bold">{toEnglishDigits(q.total)}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={`font-bold ${q.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                          {toEnglishDigits(q.pct)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* إحصاءات الأقسام */}
        {aggregates.sArr && aggregates.sArr.length > 0 && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-primary mb-4">📚 إحصاءات الأقسام</h2>
            {aggregates.sArr.map((s, sIdx) => (
              <div key={sIdx} className="mb-8">
                <h3 className="text-xl font-bold text-primary mb-3">{s.section}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-right font-bold">القسم الفرعي</th>
                        <th className="px-4 py-2 text-right font-bold">صحيح</th>
                        <th className="px-4 py-2 text-right font-bold">خاطئ</th>
                        <th className="px-4 py-2 text-right font-bold">إجمالي</th>
                        <th className="px-4 py-2 text-right font-bold">النسبة %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.subs && s.subs.length > 0 ? (
                        s.subs.map((sub, subIdx) => (
                          <tr key={subIdx} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-2 text-right">{sub.subsection}</td>
                            <td className="px-4 py-2 text-right text-green-600 font-bold">{toEnglishDigits(sub.right)}</td>
                            <td className="px-4 py-2 text-right text-red-600 font-bold">{toEnglishDigits(sub.wrong)}</td>
                            <td className="px-4 py-2 text-right font-bold">{toEnglishDigits(sub.total)}</td>
                            <td className="px-4 py-2 text-right">
                              <span className={`font-bold ${sub.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                {toEnglishDigits(sub.pct)}%
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="px-4 py-2 text-center text-gray-500">لا توجد بيانات فرعية</td>
                        </tr>
                      )}
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-4 py-2 text-right">إجمالي القسم</td>
                        <td className="px-4 py-2 text-right text-green-600">{toEnglishDigits(s.right)}</td>
                        <td className="px-4 py-2 text-right text-red-600">{toEnglishDigits(s.wrong)}</td>
                        <td className="px-4 py-2 text-right">{toEnglishDigits(s.total)}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={`font-bold ${s.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {toEnglishDigits(s.pct)}%
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* الأزرار */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={handleExportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl"
          >
            📥 تصدير PDF
          </button>
          <button
            onClick={() => window.print()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl"
          >
            🖨️ طباعة
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Tajweedy',
                  url: window.location.href
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('✅ تم نسخ الرابط');
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-2xl"
          >
            📤 مشاركة
          </button>
          <Link
            href="/"
            className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-4 rounded-2xl text-center flex items-center justify-center"
          >
            🏠 الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
