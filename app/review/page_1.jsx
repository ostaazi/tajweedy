// app/review/page.jsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ========================= Helpers ========================= */

// تنسيق نص السؤال (نفس منطق صفحة الاختبار)
function formatQuestionText(text) {
  if (!text) return '';
  let result = text;

  // الأقواس القرآنية ﴿...﴾
  result = result.replace(
    /﴿([^﴿﴾]+)﴾/g,
    '<span class="quran-uthmani">﴿$1﴾</span>'
  );

  // الأقواس { ... }
  result = result.replace(
    /{([^}]+)}/g,
    '<span class="quran-uthmani">$1</span>'
  );

  return result;
}

// خريطة أسماء الأقسام الفرعية → بالعربي
const subSectionLabels = {
  idhar_halaqi: 'إظهار حلقي',
  ikhfa: 'إخفاء حقيقي',
  ikhfa_shafawi: 'إخفاء شفوي',
  idgham_shafawi: 'إدغام شفوي',
  qalqalah: 'قلقلة',
  madd_tabeei: 'مد طبيعي',
  madd_munfasil: 'مد منفصل',
  madd_muttasil: 'مد متصل',
  // المطلوب تعريبهم
  idgham_bilaghunnah: 'إدغام بلا غنّة',
  idgham_bighunnah: 'إدغام بغنّة',
};

// إخراج اسم عربي للقسم الفرعي إن وُجد في الخريطة
function getSubSectionLabel(key) {
  return subSectionLabels[key] || key;
}

/* ========================= الصفحة ========================= */

