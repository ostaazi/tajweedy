'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ===================== Hook: التظليل المتزامن ===================== */
function useWordSync(audioRef, segmentsAbs, pos2idx, setHighlighted) {
  useEffect(() => {
    const el = audioRef.current;
    if (!el || segmentsAbs.length === 0 || !pos2idx) return;

    const starts = segmentsAbs.map((s) => s[1]);
    const findSegIndex = (tMs) => {
      let lo = 0, hi = starts.length - 1, ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (starts[mid] <= tMs) { ans = mid; lo = mid + 1; }
        else { hi = mid - 1; }
      }
      if (ans === -1) return -1;
      return tMs < segmentsAbs[ans][2] ? ans : -1;
    };

    const onTime = () => {
      const tMs = (audioRef.current?.currentTime ?? 0) * 1000;
      const k = findSegIndex(tMs);
      if (k !== -1) {
        const pos1 = segmentsAbs[k][0]; // 1-based
        const idx = pos2idx.get(pos1);
        if (typeof idx === 'number') {
          setHighlighted(idx);
          const node = document.querySelector(`[data-word-idx="${idx}"]`);
          node?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      }
    };

    const attach = () => { el.addEventListener('timeupdate', onTime); el.addEventListener('seeked', onTime); };
    if (el.readyState >= 1) attach();
    else el.addEventListener('loadedmetadata', attach, { once: true });

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('seeked', onTime);
      el.removeEventListener('loadedmetadata', attach);
    };
  }, [audioRef, segmentsAbs, pos2idx, setHighlighted]);
}

