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

// دالة لترجمة الأقسام الرئيسية للعرض فقط
function getArabicSectionName(englishName) {
  const map = {
    'noon_tanween': 'أحكام النون الساكنة والتنوين',
    'lam_sakinah': 'أحكام اللام الساكِنة',
    'meem_sakinah': 'أحكام الميم الساكِنة',
    'meem_maddah': 'أحكام الميم الممدودة',
    'qalqalah': 'حكم القلقلة',
    'madd': 'أنواع المد',
    'ghunnah': 'حكم الغنّة',
    'idgham': 'أحكام الإدغام',
    'ikhfa': 'أحكام الإخفاء',
    'iqlab': 'حكم الإقلاب',
    'izhar': 'حكم الإظهار',
    'stopping': 'أحكام الوقف',
  };
  return map[englishName] || englishName;
}

// دالة لترجمة الأجزاء الفرعية للعرض فقط
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
    'madd_lin': 'مد لين',
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
    'madd_munfasil': 'مد منفصل',
    'madd_muttasil': 'مد متصل',
    'idhar_shafawi': 'إظهار شفوي',
    'madd_lazim': 'مد لازم',
    'madd_wajib': 'مد واجب',
    'madd_jaiz': 'مد جائز',
    'madd_arid': 'مد عارض للسكون',
    'madd_silah': 'مد صلة',
    'madd_badal': 'مد بدل',
    'madd_iwad': 'مد عوض',
    'madd_tamkin': 'مد تمكين',
    'madd_farq': 'مد فرق',
    'idgham_mutamatthil': 'إدغام متماثل',
    'idgham_mutajannis': 'إدغام متجانس',
    'idgham_mutaqarib': 'إدغام متقارب',
    'idgham_kamil': 'إدغام كامل',
    'idgham_naqis': 'إدغام ناقص',
    'ikhfa_haqiqi': 'إخفاء حقيقي',
    'izhar_halqi': 'إظهار حلقي',
    'qalqalah_sughra': 'قلقلة صغرى',
    'qalqalah_kubra': 'قلقلة كبرى',
    'tafkhim': 'تفخيم',
    'tarqiq': 'ترقيق',
    'imalah': 'إمالة',
    'ishmam': 'إشمام',
    'rawm': 'روم',
    'sakt': 'سكت',
    'waqf': 'وقف',
    'ibtida': 'ابتداء',
    'mad_sila_kubra': 'مد صلة كبرى',
    'mad_sila_sughra': 'مد صلة صغرى',
  };
  return map[englishName] || englishName;
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

/* ======================= أيقونات + استايل الأزرار (مثل صفحة النتيجة) ======================= */

function IconHome({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10.5V20h5v-4h4v4h5v-9.5" />
    </svg>
  );
}

