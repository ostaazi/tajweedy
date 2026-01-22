'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

/* ============ أيقونات SVG حديثة ============ */

function IconTarget({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.3" />
      <line x1="12" y1="3" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function IconSave({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M9 4v5h6V4" />
      <path d="M9 14h6v5H9z" />
    </svg>
  );
}

function IconDownload({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M4 19h16" />
    </svg>
  );
}

function IconStar({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
      <path d="M12 3.5l2.26 4.63 5.11.74-3.7 3.6.87 5.08L12 15.9l-4.54 2.38.87-5.08-3.7-3.6 5.11-.74z" />
    </svg>
  );
}

function IconArrowLeft({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconArrowRight({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function IconPlus({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function IconTrash({ className = 'w-5 h-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

/* ============ خرائط أسماء الأقسام ============ */

const sectionTitlesMap = {
  nun_sakinah_tanween: 'أحكام النون الساكنة والتنوين',
  meem_sakinah: 'أحكام الميم الساكنة',
  madd: 'أحكام المدود',
};

const subSectionTitlesMap = {
  // أحكام النون الساكنة والتنوين
  idhar_halaqi: 'إظهار حلقي',
  idgham_with_ghunnah: 'إدغام بغنة',
  idgham_without_ghunnah: 'إدغام بغير غنة',
  idgham_bighunnah: 'إدغام بغنة',
  idgham_bilaghunnah: 'إدغام بغير غنة',
  ikhfa: 'إخفاء',
  iqlab: 'إقلاب',

  // أحكام الميم الساكنة
  idgham_shafawi: 'إدغام شفوي',
  idhar_shafawi: 'إظهار شفوي',
  ikhfa_shafawi: 'إخفاء شفوي',

  // المدود
  madd_tabii: 'مد طبيعي',
  madd_muttasil: 'مد متصل',
  madd_munfasil: 'مد منفصل',
  madd_lazim: 'مد لازم',
};

/* ============ دوال مساعدة ============ */

function stripMetaFields(question) {
  const plain = { ...question };
  delete plain.sectionKey;
  delete plain.partKey;
  delete plain.sectionTitle;
  delete plain.reviewed;
  delete plain.__index;
  return plain;
}

function formatQuestionText(text) {
  if (!text) return '';
  let result = text;
  result = result.replace(
    /﴿([^﴿﴾]+)﴾/g,
    '<span class="quran-uthmani">﴿$1﴾</span>'
  );
  result = result.replace(
    /{([^}]+)}/g,
    '<span class="quran-uthmani">$1</span>'
  );
  return result;
}

/* ============ الصفحة الرئيسية لمراجعة الأسئلة ============ */

export default function ReviewPage() {
  const [questionsBank, setQuestionsBank] = useState(null);
  const [flatQuestions, setFlatQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

  const glassPrimary =
    'group relative flex-1 overflow-hidden rounded-2xl border border-emerald-400 bg-white/20 backdrop-blur-sm px-5 py-3 md:py-4 text-base md:text-lg font-semibold text-emerald-800 shadow-sm hover:shadow-lg hover:bg-white/40 transition-all duration-200';
  const glassSecondary =
    'group relative flex-1 overflow-hidden rounded-2xl border border-slate-300 bg-white/20 backdrop-blur-sm px-5 py-3 md:py-4 text-base md:text-lg font-semibold text-slate-800 shadow-sm hover:shadow-lg hover:bg-white/40 transition-all duration-200';
  const glassPill =
    'inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white/30 backdrop-blur-sm px-5 py-3 text-sm md:text-base font-semibold text-amber-800 shadow-sm hover:shadow-md hover:bg-white/50 transition-all duration-200';

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/data/questions_bank.json');
        const data = await res.json();
        setQuestionsBank(data);

        const all = [];
        const sections = data.sections || {};

        Object.keys(sections).forEach((sectionKey) => {
          const section = sections[sectionKey];
          const sectionTitle = section.title || sectionTitlesMap[sectionKey] || sectionKey;
          const parts = section.parts || {};

          Object.keys(parts).forEach((partKey) => {
            const partQuestions = parts[partKey] || [];
            partQuestions.forEach((q, idx) => {
              all.push({
                ...q,
                sectionKey,
                sectionTitle,
                partKey,
                reviewed: q.reviewed === true,
                __index: idx,
              });
            });
          });
        });

        setFlatQuestions(all);
        setCurrentIndex(0);
      } catch (err) {
        console.error('خطأ في تحميل بنك الأسئلة:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const currentQuestion = flatQuestions[currentIndex] || null;

  const updateCurrentQuestionField = (field, value) => {
    setFlatQuestions((prev) => {
      if (!currentQuestion) return prev;
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], [field]: value };
      return updated;
    });
  };

  const handleOptionChange = (idx, value) => {
    setFlatQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[currentIndex] };
      const options = [...(q.options || [])];
      options[idx] = value;
      q.options = options;
      updated[currentIndex] = q;
      return updated;
    });
  };

  const handleCorrectAnswerChange = (value) => {
    const num = Number(value) || 1;
    updateCurrentQuestionField('answer', num);
  };

  const handleSectionChange = (newSectionKey) => {
    if (!questionsBank) return;
    const sections = questionsBank.sections || {};
    const section = sections[newSectionKey];

    let firstPartKey = '';
    if (section && section.parts) {
      const partKeys = Object.keys(section.parts);
      if (partKeys.length > 0) firstPartKey = partKeys[0];
    }

    setFlatQuestions((prev) => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        sectionKey: newSectionKey,
        sectionTitle: section?.title || sectionTitlesMap[newSectionKey] || newSectionKey,
        partKey: firstPartKey,
      };
      return updated;
    });
  };

  const handlePartChange = (newPartKey) => {
    updateCurrentQuestionField('partKey', newPartKey);
  };

  const handleQuestionSelectionChange = (e) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    setSelectionRange({ start, end });
  };

  const applyTargetWordFromSelection = () => {
    if (!currentQuestion) return;
    const text = currentQuestion.question || '';
    const { start, end } = selectionRange;
    if (start === end) return;
    const selected = text.slice(start, end).trim();
    if (!selected) return;
    updateCurrentQuestionField('targetWord', selected);
  };

  const goToIndex = (idx) => {
    if (idx < 0 || idx >= flatQuestions.length) return;
    setCurrentIndex(idx);
  };

  const goNext = () => goToIndex(currentIndex + 1);
  const goPrev = () => goToIndex(currentIndex - 1);

  const toggleReviewed = () => {
    setFlatQuestions((prev) => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], reviewed: !updated[currentIndex].reviewed };
      return updated;
    });
  };

  const buildUpdatedBank = () => {
    if (!questionsBank) return null;
    const base = JSON.parse(JSON.stringify(questionsBank));
    const sections = base.sections || {};

    Object.keys(sections).forEach((sectionKey) => {
      const section = sections[sectionKey];
      if (!section.parts) section.parts = {};
      Object.keys(section.parts).forEach((partKey) => {
        section.parts[partKey] = [];
      });
    });

    flatQuestions.forEach((q) => {
      const { sectionKey, partKey } = q;
      if (!sectionKey || !partKey) return;

      if (!sections[sectionKey]) {
        sections[sectionKey] = {
          title: sectionTitlesMap[sectionKey] || sectionKey,
          parts: {},
        };
      }
      if (!sections[sectionKey].parts[partKey]) {
        sections[sectionKey].parts[partKey] = [];
      }

      sections[sectionKey].parts[partKey].push(stripMetaFields(q));
    });

    base.sections = sections;
    return base;
  };

  const saveToBrowser = () => {
    const updatedBank = buildUpdatedBank();
    if (!updatedBank) return;
    try {
      localStorage.setItem('questions_bank_reviewed', JSON.stringify(updatedBank));
      alert('تم حفظ التعديلات في المتصفح بنجاح.');
    } catch (err) {
      console.error('خطأ في الحفظ إلى المتصفح:', err);
      alert('حدث خطأ أثناء الحفظ في المتصفح.');
    }
  };

  const downloadJson = () => {
    const updatedBank = buildUpdatedBank();
    if (!updatedBank) return;

    const blob = new Blob([JSON.stringify(updatedBank, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_bank_reviewed.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const addNewQuestion = () => {
    if (!questionsBank) return;
    const sections = questionsBank.sections || {};
    const sectionKeys = Object.keys(sections);
    const defaultSectionKey = sectionKeys[0] || 'nun_sakinah_tanween';
    const defaultSection = sections[defaultSectionKey];
    const defaultPartKey =
      defaultSection && defaultSection.parts
        ? Object.keys(defaultSection.parts)[0] || 'default_part'
        : 'default_part';

    const newQuestion = {
      qnum: flatQuestions.length + 1,
      question: '',
      options: ['', '', '', ''],
      answer: 1,
      explain: '',
      targetWord: '',
      sectionKey: defaultSectionKey,
      sectionTitle:
        defaultSection?.title ||
        sectionTitlesMap[defaultSectionKey] ||
        defaultSectionKey,
      partKey: defaultPartKey,
      reviewed: false,
    };

    setFlatQuestions((prev) => [...prev, newQuestion]);
    setCurrentIndex(flatQuestions.length);
  };

  const deleteCurrentQuestion = () => {
    if (!currentQuestion) return;
    const confirmed = window.confirm(
      'تحذير: سيتم حذف هذا السؤال نهائيًا من جلسة المراجعة الحالية. هل أنت متأكد من المتابعة؟'
    );
    if (!confirmed) return;

    setFlatQuestions((prev) => {
      if (prev.length === 0) return prev;
      const updated = prev.filter((_, idx) => idx !== currentIndex);
      let newIndex = currentIndex;
      if (newIndex >= updated.length) newIndex = updated.length - 1;
      if (newIndex < 0) newIndex = 0;
      setCurrentIndex(newIndex);
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-lg text-slate-600">
            جاري تحميل الأسئلة للمراجعة…
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-xl font-bold text-slate-700">
          لا توجد أسئلة للمراجعة.
        </p>
      </div>
    );
  }

  const totalQuestions = flatQuestions.length;
  const sectionKey = currentQuestion.sectionKey;
  const currentSection = questionsBank?.sections?.[sectionKey];
  const parts = currentSection?.parts || {};
  const currentPartKey = currentQuestion.partKey;
  const targetWord = currentQuestion.targetWord || '';

  return (
    <div className="relative min-h-screen p-4 md:p-8 overflow-hidden" dir="rtl">
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <Image
          src="/tajweedy_background.jpg"
          alt="Tajweedy Background"
          fill
          className="object-cover"
        />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* الهيدر */}
        <div className="mb-6 flex items-center justify-between rounded-3xl bg-white px-4 py-3 md:px-6 md:py-4 shadow-md border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 md:h-14 md:w-14">
              <Image
                src="/logo.png"
                alt="Tajweedy Logo"
                fill
                className="object-contain"
              />
            </div>
            <div>
              <p className="text-sm md:text-base text-slate-500">
                مراجعة سؤال {currentIndex + 1} من {totalQuestions}
              </p>
              <h1 className="text-lg md:text-2xl font-bold text-slate-800">
                مراجعة بنك الأسئلة – Tajweedy
              </h1>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm md:text-base font-semibold text-emerald-700 hover:bg-emerald-50 hover:shadow-md transition-all duration-200"
          >
            <span>العودة للرئيسية</span>
          </Link>
        </div>

        {/* شريط أرقام الأسئلة */}
        <div className="mb-5 rounded-3xl bg-white px-4 py-3 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base md:text-lg font-semibold text-slate-800">
              قائمة الأسئلة
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              ⭐ تعني أن السؤال تمت مراجعته
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {flatQuestions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isReviewed = q.reviewed;
              let cls =
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-150 border ';
              if (isCurrent) {
                cls +=
                  'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105';
              } else if (isReviewed) {
                cls +=
                  'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100';
              } else {
                cls +=
                  'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
              }
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goToIndex(idx)}
                  className={cls}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* البطاقة الرئيسية */}
        <div className="rounded-3xl bg-white px-4 py-5 md:px-8 md:py-8 shadow-xl border border-slate-100 mb-8">
          {/* القسم الرئيسي والفرعي */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm md:text-base font-semibold text-slate-700">
                القسم الرئيسي
              </label>
              <select
                value={currentQuestion.sectionKey}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
              >
                {questionsBank &&
                  Object.entries(questionsBank.sections || {}).map(
                    ([sKey, sObj]) => (
                      <option key={sKey} value={sKey}>
                        {sObj.title || sectionTitlesMap[sKey] || sKey}
                      </option>
                    )
                  )}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm md:text-base font-semibold text-slate-700">
                القسم الفرعي
              </label>
              <select
                value={currentPartKey}
                onChange={(e) => handlePartChange(e.target.value)}
                className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Object.keys(parts).map((partKey) => (
                  <option key={partKey} value={partKey}>
                    {subSectionTitlesMap[partKey] || partKey}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* عرض السؤال كما في الاختبار */}
          <div className="mb-5">
            <label className="mb-2 block text-base md:text-lg font-semibold text-slate-700">
              نص السؤال كما يظهر في الاختبار
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p
                className="text-2xl md:text-3xl text-slate-800 text-center leading-relaxed font-amiri"
                dir="rtl"
                dangerouslySetInnerHTML={{
                  __html: formatQuestionText(currentQuestion.question || ''),
                }}
              />
            </div>
          </div>

          {/* مربع تحرير نص السؤال */}
          <div className="mb-6">
            <label className="mb-2 block text-base md:text-lg font-semibold text-slate-700">
              نص السؤال (قابل للتعديل)
            </label>
            <textarea
              value={currentQuestion.question || ''}
              onChange={(e) =>
                updateCurrentQuestionField('question', e.target.value)
              }
              onSelect={handleQuestionSelectionChange}
              className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-right text-xl md:text-2xl leading-relaxed font-amiri text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400 min-h-[140px]"
            />
          </div>

          {/* الكلمة المستهدفة + زر التحديد */}
          <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <button
              type="button"
              onClick={applyTargetWordFromSelection}
              className={glassPrimary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconTarget />
                <span>تحديد الكلمة المستهدفة من نص السؤال</span>
              </span>
            </button>

            <div className="flex-1 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-3 flex items-center gap-4">
              <span className="text-base md:text-lg font-semibold text-slate-700">
                الكلمة المستهدفة الحالية:
              </span>
              <div className="flex-1 flex justify-center">
                <span className="text-xl md:text-2xl font-bold text-emerald-700">
                  {targetWord || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* الخيارات + رقم الإجابة + التفسير */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
            {/* خيارات الإجابة */}
            <div className="flex flex-col gap-3">
              <span className="text-base md:text-lg font-semibold text-slate-700 mb-1">
                خيارات الإجابة
              </span>
              {(currentQuestion.options || []).map((opt, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white text-base md:text-lg font-bold">
                    {['أ', 'ب', 'ج', 'د'][idx]}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) =>
                      handleOptionChange(idx, e.target.value)
                    }
                    className="flex-1 bg-transparent text-right text-base md:text-lg text-slate-800 focus:outline-none"
                    placeholder={`الاختيار ${idx + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* رقم الإجابة الصحيحة + التفسير */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-base md:text-lg font-semibold text-slate-700">
                  رقم الإجابة الصحيحة
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((num) => {
                    const active = currentQuestion.answer === num;
                    let cls =
                      'flex items-center justify-center rounded-2xl border px-2 py-3 text-base md:text-lg font-bold transition-all duration-150 ';
                    cls += active
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleCorrectAnswerChange(num)}
                        className={cls}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-base md:text-lg font-semibold text-slate-700">
                  التفسير / سبب الإجابة الصحيحة
                </label>
                <textarea
                  value={currentQuestion.explain || ''}
                  onChange={(e) =>
                    updateCurrentQuestionField('explain', e.target.value)
                  }
                  className="min-h-[110px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* زر علامة تمت المراجعة */}
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={toggleReviewed}
              className={glassPill}
            >
              <IconStar className="w-4 h-4" />
              <span>
                {currentQuestion.reviewed
                  ? 'تمت مراجعة هذا السؤال'
                  : 'وضع علامة تمت المراجعة'}
              </span>
            </button>
          </div>

          {/* أزرار التنقل */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className={
                glassSecondary +
                (currentIndex === 0
                  ? ' opacity-40 cursor-not-allowed hover:shadow-none hover:bg-white/20'
                  : '')
              }
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconArrowLeft />
                <span>السؤال السابق</span>
              </span>
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === totalQuestions - 1}
              className={
                glassSecondary +
                (currentIndex === totalQuestions - 1
                  ? ' opacity-40 cursor-not-allowed hover:shadow-none hover:bg-white/20'
                  : '')
              }
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <span>السؤال التالي</span>
                <IconArrowRight />
              </span>
            </button>
          </div>

          {/* الحفظ والتنزيل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <button
              type="button"
              onClick={saveToBrowser}
              className={glassPrimary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconSave />
                <span>حفظ التعديلات في المتصفح</span>
              </span>
            </button>

            <button
              type="button"
              onClick={downloadJson}
              className={glassPrimary}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-sky-500/15 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconDownload />
                <span>تنزيل ملف JSON المحدّث</span>
              </span>
            </button>
          </div>

          {/* إضافة / حذف سؤال */}
          <div className="mt-6 flex flex-col md:flex-row justify-center gap-4">
            <button
              type="button"
              onClick={addNewQuestion}
              className={glassSecondary + ' max-w-xs'}
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-indigo-500/12 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconPlus />
                <span>إضافة سؤال جديد</span>
              </span>
            </button>

            <button
              type="button"
              onClick={deleteCurrentQuestion}
              className={
                'group relative max-w-xs flex-1 overflow-hidden rounded-2xl border border-red-300 bg-red-50/70 backdrop-blur-sm px-5 py-3 md:py-4 text-base md:text-lg font-semibold text-red-700 shadow-sm hover:shadow-lg hover:bg-red-100 transition-all duration-200'
              }
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-red-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <IconTrash />
                <span>حذف السؤال الحالي</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
