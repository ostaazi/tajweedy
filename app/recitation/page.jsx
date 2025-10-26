'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const RECITERS = [
  { id: 0, name: 'اسم القارئ', subtext: 'غير محدد (عشوائي)', reciterId: null },
  { id: 1, name: 'مشاري العفاسي', subtext: null, reciterId: 7 },
  { id: 2, name: 'عبد الباسط عبد الصمد', subtext: null, reciterId: 1 },
  { id: 3, name: 'عبد الرحمن السديس', subtext: null, reciterId: 9 },
  { id: 4, name: 'محمد صديق المنشاوي', subtext: null, reciterId: 3 },
  { id: 5, name: 'محمود خليل الحصري', subtext: null, reciterId: 2 },
  { id: 6, name: 'أبو بكر الشاطري', subtext: null, reciterId: 5 },
];

export default function RecitationPage() {
  const [verse, setVerse] = useState(null);
  const [words, setWords] = useState([]);
  const [wordTimings, setWordTimings] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [currentPlayingWordIndex, setCurrentPlayingWordIndex] = useState(-1);

  const [selectedReciter, setSelectedReciter] = useState(0);
  const [selectedSurah, setSelectedSurah] = useState(0);
  const [selectedAyah, setSelectedAyah] = useState(0);
  const [availableAyahs, setAvailableAyahs] = useState([]);

  const audioRef = useRef(null);
  const highlightTimerRef = useRef(null);

  useEffect(() => {
    fetchSurahs();
    fetchVerse();
  }, []);

  const fetchSurahs = async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/meta');
      const data = await response.json();
      const surahsList = [
        { id: 0, name: 'اسم السورة', subtext: 'غير محدد (عشوائي)', verses_count: 0 },
        ...data.data.surahs.references.map(s => ({
          id: s.number,
          name: s.name,
          subtext: null,
          verses_count: s.numberOfAyahs
        }))
      ];
      setSurahs(surahsList);
    } catch (error) {
      console.error('خطأ في جلب السور:', error);
    }
  };

  useEffect(() => {
    if (selectedSurah > 0) {
      const surah = surahs.find(s => s.id === selectedSurah);
      if (surah) {
        const ayahs = [{ number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' }];
        for (let i = 1; i <= surah.verses_count; i++) {
          ayahs.push({ number: i, label: `الآية ${i}`, subtext: null });
        }
        setAvailableAyahs(ayahs);
        setSelectedAyah(0);
      }
    } else {
      setAvailableAyahs([{ number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' }]);
    }
  }, [selectedSurah, surahs]);

  const fetchVerse = async () => {
    setLoading(true);
    setAudioBlob(null);
    setHighlightedWordIndex(-1);
    setCurrentPlayingWordIndex(-1);
    setWordTimings([]);
    
    try {
      let surahNum = selectedSurah === 0 
        ? Math.floor(Math.random() * 114) + 1 
        : selectedSurah;
      
      let ayahNum = selectedAyah;
      if (ayahNum === 0 && surahs.length > 0) {
        const surah = surahs.find(s => s.id === surahNum) || { verses_count: 7 };
        ayahNum = Math.floor(Math.random() * surah.verses_count) + 1;
      } else if (ayahNum === 0) {
        ayahNum = 1;
      }

      let reciterData = selectedReciter === 0 
        ? RECITERS[Math.floor(Math.random() * (RECITERS.length - 1)) + 1]
        : RECITERS.find(r => r.id === selectedReciter);

      const reciterId = reciterData.reciterId;

      // Fetch verse text and words from Quran.com API v4
      const verseKey = `${surahNum}:${ayahNum}`;
      const wordsResponse = await fetch(
        `https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=ar&words=true&word_fields=text_uthmani,audio&audio=${reciterId}`
      );
      const wordsData = await wordsResponse.json();

      if (wordsData.verse) {
        const verseInfo = wordsData.verse;
        
        setVerse({
          text: verseInfo.text_uthmani,
          surah: surahs.find(s => s.id === surahNum)?.name || 'السورة',
          surahNumber: surahNum,
          number: ayahNum,
          audio: verseInfo.audio?.url || null,
          reciter: reciterData.name
        });

        if (verseInfo.words) {
          setWords(verseInfo.words);
          
          // Extract word timings from audio segments
          const timings = verseInfo.words
            .filter(word => word.audio)
            .map(word => ({
              timestamp_from: word.audio.timestamp_from || 0,
              timestamp_to: word.audio.timestamp_to || 0,
            }));
          
          setWordTimings(timings);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب الآية:', error);
      // Fallback to old API
      setVerse({
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        surah: 'الفاتحة',
        surahNumber: 1,
        number: 1,
        audio: 'https://verses.quran.com/Alafasy/mp3/001001.mp3',
        reciter: RECITERS[1].name
      });
      setWords([]);
      setWordTimings([]);
    } finally {
      setLoading(false);
    }
  };

  // Precise word-by-word highlighting with timestamps
  const handleAudioPlay = () => {
    if (!audioRef.current || wordTimings.length === 0) return;

    const audio = audioRef.current;
    setCurrentPlayingWordIndex(-1);

    // Clear any existing timers
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current);
    }

    highlightTimerRef.current = setInterval(() => {
      const currentTime = audio.currentTime * 1000; // Convert to milliseconds
      
      // Find the current word based on timestamp
      const currentIndex = wordTimings.findIndex(
        timing => currentTime >= timing.timestamp_from && currentTime <= timing.timestamp_to
      );
      
      if (currentIndex !== -1 && currentIndex !== currentPlayingWordIndex) {
        setCurrentPlayingWordIndex(currentIndex);
      }
      
      if (audio.ended || audio.paused) {
        clearInterval(highlightTimerRef.current);
        setCurrentPlayingWordIndex(-1);
      }
    }, 50); // Check every 50ms for smooth highlighting
  };

  const handleAudioPause = () => {
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current);
    }
    setCurrentPlayingWordIndex(-1);
  };

  const handleAudioEnded = () => {
    if (highlightTimerRef.current) {
      clearInterval(highlightTimerRef.current);
    }
    setCurrentPlayingWordIndex(-1);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearInterval(highlightTimerRef.current);
      }
    };
  }, []);

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

      setTimeout(() => {
        if (recorder.state === 'recording') {
          stopRecording();
        }
      }, 30000);
    } catch (error) {
      console.error('خطأ في تسجيل الصوت:', error);
      alert('لم نتمكن من الوصول إلى الميكروفون.');
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
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Link href="/" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2">
            <span>←</span> العودة للرئيسية
          </Link>
          <div className="w-12 h-12 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">
            قسم التلاوة والتدريب
          </h1>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl shadow-lg border border-gray-100 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">جاري تحميل الآية...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1 font-amiri">
                {verse?.surah}
              </h2>
              <p className="text-gray-600 font-amiri">الآية {verse?.number}</p>
            </div>

            <div className="quran-text bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 mb-6 shadow-inner">
              {words.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                  {words.map((word, index) => (
                    <span
                      key={index}
                      onClick={() => setHighlightedWordIndex(index)}
                      className={`cursor-pointer px-2 py-1 rounded-lg transition-all ${
                        currentPlayingWordIndex === index
                          ? 'bg-green-100/40 text-[#1e7850] font-bold shadow-sm scale-105'
                          : highlightedWordIndex === index
                          ? 'bg-green-200 shadow-md scale-110'
                          : 'hover:bg-green-50'
                      }`}
                    >
                      {word.text_uthmani}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center">{verse?.text}</div>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-6">
              <select
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(Number(e.target.value))}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white"
              >
                {RECITERS.map(reciter => (
                  <option key={reciter.id} value={reciter.id}>
                    {reciter.subtext ? `${reciter.name}  ${reciter.subtext}` : reciter.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSurah}
                onChange={(e) => setSelectedSurah(Number(e.target.value))}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white"
              >
                {surahs.map(surah => (
                  <option key={surah.id} value={surah.id}>
                    {surah.subtext 
                      ? `${surah.name}  ${surah.subtext}` 
                      : `${surah.id}. ${surah.name}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedAyah}
                onChange={(e) => setSelectedAyah(Number(e.target.value))}
                disabled={selectedSurah === 0}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {availableAyahs.map(ayah => (
                  <option key={ayah.number} value={ayah.number}>
                    {ayah.subtext ? `${ayah.label}  ${ayah.subtext}` : ayah.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchVerse}
              className="w-full bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold hover:bg-[#155c3e] transition-all shadow-md mb-4"
            >
              🔄 تطبيق الاختيارات
            </button>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-4">
              <p className="text-sm text-gray-600 mb-2 text-center">
                استمع للتلاوة الصحيحة - القارئ: <span className="font-bold">{verse?.reciter}</span>
              </p>
              {verse?.audio ? (
                <audio 
                  ref={audioRef}
                  key={verse.audio} 
                  controls 
                  className="w-full rounded-full"
                  onPlay={handleAudioPlay}
                  onPause={handleAudioPause}
                  onEnded={handleAudioEnded}
                >
                  <source src={verse.audio} type="audio/mpeg" />
                  المتصفح لا يدعم تشغيل الصوت
                </audio>
              ) : (
                <p className="text-center text-gray-500 text-sm">جاري تحميل الصوت...</p>
              )}
            </div>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full ${
                isRecording 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-white border-2 border-[#1e7850] text-[#1e7850] hover:bg-[#1e7850] hover:text-white'
              } px-6 py-4 rounded-full font-bold transition-all shadow-md mb-4`}
            >
              {isRecording ? '⏹ إيقاف التسجيل' : '🎤 ابدأ التسجيل'}
            </button>

            {audioBlob && (
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 mb-4">
                <p className="text-sm text-blue-700 mb-2 text-center font-semibold">✅ تم التسجيل بنجاح!</p>
                <audio controls className="w-full rounded-full">
                  <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                </audio>
                <p className="text-xs text-gray-600 text-center mt-2">
                  💡 ميزة تحليل الصوت بالذكاء الاصطناعي ستكون متاحة قريباً
                </p>
              </div>
            )}

            <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                💡 <strong>تلميح:</strong> عند تشغيل الصوت، سيتم تظليل الكلمات تلقائياً بدقة عالية متزامنة مع القارئ.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
