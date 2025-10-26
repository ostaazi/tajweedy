'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ========== Types ========== */
type WordSegment = [number, number, number]; // [position(1-based), startMs, endMs] — سنخزنها مطلقة
type VerseTimestamp = {
  verse_key: string;
  timestamp_from: number;
  timestamp_to: number;
  segments?: WordSegment[]; // نسبية للآية
};
type ChapterAudioWithSegments = {
  audio_url: string;
  timestamps?: VerseTimestamp[];
};
type VerseWord = { text_uthmani: string; position?: number; type?: string };

/* ========== Hook: تظليل متزامن (بحث ثنائي) ========== */
function useWordSync(
  audioRef: React.RefObject<HTMLAudioElement>,
  segmentsAbs: WordSegment[],
  pos2idx: Map<number, number> | null,
  setIdx: (i: number) => void
) {
  useEffect(() => {
    const el = audioRef.current;
    if (!el || segmentsAbs.length === 0 || !pos2idx) return;

    const starts = segmentsAbs.map(s => s[1]);
    const findIdx = (tMs: number) => {
      let lo = 0, hi = starts.length - 1, ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (starts[mid] <= tMs) { ans = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      if (ans === -1) return -1;
      return tMs < segmentsAbs[ans][2] ? ans : -1;
    };

    const onTime = () => {
      const t = (audioRef.current?.currentTime ?? 0) * 1000;
      const k = findIdx(t);
      if (k !== -1) {
        const pos1 = segmentsAbs[k][0];
        const di = pos2idx.get(pos1);
        if (typeof di === 'number') {
          setIdx(di);
          const node = document.querySelector(`[data-word-idx="${di}"]`) as HTMLElement | null;
          node?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      }
    };

    const attach = () => { el.addEventListener('timeupdate', onTime); el.addEventListener('seeked', onTime); };
    if (el.readyState >= 1) attach(); else el.addEventListener('loadedmetadata', attach, { once: true });
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('seeked', onTime);
      el.removeEventListener('loadedmetadata', attach as any);
    };
  }, [audioRef, segmentsAbs, pos2idx, setIdx]);
}

/* ========== أدوات بسيطة ========== */
const getLS = (k: string) => (typeof window === 'undefined' ? null : window.localStorage.getItem(k));
const setLS = (k: string, v: string) => { if (typeof window !== 'undefined') window.localStorage.setItem(k, v); };

/* =========================================================
   صفحة المزامنة — مستقرة ومبسّطة
   ========================================================= */
export default function Page() {
  const [loading, setLoading] = useState(true);

  // اختيارات بسيطة
  const [surah, setSurah] = useState<number>(1);
  const [ayah, setAyah] = useState<number>(1);

  // نص الآية وكلماتها
  const [fullText, setFullText] = useState<string>('');
  const [words, setWords] = useState<VerseWord[]>([]);
  const [pos2idx, setPos2idx] = useState<Map<number, number> | null>(null);

  // الصوت + المقاطع
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [segmentsAbs, setSegmentsAbs] = useState<WordSegment[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);

  // للتشخيص
  const [activeRecitationId, setActiveRecitationId] = useState<number | null>(null);
  const [supportedIds, setSupportedIds] = useState<number[]>([]);
  const [probing, setProbing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useWordSync(audioRef, segmentsAbs, pos2idx, setHighlight);

  /* ------ جلب نص الآية والكلمات ------ */
  const verseKey = `${surah}:${ayah}`;
  const surahAyahKey = `syncSupport:${surah}:${ayah}`; // للتخزين المؤقت

  const fetchTextAndWords = async () => {
    // نص كامل (احتياطي)
    const vRes = await fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/quran-uthmani`);
    const vJson = await vRes.json();
    if (vJson?.status === 'OK') setFullText(vJson.data.text);

    // كلمات مع position + تصفية type==='word'
    const wRes = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=ar&words=true&word_fields=text_uthmani,position,type`);
    const wJson = await wRes.json();
    const all: VerseWord[] = wJson?.verse?.words ?? [];
    const onlyWords = all.filter(w => w.type === 'word');
    const map = new Map<number, number>();
    onlyWords.forEach((w, i) => { if (typeof w.position === 'number') map.set(w.position, i); });
    setWords(onlyWords);
    setPos2idx(map);
  };

  /* ------ فاحص: ابحث عن أول recitation_id يعيد segments>0 لهذه الآية ------ */
  const probeForSegments = async (): Promise<{ id: number | null; list: number[]; url: string | null; segsAbs: WordSegment[]; }> => {
    setProbing(true);
    const ok: number[] = [];
    try {
      // جلب قائمة التلاوات الرسمية
      const rRes = await fetch('https://api.quran.com/api/v4/resources/recitations?language=ar');
      const rJson = await rRes.json();
      const recitations: { id: number; reciter_name: string }[] = rJson?.recitations ?? [];

      // إن وُجد Cache سابق، جربه أولًا
      const cached = getLS(surahAyahKey);
      let preferred: number | null = null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { preferred: number | null; supported: number[] };
          preferred = parsed.preferred ?? null;
          if (preferred) {
            const okFirst = await tryLoad(preferred);
            if (okFirst) return okFirst;
          }
        } catch {}
      }

      // جرّب أول 30 قارئًا (يكفي عمليًا — يمكن زيادتها)
      const MAX = Math.min(recitations.length, 30);
      for (let i = 0; i < MAX; i++) {
        const rid = recitations[i].id;
        const loaded = await tryLoad(rid);
        if (loaded) {
          ok.push(rid);
          // نكتفي بأول واحد للعودة السريعة، لكن سنجمع قائمة المدعومين كذلك
          // (نستكمل المحاولة لجمع أكثر، لكن لتقليل زمن الشبكة يمكن الخروج مباشرة)
          // break; // إن أردت الخروج عند أول نجاح، فعّل هذا السطر
        }
      }

      // خزّن النتيجة
      setLS(surahAyahKey, JSON.stringify({ preferred: ok[0] ?? null, supported: ok }));
      return { id: ok[0] ?? null, list: ok, url: null, segsAbs: [] };

      // دالة داخلية: تحاول تحميل المقاطع لهذا rid
      async function tryLoad(rid: number) {
        const url = `https://api.quran.com/api/v4/recitations/${rid}/by_chapter/${surah}?segments=true`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const file: ChapterAudioWithSegments | null = data?.audio_file ?? null;
        const ts = file?.timestamps ?? [];
        const verseTs = ts.find(t => t.verse_key === verseKey);
        if (verseTs?.segments && Array.isArray(verseTs.segments) && verseTs.segments.length > 0 && file?.audio_url) {
          const base = verseTs.timestamp_from || 0;
          const segsAbs: WordSegment[] = verseTs.segments.map(s => [s[0], base + s[1], base + s[2]]);
          return { id: rid, list: [rid], url: file.audio_url, segsAbs };
        }
        return null;
      }
    } finally {
      setProbing(false);
      setSupportedIds(ok => ok); // لا تغيّر هنا (نحدّث لاحقًا بعد النداء الأعلى)
    }
  };

  /* ------ الجلب الرئيسي للآية + المزامنة ------ */
  const fetchAll = async () => {
    setLoading(true);
    setAudioUrl(null);
    setSegmentsAbs([]);
    setHighlight(-1);
    setActiveRecitationId(null);
    setSupportedIds([]);

    try {
      await fetchTextAndWords();

      // لو ما فيه كلمات بعد لأي سبب، لا تكمل
      if (!pos2idx || (pos2idx && pos2idx.size === 0)) {
        // سيُحدث pos2idx بعد setState—نتابع على أي حال
      }

      // جرّب العثور تلقائيًا على recitation_id مدعوم بالمقاطع
      const result = await probeForSegments();
      // إن رجع tryLoad مدمجًا (url + segs)، استخدمه مباشرة، وإلا جرب preferred من الكاش
      if ((result as any).url) {
        const { id, url, segsAbs } = result as any;
        setActiveRecitationId(id);
        setAudioUrl(url);
        setSegmentsAbs(segsAbs);
        setSupportedIds([id]);
      } else {
        // لم يرجع مباشرة (كنا نجمع قائمة فقط). جرّب preferred من الـLS إن وُجد.
        let preferred: number | null = null;
        try {
          const cached = getLS(surahAyahKey);
          if (cached) preferred = (JSON.parse(cached) as any)?.preferred ?? null;
        } catch {}
        if (preferred) {
          const url = `https://api.quran.com/api/v4/recitations/${preferred}/by_chapter/${surah}?segments=true`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const file: ChapterAudioWithSegments | null = data?.audio_file ?? null;
            const ts = file?.timestamps ?? [];
            const verseTs = ts.find((t: any) => t.verse_key === verseKey);
            if (verseTs?.segments && file?.audio_url) {
              const base = verseTs.timestamp_from || 0;
              const segsAbs: WordSegment[] = verseTs.segments.map((s: any) => [s[0], base + s[1], base + s[2]]);
              setActiveRecitationId(preferred);
              setAudioUrl(file.audio_url);
              setSegmentsAbs(segsAbs);
            }
          }
        }
        // حدّث قائمة المدعومين (لو خزّناها)
        try {
          const cached = getLS(surahAyahKey);
          if (cached) setSupportedIds((JSON.parse(cached) as any)?.supported ?? []);
        } catch {}
      }

      // إن لم نجد مقاطع لأي قارئ: ما زال الصوت يعمل بدون تظليل (يمكنك إضافة Fallback EveryAyah لو رغبت)
      if (!audioUrl && segmentsAbs.length === 0) {
        // Fallback: اجلب MP3 آية مفردة من EveryAyah (اختياري)
        const S = String(surah).padStart(3, '0');
        const A = String(ayah).padStart(3, '0');
        setAudioUrl(`https://everyayah.com/data/Alafasy_128kbps/${S}${A}.mp3`);
      }
    } catch (e) {
      console.error('fetchAll error', e);
    } finally {
      setLoading(false);
    }
  };

  /* ------ أول تحميل ------ */
  useEffect(() => { fetchAll(); /* eslint-disable react-hooks/exhaustive-deps */ }, []);

  /* ------ إعادة الجلب عند تغيير السورة/الآية ------ */
  useEffect(() => { if (surah && ayah) fetchAll(); /* eslint-disable react-hooks/exhaustive-deps */ }, [surah, ayah]);

  /* ------ واجهة بسيطة للغاية ------ */
  const syncOn = useMemo(() => segmentsAbs.length > 0 && (pos2idx?.size ?? 0) > 0, [segmentsAbs, pos2idx]);

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow border p-6">
        <h1 className="text-2xl font-bold mb-4 text-[#1e7850]">تجربة مزامنة التظليل — نسخة مستقرة</h1>

        {/* اختيار السورة/الآية */}
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            min={1}
            max={114}
            value={surah}
            onChange={(e) => setSurah(Math.max(1, Math.min(114, Number(e.target.value) || 1)))}
            className="w-28 p-2 border rounded"
            placeholder="سورة"
            aria-label="Surah"
          />
          <input
            type="number"
            min={1}
            value={ayah}
            onChange={(e) => setAyah(Math.max(1, Number(e.target.value) || 1))}
            className="w-28 p-2 border rounded"
            placeholder="آية"
            aria-label="Ayah"
          />
          <button onClick={fetchAll} className="px-4 py-2 rounded bg-[#1e7850] text-white font-semibold">تطبيق</button>
        </div>

        {/* نص الآية بكلمات قابلة للنقر */}
        <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded border mb-4" dir="rtl">
          {words.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {words.map((w, i) => (
                <span
                  key={i}
                  data-word-idx={i}
                  onClick={() => {
                    setHighlight(i);
                    if (syncOn && audioRef.current) {
                      const pos1 = w.position ?? -1;
                      const seg = segmentsAbs.find(s => s[0] === pos1);
                      if (seg) {
                        audioRef.current.currentTime = seg[1] / 1000;
                        audioRef.current.play().catch(() => {});
                      }
                    }
                  }}
                  className={`cursor-pointer px-2 py-1 rounded transition ${
                    highlight === i ? 'bg-green-200 text-[#1e7850] font-bold' : 'hover:bg-green-100'
                  }`}
                >
                  {w.text_uthmani}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-center">{fullText || '...'}</div>
          )}
        </div>

        {/* الصوت */}
        <div className="bg-gray-50 border rounded p-3 mb-3">
          <p className="text-sm text-center mb-2">
            {syncOn ? '✓ مزامنة الكلمة فعّالة' : '— لا توجد مقاطع لهذه الآية (سيُشغَّل الصوت فقط)'}{probing ? ' • جارِ البحث عن قارئ مدعوم...' : ''}
          </p>
          {audioUrl ? (
            <audio ref={audioRef} key={audioUrl} controls className="w-full" preload="metadata">
              <source src={audioUrl} type="audio/mpeg" />
              المتصفح لا يدعم تشغيل الصوت
            </audio>
          ) : (
            <div className="text-center text-sm text-gray-500">لا يوجد رابط صوت حتى الآن</div>
          )}
        </div>

        {/* شريط تشخيصي صغير */}
        <div className="text-xs bg-gray-50 border rounded p-2 font-mono">
          <div>Surah: {surah} — Ayah: {ayah}</div>
          <div>Active Recitation ID: {activeRecitationId ?? '—'}</div>
          <div>Supported IDs (cached): {(supportedIds || []).join(', ') || '—'}</div>
          <div>Segments: {segmentsAbs.length}</div>
          <div>First seg (ms): {segmentsAbs[0]?.[1]} → {segmentsAbs[0]?.[2] ?? ''}</div>
        </div>

        {loading && <div className="mt-3 text-sm text-gray-600">جاري التحميل...</div>}
      </div>
    </div>
  );
    }
