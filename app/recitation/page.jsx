'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ===== Types =====
type WordSegment = [number, number, number]; // [word_position(1-based), start_ms, end_ms]
type VerseTimestamp = {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  duration?: number;
  segments?: WordSegment[];
};

type ChapterAudioWithSegments = {
  id: number;
  chapter_id: number;
  format: string;
  audio_url: string;
  timestamps?: VerseTimestamp[];
};

type RecitationItem = {
  id: number;
  reciter_name: string;
  translated_name?: { name: string };
  style?: string;
};

type SurahMeta = { id: number; name: string; subtext: string | null; verses_count: number };

type VerseWord = {
  text_uthmani: string;
  position?: number; // 1-based position inside the verse
  type?: string;     // 'word' | 'end' | 'pause'...
};

type VerseState = {
  text: string;
  surah: string;
  surahNumber: number;
  number: number; // ayah number
  audio: string | null;
  reciter: string;
} | null;

// ===== Local list (for UI labels / EveryAyah fallback only) =====
const RECITERS_UI = [
  { id: 0, name: 'اسم القارئ', subtext: 'غير محدد (عشوائي)', reciterName: null as string | null, folder: null as string | null },
  { id: 1, name: 'مشاري العفاسي', subtext: null, reciterName: 'Mishari Rashid al-`Afasy', folder: 'Alafasy_128kbps' },
  { id: 2, name: 'عبد الباسط عبد الصمد', subtext: null, reciterName: 'AbdulBaset AbdulSamad', folder: 'Abdul_Basit_Mujawwad_128kbps' },
  { id: 3, name: 'عبد الرحمن السديس', subtext: null, reciterName: 'Abdurrahmaan As-Sudais', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
  { id: 4, name: 'محمد صديق المنشاوي', subtext: null, reciterName: 'Mohamed Siddiq al-Minshawi', folder: 'Minshawy_Mujawwad_192kbps' },
  { id: 5, name: 'محمود خليل الحصري', subtext: null, reciterName: 'Mahmoud Khalil Al-Hussary', folder: 'Husary_128kbps' },
  { id: 6, name: 'أبو بكر الشاطري', subtext: null, reciterName: 'Abu Bakr al-Shatri', folder: 'Abu_Bakr_Ash-Shaatree_128kbps' },
] as const;

// ===== Component =====
export default function RecitationPage() {
  // Core state
  const [verse, setVerse] = useState<VerseState>(null);
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [recitations, setRecitations] = useState<RecitationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Word-level state
  const [words, setWords] = useState<VerseWord[]>([]);
  const [positionToIndex, setPositionToIndex] = useState<Map<number, number> | null>(null);
  const [wordSegments, setWordSegments] = useState<WordSegment[]>([]);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);

  // UI selections
  const [selectedReciter, setSelectedReciter] = useState<number>(0);
  const [selectedSurah, setSelectedSurah] = useState<number>(0);
  const [selectedAyah, setSelectedAyah] = useState<number>(0);
  const [availableAyahs, setAvailableAyahs] = useState<{ number: number; label: string; subtext: string | null }[]>([
    { number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' },
  ]);

  // Recording (kept from your original file)
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ===== Helpers =====
  const normalize = (s: string) => s.normalize('NFKC').toLowerCase().trim();

  const resolveRecitationId = (name: string | null): number | null => {
    if (!name || recitations.length === 0) return null;
    const target = normalize(name);
    let found = recitations.find((r) => normalize(r.reciter_name).includes(target));
    if (!found) {
      found = recitations.find((r) => normalize(r.translated_name?.name ?? '').includes(target));
    }
    if (!found) {
      // fallback: partial reverse matching
      found = recitations.find((r) => target.includes(normalize(r.reciter_name)));
    }
    return found?.id ?? null;
  };

  const makeEveryAyahUrl = (folder: string | null, sNum: number, aNum: number) => {
    if (!folder) return null;
    const paddedSurah = String(sNum).padStart(3, '0');
    const paddedAyah = String(aNum).padStart(3, '0');
    return `https://everyayah.com/data/${folder}/${paddedSurah}${paddedAyah}.mp3`;
  };

  // ===== Effects: bootstrap =====
  useEffect(() => {
    (async () => {
      try {
        // Recitations list
        const recRes = await fetch('https://api.quran.com/api/v4/resources/recitations?language=ar');
        const recData = await recRes.json();
        setRecitations(recData?.recitations ?? []);
      } catch (e) {
        console.warn('تعذر جلب قائمة القراءات', e);
      }
      try {
        // Surahs meta
        const response = await fetch('https://api.alquran.cloud/v1/meta');
        const data = await response.json();
        const surahsList: SurahMeta[] = [
          { id: 0, name: 'اسم السورة', subtext: 'غير محدد (عشوائي)', verses_count: 0 },
          ...data.data.surahs.references.map((s: any) => ({
            id: s.number,
            name: s.name,
            subtext: null,
            verses_count: s.numberOfAyahs,
          })),
        ];
        setSurahs(surahsList);
      } catch (e) {
        console.warn('تعذر جلب السور', e);
      }
      // Load initial verse
      fetchVerse();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ayah options when surah changes
  useEffect(() => {
    if (selectedSurah > 0) {
      const surah = surahs.find((s) => s.id === selectedSurah);
      if (surah) {
        const ayahs = [{ number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' } as const];
        const arr = Array.from({ length: surah.verses_count }, (_, i) => ({
          number: i + 1,
          label: `الآية ${i + 1}`,
          subtext: null,
        }));
        setAvailableAyahs([...ayahs, ...arr]);
        setSelectedAyah(0);
      }
    } else {
      setAvailableAyahs([{ number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' }]);
    }
  }, [selectedSurah, surahs]);

  // ===== Fetch chapter segments =====
  const fetchChapterSegments = async (recitationId: number, chapterNumber: number): Promise<ChapterAudioWithSegments | null> => {
    try {
      const url = `https://api.quran.com/api/v4/recitations/${recitationId}/by_chapter/${chapterNumber}?segments=true`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.audio_file ?? null) as ChapterAudioWithSegments | null;
    } catch (error) {
      console.error('خطأ في جلب المقاطع:', error);
      return null;
    }
  };

  // ===== Main fetchVerse =====
  const fetchVerse = async () => {
    setLoading(true);
    setAudioBlob(null);
    setHighlightedWordIndex(-1);
    setWordSegments([]);
    setPositionToIndex(null);
    setWords([]);

    try {
      let surahNum = selectedSurah === 0 ? Math.floor(Math.random() * 114) + 1 : selectedSurah;

      let ayahNum = selectedAyah;
      if (ayahNum === 0 && surahs.length > 0) {
        const surah = surahs.find((s) => s.id === surahNum) || { verses_count: 7 };
        ayahNum = Math.floor(Math.random() * surah.verses_count) + 1;
      } else if (ayahNum === 0) {
        ayahNum = 1;
      }

      // Reciter from UI
      const chosenReciterUI =
        selectedReciter === 0
          ? RECITERS_UI[Math.floor(Math.random() * (RECITERS_UI.length - 1)) + 1]
          : RECITERS_UI.find((r) => r.id === selectedReciter) ?? RECITERS_UI[1];

      const verseKey = `${surahNum}:${ayahNum}`;

      // 1) Fetch verse text (for fallback/full text)
      const verseRes = await fetch(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/quran-uthmani`);
      const verseJson = await verseRes.json();

      if (verseJson?.status === 'OK') {
        const textData = verseJson.data;

        // 2) Fetch words (Uthmani) with positions & filter to type==='word'
        const wordsRes = await fetch(
          `https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=ar&words=true&word_fields=text_uthmani,position,type`
        );
        const wordsJson = await wordsRes.json();
        const allWords: VerseWord[] = wordsJson?.verse?.words ?? [];
        const displayWords = allWords.filter((w) => w.type === 'word');

        // Map: position(1-based) -> displayIndex(0-based)
        const posToIdx = new Map<number, number>();
        displayWords.forEach((w, i) => {
          if (typeof w.position === 'number') posToIdx.set(w.position, i);
        });

        setWords(displayWords);
        setPositionToIndex(posToIdx);

        // 3) Try to resolve recitationId & fetch chapter audio with segments
        const recitationId = resolveRecitationId(chosenReciterUI.reciterName);
        let audioUrl: string | null = null;
        let segments: WordSegment[] = [];

        if (recitationId) {
          const chapterData = await fetchChapterSegments(recitationId, surahNum);
          const timestamps = chapterData?.timestamps ?? [];
          const verseTimestamp = timestamps.find((t) => t.verse_key === verseKey);

          if (verseTimestamp?.segments && chapterData?.audio_url) {
            audioUrl = chapterData.audio_url;
            segments = verseTimestamp.segments;
            setWordSegments(segments);
          }
        }

        // 4) Fallback to EveryAyah per-ayah mp3
        if (!audioUrl) {
          audioUrl = makeEveryAyahUrl(chosenReciterUI.folder, surahNum, ayahNum);
        }

        setVerse({
          text: textData.text,
          surah: textData.surah.name,
          surahNumber: surahNum,
          number: ayahNum,
          audio: audioUrl ?? null,
          reciter: chosenReciterUI.name,
        });
      }
    } catch (e) {
      console.error('خطأ في جلب الآية:', e);
      setVerse({
        text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        surah: 'الفاتحة',
        surahNumber: 1,
        number: 1,
        audio: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
        reciter: 'مشاري العفاسي',
      });
      setWords([]);
      setPositionToIndex(null);
      setWordSegments([]);
    } finally {
      setLoading(false);
    }
  };

  // ===== Sync highlighting after audio + segments are ready =====
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || wordSegments.length === 0 || !positionToIndex) return;

    let attached = false;

    const onTimeUpdate = () => {
      const t = (audioRef.current?.currentTime ?? 0) * 1000;
      const k = wordSegments.findIndex((seg) => t >= seg[1] && t < seg[2]);
      if (k !== -1) {
        const pos1 = wordSegments[k][0]; // 1-based
        const dispIdx = positionToIndex.get(pos1);
        if (typeof dispIdx === 'number') {
          setHighlightedWordIndex(dispIdx);
          const el = document.querySelector(`[data-word-idx="${dispIdx}"]`) as HTMLElement | null;
          el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      }
    };

    const attach = () => {
      if (attached) return;
      audioEl.addEventListener('timeupdate', onTimeUpdate);
      audioEl.addEventListener('seeked', onTimeUpdate);
      attached = true;
      (window as any).__onTimeUpdateQuran = onTimeUpdate;
    };

    if (audioEl.readyState >= 1) {
      attach();
    } else {
      audioEl.addEventListener('loadedmetadata', attach, { once: true });
    }

    return () => {
      const handler = (window as any).__onTimeUpdateQuran;
      if (handler) {
        audioEl.removeEventListener('timeupdate', handler);
        audioEl.removeEventListener('seeked', handler);
        (window as any).__onTimeUpdateQuran = null;
      }
      audioEl.removeEventListener('loadedmetadata', attach as any);
    };
  }, [wordSegments, verse?.audio, positionToIndex]);

  // ===== UI helpers =====
  const syncAvailable = useMemo(() => wordSegments.length > 0 && positionToIndex, [wordSegments, positionToIndex]);

  // ===== Recording (unchanged) =====
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => audioChunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setTimeout(() => {
        if (recorder.state === 'recording') stopRecording();
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

  // ===== Render =====
  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10 bg-gray-50">
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
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">قسم التلاوة والتدريب</h1>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl shadow-lg border border-gray-100 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 text-lg">جاري تحميل الآية...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-1 font-amiri">{verse?.surah}</h2>
              <p className="text-gray-600 font-amiri">الآية {verse?.number}</p>
            </div>

            <div className="quran-text bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 mb-6 shadow-inner overflow-x-auto">
              {words.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                  {words.map((word, index) => (
                    <span
                      key={index}
                      data-word-idx={index}
                      onClick={() => {
                        setHighlightedWordIndex(index);
                        if (syncAvailable && audioRef.current) {
                          const pos1 = words[index].position ?? -1;
                          const seg = wordSegments.find((s) => s[0] === pos1);
                          if (seg) {
                            audioRef.current.currentTime = seg[1] / 1000;
                            audioRef.current.play().catch(() => {});
                          }
                        }
                      }}
                      className={`cursor-pointer px-2 py-1 rounded-lg transition-all ${
                        highlightedWordIndex === index
                          ? 'bg-green-200 text-[#1e7850] font-bold shadow-md scale-110'
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
                {RECITERS_UI.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.subtext ? `${r.name}  ${r.subtext}` : r.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSurah}
                onChange={(e) => setSelectedSurah(Number(e.target.value))}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white"
              >
                {surahs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subtext ? `${s.name}  ${s.subtext}` : `${s.id}. ${s.name}`}
                  </option>
                ))}
              </select>

              <select
                value={selectedAyah}
                onChange={(e) => setSelectedAyah(Number(e.target.value))}
                disabled={selectedSurah === 0}
                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-[#1e7850] focus:outline-none text-center font-semibold bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {availableAyahs.map((a) => (
                  <option key={a.number} value={a.number}>
                    {a.subtext ? `${a.label}  ${a.subtext}` : a.label}
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
                استمع للتلاوة الصحيحة - القارئ:{' '}
                <span className="font-bold">{verse?.reciter}</span>
                {syncAvailable ? <span className="text-green-600 font-bold ml-2">✓ مزامنة دقيقة</span> : null}
              </p>

              {verse?.audio ? (
                <audio
                  ref={audioRef}
                  key={verse.audio}
                  controls
                  className="w-full rounded-full"
                  preload="metadata"
                >
                  <source src={verse.audio} type="audio/mpeg" />
                  المتصفح لا يدعم تشغيل الصوت
                </audio>
              ) : (
                <p className="text-center text-gray-500 text-sm">لا يوجد رابط صوت متاح.</p>
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
                <p className="text-xs text-gray-600 text-center mt-2">💡 ميزة تحليل الصوت بالذكاء الاصطناعي ستكون متاحة لاحقًا</p>
              </div>
            )}

            <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                💡 <strong>تلميح:</strong>{' '}
                {syncAvailable
                  ? 'المزامنة التلقائية مفعّلة! الكلمات ستُظلّل تلقائيًا مع القراءة. انقر على أي كلمة للقفز إلى موضعها.'
                  : 'انقر على أي كلمة لتمييزها. إن لم يظهر التظليل التلقائي فربما لا تتوفر بيانات المقاطع لهذا القارئ/السورة.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
