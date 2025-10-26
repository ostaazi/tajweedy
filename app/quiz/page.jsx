'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QuizPage() {
  const [questionCount, setQuestionCount] = useState(10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-bold text-lg">
            ← العودة للرئيسية
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center text-blue-800 mb-8">
          اختبارات التجويد التفاعلية
        </h1>

        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            إعداد الاختبار
          </h2>

          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-700 mb-4 text-center">
              عدد الأسئلة: {questionCount}
            </label>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full h-4 bg-blue-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>5</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <button
            onClick={() => alert('الاختبار قيد التطوير!')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg text-xl"
          >
            ابدأ الاختبار
          </button>

          <div className="mt-8 bg-blue-50 p-6 rounded-lg text-center">
            <p className="text-gray-700 font-bold mb-2">بنك الأسئلة المخطط</p>
            <p className="text-gray-600">أكثر من 300 سؤال في قواعد التجويد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
