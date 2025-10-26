'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl">
        <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 animate-pulse">
          Tajweedy
        </h1>
        
        <p className="text-2xl md:text-3xl text-white mb-4 font-semibold">
          التدريب التفاعلية على قواعد تجويد القرآن الكريم
        </p>
        
        <p className="text-xl mb-12 opacity-90 text-white">
          منصة شاملة باستخدام الذكاء الاصطناعي وتقارير تفصيلية
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link 
            href="/recitation"
            className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg transform hover:scale-105"
          >
            🎤 ابدأ التلاوة
          </Link>

          <Link 
            href="/quiz"
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-green-700 transition-all transform hover:scale-105"
          >
            📝 اختبر معرفتك
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-white">
          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-4xl mb-3">🕌</div>
            <h3 className="font-bold text-xl mb-2">قرآن كريم</h3>
            <p className="text-sm opacity-90">
              آيات عشوائية من القرآن الكريم بالرسم العثماني
            </p>
          </div>

          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="font-bold text-xl mb-2">ذكاء اصطناعي</h3>
            <p className="text-sm opacity-90">
              تحليل تلاوتك وتقييم الأداء تلقائياً
            </p>
          </div>

          <div className="bg-white bg-opacity-10 p-6 rounded-lg backdrop-blur-sm">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-xl mb-2">تقارير مفصلة</h3>
            <p className="text-sm opacity-90">
              رسوم بيانية وتحليل دقيق لنقاط القوة والضعف
            </p>
          </div>
        </div>

        <footer className="mt-16 text-white text-sm opacity-75">
          <p>منصة Tajweedy - تعلم التجويد بطريقة عصرية 🌟</p>
        </footer>
      </div>
    </div>
  );
}
