'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
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
          مُذيّب أحكام التجويد
        </h2>
        
        <p className="text-lg text-gray-600 text-center mb-10">
          تجربة تعليمية عملية
        </p>

        {/* Main Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link 
            href="/recitation"
            className="bg-white border-2 border-[#1e7850] text-[#1e7850] px-8 py-4 rounded-full font-bold text-lg hover:bg-[#1e7850] hover:text-white transition-all shadow-md text-center"
          >
            🎤 ابدأ التلاوة
          </Link>

          <Link 
            href="/quiz"
            className="bg-[#1e7850] border-2 border-[#1e7850] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-[#1e7850] transition-all shadow-md text-center"
          >
            📝 اختبر معرفتك
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 text-center">
            <div className="text-5xl mb-3">🕌</div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">قرآن كريم</h3>
            <p className="text-sm text-gray-600">
              آيات عشوائية من القرآن الكريم بالرسم العثماني
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl border border-blue-100 text-center">
            <div className="text-5xl mb-3">🤖</div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">ذكاء اصطناعي</h3>
            <p className="text-sm text-gray-600">
              تحليل تلاوتك وتقييم الأداء تلقائياً
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border border-purple-100 text-center">
            <div className="text-5xl mb-3">📊</div>
            <h3 className="font-bold text-xl text-gray-800 mb-2">تقارير مفصلة</h3>
            <p className="text-sm text-gray-600">
              رسوم بيانية وتحليل دقيق لنقاط القوة والضعف
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500 border-t border-gray-200 pt-6">
          <p>🌟 تعلم التجويد بطريقة عصرية - منصة Tajweedy</p>
          <p className="mt-2">© {new Date().getFullYear()} جميع الحقوق محفوظة</p>
        </footer>
      </div>
    </div>
  );
}
