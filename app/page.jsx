'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4 animate-pulse">
          Tajweedy
        </h1>
        <p className="text-xl text-white mb-8">
          منصة التدريب على تجويد القرآن الكريم
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link 
            href="/recitation"
            className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg"
          >
            ابدأ التلاوة
          </Link>

          <Link 
            href="/quiz"
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-green-700 transition-all"
          >
            اختبر معرفتك
          </Link>
        </div>

        <div className="mt-12 text-white text-sm">
          <p>تعلم قواعد التجويد بالذكاء الاصطناعي</p>
        </div>
      </div>
    </div>
  );
}
