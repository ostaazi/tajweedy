'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function RecitationPage() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  useEffect(() => {
    fetchRandomVerse();
  }, []);

  const fetchRandomVerse = async () => {
    setLoading(true);
    setAudioBlob(null); // Reset recorded audio when fetching new verse
    
    try {
      // Get random surah (1-114)
      const randomSurah = Math.floor(Math.random() * 114) + 1;
      const response = await fetch(`https://api.alquran.cloud/v1/surah/${randomSurah}/ar.alafasy`);
      const data = await response.json();
      
      if (data.status === 'OK') {
        const ayahs = data.data.ayahs;
        // Get random ayah from the surah
        const randomAyah = ayahs[Math.floor(Math.random() * ayahs.length)];
        
        setVerse({
          text: randomAyah.text,
          surah: data.data.name,
          surahEnglish: data.data.englishName,
          number: randomAyah.numberInSurah,
          audio: randomAyah.audio
        });
      }
    } catch (error) {
      console.error('خطأ في جلب الآية:', error);
      // Fallback to a default verse if API fails
      setVerse({
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        surah: 'الفاتحة',
        surahEnglish: 'Al-Fatihah',
        number: 1,
        audio: null
      });
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Auto-stop after 30 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('خطأ في تسجيل الصوت:', error);
      alert('لم نتمكن من الوصول إلى الميكروفون. يرجى التأكد من منح الأذونات.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Link href="/" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2">
            <span>←</span> العودة للرئيسية
          </Link>
          <div className="w-12 h-12 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">
            قسم التلاوة والتدريب
          </h1>
        </div>

        {/* Main Card */}
        {loading ? (
          <div className="bg-white p-12 rounded-3xl shadow-lg border border-gray-100 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">جاري تحميل آية جديدة...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6">
            {/* Surah Info */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1">
                {verse?.surah}
              </h2>
              <p className="text-gray-600">الآية {verse?.number}</p>
            </div>

            {/* Quranic Text */}
            <div className="quran-text bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 mb-6 shadow-inner">
              {verse?.text}
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4">
              <button
                onClick={fetchRandomVerse}
                className="bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold hover:bg-[#155c3e] transition-all shadow-md"
              >
                🔄 آية جديدة
              </button>

              {verse?.audio && (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2 text-center">استمع للتلاوة الصحيحة:</p>
                  <audio controls className="w-full rounded-full">
                    <source src={verse.audio} type="audio/mpeg" />
                  </audio>
                </div>
              )}

              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`${
                  isRecording 
                    ? 'bg-red-500 animate-pulse' 
                    : 'bg-white border-2 border-[#1e7850] text-[#1e7850] hover:bg-[#1e7850] hover:text-white'
                } px-6 py-4 rounded-full font-bold transition-all shadow-md`}
              >
                {isRecording ? '⏹ إيقاف التسجيل' : '🎤 ابدأ التسجيل'}
              </button>

              {audioBlob && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                  <p className="text-sm text-blue-700 mb-2 text-center font-semibold">✅ تم التسجيل بنجاح!</p>
                  <audio controls className="w-full rounded-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  </audio>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    💡 ميزة تحليل الصوت بالذكاء الاصطناعي ستكون متاحة قريباً
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            {!audioBlob && (
              <div className="mt-6 bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg">
                <p className="text-sm text-gray-700">
                  💡 <strong>ملاحظة:</strong> حالياً يمكنك تسجيل صوتك. ميزة تحليل التلاوة بالذكاء الاصطناعي قيد التطوير.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">كيفية الاستخدام</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-100">
              <span className="text-3xl">1️⃣</span>
              <p className="text-gray-700">اقرأ الآية المعروضة بالرسم العثماني</p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100">
              <span className="text-3xl">2️⃣</span>
              <p className="text-gray-700">استمع للتلاوة الصحيحة من القراء المعتمدين</p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100">
              <span className="text-3xl">3️⃣</span>
              <p className="text-gray-700">سجّل تلاوتك بالضغط على زر التسجيل</p>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-orange-50 to-white rounded-xl border border-orange-100">
              <span className="text-3xl">4️⃣</span>
              <p className="text-gray-700">احصل على تقرير تفصيلي (قريباً)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