function IconBack({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function IconPrint({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9V4h12v5" />
      <rect x="6" y="14" width="12" height="6" rx="1" />
      <path d="M6 11H5a2 2 0 0 0-2 2v3h3" />
      <path d="M18 11h1a2 2 0 0 1 2 2v3h-3" />
    </svg>
  );
}

function IconDownload({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

function IconShare({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 11l8-4" />
      <path d="M8 13l8 4" />
    </svg>
  );
}

function IconPhoneQr({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M10 6h1v1h-1zM13 6h1v1h-1zM10 9h1v1h-1zM13 9h1v1h-1z" />
      <path d="M11 18h2" />
    </svg>
  );
}

function IconRefresh({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4v6h6" />
      <path d="M20 20v-6h-6" />
      <path d="M5.5 18A7 7 0 0 0 18 18.5" />
      <path d="M18.5 5A7 7 0 0 0 6 5.5" />
    </svg>
  );
}

/* أيقونات جديدة (SVG) للعناوين والحكم النهائي */

function IconReportStats({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="3" height="9" rx="1" fill="#16a34a" />
      <rect x="9" y="7" width="3" height="13" rx="1" fill="#0ea5e9" />
      <rect x="15" y="4" width="3" height="16" rx="1" fill="#f97316" />
      <rect x="2.5" y="3.5" width="19" height="17" rx="2" fill="none" stroke="#065f46" strokeWidth="1.4" />
    </svg>
  );
}

function IconQuestionStats({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="3"
        width="11"
        height="18"
        rx="1.8"
        fill="#e5f4ff"
        stroke="#0f766e"
        strokeWidth="1.4"
      />
      <path
        d="M8 7h7M8 10h5M8 13h4"
        fill="none"
        stroke="#0f766e"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M14 15.5l2.5 4.5 2-1.2"
        fill="none"
        stroke="#ea580c"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSectionStats({ className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="5" width="15" height="4" rx="1" fill="#22c55e" />
      <rect x="4" y="9" width="15" height="4" rx="1" fill="#0ea5e9" />
      <rect x="5" y="13" width="15" height="4" rx="1" fill="#f97316" />
      <path
        d="M6 5v-1.5a1 1 0 0 1 1-1h13"
        fill="none"
        stroke="#064e3b"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconVerdictExcellent({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="10" r="6" fill="#22c55e" />
      <path
        d="M9.5 10.2l1.4 1.6 3.2-3.4"
        fill="none"
        stroke="#ecfdf5"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 14.5l-1 5 2.5-1.4L12 20l2-1.9L16.5 19l-1-4.6"
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconVerdictGood({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 13h2.5a2 2 0 0 0 1.9-1.3L10.5 8l3.2 7H17a2 2 0 0 0 2-2.1L18.6 7a2 2 0 0 0-2-1.7h-3.8"
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="11"
        width="2"
        height="7"
        rx="0.8"
        fill="#bbf7d0"
        stroke="#16a34a"
        strokeWidth="1.3"
      />
    </svg>
  );
}

function IconVerdictReview({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="14"
        height="16"
        rx="1.6"
        fill="#eef2ff"
        stroke="#4f46e5"
        strokeWidth="1.4"
      />
      <path
        d="M7.5 9h7M7.5 12h4"
        fill="none"
        stroke="#4f46e5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle
        cx="17.5"
        cy="17.5"
        r="3.5"
        fill="none"
        stroke="#4f46e5"
        strokeWidth="1.4"
      />
      <path
        d="M19.7 19.7 21 21"
        fill="none"
        stroke="#4f46e5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* استايل الأزرار الزجاجية نفسه من صفحة النتيجة */

const glassPrimary =
  'group relative flex-1 overflow-hidden rounded-2xl border border-emerald-400 bg-white/20 backdrop-blur-sm px-5 py-3 md:py-4 text-sm md:text-base font-semibold text-emerald-800 shadow-sm hover:shadow-lg hover:bg-white/40 transition-all duration-200';

const glassSecondary =
  'group relative flex-1 overflow-hidden rounded-2xl border border-slate-300 bg-white/20 backdrop-blur-sm px-5 py-3 md:py-4 text-sm md:text-base font-semibold text-slate-800 shadow-sm hover:shadow-lg hover:bg-white/40 transition-all duration-200';

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
          section: sKey,
          subsection: subKey,
          right: 0, 
          wrong: 0, 
          total: 0 
        };
      }
      qMap[qKey].total++;
      if (r.correct) qMap[qKey].right++; else qMap[qKey].wrong++;

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
      ...s,
      subs: Object.values(s.subs || {}).map(sub => ({
        ...sub,
        pct: sub.total ? Math.round((sub.right / sub.total) * 100) : 0
      })).filter(sub => sub.total > 0)
    })).filter(s => s.total > 0);

    return { qArr, sArr };
  }, [attempt]);

  // تحميل المحاولة + اسم المتدرّب (نفس منطق صفحة النتيجة تقريباً)
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const storedName = localStorage.getItem('tajweedy_trainee_name') || '';

    let traineeName =
      (storedName && String(storedName).trim()) ||
      (userData.name && String(userData.name).trim()) ||
      'اسم المتدرب';

    if (!attemptId) {
      setUser({ name: traineeName });
      setLoading(false);
      return;
    }

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    const found = attempts.find(
      a => String(a?.id) === String(attemptId) || Number(a?.id) === Number(attemptId)
    );

    if (found && found.traineeName && String(found.traineeName).trim()) {
      traineeName = String(found.traineeName).trim();
    }

    setUser({ name: traineeName });

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
          letterRendering: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('❌ PDF Error:', error);
      alert('❌ حدث خطأ أثناء التصدير');
    }
  };

  // دالة الرسم البياني المحدّثة - التعديل النهائي
  const BarChart = ({ subs }) => {
    if (!subs || subs.length === 0) return null;

    const maxValue = Math.max(...subs.map(sub => Math.max(sub.right, sub.wrong)), 1);
    
    const barWidth = 30;
    const spacing = 0;
    const groupWidth = (barWidth * 2) + spacing;
    
    const leftMargin = 70;
    const rightMargin = 100;
    const bottomMargin = 150;
    const topMargin = 40;
    
    const availableWidth = 1000;
    const chartWidth = availableWidth;
    const plotWidth = chartWidth - leftMargin - rightMargin;
    
    const groupSpacing = plotWidth / subs.length;
    
    const chartHeight = 300;
    const plotHeight = chartHeight - topMargin - bottomMargin;

    const yAxisSteps = Math.min(maxValue, 5);
    const yAxisMax = maxValue;
    const yAxisInterval = Math.ceil(yAxisMax / yAxisSteps);

    return (
      <div className="mt-6 w-full">
        <svg 
          width="100%" 
          height={chartHeight + bottomMargin} 
          viewBox={`0 0 ${chartWidth} ${chartHeight + bottomMargin}`} 
          className="bg-gray-50 rounded-lg p-4 block mx-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* المحاور */}
          <line 
            x1={leftMargin} 
            y1={topMargin + plotHeight} 
            x2={leftMargin + plotWidth} 
            y2={topMargin + plotHeight} 
            stroke="#374151" 
            strokeWidth="2" 
          />
          <line 
            x1={leftMargin} 
            y1={topMargin + plotHeight} 
            x2={leftMargin} 
            y2={topMargin} 
            stroke="#374151" 
            strokeWidth="2" 
          />

          {/* تسمية المحور الرأسي */}
          <text 
            x={leftMargin - 50} 
            y={topMargin + plotHeight / 2} 
            fontSize="14" 
            fill="#374151" 
            textAnchor="middle"
            transform={`rotate(-90 ${leftMargin - 50} ${topMargin + plotHeight / 2})`}
            fontWeight="bold"
          >
            عدد الأسئلة
          </text>

          {/* تسمية المحور الأفقي */}
          <text 
            x={leftMargin + plotWidth / 2} 
            y={topMargin + plotHeight + bottomMargin - 10} 
            fontSize="14" 
            fill="#374151" 
            textAnchor="middle"
            fontWeight="bold"
          >
            القسم الفرعي
          </text>

          {/* ترقيم المحور الرأسي */}
          {Array.from({ length: yAxisSteps + 1 }).map((_, i) => {
            const value = i * yAxisInterval;
            const y = topMargin + plotHeight - (value / yAxisMax) * plotHeight;
            
            if (value > yAxisMax) return null;
            
            return (
              <g key={i}>
                <line
                  x1={leftMargin}
                  y1={y}
                  x2={leftMargin + plotWidth}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={leftMargin - 10}
                  y={y + 5}
                  fontSize="12"
                  fill="#374151"
                  textAnchor="end"
                >
                  {toEnglishDigits(Math.round(value))}
                </text>
              </g>
            );
          })}

          {/* الأعمدة والتسميات */}
          {subs.map((sub, idx) => {
            const centerX = leftMargin + (idx + 0.5) * groupSpacing;
            const xGreen = centerX - groupWidth / 2;
            const xRed = xGreen + barWidth;
            
            const greenHeight = (sub.right / yAxisMax) * plotHeight;
            const redHeight = (sub.wrong / yAxisMax) * plotHeight;

            return (
              <g key={idx}>
                {/* العمود الأخضر */}
                <rect
                  x={xGreen}
                  y={topMargin + plotHeight - greenHeight}
                  width={barWidth}
                  height={Math.max(greenHeight, 2)}
                  fill={COLORS.correct}
                  rx="3"
                />
                {sub.right > 0 && (
                  <text
                    x={xGreen + barWidth / 2}
                    y={topMargin + plotHeight - greenHeight - 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={COLORS.correct}
                  >
                    {toEnglishDigits(sub.right)}
                  </text>
                )}
                
                {/* العمود الأحمر */}
                <rect
                  x={xRed}
                  y={topMargin + plotHeight - redHeight}
                  width={barWidth}
                  height={Math.max(redHeight, 2)}
                  fill={COLORS.wrong}
                  rx="3"
                />
                {sub.wrong > 0 && (
                  <text
                    x={xRed + barWidth / 2}
                    y={topMargin + plotHeight - redHeight - 5}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="bold"
                    fill={COLORS.wrong}
                  >
                    {toEnglishDigits(sub.wrong)}
                  </text>
                )}

                {/* تسمية القسم الفرعي */}
                <text 
                  x={centerX} 
                  y={topMargin + plotHeight + 45} 
                  textAnchor="start"
                  fontSize="14" 
                  fill="#374151"
                  transform={`rotate(-45 ${centerX} ${topMargin + plotHeight + 45})`}
                  fontWeight="500"
                >
                  {getArabicSubsectionName(sub.subsection)}
                </text>
              </g>
            );
          })}

          {/* دليل الألوان */}
          <g transform={`translate(${chartWidth - rightMargin}, ${topMargin + 10})`}>
            {(() => {
              const BOX = 16;
              const GAP = 8;
              return (
                <>
                  {/* صواب */}
                  <rect x="0" y="0" width={BOX} height={BOX} fill={COLORS.correct} rx="3" />
                  <text
                    x={-4*GAP} y={13}
                    fontSize="12" fill="#374151" fontWeight="600"
                    textAnchor="end"
                    direction="rtl"
                    unicodeBidi="bidi-override"
                  >
                    صواب
                  </text>

                  {/* خطأ */}
                  <rect x="0" y="25" width={BOX} height={BOX} fill={COLORS.wrong} rx="3" />
                  <text
                    x={-3*GAP} y={38}
                    fontSize="12" fill="#374151" fontWeight="600"
                    textAnchor="end"
                    direction="rtl"
                    unicodeBidi="bidi-override"
                  >
                    خطأ
                  </text>
                </>
              );
            })()}
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
            <Link
              href="/"
              className={glassSecondary + ' max-w-[200px]'}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconHome />
                <span>الرئيسية</span>
              </span>
            </Link>
            <Link
              href="/quiz"
              className={glassPrimary + ' max-w-[200px]'}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconRefresh />
                <span>اختبار جديد</span>
              </span>
            </Link>
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

  // حكم النتيجة مع أيقونات SVG بدل الإيموجي
  let verdictLabel = 'يحتاج مراجعة';
  let VerdictIcon = IconVerdictReview;
  if (percentage >= 80) {
    verdictLabel = 'ممتاز!';
    VerdictIcon = IconVerdictExcellent;
  } else if (percentage >= 60) {
    verdictLabel = 'جيد';
    VerdictIcon = IconVerdictGood;
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap');
        
        * {
          font-family: 'Cairo', sans-serif !important;
        }

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

        .signature-block {
          position: relative;
          margin-top: 40px;
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

          table { direction: rtl; }
          svg text { direction: rtl; unicode-bidi: embed; }

          :root {
            --sig-block-h: 35mm;
            --sig-bottom-safe-gap: 10mm;
            --sig-offset-from-top: calc(297mm - 15mm - var(--sig-block-h) - var(--sig-bottom-safe-gap));
          }

          .signature-block {
            position: static !important;
            break-before: page;
            page-break-before: always;
            margin-top: var(--sig-offset-from-top);
            margin-left: 0;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .signature-block img {
            width: 45mm;
            height: auto;
          }

          .signature-block hr {
            border: 0;
            border-top: 1.5px solid #4B5563;
            width: 45mm;
            margin: 0 0 2mm 0;
          }

          .signature-block span {
            color: #1F2937 !important;
            font-weight: 600 !important;
            font-size: 11pt !important;
            filter: none !important;
          }
        }
      `}</style>

      <div className="watermark-bg"></div>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8 relative z-10" dir="rtl">
        <div id="report-content" className="max-w-6xl mx-auto">
          
          <div className="text-center mb-6">
            <div className="mb-3 text-center" dir="rtl">
              <img
                src="/logo.png"
                alt="Tajweedy Logo"
                width={96}
                height={96}
                className="w-24 h-24 mx-auto block object-contain"
              />
            </div>
            <p className="text-lg font-bold text-primary">التجويد الذكي</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 float-right text-right w-full" dir="rtl">
            <p className="text-lg text-gray-600 mb-2">
              <strong>نوع الاختبار:</strong> {examTypeArabic}
            </p>

            <p className="text-lg text-gray-600 mb-2">
              <strong>كود الاختبار:</strong> {examCode}
            </p>

            <p className="text-base text-primary text-right">
              <strong className="ml-2">تاريخ الاختبار:</strong>
              <span dir="rtl" className="inline-block">{toEnglishDigits(examDate)}</span>
            </p>
          </div>

          {/* أزرار أعلى الصفحة (رجوع / الرئيسية) بنفس استايل صفحة النتيجة */}
          <div className="flex items-center justify-between mb-4 no-print clear-both">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/quiz/result?id=${attemptId}`}
                className={glassSecondary + ' max-w-[200px]'}
              >
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  <IconBack />
                  <span>رجوع إلى النتيجة</span>
                </span>
              </Link>
              <Link
                href="/"
                className={glassSecondary + ' max-w-[180px]'}
              >
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  <IconHome />
                  <span>الرئيسية</span>
                </span>
              </Link>
            </div>
          </div>

          {/* عنوان التقرير الكامل مع أيقونة SVG */}
          <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-6">
            <span className="inline-flex items-center gap-2 justify-center">
              <IconReportStats className="w-7 h-7" />
              <span>التقرير الكامل</span>
            </span>
          </h1>

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
              <span className="inline-flex items-center gap-2 justify-center">
                <VerdictIcon />
                <span>{verdictLabel}</span>
              </span>
            </p>
            <p className="text-gray-600 mt-2">
              {toEnglishDigits(score)} / {toEnglishDigits(total)}
            </p>
          </div>

          {qrDataUrl && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 text-center">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center justify-center gap-2">
                <IconPhoneQr />
                <span>رمز الاستجابة السريع</span>
              </h2>
              <img src={qrDataUrl} alt="QR Code" className="mx-auto w-48 h-48" crossOrigin="anonymous" />
              <p className="text-gray-600 mt-3 text-sm">امسح للوصول إلى التقرير</p>
            </div>
          )}

          {aggregates.qArr && aggregates.qArr.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                <span className="inline-flex items-center gap-2">
                  <IconQuestionStats />
                  <span>إحصاءات الأسئلة</span>
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-right font-bold">السؤال</th>
                      <th className="px-4 py-2 text-right font-bold">القسم</th>
                      <th className="px-4 py-2 text-right font-bold">القسم الفرعي</th>
                      <th className="px-4 py-2 text-right font-bold">صواب</th>
                      <th className="px-4 py-2 text-right font-bold">خطأ</th>
                      <th className="px-4 py-2 text-right font-bold">إجمالي</th>
                      <th className="px-4 py-2 text-right font-bold">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregates.qArr.map((q, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 text-right">{q.question}</td>
                        <td className="px-4 py-2 text-right">{getArabicSectionName(q.section)}</td>
                        <td className="px-4 py-2 text-right">{getArabicSubsectionName(q.subsection)}</td>
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

          {aggregates.sArr && aggregates.sArr.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-primary mb-4">
                <span className="inline-flex items-center gap-2">
                  <IconSectionStats />
                  <span>إحصاءات الأقسام</span>
                </span>
              </h2>
              {aggregates.sArr.map((s, sIdx) => (
                <div key={sIdx} className="mb-8">
                  <h3 className="text-xl font-bold text-primary mb-3">{getArabicSectionName(s.section)}</h3>
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-full table-auto">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-right font-bold">القسم الفرعي</th>
                          <th className="px-4 py-2 text-right font-bold">صواب</th>
                          <th className="px-4 py-2 text-right font-bold">خطأ</th>
                          <th className="px-4 py-2 text-right font-bold">إجمالي</th>
                          <th className="px-4 py-2 text-right font-bold">النسبة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.subs && s.subs.length > 0 ? (
                          s.subs.map((sub, subIdx) => (
                            <tr key={subIdx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-2 text-right">{getArabicSubsectionName(sub.subsection)}</td>
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
                            <span className={`font-bold ${Math.round((s.right / s.total) * 100) >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                              {toEnglishDigits(Math.round((s.right / s.total) * 100))}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <BarChart subs={s.subs} />
                </div>
              ))}
            </div>
          )}

          {/* الأزرار السفلية بنفس استايل صفحة النتيجة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 no-print clear-both">
            <button
              onClick={handleExportPDF}
              className={glassPrimary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconDownload />
                <span>تصدير PDF</span>
              </span>
            </button>

            <button
              onClick={() => window.print()}
              className={glassSecondary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconPrint />
                <span>طباعة</span>
              </span>
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
              className={glassPrimary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconShare />
                <span>مشاركة التقرير</span>
              </span>
            </button>

            <Link
              href="/"
              className={glassSecondary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconHome />
                <span>الرئيسية</span>
              </span>
            </Link>
          </div>

          {/* توقيع المدرب */}
          <div className="signature-block mr-auto max-w-[220px]">
            <div className="inline-flex flex-col items-center text-center">
              <hr className="w-40 border-gray-600 mb-2 mx-auto" />
              <span
                className="text-gray-800 font-semibold text-sm text-center"
                style={{ filter: 'drop-shadow(0.5px 0.5px 0.8px rgba(0,0,0,0.15))' }}
              >
                مدرب التجويد
              </span>
              <img
                src="/tareq_signature.png"
                alt="توقيع مدرب التجويد"
                className="mt-1 w-40 h-auto mx-auto"
                onError={(e) => { e.currentTarget.style.opacity = '0.3'; e.currentTarget.alt = 'لم يتم العثور على التوقيع'; }}
              />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
