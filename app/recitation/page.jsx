'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RecitationPage() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    fetchRandomVerse();
  }, []);

  const fetchRandomVerse = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.alquran.cloud/v1/ayah/random/ar.alafasy');
      const data = await response.json();
      setVerse({
        text: data.data.text,
        surah: data.data.surah.name,
        number: data.data.numberInSurah,
        audio: data.data.audio
      });
    } catch (error) {
      console.error('خطأ في جلب الآية:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => setIsRecording(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-12 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <Link href="/" className="text-green-600 hover:text-green-800 font-bold">
            ← العودة للرئيسية
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-center text-green-800 mb-8">
          قسم التلاوة والتدريب
        </h1>

        {loading ? (
          <div className="bg-white p-12 rounded-xl shadow-lg text-center">
            <div className="text-2xl text-gray-600">جاري تحميل الآية...</div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-gray-700 mb-4 text-center">
              {verse?.surah} - الآية {verse?.number}
            </h2>
            <div className="quran-text text-3xl leading-relaxed mb-6 p-6 bg-green-50 rounded-lg text-center" style={{fontFamily: 'Amiri, serif'}}>
              {verse?.text}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={fetchRandomVerse}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition-all"
              >
                آية جديدة
              </button>

              {verse?.audio && (
                <audio controls className="w-full">
                  <source src={verse.audio} type="audio/mpeg" />
                </audio>
              )}

              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`${
                  isRecording ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                } text-white px-6 py-3 rounded-lg font-bold transition-all`}
              >
                {isRecording ? '⏺ جاري التسجيل...' : '🎤 ابدأ التسجيل'}
              </button>

              <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-gray-700">
                  💡 <strong>ملاحظة:</strong> ميزة تحليل الصوت بالذكاء الاصطناعي ستكون متاحة قريباً. حالياً يمكنك الاستماع للتلاوة الصحيحة والتدريب عليها.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">كيفية الاستخدام</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-2xl ml-3">1️⃣</span>
              <span>اقرأ الآية المعروضة بالرسم العثماني</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">2️⃣</span>
              <span>استمع للتلاوة الصحيحة من القارئ الشيخ مشاري العفاسي</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">3️⃣</span>
              <span>اضغط زر التسجيل وقم بتلاوة الآية</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl ml-3">4️⃣</span>
              <span>احصل على تقرير تفصيلي عن أدائك (قريباً)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
