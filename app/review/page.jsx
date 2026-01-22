// app/review/page.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ========= Helpers ========= */

// تحويل الأرقام العربية إلى إنجليزية (احتياطي إن احتجته لاحقًا)
function toEnglishDigits(input = '') {
  const map = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  };
  return String(input).replace(/[٠-٩۰-۹]/g, d => map[d] ?? d);
}

// تنسيق نص السؤال لعرض الآية بخط عثماني
function formatQuestionText(text) {
  if (!text) return '';
  let result = text;

  // الأقواس القرآنية ﴿...﴾
  result = result.replace(
    /﴿([^﴿﴾]+)﴾/g,
    '<span class="quran-uthmani">﴿$1﴾</span>'
  );

  // الأقواس { ... } تعامل كنص قرآني أيضًا
  result = result.replace(
    /{([^}]+)}/g,
    '<span class="quran-uthmani">$1</span>'
  );

  return result;
}

// اسم عربي للقسم الفرعي
function getSubsectionLabel(key) {
  const map = {
    idhar_halaqi: 'إظهار حلقي',
    idgham_shafawi: 'إدغام شفوي',
    ikhfaa_shafawi: 'إخفاء شفوي',
    ikhfa: 'إخفاء حقيقي',
    idgham_bilaghunnah: 'إدغام بغير غنة',
    idgham_bighunnah: 'إدغام بغنة',
    qalqalah: 'قلقلة',
  };
  return map[key] || key;
}

// تطبيع بنك الأسئلة
function normalizeBank(bank) {
  const flat = [];
  const sectionsMeta = {};

  if (!bank || !bank.sections) {
    return { flat, sectionsMeta };
  }

  Object.entries(bank.sections).forEach(([sectionKey, section]) => {
    const title = section.title || sectionKey;
    const parts = section.parts || {};
    const subsectionKeys = Object.keys(parts);

    sectionsMeta[sectionKey] = {
      title,
      subsections: subsectionKeys,
    };

    Object.entries(parts).forEach(([subKey, questions]) => {
      (questions || []).forEach((q, idx) => {
        flat.push({
          question: '',
          options: ['', '', '', ''],
          answer: 1,
          explain: '',
          targetWord: '',
          ...q,
          sectionKey,
          sectionTitle: title,
          subsectionKey: subKey,
          reviewed: q.reviewed ?? false,
          _id: q._id || `${sectionKey}:${subKey}:${idx}`,
        });
      });
    });
  });

  return { flat, sectionsMeta };
}

// إعادة بناء البنك من النسخة المسطَّحة
function buildBankFromFlat(flatQuestions) {
  const bank = { sections: {} };

  flatQuestions.forEach(q => {
    const { sectionKey, sectionTitle, subsectionKey, _id, ...rest } = q;

    if (!bank.sections[sectionKey]) {
      bank.sections[sectionKey] = {
        title: sectionTitle || sectionKey,
        parts: {},
      };
    }

    if (!bank.sections[sectionKey].parts[subsectionKey]) {
      bank.sections[sectionKey].parts[subsectionKey] = [];
    }

    bank.sections[sectionKey].parts[subsectionKey].push({ ...rest });
  });

  return bank;
}

/* ========= صفحة المراجعة ========= */

