'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QuizPage() {
  const [questionCount, setQuestionCount] = useState(10);
  const [quizStarted, setQuizStarted] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-bold">
            ← العودة للرئيسية
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
          اختبارات التجويد التفاعلية
        </h1>

        {!quizStarted ? (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">إعداد الاختبار</h2>
            
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                اختر عدد الأسئلة: {questionCount}
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>5 أسئلة</span>
                <span>50 سؤال</span>
                <span>100 سؤال</span>
              </div>
            </div>

            <button
              onClick={() => setQuizStarted(true)}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-xl hover:bg-blue-700 transition-all shadow-lg"
            >
              ابدأ الاختبار
            </button>

            <div className="mt-8 bg-blue-50 border-r-4 border-blue-400 p-6 rounded">
              <h3 className="font-bold text-blue-800 mb-3">📚 بنك الأسئلة</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• أحكام النون الساكنة والتنوين (الإظهار، الإدغام، الإخفاء، الإقلاب)</li>
                <li>• أحكام الميم الساكنة</li>
                <li>• أحكام المدود</li>
                <li>• المجموع: أكثر من 300 سؤال</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                جاري تحضير الاختبار...
              </h2>
              <p className="text-gray-600 mb-6">
                سيتم توليد {questionCount} سؤال عشوائي من بنك الأسئلة
              </p>
              <div className="animate-pulse bg-blue-100 h-4 rounded-full mb-4"></div>
              <p className="text-sm text-gray-500">
                💡 ميزة الاختبارات الكاملة ستكون متاحة بعد إضافة بنك الأسئلة
              </p>
              <button
                onClick={() => setQuizStarted(false)}
                className="mt-6 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                العودة للإعداد
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">المميزات القادمة</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-2xl ml-3">✅</span>
              <span>أسئلة عشوائية متوازنة من جميع الفئات</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">✅</span>
              <span>عرض النتائج في رسوم بيانية دائرية (Donut Charts)</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">✅</span>
              <span>تقرير تفصيلي لكل سؤال مع الشرح</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">✅</span>
              <span>تدريبات علاجية تلقائية بناءً على نقاط الضعف</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">✅</span>
              <span>حفظ سجل المحاولات وتتبع التقدم</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
