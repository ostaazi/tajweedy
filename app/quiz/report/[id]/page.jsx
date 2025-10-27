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

function formatDateArabic(dateLike) {
  const d = (dateLike instanceof Date) ? dateLike : new Date(dateLike || Date.now());
  return d.toLocaleDateString('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// دالة لترجمة الأقسام الرئيسية إلى العربية (مستمدة من questions_bank.json)
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
    // أضف أقسامًا إضافية إذا كانت موجودة في الـ JSON
  };
  return map[englishName?.toLowerCase()] || englishName;
}

// دالة لترجمة الأجزاء الفرعية إلى العربية (موسعة من questions_bank.json)
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
    // أجزاء إضافية شائعة من بنك التجويد
    'noontanween': 'نون والتنوين',
    'idharhalaqi': 'إظهار حلقي',
    'idghambighunnah': 'إدغام بغنة',
    'idghambilaghunnah': 'إدغام بلا غنة',
    'maddtabii': 'مد طبيعي',
  };
  return map[englishName?.toLowerCase()] || englishName; // تحويل إلى صغير للمطابقة
}

// دالة لنوع الاختبار
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

export default function QuizReportPage() {
  const params = useParams();
  const attemptId = params?.id;

  const [attempt, setAttempt] = useState(null);
  const [qrSrc, setQrSrc] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: 'اسم المتدرب' });

  const aggregates = useMemo(() => {
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
          section: getArabicSectionName(sKey), // ترجمة القسم الرئيسي
          subsection: getArabicSubsectionName(subKey), // ترجمة الفرعي
          right: 0, 
          wrong: 0, 
          total: 0 
        };
      }
      qMap[qKey].total++;
      if (r.correct) qMap[qKey].right++; else qMap[qKey].wrong++;

      if (!sMap[sKey]) {
        sMap[sKey] = { 
          section: getArabicSectionName(sKey), // ترجمة القسم
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
            subsection: getArabicSubsectionName(subKey), // ترجمة الفرعي
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
      })).filter(sub => sub.total > 0)
    })).filter(s => s.total > 0);

    return { qArr, sArr };
  }, [attempt]);

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
      console.log('✅ Attempt loaded:', found);
    } else {
      console.warn('⚠️ No attempt found for ID:', attemptId);
    }

    setLoading(false);
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    
    const reportUrl = `${window.location.origin}/quiz/report/${attemptId}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(reportUrl)}`;
    setQrSrc(qrUrl);

    fetch(qrUrl)
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => setQrDataUrl(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('QR Error:', err));
  }, [attemptId]);

  const handleExportPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('report-content');
      if (!element) {
        alert('⚠️ لم يتم العثور على المحتوى');
        return;
      }

      const opt = {
        margin: 10,
        filename: `tajweedy-report-${attemptId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true // تحسين للنصوص العربية
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('❌ PDF Error:', error);
      alert('❌ حدث خطأ أثناء التصدير');
    }
  };

  // دالة الرسم البياني (مع تسميات عربية)
  const BarChart = ({ subs }) => {
    if (!subs || subs.length === 0) return null;

    const maxValue = Math.max(...subs.map(sub => Math.max(sub.right, sub.wrong)));
    const barWidth = 30;
    const groupSpacing = 70;
    const chartHeight = 200;
    const chartWidth = subs.length * groupSpacing + 100;

    return (
      <div className="mt-6 w-full">
        <svg width="100%" height={chartHeight + 80} viewBox={`0 0 ${chartWidth} ${chartHeight + 80}`} className="bg-gray-50 rounded-lg p-4 block mx-auto">
          {/* المحاور */}
          <line x1="50" y1={chartHeight - 20} x2={chartWidth - 20} y2={chartHeight - 20} stroke="#d1d5db" strokeWidth="2" />
          <line x1="50" y1={chartHeight - 20} x2="50" y2="20" stroke="#d1d5db" strokeWidth="2" />

          {/* تسمية Y */}
          <text x="30" y="15" fontSize="12" fill="#374151" textAnchor="middle">عدد الأسئلة</text>

          {/* التسميات على X (أسماء عربية كاملة) */}
          {subs.map((sub, idx) => (
            <g key={idx}>
              <text 
                x={50 + idx * groupSpacing + (barWidth * 2 + 10) / 2} 
                y={chartHeight + 10} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#374151"
                transform={`rotate(-45 ${50 + idx * groupSpacing + (barWidth * 2 + 10) / 2} ${chartHeight + 10})`}
                dir="rtl"
              >
                {sub.subsection}
              </text>
            </g>
          ))}

          {/* الشرائط المجمعة */}
          {subs.map((sub, idx) => {
            const xBase = 50 + idx * groupSpacing;
            const greenHeight = maxValue > 0 ? (sub.right / maxValue) * (chartHeight - 40) : 0;
            const redHeight = maxValue > 0 ? (sub.wrong / maxValue) * (chartHeight - 40) : 0;

            return (
              <g key={idx}>
                {/* شريط أخضر (صحيح) */}
                <rect
                  x={xBase}
                  y={chartHeight - 20 - greenHeight}
                  width={barWidth}
                  height={greenHeight}
                  fill={COLORS.correct}
                  rx="3"
                />
                <text
                  x={xBase + barWidth / 2}
                  y={chartHeight - 20 - greenHeight - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="white"
                >
                  {toEnglishDigits(sub.right)}
                </text>
                {/* شريط أحمر (خاطئ) */}
                <rect
                  x={xBase + barWidth + 10}
                  y={chartHeight - 20 - redHeight}
                  width={barWidth}
                  height={redHeight}
                  fill={COLORS.wrong}
                  rx="3"
                />
                <text
                  x={xBase + barWidth + 10 + barWidth / 2}
                  y={chartHeight - 20 - redHeight - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="white"
                >
                  {toEnglishDigits(sub.wrong)}
                </text>
              </g>
            );
          })}

          {/* الدليل (Legend) */}
          <g transform={`translate(50, ${chartHeight + 30})`}>
            <rect x="0" y="0" width="15" height="15" fill={COLORS.correct} rx="2" />
            <text x="20" y="12" fontSize="12" fill="#374151">صحيح</text>
            <rect x="80" y="0" width="15" height="15" fill={COLORS.wrong} rx="2" />
            <text x="100" y="12" fontSize="12" fill="#374151">خاطئ</text>
          </g>
        </svg>
      </div>
    );
  };

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

        /* Watermark - كاملة دون اقتطاع */
        .watermark-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-image: url('/logo.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.1;
          z-index: 0;
          pointer-events: none;
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

          #report-content,
          #report-content * {
            visibility: visible;
          }

          #report-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
            padding: 20px;
          }

          /* Watermark for print - كاملة */
          #report-content::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 210mm;
            height: 297mm;
            background-image: url('/logo.png');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.1;
            z-index: -1;
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

          /* تحسين RTL للنصوص العربية في الطباعة */
          table { direction: rtl; }
          svg text { direction: rtl; unicode-bidi: embed; }
        }
      `}</style>

      {/* Watermark Background */}
      <div className="watermark-bg"></div>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8 relative z-10" dir="rtl">
        <div id="report-content" className="max-w-6xl mx-auto">
          
          {/* Header - شعار يسار + عنوان أصغر */}
          <div className="text-center mb-6">
            <div className="flex justify-end mb-3">
              <img 
                src="/logo.png" 
                alt="Tajweedy Logo" 
                className="w-24 h-24 mr-auto object-contain"
              />
            </div>
            <p className="text-lg font-bold text-primary">التجويد الذكي</p>
          </div>

          {/* اسم المتدرب - مركز */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          </div>

          {/* المعلومات العلوية - أعلى يسار (visual left) */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 float-left text-left w-64">
            <p className="text-lg text-gray-600 mb-2">
              <strong>نوع الاختبار:</strong> {examTypeArabic}
            </p>
            <p className="text-lg text-gray-600 mb-2">
              <strong>كود الاختبار:</strong> {examCode}
            </p>
            <p className="text-base text-primary flex justify-between">
              <span className="dir=ltr mr-2">{examDate}</span>
              <strong>تاريخ الاختبار:</strong>
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mb-4 no-print clear-both">
            <div className="flex items-center gap-3">
              <Link href={`/quiz/result?id=${attemptId}`} className="px-4 py-2 rounded-xl bg-gray-600 text-white font-bold hover:bg-gray-700">
                ← رجوع
              </Link>
              <Link href="/" className="px-4 py-2 rounded-xl bg-gray-700 text-white font-bold hover:bg-gray-800">
                🏠 الرئيسية
              </Link>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-6">📊 التقرير الكامل</h1>

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
          {qrDataUrl && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
              <h2 className="text-xl font-bold text-primary mb-4">رمز الاستجابة السريع</h2>
              <img src={qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48" crossOrigin="anonymous" />
              <p className="text-gray-600 mt-3 text-sm">امسح للوصول إلى التقرير</p>
            </div>
          )}

          {/* إحصاءات الأسئلة (مع أسماء عربية) */}
          {aggregates.qArr && aggregates.qArr.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-primary mb-4">📝 إحصاءات الأسئلة</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right font-bold">السؤال</th>
                      <th className="px-4 py-2 text-right font-bold">القسم</th>
                      <th className="px-4 py-2 text-right font-bold">القسم الفرعي</th>
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
                        <td className="px-4 py-2 text-right">{q.section}</td>
                        <td className="px-4 py-2 text-right">{q.subsection}</td>
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

          {/* إحصاءات الأقسام مع الرسم البياني (أسماء عربية) */}
          {aggregates.sArr && aggregates.sArr.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-primary mb-4">📚 إحصاءات الأقسام</h2>
              {aggregates.sArr.map((s, sIdx) => (
                <div key={sIdx} className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-3">{s.section}</h3>
                  <div className="overflow-x-auto mb-4">
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
                  {/* الرسم البياني */}
                  <BarChart subs={s.subs} />
                </div>
              ))}
            </div>
          )}

          {/* الأزرار */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 no-print clear-both">
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
    </>
  );
}
