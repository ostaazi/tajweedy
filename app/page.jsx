'use client';

import Link from 'next/link';
import Image from 'next/image';

/* ======================= أيقونات SVG حديثة ======================= */

function IconMic({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="9"
        y="4"
        width="6"
        height="10"
        rx="3"
        fill="#22c55e"
      />
      <path
        d="M7 10a5 5 0 0 0 10 0"
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 15v3.2"
        fill="none"
        stroke="#065f46"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M9 18.5h6"
        fill="none"
        stroke="#065f46"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconQuiz({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="14"
        height="18"
        rx="2"
        fill="#1d4ed8"
        opacity="0.08"
      />
      <rect
        x="4"
        y="3"
        width="14"
        height="18"
        rx="2"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="1.5"
      />
      <path
        d="M8 8a3 3 0 0 1 5.6-1.5c.6.9.4 2.1-.4 2.8l-1.1.9A1.6 1.6 0 0 0 11.5 12v.5"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11.5" cy="16.5" r="0.8" fill="#1d4ed8" />
    </svg>
  );
}

function IconQuran({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className + ' mx-auto'}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="15"
        height="18"
        rx="2"
        fill="#dcfce7"
        stroke="#166534"
        strokeWidth="1.4"
      />
      <path
        d="M8 7.5h7.5M8 10.5h7.5"
        fill="none"
        stroke="#166534"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M10.5 14.5l1.5-1.3 1.5 1.3-1.5 1.5-1.5-1.5z"
        fill="#16a34a"
      />
    </svg>
  );
}

function IconAIChip({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className + ' mx-auto'}
      aria-hidden="true"
    >
      <rect
        x="7"
        y="7"
        width="10"
        height="10"
        rx="2"
        fill="#e0f2fe"
        stroke="#0369a1"
        strokeWidth="1.4"
      />
      <path
        d="M9.5 10.5h5M9.5 13.5h3"
        fill="none"
        stroke="#0369a1"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M4 9h2M4 12h2M4 15h2M18 9h2M18 12h2M18 15h2M9 4v2M12 4v2M15 4v2M9 18v2M12 18v2M15 18v2"
        fill="none"
        stroke="#0369a1"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* أيقونة مراجعة بنك الأسئلة */
function IconReview({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className + ' mx-auto'}
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        fill="#eef2ff"
        stroke="#4f46e5"
        strokeWidth="1.4"
      />
      <path
        d="M8 8h8M8 11h5M8 14h4"
        fill="none"
        stroke="#4f46e5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M15 14.5l1.6 1.6 2.4-2.4"
        fill="none"
        stroke="#22c55e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReportStats({ className = 'w-10 h-10' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className + ' mx-auto'}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="3" height="9" rx="1" fill="#22c55e" />
      <rect x="9" y="7" width="3" height="13" rx="1" fill="#0ea5e9" />
      <rect x="15" y="4" width="3" height="16" rx="1" fill="#f97316" />
      <rect
        x="2.5"
        y="3.5"
        width="19"
        height="17"
        rx="2"
        fill="none"
        stroke="#065f46"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function IconStar({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 4.5l1.9 3.8 4.2.6-3 3 0.7 4.3L12 14.7 8.2 16.2 9 11.9 6 8.9l4.2-.6L12 4.5z"
        fill="#eab308"
        stroke="#a16207"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ======================= استايل الأزرار الزجاجية (نفس صفحة التقرير) ======================= */

const glassPrimary =
  'group relative flex-1 overflow-hidden rounded-full border border-emerald-400 bg-white/20 backdrop-blur-sm px-8 py-4 text-lg font-bold text-emerald-800 shadow-md hover:shadow-lg hover:bg-white/40 transition-all duration-200 text-center';

const glassSecondary =
  'group relative flex-1 overflow-hidden rounded-full border border-slate-300 bg-white/40 backdrop-blur-sm px-8 py-4 text-lg font-bold text-slate-800 shadow-md hover:shadow-lg hover:bg-white/70 transition-all duration-200 text-center';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 bg-gradient-to-br from-green-50 to-teal-50">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 md:w-40 md:h-40 relative">
            <Image 
              src="/logo.png" 
              alt="Tajweedy Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-[#1e7850] text-center mb-3">
          Tajweedy
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-700 text-center mb-3">
          مُدرّب أحكام التجويد
        </h2>
        
        <p className="text-lg text-gray-600 text-center mb-10">
          تجربة تعليمية عملية
        </p>

        {/* Main Buttons (نفس استايل الأزرار الزجاجية) */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/recitation"
            className={glassSecondary}
          >
            <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative inline-flex items-center justify-center gap-2">
              <IconMic />
              <span>ابدأ التلاوة</span>
            </span>
          </Link>

          <Link 
            href="/quiz"
            className={glassPrimary}
          >
            <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative inline-flex items-center justify-center gap-2">
              <IconQuiz />
              <span>اختبر معرفتك</span>
            </span>
          </Link>
        </div>

        {/* Features Grid مع جعل جميع البلوكات بنفس تأثير بلوك المراجعة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {/* بلوك القرآن → صفحة التلاوة */}
          <Link
            href="/recitation"
            className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 text-center block hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <IconQuran />
            <h3 className="font-bold text-xl text-gray-800 mb-2 mt-2">قرآن كريم</h3>
            <p className="text-sm text-gray-600">
              آيات متنوعة من القرآن الكريم بالرسم العثماني
            </p>
          </Link>

          {/* بلوك مراجعة بنك الأسئلة */}
          <Link
            href="/review"
            className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 text-center block hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <IconReview />
            <h3 className="font-bold text-xl text-gray-800 mb-2 mt-2">
              مراجعة بنك الأسئلة
            </h3>
            <p className="text-sm text-gray-600">
              مراجعة أسئلة بنك التجويد وتحريرها وتنظيمها
            </p>
          </Link>

          {/* بلوك التقارير → صفحة الاختبار */}
          <Link
            href="/quiz"
            className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 text-center block hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
          >
            <IconReportStats />
            <h3 className="font-bold text-xl text-gray-800 mb-2 mt-2">تقارير مفصلة</h3>
            <p className="text-sm text-gray-600">
              إحصاءات وتحليل دقيق لنقاط القوة والضعف
            </p>
          </Link>
        </div>

        {/* Footer مع أيقونة SVG بدل الإيموجي */}
        <footer className="mt-12 text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
          <p className="flex items-center justify-center gap-2">
            <IconStar />
            <span>تعلم التجويد بطريقة عصرية - منصة Tajweedy</span>
          </p>
          <p className="mt-2">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
        </footer>
      </div>
    </div>
  );
}
