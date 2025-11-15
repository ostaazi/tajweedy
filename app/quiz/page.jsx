'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

/* ============ أيقونات بسيطة للأزرار (مثل صفحة المراجعة) ============ */

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

export default function QuizPage() {
  const router = useRouter();
  
  const [questionsBank, setQuestionsBank] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questionsCount, setQuestionsCount] = useState(10);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // اسم المتدرب (يُستخدم في صفحة النتيجة والتقارير)
  const [traineeName, setTraineeName] = useState('');
  const [savedTraineeName, setSavedTraineeName] = useState('');

  useEffect(() => {
    fetch('/data/questions_bank.json')
      .then(res => res.json())
      .then(data => setQuestionsBank(data))
      .catch(err => console.error('خطأ في تحميل بنك الأسئلة:', err));
  }, []);

  // تحميل اسم المتدرب من التخزين المحلي (إن وجد)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const storedName = localStorage.getItem('tajweedy_trainee_name') || '';
      if (storedName) {
        setTraineeName(storedName);
        setSavedTraineeName(storedName);
      }
    } catch (err) {
      console.error('خطأ في تحميل اسم المتدرب من التخزين المحلي:', err);
    }
  }, []);

  const handleSaveTraineeName = () => {
    const nameToSave = (traineeName || '').trim();
    if (!nameToSave) {
      alert('من فضلك اكتب اسم المتدرب أولًا.');
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tajweedy_trainee_name', nameToSave);
      }
      setSavedTraineeName(nameToSave);
      alert('تم حفظ اسم المتدرب بنجاح.');
    } catch (err) {
      console.error('خطأ في حفظ اسم المتدرب:', err);
      alert('حدث خطأ أثناء حفظ اسم المتدرب.');
    }
  };

  // دالة خلط عميقة
  const deepShuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // دالة تنسيق السؤال
  const formatQuestionText = (text) => {
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
  };

  const startQuiz = () => {
    if (!questionsBank) return;

    // جمع جميع الأسئلة مع تعريف القسم
    const allQuestions = [];
    
    Object.keys(questionsBank.sections).forEach(sectionKey => {
      const section = questionsBank.sections[sectionKey];
      
      Object.keys(section.parts).forEach(partKey => {
        const questions = section.parts[partKey];
        questions.forEach(q => {
          allQuestions.push({
            ...q,
            sectionKey: sectionKey,
            section: section.title,
            part: partKey
          });
        });
      });
    });

    // خلط عميق لجميع الأسئلة
    const fullyShuffled = deepShuffle(allQuestions);

    // تحديد الأقسام
    const sections = Object.keys(questionsBank.sections);
    const questionsPerSection = Math.floor(questionsCount / sections.length);
    const remainder = questionsCount % sections.length;

    // تجميع الأسئلة حسب القسم
    const sectionGroups = {};
    sections.forEach(key => {
      sectionGroups[key] = fullyShuffled.filter(q => q.sectionKey === key);
    });

    // اختيار الأسئلة بالتساوي
    const selectedQuestionsLocal = [];
    
    sections.forEach((key, index) => {
      const count = questionsPerSection + (index < remainder ? 1 : 0);
      const sectionQuestions = sectionGroups[key];
      
      if (sectionQuestions && sectionQuestions.length > 0) {
        const shuffled = deepShuffle(sectionQuestions);
        const selected = shuffled.slice(0, Math.min(count, shuffled.length));
        selectedQuestionsLocal.push(...selected);
      }
    });

    // خلط نهائي
    const finalQuestions = deepShuffle(selectedQuestionsLocal);
    
    setSelectedQuestions(finalQuestions);
    setUserAnswers(new Array(finalQuestions.length).fill(null));
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  // دالة عامة للانتقال لسؤال معيّن
  const goToQuestion = (index) => {
    setCurrentQuestionIndex(index);
    const savedAnswer = userAnswers[index];
    setSelectedAnswer(savedAnswer);
    setShowExplanation(savedAnswer !== null);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    }
  };

  // إنهاء الاختبار وحفظ المحاولة
  const finishQuiz = () => {
    let correctCount = 0;
    
    const responses = selectedQuestions.map((q, index) => {
      const userAnswer = userAnswers[index];
      const isCorrect = userAnswer === q.answer;
      if (isCorrect) correctCount++;
      
      return {
        question: q.question,
        section: q.section,
        subsection: q.part || '',
        userAnswer: userAnswer,
        correctAnswer: q.answer,
        correct: isCorrect,
        explanation: q.explain
      };
    });

    const attempt = {
      id: Date.now(),
      date: new Date().toISOString(),
      score: correctCount,
      total: selectedQuestions.length,
      traineeName: (savedTraineeName || traineeName || '').trim(), // اسم المتدرب للنتيجة والتقارير
      responses: responses
    };

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    attempts.push(attempt);
    localStorage.setItem('quizAttempts', JSON.stringify(attempts));

    console.log('✅ Attempt saved:', attempt);

    router.push(`/quiz/result?id=${attempt.id}`);
  };

  const endQuiz = () => {
    // البحث عن الأسئلة غير المجابة
    const unansweredIndices = userAnswers
      .map((ans, idx) => (ans === null ? idx : -1))
      .filter(idx => idx !== -1);

    if (unansweredIndices.length > 0) {
      const questionNumbers = unansweredIndices.map(i => i + 1).join('، ');
      alert(
        `يجب الإجابة على جميع الأسئلة قبل إنهاء الاختبار.\n` +
        `الأسئلة غير المجابة: ${questionNumbers}`
      );

      // الانتقال لأول سؤال غير مُجاب
      const firstUnanswered = unansweredIndices[0];
      goToQuestion(firstUnanswered);
      return;
    }

    if (confirm('هل أنت متأكد من إنهاء الاختبار؟')) {
      finishQuiz();
    }
  };

  if (!questionsBank) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تحميل الأسئلة...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = selectedQuestions[currentQuestionIndex];
  const isLastQuestion =
    quizStarted && currentQuestionIndex === selectedQuestions.length - 1;

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الهيدر */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-4 py-2 text-sm md:text-base font-semibold text-emerald-700 hover:bg-emerald-50 hover:shadow-md transition-all duration-200"
          >
            <IconArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </Link>
          <div className="w-12 h-12 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">
            اختبار أحكام التجويد
          </h1>
        </div>

        {/* قبل بدء الاختبار */}
        {!quizStarted ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
              إعدادات الاختبار
            </h2>

            {/* اسم المتدرب + زر الحفظ */}
            <div className="mb-8">
              <label className="block text-base md:text-lg font-semibold text-gray-700 mb-2 text-right">
                اسم المتدرب (يظهر في النتيجة والتقارير):
              </label>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                <input
                  type="text"
                  value={traineeName}
                  onChange={(e) => setTraineeName(e.target.value)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-base md:text-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-400"
                  placeholder="اكتب اسم المتدرب هنا"
                />
                <button
                  type="button"
                  onClick={handleSaveTraineeName}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400 bg-emerald-50 px-4 py-3 text-sm md:text-base font-semibold text-emerald-800 shadow-sm hover:shadow-md hover:bg-emerald-100 transition-all duration-200"
                >
                  <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-500/15 via-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    <IconSave className="w-4 h-4" />
                    <span>حفظ الاسم</span>
                  </span>
                </button>
              </div>
              {savedTraineeName && (
                <p className="mt-2 text-sm md:text-base text-slate-600 text-right">
                  الاسم المحفوظ حاليًا:&nbsp;
                  <span className="font-bold text-emerald-700">
                    {savedTraineeName}
                  </span>
                </p>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-xl font-semibold text-gray-700 mb-3 text-center">
                عدد الأسئلة: {questionsCount}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={questionsCount}
                onChange={(e) => setQuestionsCount(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1e7850]"
              />
              <div className="flex justify-between text-base text-gray-500 mt-2">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="group relative w-full overflow-hidden rounded-3xl border border-emerald-500 bg-emerald-600 px-6 py-4 text-xl font-bold text-white shadow-md hover:shadow-lg hover:bg-emerald-700 transition-all duration-200"
            >
              <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-emerald-400/30 via-sky-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                <span>ابدأ الاختبار</span>
              </span>
            </button>
          </div>
        ) : (
          /* بعد بدء الاختبار */
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6">
            {/* شريط التقدم */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-semibold text-gray-600">
                  السؤال {currentQuestionIndex + 1} من {selectedQuestions.length}
                </span>
                <span className="text-base font-semibold text-[#1e7850]">
                  {Math.round(
                    ((currentQuestionIndex + 1) / selectedQuestions.length) * 100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-[#1e7850] h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      ((currentQuestionIndex + 1) / selectedQuestions.length) * 100
                    }%`
                  }}
                ></div>
              </div>

              {/* شريط أرقام الأسئلة */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {selectedQuestions.map((_, idx) => {
                  const answered = userAnswers[idx] !== null;
                  const isCurrent = idx === currentQuestionIndex;

                  let classes =
                    'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-150 border ';
                  if (isCurrent) {
                    classes +=
                      'bg-emerald-600 text-white border-emerald-600 shadow-md scale-105';
                  } else if (answered) {
                    classes +=
                      'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100';
                  } else {
                    classes +=
                      'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={classes}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* نص السؤال */}
            <div className="mb-6">
              <p
                className="text-2xl md:text-3xl text-gray-800 mb-4 text-center font-amiri leading-relaxed"
                dir="rtl"
                dangerouslySetInnerHTML={{
                  __html: formatQuestionText(currentQuestion.question),
                }}
              />
              <p className="text-base md:text-lg text-gray-500 text-center">
                {currentQuestion.section}
              </p>
            </div>

            {/* الخيارات */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index + 1;
                const isCorrect = index + 1 === currentQuestion.answer;
                const showResult = showExplanation;

                return (
                  <button
                    key={index}
                    onClick={() => !showExplanation && handleAnswer(index + 1)}
                    disabled={showExplanation}
                    className={`w-full p-5 rounded-2xl border-2 text-xl md:text-2xl font-semibold transition-all text-right ${
                      showResult
                        ? isCorrect
                          ? 'bg-green-100 border-green-500 text-green-800'
                          : isSelected
                          ? 'bg-red-100 border-red-500 text-red-800'
                          : 'border-gray-200 text-gray-600'
                        : isSelected
                        ? 'bg-blue-100 border-blue-500 text-blue-800'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <span className="inline-block w-10 h-10 rounded-full bg-white border-2 border-current ml-3 text-center leading-10 text-lg">
                      {['أ', 'ب', 'ج', 'د'][index]}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {/* التفسير بعد الإجابة */}
            {showExplanation && (
              <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-blue-800 font-semibold mb-2 text-lg">💡 التفسير:</p>
                <p className="text-blue-700 text-base md:text-lg leading-relaxed">
                  {currentQuestion.explain}
                </p>
              </div>
            )}

            {/* أزرار التنقّل (دائمًا ظاهرة) */}
            <div className="flex gap-3">
              <button
                onClick={currentQuestionIndex > 0 ? prevQuestion : undefined}
                disabled={currentQuestionIndex === 0}
                className={`group relative flex-1 overflow-hidden rounded-2xl border px-6 py-4 text-lg font-bold transition-all duration-200 ${
                  currentQuestionIndex === 0
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-slate-300 text-slate-800 hover:bg-white/60 hover:shadow-md'
                }`}
              >
                {currentQuestionIndex !== 0 && (
                  <span className="absolute inset-0 pointer-events-none bg-gradient-to-l from-slate-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
                <span className="relative flex items-center justify-center gap-2">
                  <IconArrowRight />
                  <span>السؤال السابق</span>
                </span>
              </button>

              <button
                onClick={isLastQuestion ? endQuiz : nextQuestion}
                className="group relative flex-1 overflow-hidden rounded-2xl border border-emerald-500 bg-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-md hover:shadow-lg hover:bg-emerald-700 transition-all duration-200"
              >
                <span className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-400/25 via-sky-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative flex items-center justify-center gap-2">
                  <span>{isLastQuestion ? 'إنهاء الاختبار' : 'السؤال التالي'}</span>
                  <IconArrowLeft />
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