/* ===================== أدوات مساعدة ===================== */
const makeEveryAyahUrl = (folder, s, a) => {
  const S = String(s).padStart(3, '0'); const A = String(a).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${S}${A}.mp3`;
};
const lsGet = (k, fallback = null) => {
  try { if (typeof window === 'undefined') return fallback; const v = window.localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (k, v) => { try { if (typeof window !== 'undefined') window.localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const UI_RECITERS = [
  { id: 0, nameAr: 'اسم القارئ', note: 'غير محدد (عشوائي)', match: [] },
  { id: 1, nameAr: 'مشاري العفاسي', note: null, match: ['mishari', 'afasy', 'مشاري', 'العفاسي'] },
  { id: 2, nameAr: 'عبد الباسط عبد الصمد', note: null, match: ['abdul', 'basit', 'عبد', 'الباسط'] },
  { id: 3, nameAr: 'عبد الرحمن السديس', note: null, match: ['sudais', 'السديس'] },
  { id: 4, nameAr: 'محمد صديق المنشاوي', note: null, match: ['minshawi', 'المنشاوي'] },
  { id: 5, nameAr: 'محمود خليل الحصري', note: null, match: ['husary', 'الحصري'] },
  { id: 6, nameAr: 'أبو بكر الشاطري', note: null, match: ['shatri', 'الشاطري'] },
];

/* ===================== الصفحة ===================== */
export default function RecitationPage() {
  // اختيار
  const [surah, setSurah] = useState(18);
  const [ayah, setAyah] = useState(1);
  const [selectedReciter, setSelectedReciter] = useState(0);

  // نص وكلمات
  const [fullText, setFullText] = useState('');
  const [words, setWords] = useState([]);
  const [pos2idx, setPos2idx] = useState(new Map());

  // الصوت والمقاطع
  const [audioUrl, setAudioUrl] = useState(null);
  const [segmentsAbs, setSegmentsAbs] = useState([]);
  const [highlight, setHighlight] = useState(-1);

  // التعريفات
  const [surahs, setSurahs] = useState([]);
  const [availableAyahs, setAvailableAyahs] = useState([]);
  const [chapterReciters, setChapterReciters] = useState([]);
  const [activeChapterReciterId, setActiveChapterReciterId] = useState(null);
  const [reciterLabel, setReciterLabel] = useState('—');

  // تشخيص
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState('');

  // استكشاف القرّاء المدعومين (الخيار 2)
  const [exploring, setExploring] = useState(false);
  const [exploreResults, setExploreResults] = useState([]); // [{id,name,hasSegmentsForSurah,hasSegmentsForAyah}]
  const [progress, setProgress] = useState({ tried: 0, total: 0 });

  const audioRef = useRef(null);
  useWordSync(audioRef, segmentsAbs, pos2idx, setHighlight);

  const verseKey = `${surah}:${ayah}`;
  const exploreCacheKey = (s) => `supported:list:chap${s}`; // يخزن قائمة القراء المدعومين للسورة

  /* --------- جلب السور --------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('https://api.alquran.cloud/v1/meta');
        const j = await r.json();
        const list = [
          { id: 0, name: 'اسم السورة', subtext: 'غير محدد (عشوائي)', verses_count: 0 },
          ...j.data.surahs.references.map((s) => ({ id: s.number, name: s.name, verses_count: s.numberOfAyahs })),
        ];
        setSurahs(list);
      } catch {}
    })();
  }, []);

  /* --------- آيات السورة --------- */
  useEffect(() => {
    if (surah > 0) {
      const s = surahs.find((x) => x.id === surah);
      if (s) {
        const arr = [{ number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' }];
        for (let i = 1; i <= s.verses_count; i++) arr.push({ number: i, label: `الآية ${i}` });
        setAvailableAyahs(arr);
        setAyah(ayah > 0 && ayah <= s.verses_count ? ayah : 1);
      }
    } else {
      setAvailableAyahs([{ number: 0, label: 'رقم الآية', subtext: 'غير محدد (عشوائي)' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, surahs.length]);

  /* --------- جلب قائمة chapter_reciters --------- */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('https://api.quran.com/api/v4/resources/chapter_reciters?language=ar', { cache: 'no-store' });
        const j = await r.json();
        const list = Array.isArray(j) ? j : j?.chapter_reciters || j?.reciters || [];
        setChapterReciters(list);
      } catch {}
    })();
  }, []);

  /* --------- دوال مساعدة --------- */
  const resolveChapterReciter = (uiIdx) => {
    if (!chapterReciters.length) return null;
    // عشوائي إن لم يحدد
    if (uiIdx === 0) {
      const any = chapterReciters[Math.floor(Math.random() * chapterReciters.length)];
      return { id: any.id, label: any.reciter_name || any.name || `Reciter #${any.id}` };
    }
    const ui = UI_RECITERS.find((r) => r.id === uiIdx);
    const norm = (s) => (s || '').toLowerCase();
    const hit = chapterReciters.find((cr) => {
      const hay = `${cr.reciter_name || ''} ${cr.name || ''}`.toLowerCase();
      return (ui.match || []).some((m) => hay.includes(norm(m)));
    });
    if (hit) return { id: hit.id, label: hit.reciter_name || hit.name || `Reciter #${hit.id}` };
    const any = chapterReciters[Math.floor(Math.random() * chapterReciters.length)];
    return { id: any.id, label: any.reciter_name || any.name || `Reciter #${any.id}` };
  };

  const fetchTextAndWords = async () => {
    setLastError('');
    const v = await fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/quran-uthmani`);
    const j = await v.json();
    if (j?.status === 'OK') setFullText(j.data.text);

    const w = await fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=ar&words=true&word_fields=text_uthmani,position,type`);
    const wj = await w.json();
    const all = wj?.verse?.words || [];
    const only = all.filter((x) => x.type === 'word');
    const map = new Map();
    only.forEach((x, i) => { if (typeof x.position === 'number') map.set(x.position, i); });
    setWords(only);
    setPos2idx(map);
  };

  const loadChapterAudio = async (chapterReciterId) => {
    try {
      const url = `https://api.quran.com/api/v4/chapter_reciters/${chapterReciterId}/${surah}?segments=true`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`chapter_reciters ${chapterReciterId} → ${surah} : ${r.status}`);
      const j = await r.json();
      const audio = j?.audio_file?.audio_url || null;
      const ts = j?.audio_file?.timestamps || [];
      // مقاطع الآية الحالية إن وُجدت
      const current = ts.find((t) => t.verse_key === verseKey);
      let segs = current?.segments || [];
      if (!segs?.length) {
        // حوّل كل مقاطع السورة لقفز بالنقر على الأقل
        segs = ts.flatMap((t) => Array.isArray(t.segments) ? t.segments : []);
      }
      return { audio, segs };
    } catch (e) {
      setLastError(String(e));
      return { audio: null, segs: [] };
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    setSegmentsAbs([]);
    setAudioUrl(null);
    setHighlight(-1);
    try {
      await fetchTextAndWords();
      const resolved = resolveChapterReciter(selectedReciter);
      setActiveChapterReciterId(resolved?.id || null);
      setReciterLabel(resolved?.label || '—');
      if (resolved?.id) {
        const { audio, segs } = await loadChapterAudio(resolved.id);
        setAudioUrl(audio || makeEveryAyahUrl('Alafasy_128kbps', surah, ayah));
        setSegmentsAbs(segs || []);
      } else {
        setAudioUrl(makeEveryAyahUrl('Alafasy_128kbps', surah, ayah));
        setSegmentsAbs([]);
      }
    } finally {
      setLoading(false);
    }
  };

  /* --------- أول تحميل + عند تغيير السورة/الآية/القارئ --------- */
  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [surah, ayah, selectedReciter]);

  const syncOn = useMemo(() => segmentsAbs.length > 0 && (pos2idx?.size || 0) > 0, [segmentsAbs, pos2idx]);

  /* ===================== استكشاف القرّاء المدعومين (الخيار 2) ===================== */
  const exploreSupported = async () => {
    if (!chapterReciters.length) return;
    setExploring(true);
    setExploreResults([]);
    setProgress({ tried: 0, total: chapterReciters.length });

    // جرّب الكاش أولًا
    const cached = lsGet(exploreCacheKey(surah), null);
    if (cached && Array.isArray(cached)) {
      setExploreResults(cached);
      setExploring(false);
      return;
    }

    const results = [];
    // نجرب بشكل متتابع حتى لا نجهد الـ API
    for (let i = 0; i < chapterReciters.length; i++) {
      const cr = chapterReciters[i];
      setProgress({ tried: i + 1, total: chapterReciters.length });
      try {
        const url = `https://api.quran.com/api/v4/chapter_reciters/${cr.id}/${surah}?segments=true`;
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) { results.push({ id: cr.id, name: cr.reciter_name || cr.name || `Reciter #${cr.id}`, hasSegmentsForSurah: false, hasSegmentsForAyah: false }); continue; }
        const j = await r.json();
        const ts = j?.audio_file?.timestamps || [];
        const hasForSurah = ts.some((t) => Array.isArray(t.segments) && t.segments.length);
        const hasForAyah = ts.some((t) => t.verse_key === verseKey && Array.isArray(t.segments) && t.segments.length);
        results.push({
          id: cr.id,
          name: cr.reciter_name || cr.name || `Reciter #${cr.id}`,
          hasSegmentsForSurah: !!hasForSurah,
          hasSegmentsForAyah: !!hasForAyah,
        });
      } catch {
        results.push({ id: cr.id, name: cr.reciter_name || cr.name || `Reciter #${cr.id}`, hasSegmentsForSurah: false, hasSegmentsForAyah: false });
      }
    }

    // رتب: الداعمة للآية أولًا، ثم الداعمة للسورة، ثم الباقي
    results.sort((a, b) => {
      if (a.hasSegmentsForAyah !== b.hasSegmentsForAyah) return a.hasSegmentsForAyah ? -1 : 1;
      if (a.hasSegmentsForSurah !== b.hasSegmentsForSurah) return a.hasSegmentsForSurah ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    setExploreResults(results);
    lsSet(exploreCacheKey(surah), results);
    setExploring(false);
  };

  const useExploredReciter = async (id, name) => {
    setSelectedReciter(0); // لتجاهل قائمة الواجهة
    setActiveChapterReciterId(id);
    setReciterLabel(name || `Reciter #${id}`);
    setLoading(true);
    try {
      const { audio, segs } = await loadChapterAudio(id);
      setAudioUrl(audio || makeEveryAyahUrl('Alafasy_128kbps', surah, ayah));
      setSegmentsAbs(segs || []);
      setHighlight(-1);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== واجهة المستخدم ===================== */
  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#f7faf7]">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow border p-6">
        <h1 className="text-2xl font-bold mb-4 text-[#1e7850]">قسم التلاوة والتدريب</h1>

        {/* اختيارات */}
        <div className="flex gap-3 mb-4 justify-center">
          <select
            value={selectedReciter}
            onChange={(e) => setSelectedReciter(Number(e.target.value))}
            className="w-60 p-2 border rounded text-center"
          >
            {UI_RECITERS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.note ? `${r.nameAr} (${r.note})` : r.nameAr}
              </option>
            ))}
          </select>

          <input
            type="number" min={1} max={114}
            value={surah}
            onChange={(e) => setSurah(Math.max(1, Math.min(114, Number(e.target.value) || 1)))}
            className="w-24 p-2 border rounded text-center"
            placeholder="سورة"
          />
          <input
            type="number" min={1}
            value={ayah}
            onChange={(e) => setAyah(Math.max(1, Number(e.target.value) || 1))}
            className="w-24 p-2 border rounded text-center"
            placeholder="آية"
          />

          <button onClick={fetchAll} className="px-4 py-2 rounded bg-[#1e7850] text-white font-semibold">
            تطبيق الاختيارات
          </button>
        </div>

        {/* نص الآية */}
        <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded border mb-4" dir="rtl">
          {words.length > 0 ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {words.map((w, i) => (
                <span
                  key={i}
                  data-word-idx={i}
                  onClick={() => {
                    setHighlight(i);
                    if (segmentsAbs.length && audioRef.current) {
                      const seg = segmentsAbs.find((s) => (s[0] || 1) - 1 === i);
                      if (seg) {
                        audioRef.current.currentTime = seg[1] / 1000;
                        audioRef.current.play().catch(() => {});
                      }
                    }
                  }}
                  className={`cursor-pointer px-2 py-1 rounded transition ${highlight === i ? 'bg-green-200 text-[#1e7850] font-bold' : 'hover:bg-green-100'}`}
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
            القارئ: <b>{reciterLabel}</b> — {segmentsAbs.length > 0 ? '✓ مزامنة الكلمة فعّالة' : '— (صوت فقط)'}
          </p>
          {audioUrl ? (
            <audio ref={audioRef} key={audioUrl} controls className="w-full" preload="metadata">
              <source src={audioUrl} type="audio/mpeg" />
              المتصفح لا يدعم تشغيل الصوت
            </audio>
          ) : (
            <div className="text-center text-sm text-gray-500">لا يوجد رابط صوت</div>
          )}
        </div>

        {/* أزرار الاستكشاف (الخيار 2) */}
        <div className="mb-3 flex flex-wrap gap-2 justify-center">
          <button
            onClick={exploreSupported}
            className="px-4 py-2 rounded border border-[#1e7850] text-[#1e7850] hover:bg-[#1e7850] hover:text-white"
          >
            🔎 استكشاف القرّاء المدعومين لهذه السورة
          </button>
          {exploring && (
            <span className="text-xs text-gray-600 self-center">
              جاري الفحص… {progress.tried}/{progress.total}
            </span>
          )}
        </div>

        {/* نتائج الاستكشاف */}
        {exploreResults.length > 0 && (
          <div className="border rounded-xl p-3 bg-green-50/40">
            <div className="text-sm font-semibold mb-2">النتائج (مرتبة: يدعم الآية ← يدعم السورة ← غير مدعوم):</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {exploreResults.map((r) => (
                <div key={r.id} className="border rounded-lg p-2 bg-white flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs">
                      {r.hasSegmentsForAyah ? '✅ يدعم تظليل الآية الحالية' :
                       r.hasSegmentsForSurah ? '🟡 يدعم تظليل آيات في هذه السورة' :
                       '❌ لا تتوفر بيانات تظليل'}
                    </div>
                  </div>
                  <button
                    onClick={() => useExploredReciter(r.id, r.name)}
                    className="px-2 py-1 text-xs rounded border border-[#1e7850] text-[#1e7850] hover:bg-[#1e7850] hover:text-white"
                  >
                    استخدم
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تشخيص مختصر */}
        <div className="text-xs bg-gray-50 border rounded p-2 font-mono mt-3">
          <div>Surah: {surah} — Ayah: {ayah}</div>
          <div>Active Chapter-Reciter ID: {activeChapterReciterId ?? '—'}</div>
          <div>Segments: {segmentsAbs.length}</div>
          <div className="text-red-600">Last error: {lastError || '—'}</div>
        </div>

        {loading && <div className="mt-3 text-sm text-gray-600">جاري التحميل...</div>}
      </div>
    </div>
  );
}
