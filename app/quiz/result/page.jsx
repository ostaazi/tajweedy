'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

/* ======================= Helpers ======================= */

function toEnglishDigits(input = '') {
  const map = {
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4',
    '٥':'5','٦':'6','٧':'7','٨':'8','٩':'9',
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4',
    '۵':'5','۶':'6','۷':'7','۸':'8','٩':'9'
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}

function formatDateArabic(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  return d.toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getArabicSectionName(englishName) {
  const map = {
    'noon_tanween': 'أحكام النون الساكنة والتنوين',
    'lam_sakinah': 'أحكام اللام الساكِنة',
    'meem_sakinah': 'أحكام الميم الساكِنة',
    'meem_maddah': 'أحكام الميم الممدودة',
    'qalqalah': 'حكم القلبة',
    'madd': 'أنواع المد',
    'ghunnah': 'حكم الغنّة',
    'idgham': 'أحكام الإدغام',
    'ikhfa': 'أحكام الإخفاء',
    'iqlab': 'حكم الإقلاب',
    'izhar': 'حكم الإظهار',
    'stopping': 'أحكام الوقف',
  };
  return map[englishName?.toLowerCase()] || englishName;
}

function getArabicSubsectionName(englishName) {
  const map = {
    'idhar_halaqi': 'الإظهار الحلقي',
    'idgham_bighunnah': 'إدغام بغنّة',
    'idgham_bilaghunnah': 'إدغام بلا غنّة',
    'ikhfa': 'إخفاء',
    'iqlab': 'إقلاب',
    'izhar': 'إظهار',
    'madd_tabii': 'مد طبيعي',
    'madd_arkam': 'مد عارض للسكون',
    'madd_lin': 'مد لازم',
    'ghunnah': 'غنّة',
    'qalqalah_major': 'قلقلة كبرى',
    'qalqalah_minor': 'قلقلة صغرى',
    'idgham_shafawi': 'إدغام شفوي',
    'ikhfa_shafawi': 'إخفاء شفوي',
    'izhar_shafawi': 'إظهار شفوي',
    'idgham_takrir': 'إدغام مع تكرير',
    'stopping_rules': 'قواعد الوقف',
    'noontanween': 'نون والتنوين',
    'idharhalaqi': 'إظهار حلقي',
    'idghambighunnah': 'إدغام بغنة',
    'idghambilaghunnah': 'إدغام بلا غنة',
    'maddtabii': 'مد طبيعي',
  };
  return map[englishName?.toLowerCase()] || englishName;
}

function getExamTypeArabic(type) {
  if (type === 'periodic') return 'اختبار دوري';
  if (type === 'therapeutic') return 'تدريب علاجي';
  return 'اختبار';
}

const COLORS = {
  primary: '#1e7850',
  primaryDark: '#155a3c',
  correct: '#10b981',
  wrong: '#ef4444'
};

/* ======================= Main Component ======================= */

export default function QuizResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const attemptId = params?.id || searchParams.get('id');

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: 'اسم المتدرب' });
  const [qrDataUrl, setQrDataUrl] = useState('');

  const aggregates = useState(() => {
    if (!attempt?.responses || attempt.responses.length === 0) {
      return { qArr: [], sArr: [] };
    }

    const qMap = {};
    const sMap = {};

    attempt.responses.forEach(r => {
      const qKey = r.question || 'غير محدد';
      const sKey = r.section || 'غير محدد';
      const subKey = r.subsection || '';

      if (!qMap[qKey]) {
        qMap[qKey] = { 
          question: qKey, 
          section: getArabicSectionName(sKey),
          subsection: getArabicSubsectionName(subKey),
          right: 0, 
          wrong: 0, 
          total: 0 
        };
      }
      qMap[qKey].total++;
      if (r.correct) qMap[qKey].right++; else qMap[qKey].wrong++;

      if (!sMap[sKey]) {
        sMap[sKey] = { 
          section: getArabicSectionName(sKey),
          subs: {}, 
          right: 0, 
          wrong: 0, 
          total: 0 
        };
      }
      sMap[sKey].total++;
      if (r.correct) sMap[sKey].right++; else sMap[sKey].wrong++;

      if (subKey) {
        if (!sMap[sKey].subs[subKey]) {
          sMap[sKey].subs[subKey] = { 
            subsection: getArabicSubsectionName(subKey),
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
      ...s,
      subs: Object.values(s.subs || {}).map(sub => ({
        ...sub,
        pct: sub.total ? Math.round((sub.right / sub.total) * 100) : 0
      })).filter(sub => sub.total > 0),
      pct: s.total ? Math.round((s.right / s.total) * 100) : 0
    })).filter(s => s.total > 0);

    return { qArr, sArr };
  }, [attempt])[0];

  useEffect(() => {
    if (attemptId) {
      const baseUrl = `${window.location.origin}/quiz/result/${attemptId}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(baseUrl)}&size=200x200&color=1e7850&bgcolor=ffffff`;
      setQrDataUrl(qrUrl);
    }
  }, [attemptId]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser({ name: userData.name || 'اسم المتدرب' });

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
      console.log('✅ Result loaded:', found);
    } else {
      console.warn('⚠️ No attempt found for ID:', attemptId);
    }

    setLoading(false);
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-700 mb-4">❌ لا توجد بيانات</p>
          <p className="text-gray-600 mb-6">لم يتم العثور على نتيجة الاختبار</p>
          <Link href="/quiz" className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl">← اختبار جديد</Link>
        </div>
      </div>
    );
  }

  const score = attempt.score ?? 0;
  const total = attempt.total ?? 0;
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const examTypeArabic = getExamTypeArabic(attempt.type);
  const examCode = `TJ-${toEnglishDigits(attemptId)}`;
  const examDate = formatDateArabic(attempt.date || Date.now());

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
          font-family: 'Cairo', sans-serif !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          #result-content,
          #result-content * {
            visibility: visible;
          }

          #result-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }

          .no-print {
            display: none !important;
          }

          .bg-gradient-to-br {
            background: white !important;
          }

          .shadow-lg {
            box-shadow: none !important;
          }

          /* فاصل صفحات - QR والإحصاءات في صفحة واحدة، باقي البيانات بعدها */
          .page-break-after {
            page-break-after: always;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8" dir="rtl">
        <div id="result-content" className="max-w-4xl mx-auto">
          
          {/* Header - مطابق للصور: شعار، بطاقة ترويسة أعلى يسار */}
          <div className="relative mb-6">
            {/* الشعار والنص في الوسط أعلى */}
            <div className="text-center mb-4">
              <img src="/logo.png" alt="Tajweedy Logo" className="w-16 h-16 mx-auto object-contain mb-2" />
              <p className="text-sm font-bold text-primary">التجويد الذكي</p>
            </div>

            {/* بطاقة الترويسة - أعلى يسار، RTL داخلي */}
            <div className="bg-white rounded-2xl shadow-md p-3 w-64 absolute top-0 left-0 text-right">
              <p className="text-xs text-gray-600 mb-1"><strong>نوع الاختبار:</strong> {examTypeArabic}</p>
              <p className="text-xs text-gray-600 mb-1"><strong>كود الاختبار:</strong> {examCode}</p>
              <p className="text-xs text-gray-600"><strong>تاريخ الاختبار:</strong> {examDate}</p>
            </div>
          </div>

          {/* اسم المتدرب */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 text-center">
            <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
          </div>

          {/* Navigation - رجوع إلى التقرير الكامل */}
          <div className="flex justify-center mb-4 no-print">
            <Link 
              href={`/quiz/report/${attemptId}`} 
              className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-2xl flex items-center gap-2"
            >
              📊 التقرير الكامل
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-primary text-center mb-6">🎯 نتيجة الاختبار</h1>

          {/* دائرة التقدم - مطابقة للصور */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center">
            <h2 className="text-lg font-bold text-primary mb-4">النسبة المئوية</h2>
            <div className="flex justify-center mb-4">
              <svg width="150" height="150" viewBox="0 0 150 150">
                <circle cx="75" cy="75" r="60" fill="none" stroke="#e5e7eb" strokeWidth="15"/>
                <circle
                  cx="75" cy="75" r="60" fill="none"
                  stroke={percentage >= 60 ? COLORS.correct : COLORS.wrong}
                  strokeWidth="15"
                  strokeDasharray={`${(percentage / 100) * 377} 377`}
                  transform="rotate(-90 75 75)"
                  strokeLinecap="round"
                />
                <text x="75" y="75" fontSize="30" fontWeight="bold" textAnchor="middle" dy="10" fill={COLORS.primary}>
                  {toEnglishDigits(percentage)}%
                </text>
              </svg>
            </div>
            <p className="text-lg font-bold text-gray-700">
              {percentage >= 80 ? '🎉 ممتاز!' : percentage >= 60 ? '👍 جيد' : '📚 يحتاج تحسين'}
            </p>
            <p className="text-gray-600 mt-2 text-sm">
              {toEnglishDigits(score)} صحيح من {toEnglishDigits(total)} إجمالي
            </p>
          </div>

          {/* بطاقة QR Code - مطبوعة وفي الصفحة الأولى */}
          {qrDataUrl && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 text-center page-break-after">
              <h2 className="text-lg font-bold text-primary mb-4">رمز الاستجابة السريع</h2>
              <img src={qrDataUrl} alt="QR Code للنتيجة" className="mx-auto w-48 h-48" />
              <p className="text-gray-600 mt-3 text-sm">امسح للوصول السريع إلى نتيجة الاختبار</p>
            </div>
          )}

          {/* جدول الأسئلة - سجل المحاولات/إحصاءات الأسئلة */}
          {aggregates.qArr && aggregates.qArr.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 overflow-x-auto">
              <h2 className="text-lg font-bold text-primary mb-3 text-right">📝 إحصاءات الأسئلة</h2>
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-2 py-2 text-xs font-bold text-right">السؤال</th>
                    <th className="px-2 py-2 text-xs font-bold text-right">القسم</th>
                    <th className="px-2 py-2 text-xs font-bold text-right">القسم الفرعي</th>
                    <th className="px-2 py-2 text-xs font-bold text-right">صحيح</th>
                    <th className="px-2 py-2 text-xs font-bold text-right">خطأ</th>
                    <th className="px-2 py-2 text-xs font-bold text-right">النسبة %</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregates.qArr.map((q, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="px-2 py-2 text-xs text-right">{q.question}</td>
                      <td className="px-2 py-2 text-xs text-right">{q.section}</td>
                      <td className="px-2 py-2 text-xs text-right">{q.subsection}</td>
                      <td className={`px-2 py-2 text-xs font-bold text-right ${q.right > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {toEnglishDigits(q.right)}
                      </td>
                      <td className={`px-2 py-2 text-xs font-bold text-right ${q.wrong > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {toEnglishDigits(q.wrong)}
                      </td>
                      <td className="px-2 py-2 text-xs text-right">
                        <span className={`font-bold ${q.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                          {toEnglishDigits(q.pct)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* إحصاءات الأقسام المختصرة */}
          {aggregates.sArr && aggregates.sArr.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
              <h2 className="text-lg font-bold text-primary mb-3 text-right">📚 إحصاءات الأقسام</h2>
              {aggregates.sArr.map((s, sIdx) => (
                <div key={sIdx} className="mb-4">
                  <h3 className="text-base font-bold text-primary mb-2">{s.section}</h3>
                  <div className="flex flex-col gap-1 text-xs">
                    {s.subs && s.subs.length > 0 ? (
                      s.subs.map((sub, subIdx) => (
                        <div key={subIdx} className="flex justify-between px-2">
                          <span>{sub.subsection}</span>
                          <span className={`font-bold ${sub.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {toEnglishDigits(sub.right)} / {toEnglishDigits(sub.wrong)} ({toEnglishDigits(sub.pct)}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500">لا توجد بيانات فرعية</div>
                    )}
                    <div className="border-t pt-1 font-bold text-sm">
                      <span>إجمالي القسم: </span>
                      <span className={`text-right ml-auto ${s.pct >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        {toEnglishDigits(s.right)} / {toEnglishDigits(s.wrong)} ({toEnglishDigits(s.pct)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* الأزرار - تصدير وطباعة واختبار جديد */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 no-print">
            <Link
              href={`/quiz/report/${attemptId}`}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-2xl text-center"
            >
              📊 تقرير مفصل
            </Link>
            <button
              onClick={() => window.print()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-2xl"
            >
              🖨️ طباعة
            </button>
            <Link
              href="/quiz"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-2xl text-center"
            >
              🔄 اختبار جديد
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
