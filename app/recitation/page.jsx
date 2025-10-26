'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

/* ================ Hook: تظليل متزامن بكفاءة ================ */
function useWordSync(audioRef, segmentsAbs, pos2idx, setHighlighted) {
  useEffect(() => {
    const el = audioRef.current;
    if (!el || segmentsAbs.length === 0 || !pos2idx) return;

    const starts = segmentsAbs.map((s) => s[1]);
    const findSegIndex = (tMs) => {
      let lo = 0,
        hi = starts.length - 1,
        ans = -1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (starts[mid] <= tMs) {
          ans = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (ans === -1) return -1;
      return tMs < segmentsAbs[ans][2] ? ans : -1;
    };

    const onTime = () => {
      const tMs = (audioRef.current?.currentTime ?? 0) * 1000;
      const k = findSegIndex(tMs);
      if (k !== -1) {
        const pos1 = segmentsAbs[k][0];
        const idx = pos2idx.get(pos1);
        if (typeof idx === 'number') {
          setHighlighted(idx);
          const node = document.querySelector(`[data-word-idx="${idx}"]`);
          node?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
        }
      }
    };

    const attach = () => {
      el.addEventListener('timeupdate', onTime);
      el.addEventListener('seeked', onTime);
    };
    if (el.readyState >= 1) attach();
    else el.addEventListener('loadedmetadata', attach, { once: true });

    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('seeked', onTime);
      el.removeEventListener('loadedmetadata', attach);
    };
  }, [audioRef, segmentsAbs, pos2idx, setHighlighted]);
}

/* ==================== لوحة تشخيص عائمة ==================== */
function DebugPanel({
  verseKey,
  audioRef,
  sourceLabel,
  recitationId,
  segmentsAbs,
  supportedForAyah,
  onProbe,
  onDump,
  onJumpFirst,
}) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 9999, maxWidth: 360 }}>
      <div className="bg-white/95 backdrop-blur border border-gray-200 shadow-lg rounded-xl">
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
          <strong className="text-xs">Debug • {verseKey}</strong>
          <button
            onClick={() => setOpen(!open)}
            className="text-[11px] px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
            title="إظهار/إخفاء اللوحة"
          >
            {open ? 'إخفاء' : 'إظهار'}
          </button>
        </div>
        {open && (
          <div className="p-3 text-[11px] space-y-1 font-mono">
            <div>
              Source: <span className="font-semibold">{sourceLabel}</span>
            </div>
            <div>
              Recitation ID: <span className="font-semibold">{recitationId ?? '—'}</span>
            </div>
            <div>
              Segments: <span className="font-semibold">{segmentsAbs.length}</span>
            </div>
            <div>
              First seg (ms):{' '}
              <span className="font-semibold">
                {segmentsAbs[0]?.[1] ?? '—'} → {segmentsAbs[0]?.[2] ?? '—'}
              </span>
            </div>
            <div className="break-words">
              Supported IDs: {supportedForAyah?.length ? supportedForAyah.join(', ') : '—'}
            </div>

            <div className="pt-2 flex gap-2 flex-wrap">
              <button onClick={onProbe} className="px-2 py-1 rounded border border-blue-300 hover:bg-blue-50">
                🔎 Probe IDs
              </button>
              <button onClick={onJumpFirst} className="px-2 py-1 rounded border border-green-300 hover:bg-green-50">
                ▶️ Jump first
              </button>
              <button onClick={onDump} className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
                📜 Dump
              </button>
              <button
                onClick={() => {
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                  }
                }}
                className="px-2 py-1 rounded border border-red-300 hover:bg-red-50"
              >
                ⏹ Stop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== أدوات مساعدة ===================== */
const getLS = (k) => (typeof window === 'undefined' ? null : window.localStorage.getItem(k));
const setLS = (k, v) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(k, v);
};
const makeEveryAyahUrl = (folder, s, a) => {
  const S = String(s).padStart(3, '0');
  const A = String(a).padStart(3, '0');
  return `https://everyayah.com/data/${folder}/${S}${A}.mp3`;
};

