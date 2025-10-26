'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

  useEffect(() => {
    fetch('/data/questions_bank.json')
      .then(res => res.json())
      .then(data => setQuestionsBank(data))
      .catch(err => console.error('خطأ في تحميل بنك الأسئلة:', err));
  }, []);

  const startQuiz = () => {
    if (!questionsBank) return;

    // تجميع الأسئلة حسب الأقسام الرئيسية الثلاثة
    const sectionGroups = {
      section1: [], // القسم الأول
      section2: [], // القسم الثاني
      section3: []  // القسم الثالث
    };

    Object.keys(questionsBank.sections).forEach(sectionKey => {
      const section = questionsBank.sections[sectionKey];
      const sectionGroup = sectionGroups[sectionKey] || [];
      
      Object.keys(section.parts).forEach(partKey => {
        const questions = section.parts[partKey];
        questions.forEach(q => {
          sectionGroup.push({
            ...q,
            section: section.title,
            part: partKey
          });
        });
      });
      
      sectionGroups[sectionKey] = sectionGroup;
    });

    // حساب عدد الأسئلة لكل قسم (بالتساوي)
    const questionsPerSection = Math.floor(questionsCount / 3);
    const remainder = questionsCount % 3;

    const selectedQuestions = [];

    // اختيار أسئلة من كل قسم
    Object.keys(sectionGroups).forEach((key, index) => {
      const sectionQuestions = sectionGroups[key];
      
      // إضافة سؤال إضافي للأقسام الأولى إذا كان هناك باقي
      const count = questionsPerSection + (index < remainder ? 1 : 0);
      
      // خلط وتحديد الأسئلة
      const shuffled = sectionQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, sectionQuestions.length));
      
      selectedQuestions.push(...selected);
    });

    // خلط الأسئلة النهائية
    const finalQuestions = selectedQuestions.sort(() => Math.random() - 0.5);
    
    setSelectedQuestions(finalQuestions);
    setUserAnswers(new Array(finalQuestions.length).fill(null));
    setQuizStarted(true);
    setCurrentQuestionIndex(0);
  };

  const handleAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    let correctCount = 0;
    selectedQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.answer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / selectedQuestions.length) * 100);

    const attempt = {
      id: Date.now(),
      date: new Date().toISOString(),
      questionsCount: selectedQuestions.length,
      correctCount,
      score,
      questions: selectedQuestions,
      answers: userAnswers
    };

    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    attempts.push(attempt);
    localStorage.setItem('quizAttempts', JSON.stringify(attempts));

    router.push(`/quiz/result?id=${attempt.id}`);
  };

  const endQuiz = () => {
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

  return (
    <div className="min-h-screen p-4 md:p-8 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <Link href="/" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2 text-lg">
            <span>←</span> العودة للرئيسية
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

        {!quizStarted ? (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center font-amiri">
              إعدادات الاختبار
            </h2>

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
              className="w-full bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold text-xl hover:bg-[#155c3e] transition-all shadow-md"
            >
              ابدأ الاختبار
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 md:p-8 mb-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-semibold text-gray-600">
                  السؤال {currentQuestionIndex + 1} من {selectedQuestions.length}
                </span>
                <span className="text-base font-semibold text-[#1e7850]">
                  {Math.round(((currentQuestionIndex + 1) / selectedQuestions.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-[#1e7850] h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / selectedQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-2xl md:text-3xl text-gray-800 mb-4 text-center font-amiri leading-relaxed">
                {currentQuestion.question}
              </p>
              <p className="text-base md:text-lg text-gray-500 text-center">
                {currentQuestion.section}
              </p>
            </div>

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
                    <span className="inline-block w-10 h-10 rounded-full bg-white border-2 border-current mr-3 text-center leading-10 text-lg">
                      {['أ', 'ب', 'ج', 'د'][index]}
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="mb-6 p-5 bg-blue-50 rounded-2xl border border-blue-200">
                <p className="text-blue-800 font-semibold mb-2 text-lg">💡 التفسير:</p>
                <p className="text-blue-700 text-base md:text-lg leading-relaxed">
                  {currentQuestion.explain}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {showExplanation && (
                <button
                  onClick={nextQuestion}
                  className="flex-1 bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-[#155c3e] transition-all shadow-md"
                >
                  {currentQuestionIndex < selectedQuestions.length - 1 ? 'السؤال التالي' : 'إنهاء الاختبار'}
                </button>
              )}
              <button
                onClick={endQuiz}
                className="flex-1 bg-white border-2 border-red-500 text-red-500 px-6 py-4 rounded-full font-bold text-lg hover:bg-red-50 transition-all shadow-md"
              >
                إنهاء الاختبار
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
