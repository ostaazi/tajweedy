'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ================== أيقونات SVG حديثة ================== */

function IconBack({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M10 6l-6 6 6 6"
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 12H5"
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconApply({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#dcfce7" />
      <path
        d="M9 12.5l2.2 2.3L15.5 9"
        fill="none"
        stroke="#16a34a"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMic({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="9" y="4" width="6" height="10" rx="3" fill="#22c55e" />
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

function IconRecordDot({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="6" fill="#ef4444" />
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="#fecaca"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconCheck({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#dbeafe" />
      <path
        d="M8.5 12.5l2.3 2.3 4.7-5"
        fill="none"
        stroke="#2563eb"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHint({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 4a6 6 0 0 1 3.5 10.9c-.5.4-.8.9-.9 1.5l-.1.6H9.5l-.1-.6c-.1-.6-.4-1.1-.9-1.5A6 6 0 0 1 12 4z"
        fill="#fef3c7"
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      <path
        d="M11 19h2"
        fill="none"
        stroke="#f59e0b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11.25 9.5c0-.4.3-.75.75-.75s.75.35.75.75c0 .9-.75 1.05-.75 1.75"
        fill="none"
        stroke="#92400e"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="15.5" r=".75" fill="#92400e" />
    </svg>
  );
}

/* ============ استايل الأزرار الزجاجية ============ */

const glassPrimary =
  'group relative w-full overflow-hidden rounded-full border border-emerald-400 bg-white/20 backdrop-blur-sm px-8 py-4 text-lg font-bold text-emerald-800 shadow-md hover:shadow-lg hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-2';

const glassSecondaryBase =
  'group relative w-full overflow-hidden rounded-full border border-slate-300 bg-white/40 backdrop-blur-sm px-8 py-4 text-lg font-bold text-slate-800 shadow-md hover:shadow-lg hover:bg-white/70 transition-all duration-200 flex items-center justify-center gap-2';

const RECITERS = [
  { id: 0, name: 'اسم القارئ', subtext: 'غير محدد (عشوائي)', edition: null },
  { id: 1, name: 'مشاري العفاسي', subtext: null, edition: 'ar.alafasy' },
  { id: 2, name: 'عبد الباسط عبد الصمد', subtext: null, edition: 'ar.abdulbasitmurattal' },
  { id: 3, name: 'عبد الرحمن السديس', subtext: null, edition: 'ar.abdurrahmaansudais' },
  { id: 4, name: 'محمد صديق المنشاوي', subtext: null, edition: 'ar.minshawi' },
  { id: 5, name: 'محمود خليل الحصري', subtext: null, edition: 'ar.husary' },
  { id: 6, name: 'أبو بكر الشاطري', subtext: null, edition: 'ar.shaatree' },
];

const DEFAULT_AYAH_OPTION = {
  number: 0,
  label: 'رقم الآية',
  subtext: 'غير محدد (عشوائي)',
};

export default function RecitationPage() {
  const [verse, setVerse] = useState(null);
  const [words, setWords] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);

  const [selectedReciter, setSelectedReciter] = useState(0);
  const [selectedSurah, setSelectedSurah] = useState(0); // بداية التلاوة - السورة
  const [selectedAyah, setSelectedAyah] = useState(0);   // بداية التلاوة - الآية
  const [availableAyahs, setAvailableAyahs] = useState([DEFAULT_AYAH_OPTION]);

  const [selectedSurahEnd, setSelectedSurahEnd] = useState(0); // نهاية التلاوة - السورة
  const [selectedAyahEnd, setSelectedAyahEnd] = useState(0);   // نهاية التلاوة - الآية
  const [availableAyahsEnd, setAvailableAyahsEnd] = useState([DEFAULT_AYAH_OPTION]);

  // حالة لتتبع موضعنا الحالي ونهاية المقطع
  const [currentSurah, setCurrentSurah] = useState(null);
  const [currentAyah, setCurrentAyah] = useState(null);
  const [rangeEndSurah, setRangeEndSurah] = useState(null);
  const [rangeEndAyah, setRangeEndAyah] = useState(null);

  const audioRef = useRef(null);

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
        ...data.data.surahs.references.map((s) => ({
          id: s.number,
          name: s.name,
          subtext: null,
          verses_count: s.numberOfAyahs,
        })),
      ];
      setSurahs(surahsList);
    } catch (error) {
      console.error('خطأ في جلب السور:', error);
    }
  };

  // الآيات المتاحة لبداية التلاوة
  useEffect(() => {
    if (selectedSurah > 0) {
      const surah = surahs.find((s) => s.id === selectedSurah);
      if (surah) {
        const ayahs = [DEFAULT_AYAH_OPTION];
        for (let i = 1; i <= surah.verses_count; i++) {
          ayahs.push({ number: i, label: `الآية ${i}`, subtext: null });
        }
        setAvailableAyahs(ayahs);
        setSelectedAyah(0);
      }
    } else {
      setAvailableAyahs([DEFAULT_AYAH_OPTION]);
      setSelectedAyah(0);
    }
  }, [selectedSurah, surahs]);

  // الآيات المتاحة لنهاية التلاوة
  useEffect(() => {
    if (selectedSurahEnd > 0) {
      const surah = surahs.find((s) => s.id === selectedSurahEnd);
      if (surah) {
        const ayahs = [DEFAULT_AYAH_OPTION];
        for (let i = 1; i <= surah.verses_count; i++) {
          ayahs.push({ number: i, label: `الآية ${i}`, subtext: null });
        }
        setAvailableAyahsEnd(ayahs);
        setSelectedAyahEnd(0);
      }
    } else {
      setAvailableAyahsEnd([DEFAULT_AYAH_OPTION]);
      setSelectedAyahEnd(0);
    }
  }, [selectedSurahEnd, surahs]);

  const fetchVerse = async () => {
    setLoading(true);
    setAudioBlob(null);
    setHighlightedWordIndex(-1);

    try {
      let surahNum =
        selectedSurah === 0
          ? Math.floor(Math.random() * 114) + 1
          : selectedSurah;

      let ayahNum = selectedAyah;
      if (ayahNum === 0 && surahs.length > 0) {
        const surah = surahs.find((s) => s.id === surahNum) || { verses_count: 7 };
        ayahNum = Math.floor(Math.random() * surah.verses_count) + 1;
      } else if (ayahNum === 0) {
        ayahNum = 1;
      }

      // تحديد بيانات القارئ
      let reciterData =
        selectedReciter === 0
          ? RECITERS[Math.floor(Math.random() * (RECITERS.length - 1)) + 1]
          : RECITERS.find((r) => r.id === selectedReciter);

      // تحديد نهاية المقطع (إذا لم تُحدَّد نعتبرها مثل البداية أو نهاية السورة)
      let endSurahNum = selectedSurahEnd || surahNum;
      let endAyahNum = selectedAyahEnd;
      if (endAyahNum === 0) {
        const endSurahMeta = surahs.find((s) => s.id === endSurahNum);
        endAyahNum = endSurahMeta ? endSurahMeta.verses_count : ayahNum;
      }

      setCurrentSurah(surahNum);
      setCurrentAyah(ayahNum);
      setRangeEndSurah(endSurahNum);
      setRangeEndAyah(endAyahNum);

      // *** هنا التعديل الأول: استخدام quran-uthmani-tajweed ***
      const verseResponse = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/editions/quran-uthmani-tajweed,${reciterData.edition}`
      );
      const verseData = await verseResponse.json();

      if (verseData.status === 'OK' && verseData.data.length >= 2) {
        const textData = verseData.data[0];
        const audioData = verseData.data[1];

        const verseObj = {
          text: textData.text,
          surah: textData.surah.name,
          surahNumber: surahNum,
          number: ayahNum,
          audio: audioData.audio || audioData.audioSecondary?.[0] || null,
          reciter: reciterData.name,
        };

        setVerse(verseObj);

        try {
          const wordsResponse = await fetch(
            `https://api.quran.com/api/v4/verses/by_key/${surahNum}:${ayahNum}?language=ar&words=true&word_fields=text_uthmani`
          );
          const wordsData = await wordsResponse.json();
          if (wordsData.verse && wordsData.verse.words) {
            setWords(wordsData.verse.words);
          } else {
            setWords([]);
          }
        } catch (err) {
          console.log('تعذر جلب الكلمات');
          setWords([]);
        }
      }
    } catch (error) {
      console.error('خطأ في جلب الآية:', error);
      setVerse({
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        surah: 'الفاتحة',
        surahNumber: 1,
        number: 1,
        audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3',
        reciter: RECITERS[1].name,
      });
      setWords([]);
    } finally {
      setLoading(false);
    }
  };

  // جلب الآية التالية داخل المقطع المحدد وتشغيلها تلقائياً
  const fetchNextInRange = async () => {
    if (
      !currentSurah ||
      !currentAyah ||
      !rangeEndSurah ||
      !rangeEndAyah
    ) {
      return;
    }

    // التأكد هل وصلنا للنهاية
    if (
      currentSurah > rangeEndSurah ||
      (currentSurah === rangeEndSurah && currentAyah >= rangeEndAyah)
    ) {
      return;
    }

    let nextSurah = currentSurah;
    let nextAyah = currentAyah + 1;

    const currentSurahMeta = surahs.find((s) => s.id === currentSurah);
    const lastAyahCurrent = currentSurahMeta?.verses_count || currentAyah;

    // الانتقال للسورة التالية إذا انتهت الآيات
    if (nextAyah > lastAyahCurrent) {
      nextSurah = currentSurah + 1;
      nextAyah = 1;
    }

    // عدم تجاوز نهاية المقطع
    if (
      nextSurah > rangeEndSurah ||
      (nextSurah === rangeEndSurah && nextAyah > rangeEndAyah)
    ) {
      return;
    }

    try {
      let reciterData =
        selectedReciter === 0
          ? RECITERS.find((r) => r.name === verse?.reciter) || RECITERS[1]
          : RECITERS.find((r) => r.id === selectedReciter);

      // *** هنا التعديل الثاني: أيضًا quran-uthmani-tajweed ***
      const verseResponse = await fetch(
        `https://api.alquran.cloud/v1/ayah/${nextSurah}:${nextAyah}/editions/quran-uthmani-tajweed,${reciterData.edition}`
      );
      const verseData = await verseResponse.json();

      if (verseData.status === 'OK' && verseData.data.length >= 2) {
        const textData = verseData.data[0];
        const audioData = verseData.data[1];

        const verseObj = {
          text: textData.text,
          surah: textData.surah.name,
          surahNumber: nextSurah,
          number: nextAyah,
          audio: audioData.audio || audioData.audioSecondary?.[0] || null,
          reciter: reciterData.name,
        };

        setVerse(verseObj);
        setCurrentSurah(nextSurah);
        setCurrentAyah(nextAyah);

        try {
          const wordsResponse = await fetch(
            `https://api.quran.com/api/v4/verses/by_key/${nextSurah}:${nextAyah}?language=ar&words=true&word_fields=text_uthmani`
          );
          const wordsData = await wordsResponse.json();
          if (wordsData.verse && wordsData.verse.words) {
            setWords(wordsData.verse.words);
          } else {
            setWords([]);
          }
        } catch {
          setWords([]);
        }

        // تشغيل الصوت تلقائياً للآية التالية
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      }
    } catch (e) {
      console.error('خطأ في جلب الآية التالية:', e);
    }
  };

  const handleAudioEnded = () => {
    // عند انتهاء الصوت، نحاول جلب الآية التالية
    fetchNextInRange();
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
        stream.getTracks().forEach((track) => track.stop());
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
    <>
      {/* نفس خط UthmanicHafs المستخدم في صفحة الاختبار */}
      <style jsx global>{`
        @font-face {
          font-family: 'UthmanicHafs';
          src: url('/fonts/UthmanicHafs_V22.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        .quran-text {
          font-family: 'UthmanicHafs', 'Amiri', 'Scheherazade New', serif;
        }
      `}</style>

      <div className="min-h-screen p-4 md:p-8 relative z-10 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
            <Link
              href="/"
              className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2"
            >
              <IconBack />
              <span>العودة للرئيسية</span>
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
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 font-amiri">
                  {verse?.surah}
                </h2>
                <p className="text-lg md:text-xl text-gray-600 font-amiri">
                  الآية {verse?.number}
                </p>
              </div>

              {/* *** هنا التعديل الثالث: عرض نص التجويد من verse.text *** */}
              <div className="quran-text bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 mb-6 shadow-inner">
                <div
                  className="text-center text-3xl md:text-4xl leading-[2.4rem]"
                  dir="rtl"
                  dangerouslySetInnerHTML={{ __html: verse?.text || '' }}
                />
              </div>

              {/* باقي الصفحة كما هي تمامًا (اختيارات، أزرار، تسجيل، تلميح...) */}

              {/* اختيارات القارئ + بداية/نهاية التلاوة للسورة والآية */}
              <div className="flex flex-col gap-4 mb-6">
                <select
                  value={selectedReciter}
                  onChange={(e) => setSelectedReciter(Number(e.target.value))}
                  className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white text-lg font-amiri"
                >
                  {RECITERS.map((reciter) => (
                    <option key={reciter.id} value={reciter.id}>
                      {reciter.subtext
                        ? `${reciter.name}  ${reciter.subtext}`
                        : reciter.name}
                    </option>
                  ))}
                </select>

                {/* السورة: بداية التلاوة / نهاية التلاوة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      بداية التلاوة - السورة
                    </span>
                    <select
                      value={selectedSurah}
                      onChange={(e) => setSelectedSurah(Number(e.target.value))}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white text-lg font-amiri"
                    >
                      {surahs.map((surah) => (
                        <option key={surah.id} value={surah.id}>
                          {surah.subtext
                            ? `${surah.name}  ${surah.subtext}`
                            : `${surah.id}. ${surah.name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      نهاية التلاوة - السورة
                    </span>
                    <select
                      value={selectedSurahEnd}
                      onChange={(e) => setSelectedSurahEnd(Number(e.target.value))}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white text-lg font-amiri"
                    >
                      {surahs.map((surah) => (
                        <option key={surah.id} value={surah.id}>
                          {surah.subtext
                            ? `${surah.name}  ${surah.subtext}`
                            : `${surah.id}. ${surah.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* الآية: بداية التلاوة / نهاية التلاوة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      بداية التلاوة - الآية
                    </span>
                    <select
                      value={selectedAyah}
                      onChange={(e) => setSelectedAyah(Number(e.target.value))}
                      disabled={selectedSurah === 0}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-amiri"
                    >
                      {availableAyahs.map((ayah) => (
                        <option key={ayah.number} value={ayah.number}>
                          {ayah.subtext
                            ? `${ayah.label}  ${ayah.subtext}`
                            : ayah.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      نهاية التلاوة - الآية
                    </span>
                    <select
                      value={selectedAyahEnd}
                      onChange={(e) => setSelectedAyahEnd(Number(e.target.value))}
                      disabled={selectedSurahEnd === 0}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-amiri"
                    >
                      {availableAyahsEnd.map((ayah) => (
                        <option key={ayah.number} value={ayah.number}>
                          {ayah.subtext
                            ? `${ayah.label}  ${ayah.subtext}`
                            : ayah.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* زر تطبيق الاختيارات (زجاجي) */}
              <button onClick={fetchVerse} className={glassPrimary}>
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative inline-flex items-center justify-center gap-2">
                  <IconApply />
                  <span>تطبيق الاختيارات</span>
                </span>
              </button>

              {/* مشغل الصوت */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mb-4 mt-4">
                <p className="text-base md:text-lg text-gray-600 mb-2 text-center">
                  استمع للتلاوة الصحيحة - القارئ:{' '}
                  <span className="font-bold">{verse?.reciter}</span>
                </p>
                {verse?.audio ? (
                  <audio
                    key={verse.audio}
                    ref={audioRef}
                    controls
                    onEnded={handleAudioEnded}
                    className="w-full rounded-full"
                  >
                    <source src={verse.audio} type="audio/mpeg" />
                    المتصفح لا يدعم تشغيل الصوت
                  </audio>
                ) : (
                  <p className="text-center text-gray-500 text-base">
                    جاري تحميل الصوت...
                  </p>
                )}
              </div>

              {/* زر التسجيل الزجاجي مع حالة التسجيل */}
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={
                  isRecording
                    ? `relative w-full rounded-full px-8 py-4 text-lg font-bold text-white shadow-md transition-all duration-200 flex items-center justify-center gap-2 border border-red-500 bg-red-500 animate-pulse`
                    : glassSecondaryBase
                }
              >
                {!isRecording && (
                  <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className="relative inline-flex items-center justify-center gap-2">
                  {isRecording ? <IconRecordDot /> : <IconMic />}
                  <span>{isRecording ? 'إيقاف التسجيل' : 'ابدأ التسجيل'}</span>
                </span>
              </button>

              {audioBlob && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 mb-4 mt-4">
                  <p className="text-sm text-blue-700 mb-2 text-center font-semibold flex items-center justify-center gap-2">
                    <IconCheck />
                    <span>تم التسجيل بنجاح!</span>
                  </p>
                  <audio controls className="w-full rounded-full">
                    <source src={URL.createObjectURL(audioBlob)} type="audio/wav" />
                  </audio>
                  <p className="text-xs text-gray-600 text-center mt-2">
                    ميزة تحليل الصوت بالذكاء الاصطناعي ستكون متاحة قريباً
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg mt-2">
                <p className="text-sm text-gray-700 flex items-start gap-2">
                  <IconHint className="mt-0.5 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span>
                    <strong>تلميح:</strong> اضغط على "تطبيق الاختيارات" لتحميل الآية
                    والصوت الصحيح.
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