export default function ReviewPage() {
  const [loading, setLoading] = useState(true);
  const [flatQuestions, setFlatQuestions] = useState([]);
  const [sectionsMeta, setSectionsMeta] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // تصفية العرض
  const [filterSection, setFilterSection] = useState('all');
  const [filterSubsection, setFilterSubsection] = useState('all');

  // نطاق الحذف الجماعي
  const [deleteSectionScope, setDeleteSectionScope] = useState('all');
  const [deleteSubsectionScope, setDeleteSubsectionScope] = useState('all');

  const questionTextareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const localStorageKey = 'tajweedyReviewJSON';

  /* ----- تحميل البيانات ----- */
  useEffect(() => {
    async function loadData() {
      try {
        const cached =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(localStorageKey)
            : null;

        if (cached) {
          const bank = JSON.parse(cached);
          const { flat, sectionsMeta } = normalizeBank(bank);
          setFlatQuestions(flat);
          setSectionsMeta(sectionsMeta);
        } else {
          const res = await fetch('/data/questions_bank.json');
          const bank = await res.json();
          const { flat, sectionsMeta } = normalizeBank(bank);
          setFlatQuestions(flat);
          setSectionsMeta(sectionsMeta);
        }
      } catch (err) {
        console.error('خطأ في تحميل بنك الأسئلة:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* ----- حفظ تلقائي في المتصفح ----- */
  useEffect(() => {
    if (!flatQuestions.length) return;
    try {
      const bank = buildBankFromFlat(flatQuestions);
      const json = JSON.stringify(bank, null, 2);
      window.localStorage.setItem(localStorageKey, json);
      setLastSavedAt(new Date().toISOString());
    } catch (err) {
      console.error('فشل الحفظ التلقائي في المتصفح:', err);
    }
  }, [flatQuestions]);

  const totalCount = flatQuestions.length;
  const reviewedCount = useMemo(
    () => flatQuestions.filter(q => q.reviewed).length,
    [flatQuestions]
  );

  // الأسئلة بعد التصفية + فهارسها الأصلية
  const filteredEntries = useMemo(
    () =>
      flatQuestions
        .map((q, idx) => ({ q, idx }))
        .filter(({ q }) => {
          if (filterSection !== 'all' && q.sectionKey !== filterSection)
            return false;
          if (
            filterSubsection !== 'all' &&
            q.subsectionKey !== filterSubsection
          )
            return false;
          return true;
        }),
    [flatQuestions, filterSection, filterSubsection]
  );

  // ضمان أن currentIndex دائمًا داخل التصفية إن وُجدت عناصر
  useEffect(() => {
    if (!filteredEntries.length) return;
    const exists = filteredEntries.some(entry => entry.idx === currentIndex);
    if (!exists) {
      setCurrentIndex(filteredEntries[0].idx);
    }
  }, [filteredEntries, currentIndex]);

  const sectionStats = useMemo(() => {
    const stats = {};
    flatQuestions.forEach(q => {
      const k = q.sectionKey;
      if (!stats[k]) {
        stats[k] = {
          sectionKey: k,
          sectionTitle: q.sectionTitle || k,
          total: 0,
          reviewed: 0,
        };
      }
      stats[k].total += 1;
      if (q.reviewed) stats[k].reviewed += 1;
    });

    Object.values(stats).forEach(s => {
      s.pending = s.total - s.reviewed;
    });

    return stats;
  }, [flatQuestions]);

  const subsectionsForFilter =
    filterSection === 'all'
      ? []
      : sectionsMeta[filterSection]?.subsections || [];

  const subsectionsForDeleteScope =
    deleteSectionScope === 'all'
      ? []
      : sectionsMeta[deleteSectionScope]?.subsections || [];

  /* ========= دوال التعديل على السؤال ========= */

  const updateCurrentQuestion = patch => {
    setFlatQuestions(prev => {
      if (!prev.length) return prev;
      const copy = [...prev];
      copy[currentIndex] = { ...copy[currentIndex], ...patch };
      return copy;
    });
  };

  const handleOptionChange = (index, value) => {
    setFlatQuestions(prev => {
      const copy = [...prev];
      const q = { ...copy[currentIndex] };
      const options = [...(q.options || ['', '', '', ''])];
      options[index] = value;
      q.options = options;
      copy[currentIndex] = q;
      return copy;
    });
  };

  const handleSectionChange = newSectionKey => {
    if (!newSectionKey) return;
    const meta = sectionsMeta[newSectionKey];
    const defaultSub = meta?.subsections?.[0] || '';

    updateCurrentQuestion({
      sectionKey: newSectionKey,
      sectionTitle: meta?.title || newSectionKey,
      subsectionKey: defaultSub,
    });
  };

  const handleSubsectionChange = newSubsectionKey => {
    updateCurrentQuestion({ subsectionKey: newSubsectionKey });
  };

  const handleToggleReviewed = () => {
    setFlatQuestions(prev => {
      const copy = [...prev];
      const q = copy[currentIndex];
      copy[currentIndex] = { ...q, reviewed: !q.reviewed };
      return copy;
    });
  };

  const handleCaptureTargetWord = () => {
    const textarea = questionTextareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart === selectionEnd) {
      alert('رجاءً ظلِّل الكلمة المستهدفة أولًا داخل نص السؤال.');
      return;
    }
    const selected = value.slice(selectionStart, selectionEnd).trim();
    if (!selected) {
      alert('النص المحدد فارغ.');
      return;
    }
    updateCurrentQuestion({ targetWord: selected });
  };

  const goToQuestion = index => {
    if (index < 0 || index >= flatQuestions.length) return;
    setCurrentIndex(index);
  };

  const handleAddQuestionAfterCurrent = () => {
    if (!flatQuestions.length) return;
    const base = flatQuestions[currentIndex] || flatQuestions[0];

    const newQ = {
      question: '',
      options: ['', '', '', ''],
      answer: 1,
      explain: '',
      targetWord: '',
      sectionKey: base.sectionKey,
      sectionTitle: base.sectionTitle,
      subsectionKey: base.subsectionKey,
      reviewed: false,
      _id: `new-${Date.now()}`,
    };

    setFlatQuestions(prev => {
      const copy = [...prev];
      copy.splice(currentIndex + 1, 0, newQ);
      return copy;
    });
    setCurrentIndex(currentIndex + 1);
  };

  const handleDeleteCurrentQuestion = () => {
    if (!flatQuestions.length) return;
    const q = flatQuestions[currentIndex];

    const msg =
      `سيتم حذف هذا السؤال نهائيًا من بنك الأسئلة الحالي:\n\n` +
      `السؤال رقم ${currentIndex + 1} – القسم: ${q.sectionTitle}\n\n` +
      `هل أنت متأكد من المتابعة؟ لا يمكن التراجع عن هذه العملية.`;

    if (!window.confirm(msg)) return;

    setFlatQuestions(prev => {
      const copy = [...prev];
      copy.splice(currentIndex, 1);
      let newIndex = currentIndex;
      if (newIndex >= copy.length) newIndex = Math.max(0, copy.length - 1);
      setCurrentIndex(newIndex);
      return copy;
    });
  };

  /* ========= التصدير / الاستيراد / الحفظ ========= */

  const handleManualSaveToBrowser = () => {
    try {
      const bank = buildBankFromFlat(flatQuestions);
      const json = JSON.stringify(bank, null, 2);
      window.localStorage.setItem(localStorageKey, json);
      setLastSavedAt(new Date().toISOString());
      alert('✅ تم حفظ التعديلات في المتصفح بنجاح.');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ في المتصفح.');
    }
  };

  const handleExportJSON = () => {
    try {
      const bank = buildBankFromFlat(flatQuestions);
      const json = JSON.stringify(bank, null, 2);
      const blob = new Blob([json], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `questions_bank_reviewed_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء تصدير ملف JSON.');
    }
  };

  const handleImportJSONFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result;
        const bank = JSON.parse(content);
        const { flat, sectionsMeta } = normalizeBank(bank);
        setFlatQuestions(flat);
        setSectionsMeta(sectionsMeta);
        setCurrentIndex(0);
        window.localStorage.setItem(
          localStorageKey,
          JSON.stringify(bank, null, 2)
        );
        alert('✅ تم تحميل ملف JSON وتحديث بنك الأسئلة.');
      } catch (err) {
        console.error(err);
        alert('ملف JSON غير صالح.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  /* ========= الحذف الجماعي للأسئلة غير المراجعة ========= */

  const countUnreviewedInScope = (sectionKeyScope, subsectionKeyScope) => {
    return flatQuestions.filter(q => {
      if (q.reviewed) return false;
      if (sectionKeyScope !== 'all' && q.sectionKey !== sectionKeyScope)
        return false;
      if (
        subsectionKeyScope !== 'all' &&
        q.subsectionKey !== subsectionKeyScope
      )
        return false;
      return true;
    }).length;
  };

  const handleDeleteUnreviewedInScope = () => {
    const scopeSection = deleteSectionScope;
    const scopeSub = deleteSubsectionScope;

    const count = countUnreviewedInScope(scopeSection, scopeSub);
    if (!count) {
      alert('لا توجد أسئلة غير مُراجَعة في النطاق المحدد.');
      return;
    }

    const sectionLabel =
      scopeSection === 'all'
        ? 'جميع الأقسام'
        : sectionsMeta[scopeSection]?.title || scopeSection;

    const subsectionLabel =
      scopeSub === 'all' ? '' : ` / ${getSubsectionLabel(scopeSub)}`;

    const msg =
      `سيتم حذف ${count} سؤال/أسئلة غير مُراجَعة من النطاق التالي:\n` +
      `${sectionLabel}${subsectionLabel}\n\n` +
      'لن يمكن التراجع عن هذه العملية.\n' +
      'هل تريد المتابعة؟';

    if (!window.confirm(msg)) return;

    setFlatQuestions(prev => {
      const filtered = prev.filter(q => {
        if (q.reviewed) return true;
        if (scopeSection !== 'all' && q.sectionKey !== scopeSection)
          return true;
        if (scopeSub !== 'all' && q.subsectionKey !== scopeSub) return true;
        return false;
      });

      let newIndex = currentIndex;
      if (newIndex >= filtered.length) {
        newIndex = Math.max(0, filtered.length - 1);
      }
      setCurrentIndex(newIndex);
      return filtered;
    });
  };

  /* ========= عرض مبدئي / تحميل ========= */

  if (loading || !flatQuestions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="flex flex-col items-center gap-4" dir="rtl">
          <div className="h-16 w-16 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-lg text-slate-700 font-semibold">
            جارٍ تحميل بنك الأسئلة للمراجعة…
          </p>
        </div>
      </div>
    );
  }

  // لو لم توجد أسئلة بعد التصفية
  if (!filteredEntries.length) {
    return (
      <div className="min-h-screen relative overflow-hidden" dir="rtl">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <Image
            src="/tajweedy_background.jpg"
            alt="Tajweedy background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 p-4 md:p-8">
          <div className="mx-auto max-w-6xl space-y-6">
            {/* الهيدر */}
            <header className="flex items-center justify-between rounded-3xl bg-white/90 px-4 py-3 md:px-6 md:py-4 shadow-sm border border-emerald-50">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="text-emerald-700 hover:text-emerald-900 text-sm md:text-base font-semibold flex items-center gap-1"
                >
                  <span className="text-lg">⬅️</span>
                  <span>العودة للرئيسية</span>
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 md:h-12 md:w-12">
                  <Image
                    src="/logo.png"
                    alt="Tajweedy"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs md:text-sm text-slate-500">
                    لا توجد أسئلة في التصنيف الحالي
                  </p>
                </div>
              </div>
            </header>

            {/* شريط التصفية + رسالة */}
            <section className="rounded-3xl bg-white/80 border border-emerald-50 px-4 py-4 shadow-sm space-y-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-right text-base md:text-lg font-semibold text-slate-800">
                    قائمة الأسئلة
                  </h2>
                  <p className="text-xs md:text-sm text-slate-500">
                    لا توجد أسئلة مطابقة للقسم / القسم الفرعي الحالي. غيّر
                    التصفية أدناه لعرض أسئلة أخرى.
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                  <select
                    value={filterSection}
                    onChange={e => {
                      setFilterSection(e.target.value);
                      setFilterSubsection('all');
                    }}
                    className="w-full md:w-56 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">كل الأقسام</option>
                    {Object.entries(sectionsMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.title || key}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterSubsection}
                    onChange={e => setFilterSubsection(e.target.value)}
                    disabled={filterSection === 'all'}
                    className="w-full md:w-56 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="all">كل الأقسام الفرعية</option>
                    {subsectionsForFilter.map(subKey => (
                      <option key={subKey} value={subKey}>
                        {getSubsectionLabel(subKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = flatQuestions[currentIndex];
  const currentPosInFilter = filteredEntries.findIndex(
    entry => entry.idx === currentIndex
  );
  const isFirstInFilter = currentPosInFilter <= 0;
  const isLastInFilter =
    currentPosInFilter === filteredEntries.length - 1 ||
    currentPosInFilter === -1;

  const handlePrevInFilter = () => {
    if (isFirstInFilter) return;
    const prevEntry = filteredEntries[currentPosInFilter - 1];
    setCurrentIndex(prevEntry.idx);
  };

  const handleNextInFilter = () => {
    if (isLastInFilter) return;
    const nextEntry = filteredEntries[currentPosInFilter + 1];
    setCurrentIndex(nextEntry.idx);
  };

  /* ========= واجهة المستخدم الرئيسية ========= */

  return (
    <div className="min-h-screen relative overflow-hidden" dir="rtl">
      {/* خلفية العلامة المائية */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <Image
          src="/tajweedy_background.jpg"
          alt="Tajweedy background"
          fill
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* الهيدر */}
          <header className="flex items-center justify-between rounded-3xl bg-white/90 px-4 py-3 md:px-6 md:py-4 shadow-sm border border-emerald-50">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-emerald-700 hover:text-emerald-900 text-sm md:text-base font-semibold flex items-center gap-1"
              >
                <span className="text-lg">⬅️</span>
                <span>العودة للرئيسية</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 md:h-12 md:w-12">
                <Image
                  src="/logo.png"
                  alt="Tajweedy"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-slate-500">
                  مراجعة سؤال {currentIndex + 1} من {totalCount}
                </p>
                <p className="text-xs md:text-sm text-emerald-700">
                  تمت مراجعة {reviewedCount} من {totalCount}
                </p>
              </div>
            </div>
          </header>

          {/* شريط أرقام الأسئلة مع التصفية */}
          <section className="rounded-3xl bg-white/80 border border-emerald-50 px-4 py-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
              <div>
                <h2 className="text-right text-base md:text-lg font-semibold text-slate-800">
                  قائمة الأسئلة
                </h2>
                <p className="text-xs md:text-sm text-slate-500">
                  اضغط على رقم السؤال للانتقال إليه. يمكن تصفية القائمة حسب
                  القسم والقسم الفرعي.
                </p>
              </div>
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <select
                  value={filterSection}
                  onChange={e => {
                    setFilterSection(e.target.value);
                    setFilterSubsection('all');
                  }}
                  className="w-full md:w-56 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="all">كل الأقسام</option>
                  {Object.entries(sectionsMeta).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.title || key}
                    </option>
                  ))}
                </select>

                <select
                  value={filterSubsection}
                  onChange={e => setFilterSubsection(e.target.value)}
                  disabled={filterSection === 'all'}
                  className="w-full md:w-56 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-2 text-right text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="all">كل الأقسام الفرعية</option>
                  {subsectionsForFilter.map(subKey => (
                    <option key={subKey} value={subKey}>
                      {getSubsectionLabel(subKey)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {filteredEntries.map(({ q, idx }) => {
                const isCurrent = idx === currentIndex;
                const isReviewed = q.reviewed;

                return (
                  <button
                    key={q._id || idx}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    className={[
                      'relative flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all',
                      isCurrent
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : isReviewed
                        ? 'bg-amber-50 text-amber-800 border-amber-400 hover:bg-amber-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                    ].join(' ')}
                  >
                    {idx + 1}
                    {isReviewed && (
                      <span className="absolute -top-1 -right-1 text-[11px]">
                        ⭐
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* بطاقة السؤال */}
          <main className="space-y-6">
            <section className="rounded-3xl bg-white/90 border border-emerald-50 p-4 md:p-6 shadow-sm">
              {/* نص السؤال كما في الاختبار */}
              <div className="mb-5 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-4 md:px-6 md:py-5">
                <p
                  className="quran-uthmani text-2xl md:text-3xl leading-relaxed text-slate-900 text-center"
                  dangerouslySetInnerHTML={{
                    __html: formatQuestionText(currentQuestion.question),
                  }}
                />
              </div>

              {/* مربع تعديل نص السؤال */}
              <div className="mb-6">
                <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                  نص السؤال (قابل للتعديل):
                </label>
                <textarea
                  ref={questionTextareaRef}
                  className="w-full rounded-3xl border border-emerald-100 bg-white px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={4}
                  value={currentQuestion.question || ''}
                  onChange={e =>
                    updateCurrentQuestion({ question: e.target.value })
                  }
                />
              </div>

              {/* مجموعة الكلمة المستهدفة أسفل مربع السؤال */}
              <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="flex-1 rounded-full border border-emerald-200 bg-emerald-50/70 px-5 py-3 flex items-center justify-between">
                  <span className="text-sm md:text-base text-slate-600">
                    الكلمة المستهدفة الحالية:
                  </span>
                  <span className="text-lg md:text-xl font-bold text-emerald-700">
                    {currentQuestion.targetWord || '—'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCaptureTargetWord}
                  className="flex-1 md:flex-none md:w-auto inline-flex items-center justify-center rounded-full border border-emerald-400 bg-gradient-to-l from-emerald-500 to-teal-500 px-5 py-3 text-sm md:text-base font-semibold text-white shadow-md shadow-emerald-200 hover:shadow-lg hover:from-emerald-600 hover:to-teal-600 transition-all"
                >
                  <span className="ml-2 text-lg">🎯</span>
                  <span>تحديد الكلمة المستهدفة من نص السؤال</span>
                </button>
              </div>

              {/* خيارات الإجابة */}
              <div className="mb-6">
                <h3 className="mb-3 text-right text-base md:text-lg font-semibold text-slate-800">
                  خيارات الإجابة
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {currentQuestion.options?.map((opt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300 bg-white text-sm font-bold text-emerald-700">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        className="flex-1 bg-transparent text-base md:text-lg text-slate-800 focus:outline-none"
                        value={opt || ''}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* رقم الإجابة الصحيحة + التفسير */}
              <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,2fr)]">
                <div>
                  <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                    رقم الإجابة الصحيحة
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateCurrentQuestion({ answer: n })}
                        className={[
                          'flex-1 rounded-3xl border px-3 py-2 text-base font-semibold transition-all',
                          currentQuestion.answer === n
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
                        ].join(' ')}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                    التفسير / سبب الإجابة الصحيحة
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={currentQuestion.explain || ''}
                    onChange={e =>
                      updateCurrentQuestion({ explain: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* الأقسام */}
              <div className="mb-4 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                    القسم الرئيسي
                  </label>
                  <select
                    value={currentQuestion.sectionKey}
                    onChange={e => handleSectionChange(e.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {Object.entries(sectionsMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.title || key}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                    القسم الفرعي
                  </label>
                  <select
                    value={currentQuestion.subsectionKey}
                    onChange={e => handleSubsectionChange(e.target.value)}
                    className="w-full rounded-3xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-right text-base md:text-lg text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {(sectionsMeta[currentQuestion.sectionKey]?.subsections ||
                      []
                    ).map(subKey => (
                      <option key={subKey} value={subKey}>
                        {getSubsectionLabel(subKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* أزرار التنقل + علامة المراجعة */}
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={handleToggleReviewed}
                  className={[
                    'inline-flex items-center justify-center rounded-full px-6 py-3 text-sm md:text-base font-semibold border transition-all',
                    currentQuestion.reviewed
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <span className="ml-2 text-lg">
                    {currentQuestion.reviewed ? '✅' : '⭐'}
                  </span>
                  <span>
                    {currentQuestion.reviewed
                      ? 'إزالة علامة تمت المراجعة'
                      : 'وضع علامة تمت المراجعة'}
                  </span>
                </button>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <button
                    type="button"
                    onClick={handlePrevInFilter}
                    disabled={isFirstInFilter}
                    className={[
                      'inline-flex flex-1 items-center justify-center rounded-full px-6 py-3 text-sm md:text-base font-semibold border transition-all',
                      isFirstInFilter
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                        : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className="ml-2 text-lg">⬅️</span>
                    <span>السؤال السابق</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextInFilter}
                    disabled={isLastInFilter}
                    className={[
                      'inline-flex flex-1 items-center justify-center rounded-full px-6 py-3 text-sm md:text-base font-semibold border transition-all',
                      isLastInFilter
                        ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                        : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md',
                    ].join(' ')}
                  >
                    <span className="ml-2 text-lg">➡️</span>
                    <span>السؤال التالي</span>
                  </button>
                </div>
              </div>
            </section>

            {/* حفظ / تصدير / تحميل */}
            <section className="rounded-3xl bg-white/90 border border-emerald-50 p-4 md:p-6 shadow-sm space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={handleManualSaveToBrowser}
                  className="inline-flex items-center justify-center rounded-full border border-indigo-300 bg-indigo-500/90 px-4 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:bg-indigo-600 hover:shadow-lg transition-all"
                >
                  <span className="ml-2 text-lg">🧠</span>
                  <span>حفظ التعديلات في المتصفح</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="inline-flex items-center justify-center rounded-full border border-emerald-400 bg-emerald-600 px-4 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all"
                >
                  <span className="ml-2 text-lg">⬇️</span>
                  <span>تصدير ملف JSON المحدَّث</span>
                </button>

                <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 py-3 text-sm md:text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-100 transition-all">
                  <span className="ml-2 text-lg">⬆️</span>
                  <span>تحميل ملف JSON من الجهاز</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleImportJSONFile}
                  />
                </label>
              </div>

              {lastSavedAt && (
                <p className="text-xs md:text-sm text-slate-500 text-right">
                  آخر حفظ تلقائي في المتصفح:{' '}
                  {new Date(lastSavedAt).toLocaleString('ar-EG')}
                </p>
              )}
            </section>

            {/* إضافة / حذف سؤال */}
            <section className="rounded-3xl bg-white/90 border border-emerald-50 p-4 md:p-6 shadow-sm flex flex-col gap-3 md:flex-row md:justify-center">
              <button
                type="button"
                onClick={handleAddQuestionAfterCurrent}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-sm md:text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-100 transition-all"
              >
                <span className="ml-2 text-lg">➕</span>
                <span>إضافة سؤال جديد</span>
              </button>
              <button
                type="button"
                onClick={handleDeleteCurrentQuestion}
                className="inline-flex flex-1 items-center justify-center rounded-full border border-rose-300 bg-rose-50 px-6 py-3 text-sm md:text-base font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition-all"
              >
                <span className="ml-2 text-lg">🗑️</span>
                <span>حذف السؤال الحالي</span>
              </button>
            </section>

            {/* إدارة الأسئلة غير المراجعة */}
            <section className="rounded-3xl bg-white/95 border border-emerald-50 p-4 md:p-6 shadow-sm space-y-4">
              <h3 className="text-right text-base md:text-lg font-semibold text-slate-800 mb-2">
                إدارة الأسئلة غير المُراجَعة
              </h3>

              <p className="text-sm md:text-base text-slate-700 mb-2">
                تمّت مراجعة{' '}
                <span className="font-bold text-emerald-700">
                  {reviewedCount}
                </span>{' '}
                من{' '}
                <span className="font-bold text-slate-800">{totalCount}</span>{' '}
                سؤال. المتبقي غير مُراجَع:{' '}
                <span className="font-bold text-amber-700">
                  {totalCount - reviewedCount}
                </span>
                .
              </p>

              <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] items-end">
                <div>
                  <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                    اختر القسم الرئيسي
                  </label>
                  <select
                    value={deleteSectionScope}
                    onChange={e => {
                      setDeleteSectionScope(e.target.value);
                      setDeleteSubsectionScope('all');
                    }}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm md:text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="all">كل الأقسام</option>
                    {Object.entries(sectionsMeta).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.title || key}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-right text-sm md:text-base font-semibold text-slate-800">
                    اختر القسم الفرعي (اختياري)
                  </label>
                  <select
                    value={deleteSubsectionScope}
                    onChange={e => setDeleteSubsectionScope(e.target.value)}
                    disabled={deleteSectionScope === 'all'}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-sm md:text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="all">كل الأقسام الفرعية</option>
                    {subsectionsForDeleteScope.map(subKey => (
                      <option key={subKey} value={subKey}>
                        {getSubsectionLabel(subKey)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-slate-700">
                    عدد الأسئلة غير المُراجَعة في النطاق المحدد:{' '}
                    <span className="font-bold text-amber-700">
                      {countUnreviewedInScope(
                        deleteSectionScope,
                        deleteSubsectionScope
                      )}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteUnreviewedInScope}
                    className="inline-flex w-full items-center justify-center rounded-full border border-rose-400 bg-rose-500/90 px-4 py-3 text-sm md:text-base font-semibold text-white shadow-md hover:bg-rose-600 hover:shadow-lg transition-all"
                  >
                    <span className="ml-2 text-lg">🗑️</span>
                    <span>حذف جميع الأسئلة غير المُراجَعة في هذا النطاق</span>
                  </button>
                </div>
              </div>

              {/* جدول إحصاءات الأقسام */}
              <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/60">
                <table className="min-w-full text-sm md:text-base text-right">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-3 py-2 font-semibold text-slate-800">
                        القسم الرئيسي
                      </th>
                      <th className="px-3 py-2 font-semibold text-slate-800">
                        إجمالي الأسئلة
                      </th>
                      <th className="px-3 py-2 font-semibold text-emerald-700">
                        تمت المراجعة
                      </th>
                      <th className="px-3 py-2 font-semibold text-amber-700">
                        غير مُراجَع
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(sectionStats).map(stat => (
                      <tr key={stat.sectionKey} className="border-t">
                        <td className="px-3 py-2">
                          {stat.sectionTitle || stat.sectionKey}
                        </td>
                        <td className="px-3 py-2">{stat.total}</td>
                        <td className="px-3 py-2 text-emerald-700 font-semibold">
                          {stat.reviewed}
                        </td>
                        <td className="px-3 py-2 text-amber-700 font-semibold">
                          {stat.pending}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
