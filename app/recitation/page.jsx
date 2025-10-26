'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const RECITERS = [
  { id: 0, name: 'اسم القارئ', subtext: 'غير محدد (عشوائي)', edition: null },
  { id: 1, name: 'مشاري العفاسي', subtext: null, edition: 'ar.alafasy' },
  { id: 2, name: 'عبد الباسط عبد الصمد', subtext: null, edition: 'ar.abdulbasitmurattal' },
  { id: 3, name: 'عبد الرحمن السديس', subtext: null, edition: 'ar.abdurrahmaansudais' },
  { id: 4, name: 'محمد صديق المنشاوي', subtext: null, edition: 'ar.minshawi' },
  { id: 5, name: 'محمود خليل الحصري', subtext: null, edition: 'ar.husary' },
  { id: 6, name: 'أبو بكر الشاطري', subtext: null, edition: 'ar.shaatree' },
];

export default function RecitationPage() {
  const [verse, setVerse] = useState(null);
  const [words, setWords] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);

  const [selectedReciter, setSelectedReciter] = useState(1);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedAyah, setSelectedAyah] = useState(1);
  const [availableAyahs, setAvailableAyahs] = useState([]);

  const [autoContinue, setAutoContinue] = useState(false);
  const audioRef = useRef(null);
  const [wordTimer, setWordTimer] = useState(null);

  useEffect(() => {
    fetchSurahs();
  }, []);

  useEffect(() => {
    if (selectedSurah > 0 && surahs.length > 0) {
      const surah = surahs.find(s => s.id === selectedSurah);
      if (surah) {
        const ayahs = Array.from({ length: surah.verses_count }, (_, i) => i + 1);
        setAvailableAyahs(ayahs);
      }
    }
  }, [selectedSurah, surahs]);

  const fetchSurahs = async () => {
    try {
      const response = await fetch('https://api.alquran.cloud/v1/meta');
      const data = await response.json();
      const surahList = data.data.surahs.references.map(s => ({
        id: s.number,
        name: s.name,
        verses_count: s.numberOfAyahs
      }));
      setSurahs(surahList);
    } catch (error) {
      console.error('خطأ في جلب السور:', error);
    }
  };

  const fetchVerse = async () => {
    setLoading(true);
    setHighlightedWordIndex(-1);
    if (wordTimer) clearInterval(wordTimer);

    try {
      const reciter = RECITERS.find(r => r.id === selectedReciter);
      const verseResponse = await fetch(
        `https://api.alquran.cloud/v1/ayah/${selectedSurah}:${selectedAyah}/editions/quran-uthmani,${reciter.edition}`
      );
      const verseData = await verseResponse.json();

      if (verseData.status === 'OK') {
        const textData = verseData.data[0];
        const audioData = verseData.data[1];

        setVerse({
          text: textData.text,
          surah: textData.surah.name,
          number: selectedAyah,
          reciter: reciter.name,
          audio: audioData.audio
        });

        const wordsResponse = await fetch(
          `https://api.quran.com/api/v4/verses/by_key/${selectedSurah}:${selectedAyah}?language=ar&words=true&word_fields=text_uthmani`
        );
        const wordsData = await wordsResponse.json();
        setWords(wordsData.verse.words);
      }
    } catch (err) {
      console.error('خطأ في تحميل الآية:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = () => {
    if (!audioRef.current || words.length === 0) return;
    if (wordTimer) clearInterval(wordTimer);

    const duration = audioRef.current.duration * 1000;
    const intervalTime = duration / words.length;

    let index = 0;
    const timer = setInterval(() => {
      setHighlightedWordIndex(i => {
        if (index < words.length) {
          index++;
          return index - 1;
        } else {
          clearInterval(timer);
          return -1;
        }
      });
    }, intervalTime);

    setWordTimer(timer);
  };

  const handleEnded = () => {
    if (wordTimer) clearInterval(wordTimer);
    setHighlightedWordIndex(-1);

    if (autoContinue) {
      const surah = surahs.find(s => s.id === selectedSurah);
      if (surah && selectedAyah < surah.verses_count) {
        setSelectedAyah(selectedAyah + 1);
        setTimeout(fetchVerse, 300);
      } else if (selectedSurah < 114) {
        setSelectedSurah(selectedSurah + 1);
        setSelectedAyah(1);
        setTimeout(fetchVerse, 300);
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <Link href="/" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2">
            ← العودة للرئيسية
          </Link>
          <Image src="/logo.png" alt="Logo" width={48} height={48} className="object-contain" />
        </div>

        <h1 className="text-3xl font-bold text-center text-[#1e7850] mb-6">قسم التلاوة والتدريب</h1>

        {/* 🕌 القوائم */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 mb-4 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="border border-gray-200 rounded-xl p-3 text-gray-700 focus:border-[#1e7850] focus:ring-1 focus:ring-[#1e7850]"
            value={selectedReciter}
            onChange={e => setSelectedReciter(Number(e.target.value))}
          >
            {RECITERS.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-xl p-3 text-gray-700 focus:border-[#1e7850] focus:ring-1 focus:ring-[#1e7850]"
            value={selectedSurah}
            onChange={e => setSelectedSurah(Number(e.target.value))}
          >
            {surahs.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            className="border border-gray-200 rounded-xl p-3 text-gray-700 focus:border-[#1e7850] focus:ring-1 focus:ring-[#1e7850]"
            value={selectedAyah}
            onChange={e => setSelectedAyah(Number(e.target.value))}
          >
            {availableAyahs.map(n => (
              <option key={n} value={n}>
                الآية {n}
              </option>
            ))}
          </select>
        </div>

        {/* زر تطبيق الاختيارات */}
        <div className="text-center mb-6">
          <button
            onClick={fetchVerse}
            className="bg-[#1e7850] text-white px-8 py-3 rounded-full font-bold hover:bg-[#155c3e] transition-all shadow-md"
          >
            تطبيق الاختيارات 📖
          </button>
        </div>

        {/* محتوى الآية */}
        {loading ? (
          <div className="text-center text-gray-600 mt-10">جاري تحميل الآية...</div>
        ) : (
          verse && (
            <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-6 mb-6">
              <h2 className="text-xl text-center font-bold mb-2 text-gray-700">{verse?.surah}</h2>
              <p className="text-center text-gray-500 mb-6">الآية {verse?.number}</p>

              <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mb-6">
                <div className="text-3xl text-center leading-relaxed font-amiri" dir="rtl">
                  {words.map((word, i) => (
                    <span
                      key={i}
                      className={`mx-1 transition-all ${
                        highlightedWordIndex === i
                          ? 'bg-green-300 px-1 rounded-lg shadow-sm scale-110'
                          : 'hover:bg-green-100'
                      }`}
                    >
                      {word.text_uthmani}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-center mb-4">
                <p className="text-sm text-gray-700 mb-2">
                  استمع للتلاوة الصحيحة - القارئ: <strong>{verse?.reciter}</strong>
                </p>
                {verse?.audio && (
                  <audio
                    ref={audioRef}
                    controls
                    onPlay={handlePlay}
                    onEnded={handleEnded}
                    className="w-full rounded-full"
                  >
                    <source src={verse.audio} type="audio/mpeg" />
                  </audio>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <label className="font-semibold text-gray-700">تشغيل تلقائي حتى نهاية المصحف</label>
                <input
                  type="checkbox"
                  checked={autoContinue}
                  onChange={e => setAutoContinue(e.target.checked)}
                  className="w-6 h-6 accent-[#1e7850]"
                />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
