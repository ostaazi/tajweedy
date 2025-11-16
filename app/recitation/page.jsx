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

function IconApply({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
      />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCheck({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
      />
      <path
        d="M8 12.5l2.5 2.5L16 9"
        fill="none"
        stroke="#166534"
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
      <rect
        x="9"
        y="4"
        width="6"
        height="10"
        rx="3"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
      />
      <path
        d="M6 11v1a6 6 0 0012 0v-1"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 17v3"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 20h6"
        fill="none"
        stroke="#166534"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconRecordDot({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#b91c1c" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="5" fill="#ef4444" />
    </svg>
  );
}

function IconHint({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="#0f766e"
        strokeWidth="1.8"
      />
      <path
        d="M12 7a3 3 0 00-3 3"
        fill="none"
        stroke="#0f766e"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 13a3 3 0 003 3 3 3 0 003-3 3 3 0 00-1.2-2.4L12 9"
        fill="none"
        stroke="#0f766e"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="0.9" fill="#0f766e" />
    </svg>
  );
}

/* ============ استايل الأزرار الزجاجية ============ */

const glassPrimary =
  'group relative w-full overflow-hidden rounded-full border border-emerald-400 bg-white/20 backdrop-blur-md text-emerald-800 shadow-md hover:shadow-lg hover:bg-white/40 transition-all duration-200 flex items-center justify-center gap-2';

const glassSecondaryBase =
  'group relative w-full overflow-hidden rounded-full border border-slate-300 bg-white/60 backdrop-blur-md text-slate-700 hover:bg-white hover:border-emerald-300 transition-all duration-200 flex items-center justify-center gap-2';

/* ============ بيانات القرّاء ============ */

const RECITERS = [
  { id: 0, name: 'اسم القارئ', subtext: 'غير محدد (عشوائي)', edition: null },
  { id: 1, name: 'مشاري العفاسي', subtext: 'رواية حفص', edition: 'ar.alafasy' },
  { id: 2, name: 'عبدالباسط عبدالصمد', subtext: 'رواية حفص', edition: 'ar.abdulbasitmurattal' },
  { id: 3, name: 'المنشاوي', subtext: 'معلم', edition: 'ar.minshawi' },
];

const DEFAULT_SURAH_OPTION = {
  id: 0,
  name: 'اسم السورة',
  subtext: 'غير محدد (عشوائي)',
  verses_count: 0,
};

const DEFAULT_AYAH_OPTION = {
  number: 0,
  label: 'رقم الآية',
  subtext: 'غير محددة',
};

/* ============ المكوّن الرئيسي لصفحة التلاوة ============ */

export default function RecitationPage() {
  const [surahs, setSurahs] = useState([DEFAULT_SURAH_OPTION]);

  // بداية التلاوة
  const [selectedSurah, setSelectedSurah] = useState(0);
  const [availableAyahs, setAvailableAyahs] = useState([DEFAULT_AYAH_OPTION]);
  const [selectedAyah, setSelectedAyah] = useState(0);

  // نهاية التلاوة
  const [rangeEndSurah, setRangeEndSurah] = useState(0);
  const [availableEndAyahs, setAvailableEndAyahs] =
    useState([DEFAULT_AYAH_OPTION]);
  const [rangeEndAyah, setRangeEndAyah] = useState(0);

  // القارئ
  const [selectedReciter, setSelectedReciter] = useState(0);

  // حالة الآية / الكلمات
  const [verse, setVerse] = useState(null);
  const [words, setWords] = useState([]);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);

  // حالة الصوت
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // حالة التسجيل (واجهة فقط – يمكنك لاحقًا ربطها بـ MediaRecorder)
  const [isRecording, setIsRecording] = useState(false);

  // حالة التحميل والأخطاء
  const [isLoading, setIsLoading] = useState(false);
  const [applyClicked, setApplyClicked] = useState(false);
  const [error, setError] = useState(null);

  /* ============ تحميل بيانات السور من API ============ */

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://api.alquran.cloud/v1/meta');
        const data = await response.json();
        const surahsList = [
          DEFAULT_SURAH_OPTION,
          ...data.data.surahs.references.map((s) => ({
            id: s.number,
            name: s.name,
            subtext: null,
            verses_count: s.numberOfAyahs,
          })),
        ];
        setSurahs(surahsList);
      } catch (err) {
        console.error('Error fetching surahs meta:', err);
        setError('حدث خطأ أثناء تحميل بيانات السور.');
      }
    };

    fetchSurahs();
  }, []);

  /* ============ تحديث الآيات المتاحة عند اختيار السورة ============ */

  useEffect(() => {
    if (selectedSurah !== 0) {
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

  useEffect(() => {
    if (rangeEndSurah !== 0) {
      const surah = surahs.find((s) => s.id === rangeEndSurah);
      if (surah) {
        const ayahs = [DEFAULT_AYAH_OPTION];
        for (let i = 1; i <= surah.verses_count; i++) {
          ayahs.push({ number: i, label: `الآية ${i}`, subtext: null });
        }
        setAvailableEndAyahs(ayahs);
        setRangeEndAyah(0);
      }
    } else {
      setAvailableEndAyahs([DEFAULT_AYAH_OPTION]);
      setRangeEndAyah(0);
    }
  }, [rangeEndSurah, surahs]);

  /* ============ دالة مساعدة لجلب الآية مع نص التجويد والكلمات ============ */

  const fetchVerse = async (surahNum, ayahNum, reciterData) => {
    setIsLoading(true);
    setError(null);
    try {
      // نص الآية + تلاوة القارئ – مع التجويد
      const verseResponse = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/editions/quran-uthmani-tajweed,${reciterData.edition}`
      );
      const verseData = await verseResponse.json();

      if (verseData.status === 'OK' && verseData.data.length >= 2) {
        const textData = verseData.data[0];
        const audioData = verseData.data[1];

        const verseObj = {
          text: textData.text, // يحتوي HTML بعلامات التجويد
          surah: textData.surah.name,
          surahNumber: surahNum,
          number: ayahNum,
          audio: audioData.audio || audioData.audioSecondary?.[0] || null,
          reciter: reciterData.name,
        };

        setVerse(verseObj);
        setAudioUrl(verseObj.audio);

        // جلب الكلمات من API quran.com مع نص حفص عثماني
        try {
          const wordsResponse = await fetch(
            `https://api.quran.com/api/v4/verses/by_key/${surahNum}:${ayahNum}?language=ar&words=true&word_fields=text_uthmani`
          );
          const wordsData = await wordsResponse.json();
          if (wordsData?.verse?.words) {
            setWords(
              wordsData.verse.words.map((w) => ({
                text_uthmani: w.text_uthmani,
              }))
            );
          } else {
            setWords([]);
          }
        } catch (wErr) {
          console.error('Error fetching words:', wErr);
          setWords([]);
        }
      } else {
        setError('تعذر جلب الآية. حاول مرة أخرى.');
      }
    } catch (err) {
      console.error('Error fetching verse:', err);
      setError('حدث خطأ أثناء جلب الآية. تحقق من الاتصال بالإنترنت.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ============ تطبيق الاختيارات ============ */

  const handleApplySelections = async () => {
    setApplyClicked(true);
    setHighlightedWordIndex(-1);

    // اختيار القارئ
    let reciterData =
      selectedReciter === 0
        ? RECITERS[1]
        : RECITERS.find((r) => r.id === selectedReciter) || RECITERS[1];

    // في حالة عدم اختيار السورة/الآية نختار عشوائيًا
    let surahNum = selectedSurah;
    let ayahNum = selectedAyah;

    if (surahNum === 0 || ayahNum === 0) {
      const validSurahs = surahs.filter((s) => s.id !== 0);
      const randomSurah =
        validSurahs[Math.floor(Math.random() * validSurahs.length)];
      surahNum = randomSurah.id;
      const randomAyah =
        1 + Math.floor(Math.random() * randomSurah.verses_count);
      ayahNum = randomAyah;
      setSelectedSurah(randomSurah.id);
      setSelectedAyah(randomAyah);
      setRangeEndSurah(randomSurah.id);
      setRangeEndAyah(randomAyah);
    }

    await fetchVerse(surahNum, ayahNum, reciterData);
  };

  /* ============ الانتقال للآية التالية داخل النطاق ============ */

  const handleNextVerse = async () => {
    if (!verse) return;

    let nextSurah = verse.surahNumber;
    let nextAyah = verse.number + 1;

    if (
      rangeEndSurah &&
      rangeEndAyah &&
      (nextSurah > rangeEndSurah ||
        (nextSurah === rangeEndSurah && nextAyah > rangeEndAyah))
    ) {
      // عدنا إلى بداية النطاق
      nextSurah = selectedSurah || verse.surahNumber;
      nextAyah = selectedAyah || 1;
    }

    let reciterData =
      selectedReciter === 0
        ? RECITERS.find((r) => r.name === verse.reciter) || RECITERS[1]
        : RECITERS.find((r) => r.id === selectedReciter) || RECITERS[1];

    await fetchVerse(nextSurah, nextAyah, reciterData);
    setSelectedSurah(nextSurah);
    setSelectedAyah(nextAyah);
  };

  /* ============ تشغيل/إيقاف التلاوة ============ */

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Error playing audio:', err);
        });
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  /* ============ تسجيل صوت المستخدم (واجهة فقط) ============ */

  const handleToggleRecording = () => {
    setIsRecording((prev) => !prev);
  };

  /* ============ الواجهة ============ */

  return (
    <>
      <style jsx global>{`
        @font-face {
          font-family: 'UthmanicHafs';
          src: url('/fonts/UthmanicHafs1-Ver22.woff2') format('woff2');
          font-display: swap;
        }

        .font-quran {
          font-family: 'UthmanicHafs', 'Scheherazade New', 'Traditional Arabic',
            system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col">
        {/* شريط علوي بسيط */}
        <header className="w-full border-b border-emerald-100 bg-white/80 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-900 text-sm md:text-base"
              >
                <IconBack className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 relative">
                <Image
                  src="/logo.png"
                  alt="Tajweedy Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-semibold text-emerald-800 hidden sm:inline">
                مدرب أحكام التجويد
              </span>
            </div>
          </div>
        </header>

        {/* المحتوى الرئيسي */}
        <main className="flex-1">
          <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-emerald-800 mb-2">
                قسم التلاوة والتدريب
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                اختر السورة، رقم الآية، والقارئ، ثم استمع ودرّب نفسك على التلاوة
                مع عرض الآية مكتوبة بخط عثماني وعلامات التجويد.
              </p>
            </div>

            {/* كارت التلاوة الرئيسي */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-emerald-100 px-4 py-5 md:px-8 md:py-7">
              {/* معلومات السورة والآية */}
              <div className="flex flex-col items-center gap-1 mb-4">
                <p className="text-sm text-gray-500">
                  التلاوة الحالية بواسطة{' '}
                  <span className="font-semibold text-emerald-700">
                    {verse?.reciter || '—'}
                  </span>
                </p>
                <h2 className="text-2xl md:text-3xl font-quran text-emerald-800">
                  {verse?.surah || 'لم يتم اختيار آية بعد'}
                </h2>
                {verse && (
                  <p className="text-base md:text-lg text-gray-600 font-amiri">
                    الآية {verse?.number}
                  </p>
                )}
              </div>

              {/* نص الآية + علامات التجويد */}
              <div className="quran-text bg-gradient-to-br from-emerald-50 to-white p-6 md:p-8 rounded-2xl border-2 border-green-100 mb-6 shadow-inner">
                {words.length > 0 ? (
                  <>
                    {/* الكلمات القابلة للنقر */}
                    <div className="flex flex-wrap justify-center gap-1 mb-4" dir="rtl">
                      {words.map((word, index) => (
                        <span
                          key={index}
                          onClick={() => setHighlightedWordIndex(index)}
                          className={`cursor-pointer px-3 py-2 rounded-lg transition-all text-2xl md:text-3xl font-quran ${
                            highlightedWordIndex === index
                              ? 'bg-emerald-200 shadow-md scale-110'
                              : 'hover:bg-emerald-50'
                          }`}
                        >
                          {word.text_uthmani}
                        </span>
                      ))}
                    </div>

                    {/* نص التجويد الملون من API */}
                    {verse?.text && (
                      <div
                        className="text-center text-2xl md:text-3xl leading-relaxed font-quran"
                        dir="rtl"
                        dangerouslySetInnerHTML={{ __html: verse.text }}
                      />
                    )}
                  </>
                ) : (
                  <div
                    className="text-center text-2xl md:text-3xl leading-relaxed font-quran"
                    dir="rtl"
                    dangerouslySetInnerHTML={{ __html: verse?.text || '' }}
                  />
                )}
              </div>

              {/* مشغل التلاوة + التسجيل */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                {/* مشغل الصوت */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    disabled={!audioUrl}
                    className={`${glassPrimary} px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base`}
                  >
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white">
                      {isPlaying ? '⏸' : '▶'}
                    </span>
                    <span className="font-semibold">
                      {isPlaying ? 'إيقاف التلاوة' : 'تشغيل التلاوة'}
                    </span>
                  </button>

                  <audio
                    ref={audioRef}
                    src={audioUrl || undefined}
                    onEnded={handleAudioEnded}
                    className="hidden"
                  />
                </div>

                {/* زر الآية التالية */}
                <button
                  type="button"
                  onClick={handleNextVerse}
                  disabled={!verse}
                  className={`${glassSecondaryBase} px-5 py-2 md:px-6 md:py-2.5 text-sm md:text-base`}
                >
                  <span className="font-semibold text-emerald-700">
                    الآية التالية داخل النطاق
                  </span>
                </button>

                {/* التسجيل (واجهة) */}
                <button
                  type="button"
                  onClick={handleToggleRecording}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rose-300 bg-rose-50/70 text-rose-700 hover:bg-rose-100 transition-colors text-xs md:text-sm"
                >
                  <IconMic className="w-4 h-4" />
                  <span>{isRecording ? 'إيقاف التسجيل' : 'بدء تسجيل تلاوتك'}</span>
                  {isRecording && <IconRecordDot className="w-3 h-3" />}
                </button>
              </div>

              {/* اختيارات القارئ + بداية/نهاية التلاوة للسورة والآية */}
              <div className="flex flex-col gap-4 mb-6">
                {/* اختيار القارئ */}
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-600 pr-2 text-right">
                    اختر القارئ
                  </span>
                  <select
                    value={selectedReciter}
                    onChange={(e) => setSelectedReciter(Number(e.target.value))}
                    className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-600 focus:outline-none text-center font-semibold bg-white text-sm md:text-base font-amiri"
                  >
                    {RECITERS.map((reciter) => (
                      <option key={reciter.id} value={reciter.id}>
                        {reciter.subtext
                          ? `${reciter.name} – ${reciter.subtext}`
                          : reciter.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* السورة: بداية التلاوة / نهاية التلاوة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      بداية التلاوة - السورة
                    </span>
                    <select
                      value={selectedSurah}
                      onChange={(e) => setSelectedSurah(Number(e.target.value))}
                      className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-600 focus:outline-none text-center bg-white text-sm md:text-base font-amiri"
                    >
                      {surahs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id === 0 ? s.name : `سورة ${s.name}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      نهاية التلاوة - السورة
                    </span>
                    <select
                      value={rangeEndSurah}
                      onChange={(e) => setRangeEndSurah(Number(e.target.value))}
                      className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-600 focus:outline-none text-center bg-white text-sm md:text-base font-amiri"
                    >
                      {surahs.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id === 0 ? s.name : `سورة ${s.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* الآية: بداية التلاوة / نهاية التلاوة */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      بداية التلاوة - رقم الآية
                    </span>
                    <select
                      value={selectedAyah}
                      onChange={(e) => setSelectedAyah(Number(e.target.value))}
                      className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-600 focus:outline-none text-center bg-white text-sm md:text-base font-amiri"
                    >
                      {availableAyahs.map((a) => (
                        <option key={a.number} value={a.number}>
                          {a.number === 0 ? a.label : a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600 pr-2 text-right">
                      نهاية التلاوة - رقم الآية
                    </span>
                    <select
                      value={rangeEndAyah}
                      onChange={(e) => setRangeEndAyah(Number(e.target.value))}
                      className="w-full p-3 md:p-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-600 focus:outline-none text-center bg-white text-sm md:text-base font-amiri"
                    >
                      {availableEndAyahs.map((a) => (
                        <option key={a.number} value={a.number}>
                          {a.number === 0 ? a.label : a.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* زر تطبيق الاختيارات */}
              <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
                <button
                  type="button"
                  onClick={handleApplySelections}
                  className={`${glassPrimary} px-6 py-3 text-sm md:text-base`}
                >
                  <span className="inline-flex w-8 h-8 rounded-full bg-emerald-600 text-white items-center justify-center">
                    <IconApply className="w-4 h-4" />
                  </span>
                  <span className="font-semibold">
                    {applyClicked ? 'إعادة تحميل الآية' : 'تطبيق الاختيارات وتحميل الآية'}
                  </span>
                </button>

                {verse && (
                  <span className="inline-flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <IconCheck className="w-4 h-4" />
                    <span>
                      تم تحميل الآية{' '}
                      <strong>
                        {verse.surah} – {verse.number}
                      </strong>{' '}
                      بقارئ{' '}
                      <strong>{verse.reciter}</strong>
                    </span>
                  </span>
                )}
              </div>

              {/* رسالة الخطأ إن وجدت */}
              {error && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {/* تلميح */}
              <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs md:text-sm text-emerald-800 flex gap-3 items-start">
                <IconHint className="mt-0.5 w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <p>
                  <strong>تلميح:</strong> اضغط على "تطبيق الاختيارات" لتحميل الآية
                  والصوت الصحيح. يمكنك النقر على كل كلمة في السطر العلوي لتمييزها،
                  بينما يظهر أسفلها النص الكامل بعلامات التجويد الملوّنة من المصحف
                  العثماني.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
                }