/* ========================= الصفحة ========================= */
export default function RecitationPage() {
  // اختيار السورة والآية
  const [surah, setSurah] = useState(43); // مثال: الزخرف
  const [ayah, setAyah] = useState(1);

  // نص وكلمات
  const [verse, setVerse] = useState(null);
  const [fullText, setFullText] = useState('');
  const [words, setWords] = useState([]);
  const [pos2idx, setPos2idx] = useState(null);

  // الصوت والمقاطع
  const [audioUrl, setAudioUrl] = useState(null);
  const [segmentsAbs, setSegmentsAbs] = useState([]);
  const [highlight, setHighlight] = useState(-1);

  // دعم وتشخيص
  const [recitations, setRecitations] = useState([]);
  const [activeRecitationId, setActiveRecitationId] = useState(null);
  const [supportedForAyah, setSupportedForAyah] = useState([]);
  const [probing, setProbing] = useState(false);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef(null);
  useWordSync(audioRef, segmentsAbs, pos2idx, setHighlight);

  const verseKey = `${surah}:${ayah}`;
  const cacheKey = `syncSupport:${surah}:${ayah}`;

  // جلب قائمة التلاوات الرسمية مرّة واحدة
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('https://api.quran.com/api/v4/resources/recitations?language=ar');
        const j = await r.json();
        setRecitations(j?.recitations ?? []);
      } catch {
        setRecitations([]);
      }
    })();
  }, []);

  // جلب نص الآية والكلمات
  const fetchTextAndWords = async () => {
    const vRes = await fetch(`https://api.alquran.cloud/v1/ayah/${verseKey}/quran-uthmani`);
    const vJson = await vRes.json();
    if (vJson?.status === 'OK') {
      setFullText(vJson.data.text);
      setVerse({ surahNumber: surah, number: ayah, surahName: vJson.data.surah.name, audioUrl: null });
    }

    const wRes = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=ar&words=true&word_fields=text_uthmani,position,type`
    );
    const wJson = await wRes.json();
    const all = wJson?.verse?.words ?? [];
    const onlyWords = all.filter((w) => w.type === 'word');
    const map = new Map();
    onlyWords.forEach((w, i) => {
      if (typeof w.position === 'number') map.set(w.position, i);
    });
    setWords(onlyWords);
    setPos2idx(map);
  };

  // تجربة recitation_id وإرجاع المقاطع إن وُجدت
  const tryLoadRecitation = async (rid) => {
    const url = `https://api.quran.com/api/v4/recitations/${rid}/by_chapter/${surah}?segments=true`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const file = data?.audio_file ?? null;
    const ts = file?.timestamps ?? [];
    const verseTs = ts.find((t) => t.verse_key === verseKey);
    if (verseTs?.segments && verseTs.segments.length > 0 && file?.audio_url) {
      const base = verseTs.timestamp_from || 0;
      const segsAbs = verseTs.segments
        .map((s) => [s[0], base + s[1], base + s[2]])
        .sort((a, b) => a[1] - b[1]);
      return { id: rid, url: file.audio_url, segsAbs };
    }
    return null;
  };

  // مُفحّص تلقائي: ابحث عن أول ID يدعم الآية
  const probeForSegments = async () => {
    setProbing(true);
    try {
      const preferred = ['Mishari', 'Husary', 'Minshawi', 'Abdul', 'Sudais', 'Shatri'];
      const sorted = [...recitations].sort((a, b) => {
        const aw = preferred.some((p) => (a.reciter_name || '').toLowerCase().includes(p.toLowerCase())) ? -1 : 0;
        const bw = preferred.some((p) => (b.reciter_name || '').toLowerCase().includes(p.toLowerCase())) ? -1 : 0;
        return aw - bw;
      });

      const MAX = Math.min(sorted.length, 30);
      for (let i = 0; i < MAX; i++) {
        const rid = sorted[i].id;
        const loaded = await tryLoadRecitation(rid);
        if (loaded) {
          setActiveRecitationId(loaded.id);
          setSegmentsAbs(loaded.segsAbs);
          setAudioUrl(loaded.url);
          setSupportedForAyah([loaded.id]);
          setLS(cacheKey, JSON.stringify({ preferred: loaded.id, supported: [loaded.id] }));
          return loaded.id;
        }
      }
      setLS(cacheKey, JSON.stringify({ preferred: null, supported: [] }));
      setSupportedForAyah([]);
      return null;
    } finally {
      setProbing(false);
    }
  };

  // الجلب الشامل للآية + محاولة التزامن
  const fetchAll = async () => {
    setLoading(true);
    setAudioUrl(null);
    setSegmentsAbs([]);
    setHighlight(-1);
    setActiveRecitationId(null);
    setSupportedForAyah([]);

    try {
      await fetchTextAndWords();

      // جرّب الكاش
      let cachedPreferred = null;
      try {
        const cached = getLS(cacheKey);
        if (cached) cachedPreferred = JSON.parse(cached)?.preferred ?? null;
      } catch {}

      if (cachedPreferred) {
        const loaded = await tryLoadRecitation(cachedPreferred);
        if (loaded) {
          setActiveRecitationId(loaded.id);
          setSegmentsAbs(loaded.segsAbs);
          setAudioUrl(loaded.url);
          setSupportedForAyah([loaded.id]);
        }
      }

      // إن لم ينجح الكاش — افحص تلقائيًا
      if (!audioUrl && segmentsAbs.length === 0) {
        const id = await probeForSegments();
        if (!id) {
          // لا يوجد مقاطع — استخدم EveryAyah (صوت فقط)
          setAudioUrl(makeEveryAyahUrl('Alafasy_128kbps', surah, ayah));
        }
      }
    } catch (e) {
      console.error('fetchAll error', e);
      setAudioUrl(makeEveryAyahUrl('Alafasy_128kbps', surah, ayah));
    } finally {
      setLoading(false);
    }
  };

  // أول تحميل + عند تغيير السورة/الآية
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surah, ayah]);

  const syncOn = useMemo(() => segmentsAbs.length > 0 && (pos2idx?.size ?? 0) > 0, [segmentsAbs, pos2idx]);
  const sourceLabel = !audioUrl
    ? '—'
    : audioUrl.includes('api.quran.com')
    ? 'Quran.com (chapter)'
    : audioUrl.includes('everyayah.com')
    ? 'EveryAyah (single ayah)'
    : 'Other';

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow border p-6">
        <h1 className="text-2xl font-bold mb-4 text-[#1e7850]">قسم التلاوة والتدريب</h1>

        {/* العناوين */}
        <div className="text-center mb-4">
          <div className="text-lg font-semibold">{verse?.surahName ?? '...'}</div>
          <div className="text-gray-600">الآية {verse?.number ?? ayah}</div>
        </div>

        {/* اختيارات بسيطة للسورة/الآية */}
        <div className="flex gap-3 mb-4 justify-center">
          <input
            type="number"
            min={1}
            max={114}
            value={surah}
            onChange={(e) => setSurah(Math.max(1, Math.min(114, Number(e.target.value) || 1)))}
            className="w-28 p-2 border rounded text-center"
            placeholder="سورة"
          />
          <input
            type="number"
            min={1}
            value={ayah}
            onChange={(e) => setAyah(Math.max(1, Number(e.target.value) || 1))}
            className="w-28 p-2 border rounded text-center"
            placeholder="آية"
          />
          <button onClick={fetchAll} className="px-4 py-2 rounded bg-[#1e7850] text-white font-semibold">
            تطبيق الاختيارات
          </button>
        </div>

        {/* النص */}
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
                      const seg = segmentsAbs.find((s) => s[0] === pos1);
                      if (seg) {
                        audioRef.current.currentTime = seg[1] / 1000; // مطلق
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
            {syncOn ? '✓ مزامنة الكلمة فعّالة' : '— لا توجد مقاطع لهذه الآية (سيُشغَّل الصوت فقط)'}
            {probing ? ' • جارِ البحث عن قارئ مدعوم...' : ''}
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

        {/* تشخيص مختصر داخل الصفحة */}
        <div className="text-xs bg-gray-50 border rounded p-2 font-mono">
          <div>
            Surah: {surah} — Ayah: {ayah}
          </div>
          <div>Source: {sourceLabel}</div>
          <div>Active Recitation ID: {activeRecitationId ?? '—'}</div>
          <div>Segments: {segmentsAbs.length}</div>
          <div>
            First seg (ms): {segmentsAbs[0]?.[1]} → {segmentsAbs[0]?.[2] ?? ''}
          </div>
        </div>

        {loading && <div className="mt-3 text-sm text-gray-600">جاري التحميل...</div>}
      </div>

      {/* لوحة التشخيص العائمة */}
      <DebugPanel
        verseKey={verseKey}
        audioRef={audioRef}
        sourceLabel={sourceLabel}
        recitationId={activeRecitationId}
        segmentsAbs={segmentsAbs}
        supportedForAyah={supportedForAyah}
        onProbe={probeForSegments}
        onDump={() => {
          console.clear();
          window.__DBG = { verseKey, audioUrl, segmentsAbs, activeRecitationId, supportedForAyah };
          // eslint-disable-next-line no-console
          console.log('__DBG', window.__DBG);
          alert('تم الطباعة إلى Console باسم __DBG');
        }}
        onJumpFirst={() => {
          if (!audioRef.current) return;
          if (!segmentsAbs.length) return alert('لا توجد مقاطع');
          audioRef.current.currentTime = segmentsAbs[0][1] / 1000;
          audioRef.current.play().catch(() => {});
        }}
      />
    </div>
  );
}