export default function ReviewPage() {
  const [originalRoot, setOriginalRoot] = useState(null);   // نسخة JSON الأصلية
  const [sectionsDef, setSectionsDef] = useState(null);     // تعريف الأقسام فقط
  const [questions, setQuestions] = useState([]);           // قائمة الأسئلة المسطّحة
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const questionEditRef = useRef(null);
  const fileInputRef = useRef(null);

  // تحميل بنك الأسئلة (مع مراعاة نسخة محفوظة في المتصفح إن وُجدت)
  useEffect(() => {
    async function loadBank() {
      try {
        const saved =
          typeof window !== 'undefined'
            ? localStorage.getItem('questionsBankEdited')
            : null;

        let data;
        if (saved) {
          data = JSON.parse(saved);
        } else {
          const res = await fetch('/data/questions_bank.json');
          data = await res.json();
        }

        const sections = data.sections || {};
        setOriginalRoot(data);
        setSectionsDef(sections);
        setQuestions(flattenQuestions(sections));
      } catch (e) {
        console.error('خطأ في تحميل بنك الأسئلة:', e);
      } finally {
        setLoading(false);
      }
    }

    loadBank();
  }, []);

  // دالة تسطيح الأسئلة مع الاحتفاظ بمسار كل سؤال
  function flattenQuestions(sections) {
    const result = [];
    let gid = 0;

    Object.keys(sections).forEach((sectionKey) => {
      const section = sections[sectionKey];
      const parts = section.parts || {};

      Object.keys(parts).forEach((partKey) => {
        const arr = parts[partKey] || [];
        arr.forEach((q, idx) => {
          result.push({
            id: gid++,          // معرف داخلي
            sectionKey,
            partKey,
            originalOrder: idx, // ترتيب داخل الجزء
            ...q,               // كل حقول السؤال الأصلية
          });
        });
      });
    });

    return result;
  }

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex] || null;

  const currentSectionTitle = useMemo(() => {
    if (!currentQuestion || !sectionsDef) return '';
    const sec = sectionsDef[currentQuestion.sectionKey];
    return sec?.title || currentQuestion.sectionKey;
  }, [currentQuestion, sectionsDef]);

  const currentSubSectionLabel = useMemo(() => {
    if (!currentQuestion) return '';
    return getSubSectionLabel(currentQuestion.partKey);
  }, [currentQuestion]);

  // تحديث سؤال معيّن في المصفوفة
  const updateCurrentQuestion = (patch) => {
    setQuestions((prev) => {
      if (!prev[currentIndex]) return prev;
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], ...patch };
      return next;
    });
  };

  // تغيير القسم الرئيسي
  const handleSectionChange = (newSectionKey) => {
    if (!sectionsDef || !currentQuestion) return;

    const section = sectionsDef[newSectionKey];
    if (!section) return;

    const firstPartKey = Object.keys(section.parts || {})[0] || '';
    updateCurrentQuestion({
      sectionKey: newSectionKey,
      partKey: firstPartKey || currentQuestion.partKey,
    });
  };

  // تغيير القسم الفرعي
  const handleSubSectionChange = (newPartKey) => {
    updateCurrentQuestion({ partKey: newPartKey });
  };

  // اختيار الكلمة المستهدفة من مربع تحرير نص السؤال
  const handlePickTargetWord = () => {
    const textarea = questionEditRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    if (selectionStart === selectionEnd) {
      alert('رجاءً حدّد الكلمة المستهدفة من نص السؤال أولاً.');
      return;
    }

    const selected = value.slice(selectionStart, selectionEnd).trim();
    if (!selected) {
      alert('الاختيار فارغ. حاول مرة أخرى.');
      return;
    }

    updateCurrentQuestion({ targetWord: selected });
  };

  // تبديل حالة "تمت المراجعة"
  const toggleReviewed = () => {
    if (!currentQuestion) return;
    updateCurrentQuestion({ reviewed: !currentQuestion.reviewed });
  };

  // الانتقال بين الأسئلة
  const goToQuestion = (index) => {
    if (index < 0 || index >= totalQuestions) return;
    setCurrentIndex(index);
  };

  const goPrev = () => goToQuestion(currentIndex - 1);
  const goNext = () => goToQuestion(currentIndex + 1);

  // إنشاء سؤال جديد في نفس القسم/القسم الفرعي
  const handleAddQuestion = () => {
    if (!currentQuestion) return;

    const { sectionKey, partKey } = currentQuestion;
    const group = questions.filter(
      (q) => q.sectionKey === sectionKey && q.partKey === partKey
    );
    const maxOrder = group.reduce(
      (m, q) =>
        typeof q.originalOrder === 'number'
          ? Math.max(m, q.originalOrder)
          : m,
      -1
    );

    const newQuestion = {
      id: Date.now(),
      sectionKey,
      partKey,
      originalOrder: maxOrder + 1,
      question: '',
      options: ['', '', '', ''],
      answer: 1,
      explain: '',
      targetWord: '',
      reviewed: false,
    };

    setQuestions((prev) => {
      const next = [...prev];
      next.splice(currentIndex + 1, 0, newQuestion);
      return next;
    });
    setCurrentIndex((i) => i + 1);
  };

  // حذف السؤال الحالي بعد تأكيد
  const handleDeleteCurrent = () => {
    if (!currentQuestion) return;
    if (
      !confirm(
        'هل أنت متأكد من حذف هذا السؤال نهائيًا من ملف الأسئلة؟ لا يمكن التراجع عن هذه العملية.'
      )
    ) {
      return;
    }

    setQuestions((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== currentIndex);
      return next;
    });

    setCurrentIndex((prevIndex) => {
      if (totalQuestions <= 1) return 0;
      return prevIndex > 0 ? prevIndex - 1 : 0;
    });
  };

  // بناء JSON جديد من الأسئلة المسطّحة
  const buildUpdatedBank = () => {
    if (!originalRoot || !sectionsDef) return null;

    const root = {
      ...originalRoot,
      sections: {},
    };

    // تجهيز هياكل الأقسام والأجزاء
    Object.keys(sectionsDef).forEach((sectionKey) => {
      const section = sectionsDef[sectionKey];
      root.sections[sectionKey] = {
        ...section,
        parts: {},
      };

      Object.keys(section.parts || {}).forEach((partKey) => {
        root.sections[sectionKey].parts[partKey] = [];
      });
    });

    // تجميع الأسئلة حسب القسم/القسم الفرعي
    const grouped = {};
    questions.forEach((q) => {
      const key = `${q.sectionKey}__${q.partKey}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(q);
    });

    Object.keys(grouped).forEach((key) => {
      const [sectionKey, partKey] = key.split('__');
      const items = grouped[key].slice().sort((a, b) => {
        const ao = typeof a.originalOrder === 'number' ? a.originalOrder : 0;
        const bo = typeof b.originalOrder === 'number' ? b.originalOrder : 0;
        return ao - bo;
      });

      const arr = items.map((item) => {
        const out = { ...item };
        delete out.id;
        delete out.sectionKey;
        delete out.partKey;
        return out;
      });

      if (!root.sections[sectionKey]) {
        root.sections[sectionKey] = {
          title: sectionKey,
          parts: {},
        };
      }
      if (!root.sections[sectionKey].parts[partKey]) {
        root.sections[sectionKey].parts[partKey] = [];
      }
      root.sections[sectionKey].parts[partKey] = arr;
    });

    return root;
  };

  // حفظ التعديلات يدويًا في المتصفح (ما زال موجود لإعطاء رسالة للمستخدم)
  const handleSaveToBrowser = () => {
    const updated = buildUpdatedBank();
    if (!updated) return;

    try {
      localStorage.setItem('questionsBankEdited', JSON.stringify(updated));
      alert('تم حفظ التعديلات في المتصفح بنجاح 🧠');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ في المتصفح.');
    }
  };

  // حفظ تلقائي لكل تعديل في localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!originalRoot || !sectionsDef || !questions.length) return;
    const updated = buildUpdatedBank();
    if (!updated) return;
    try {
      localStorage.setItem('questionsBankEdited', JSON.stringify(updated));
    } catch (e) {
      console.error('خطأ في الحفظ التلقائي لـ JSON:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, originalRoot, sectionsDef]);

  // تنزيل ملف JSON المحدّث
  const handleDownloadJson = () => {
    const updated = buildUpdatedBank();
    if (!updated) return;

    const blob = new Blob([JSON.stringify(updated, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_bank_updated.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // فتح حوار اختيار ملف JSON
  const handleLoadJsonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // قراءة ملف JSON من الجهاز وتحديث الحالة
  const handleJsonFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        const data = JSON.parse(text);
        if (!data.sections) {
          alert('الملف لا يحتوي على الأقسام المطلوبة (sections).');
          return;
        }
        const sections = data.sections;
        setOriginalRoot(data);
        setSectionsDef(sections);
        setQuestions(flattenQuestions(sections));
        setCurrentIndex(0);

        if (typeof window !== 'undefined') {
          localStorage.setItem('questionsBankEdited', JSON.stringify(data));
        }

        alert('تم تحميل ملف JSON بنجاح ✅');
      } catch (err) {
        console.error(err);
        alert('تعذر قراءة ملف JSON. تأكد من صحة التنسيق.');
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  if (loading || !sectionsDef || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-slate-600 text-lg">جاري تحميل صفحة مراجعة الأسئلة…</p>
        </div>
      </div>
    );
  }

  const sectionOptions = Object.keys(sectionsDef).map((key) => ({
    key,
    title: sectionsDef[key].title || key,
  }));

  const currentParts = sectionsDef[currentQuestion.sectionKey]?.parts || {};
  const subSectionOptions = Object.keys(currentParts).map((key) => ({
    key,
    label: getSubSectionLabel(key),
  }));

  const displayedQuestionHtml = formatQuestionText(currentQuestion.question || '');
  const targetWord = currentQuestion.targetWord || '—';

  return (
    <div className="min-h-screen relative" dir="rtl">
      {/* خلفية تاجويدي كعلامة مائية */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "url('/tajweedy_background.jpg')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      />
      {/* محتوى الصفحة */}
      <div className="relative z-10 min-h-screen bg-white/85">
        {/* input مخفي لتحميل JSON */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleJsonFileChange}
        />

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* الهيدر */}
          <header className="mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 bg-white/70 px-4 py-2 text-sm md:text-base font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:shadow-md transition"
              >
                <span>⬅️</span>
                <span>العودة للرئيسية</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:block w-12 h-12 relative">
                <Image
                  src="/logo.png"
                  alt="Tajweedy Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-right">
                <p className="text-sm md:text-base text-slate-500">
                  مراجعة سؤال {currentIndex + 1} من {totalQuestions}
                </p>
                <h1 className="text-lg md:text-2xl font-bold text-emerald-800">
                  لوحة مراجعة بنك أسئلة التجويد
                </h1>
              </div>
            </div>
          </header>

          {/* شريط أرقام الأسئلة */}
          <section className="mb-6 bg-white/80 rounded-3xl border border-emerald-50 shadow-sm px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base md:text-lg font-semibold text-slate-800">
                قائمة الأسئلة
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                اضغط على رقم السؤال للانتقال إليه
              </p>
            </div>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const reviewed = !!q.reviewed;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    className={[
                      'relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold border transition-all',
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                        : reviewed
                        ? 'border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {idx + 1}
                    {reviewed && !isCurrent && (
                      <span className="absolute -top-1 -left-1 text-[11px]">
                        ⭐
                      </span>
                    )}
                    {reviewed && isCurrent && (
                      <span className="absolute -top-1 -left-1 text-[11px]">
                        ✅
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* محتوى السؤال */}
          <section className="bg-white/90 rounded-3xl border border-emerald-50 shadow-md px-4 md:px-6 py-5 md:py-7 space-y-6">
            {/* القسم الرئيسي والفرعي */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-2 text-right">
                <label className="text-sm md:text-base font-semibold text-slate-700">
                  القسم الرئيسي
                </label>
                <select
                  value={currentQuestion.sectionKey}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {sectionOptions.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2 text-right">
                <label className="text-sm md:text-base font-semibold text-slate-700">
                  القسم الفرعي
                </label>
                <select
                  value={currentQuestion.partKey}
                  onChange={(e) => handleSubSectionChange(e.target.value)}
                  className="w-full rounded-3xl border border-emerald-400 bg-emerald-50/60 px-4 py-3 text-right text-base md:text-lg text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {subSectionOptions.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* نص السؤال كما يظهر في الاختبار */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-slate-800">
                  نص السؤال كما يظهر في الاختبار
                </h3>
                <p className="text-xs md:text-sm text-slate-500">
                  يُستخدم خط عثمان طه في نصوص الآيات
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-4 md:px-6 py-4">
                <p
                  className="quran-text text-xl md:text-2xl leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: displayedQuestionHtml }}
                />
              </div>
            </div>

            {/* مربع تحرير نص السؤال */}
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-slate-800">
                تحرير نص السؤال
              </h3>
              <textarea
                ref={questionEditRef}
                value={currentQuestion.question || ''}
                onChange={(e) => updateCurrentQuestion({ question: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-white/90 px-4 md:px-6 py-4 text-right text-xl md:text-2xl leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[140px]"
              />
            </div>

            {/* الكلمة المستهدفة */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr,3fr] gap-4 md:gap-6 items-stretch">
              <div className="flex flex-col gap-2">
                <span className="text-sm md:text-base font-semibold text-slate-700">
                  الكلمة المستهدفة الحالية:
                </span>
                <div className="w-full rounded-full border border-emerald-300 bg-emerald-50/70 px-6 py-3 text-emerald-800 text-xl md:text-2xl flex items-center justify-center">
                  <span className="quran-uthmani text-2xl md:text-3xl text-emerald-700">
                    {targetWord}
                  </span>
                </div>
              </div>
              <div className="flex items-end justify-start md:justify-end">
                <button
                  type="button"
                  onClick={handlePickTargetWord}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-white/80 px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:shadow-md hover:-translate-y-[1px] transition"
                >
                  <span>🎯</span>
                  <span>تحديد الكلمة المستهدفة من نص السؤال</span>
                </button>
              </div>
            </div>

            {/* خيارات الإجابة */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-4 md:gap-6">
              {/* رقم الإجابة الصحيحة */}
              <div className="flex flex-col gap-3">
                <h3 className="text-base md:text-lg font-semibold text-slate-800">
                  رقم الإجابة الصحيحة
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4].map((num) => {
                    const isActive = currentQuestion.answer === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => updateCurrentQuestion({ answer: num })}
                        className={[
                          'flex h-11 min-w-[2.75rem] items-center justify-center rounded-full px-4 text-base md:text-lg font-bold border transition-all',
                          isActive
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                        ].join(' ')}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* نصوص الاختيارات */}
              <div className="flex flex-col gap-3">
                <h3 className="text-base md:text-lg font-semibold text-slate-800">
                  خيارات الإجابة
                </h3>
                <div className="space-y-3">
                  {currentQuestion.options?.map((opt, idx) => {
                    const letter = ['أ', 'ب', 'ج', 'د'][idx] || '';
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 px-4 md:px-6 py-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400 text-emerald-700 font-bold text-base md:text-lg bg-white/80">
                          {letter}
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...(currentQuestion.options || [])];
                            next[idx] = e.target.value;
                            updateCurrentQuestion({ options: next });
                          }}
                          className="flex-1 border-0 bg-transparent text-right text-base md:text-lg text-slate-900 focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* التفسير */}
            <div className="space-y-3">
              <h3 className="text-base md:text-lg font-semibold text-slate-800">
                التفسير / سبب الإجابة الصحيحة
              </h3>
              <textarea
                value={currentQuestion.explain || ''}
                onChange={(e) => updateCurrentQuestion({ explain: e.target.value })}
                className="w-full rounded-3xl border border-slate-200 bg-white/90 px-4 md:px-6 py-4 text-right text-base md:text-lg leading-relaxed text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[110px]"
              />
            </div>

            {/* زر علامة المراجعة والتنقل بين الأسئلة */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={toggleReviewed}
                className={[
                  'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm md:text-base font-semibold transition shadow-sm',
                  currentQuestion.reviewed
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100',
                ].join(' ')}
              >
                <span>{currentQuestion.reviewed ? '✅' : '⭐'}</span>
                <span>
                  {currentQuestion.reviewed
                    ? 'تمت مراجعة هذا السؤال'
                    : 'وضع علامة تمّت المراجعة'}
                </span>
              </button>

              <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 justify-end">
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIndex === 0}
                  className={[
                    'flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm md:text-base font-semibold transition',
                    currentIndex === 0
                      ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span>⬅️</span>
                  <span>السؤال السابق</span>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentIndex === totalQuestions - 1}
                  className={[
                    'flex-1 inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm md:text-base font-semibold transition',
                    currentIndex === totalQuestions - 1
                      ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                      : 'border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700',
                  ].join(' ')}
                >
                  <span>السؤال التالي</span>
                  <span>➡️</span>
                </button>
              </div>
            </div>
          </section>

          {/* أزرار الحفظ / التصدير / التحميل */}
          <section className="mt-6 flex flex-col md:flex-row gap-4">
            <button
              type="button"
              onClick={handleSaveToBrowser}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-indigo-500 bg-indigo-600 text-white px-6 py-4 text-sm md:text-base font-semibold shadow-md hover:bg-indigo-700 hover:shadow-lg transition"
            >
              <span>🧠</span>
              <span>حفظ التعديلات في المتصفح</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-emerald-600 bg-emerald-600 text-white px-6 py-4 text-sm md:text-base font-semibold shadow-md hover:bg-emerald-700 hover:shadow-lg transition"
            >
              <span>⬇️</span>
              <span>تصدير ملف JSON المحدَّث</span>
            </button>

            <button
              type="button"
              onClick={handleLoadJsonClick}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-6 py-4 text-sm md:text-base font-semibold text-slate-800 shadow-md hover:bg-slate-50 hover:shadow-lg transition"
            >
              <span>⬆️</span>
              <span>تحميل ملف JSON من الجهاز</span>
            </button>
          </section>

          {/* إضافة / حذف سؤال */}
          <section className="mt-6 flex flex-col md:flex-row gap-4 justify-center md:justify-between">
            <button
              type="button"
              onClick={handleDeleteCurrent}
              className="flex-1 md:flex-none md:min-w-[220px] inline-flex items-center justify-center gap-2 rounded-full border border-rose-400 bg-rose-50 px-6 py-3 text-sm md:text-base font-semibold text-rose-700 shadow-sm hover:bg-rose-100 hover:shadow-md transition"
            >
              <span>🗑️</span>
              <span>حذف السؤال الحالي</span>
            </button>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex-1 md:flex-none md:min-w-[220px] inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm md:text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:shadow-md transition"
            >
              <span>➕</span>
              <span>إضافة سؤال جديد</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
