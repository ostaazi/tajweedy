'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

/* ===== Helpers ===== */
function normalizeId(v) {
  if (v == null) return null;
  // نحافظ على كلٍ من النسخ الرقمية والنصية
  const asNumber = Number(v);
  if (!Number.isNaN(asNumber) && String(asNumber) === String(v)) {
    return { num: asNumber, str: String(asNumber) };
  }
  return { num: null, str: String(v) };
}

function loadAllAttempts() {
  // ندعم أكثر من مفتاح تخزين تحسبًا لاختلاف الإصدارات
  const keys = ['quizAttempts', 'tajweedy_quiz_attempts', 'tajweedy_last_report'];
  let out = [];
  for (const k of keys) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) out = out.concat(parsed);
      else if (parsed && typeof parsed === 'object') out.push(parsed);
    } catch (_) {}
  }
  // إزالة المكررات بناءً على id+date إن وجد
  const seen = new Set();
  return out.filter(a => {
    const key = `${a?.id ?? 'noid'}_${a?.date ?? 'nodate'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function coerceAttemptShape(a) {
  if (!a) return null;
  const total = Array.isArray(a.questions) ? a.questions.length : (a.questionsCount ?? 0);
  const correct = typeof a.correctCount === 'number'
    ? a.correctCount
    : (Array.isArray(a.answers) && Array.isArray(a.questions)
        ? a.questions.reduce((acc, q, i) => acc + (a.answers[i] === q.answer ? 1 : 0), 0)
        : 0);
  const score = typeof a.score === 'number' ? a.score : (total ? Math.round((correct / total) * 100) : 0);

  return {
    id: a.id ?? a.ts ?? a.date ?? crypto.randomUUID?.() ?? String(Date.now()),
    date: a.date ?? a.ts ?? Date.now(),
    score,
    correctCount: correct,
    questionsCount: total,
    // نضمن وجود المصفوفات لتجنّب الأعطال
    questions: Array.isArray(a.questions) ? a.questions : [],
    answers: Array.isArray(a.answers) ? a.answers : [],
    section: a.section ?? a.sectionKey ?? 'quiz',
  };
}

/* ===== Page content ===== */
function ResultContent() {
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('id');

  const [attempt, setAttempt] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [teacherName, setTeacherName] = useState('');

  const [debugOpen, setDebugOpen] = useState(false);
  const [debugList, setDebugList] = useState([]);

  useEffect(() => {
    // تحميل جميع المحاولات
    const all = loadAllAttempts();
    setDebugList(all);

    if (!all.length) {
      setAttempt(null);
      return;
    }

    // إن وجد id بالـ URL نبحث به (نص/رقم)
    let chosen = null;
    if (attemptIdParam) {
      const { num, str } = normalizeId(attemptIdParam);
      chosen =
        all.find(a => String(a.id) === str) ??
        (num !== null ? all.find(a => Number(a.id) === num) : null);
    }

    // إن لم نجد أو لم يوجد id: نأخذ آخر محاولة بحسب التاريخ
    if (!chosen) {
      chosen = [...all].sort((a, b) => new Date(b.date ?? b.ts ?? 0) - new Date(a.date ?? a.ts ?? 0))[0];
    }

    setAttempt(coerceAttemptShape(chosen));
  }, [attemptIdParam]);

  if (!attempt) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">لا توجد محاولات محفوظة بعد.</p>
          <p className="text-gray-500 mt-2 text-sm">
            تأكد أن صفحة الاختبار تقوم بحفظ النتائج في <code>localStorage</code> تحت المفتاح
            <code className="mx-1">quizAttempts</code>.
          </p>
        </div>
      </div>
    );
  }

  const percentage = attempt.score ?? 0;
  const wrongCount = Math.max(0, (attempt.questionsCount ?? 0) - (attempt.correctCount ?? 0));
  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {/* Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] z-0">
        <Image src="/logo.png" alt="Watermark" width={800} height={800} className="object-contain" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-2xl p-4 shadow-md">
          <Link href="/quiz" className="text-[#1e7850] hover:text-[#155c3e] font-semibold flex items-center gap-2 text-lg">
            <span>←</span> اختبار جديد
          </Link>
          <div className="w-16 h-16 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1e7850] mb-2">🎓 تقرير أداء الاختبار</h1>
          <p className="text-gray-600 text-lg">
            {new Date(attempt.date).toLocaleString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        </div>

        {/* Student & Teacher */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-lg">👤 اسم المتدرب</label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1e7850] focus:outline-none text-lg"
                placeholder="أدخل اسمك..."
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-lg">👨‍🏫 اسم المدرب (اختياري)</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#1e7850] focus:outline-none text-lg"
                placeholder="أدخل اسم المدرب..."
              />
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Donut */}
            <div className="relative w-64 h-64 mx-auto">
              <svg className="transform -rotate-90" width="256" height="256">
                <circle cx="128" cy="128" r="80" stroke="#e5e7eb" strokeWidth="20" fill="none" />
                <circle
                  cx="128" cy="128" r="80" stroke="#10b981" strokeWidth="20" fill="none"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round" className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-bold text-[#1e7850]">{percentage}%</p>
                  <p className="text-gray-600 mt-2 text-lg">النسبة النهائية</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200">
                <p className="text-green-800 font-semibold text-xl mb-2">✅ إجابات صحيحة</p>
                <p className="text-5xl font-bold text-green-600">{attempt.correctCount}</p>
              </div>
              <div className="bg-red-50 p-5 rounded-2xl border-2 border-red-200">
                <p className="text-red-800 font-semibold text-xl mb-2">❌ إجابات خاطئة</p>
                <p className="text-5xl font-bold text-red-600">{wrongCount}</p>
              </div>
              <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200">
                <p className="text-blue-800 font-semibold text-xl mb-2">📝 إجمالي الأسئلة</p>
                <p className="text-5xl font-bold text-blue-600">{attempt.questionsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="bg-blue-500 text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-md"
          >
            {showDetails ? '📤 إخفاء' : '📥 التفاصيل'}
          </button>

          <button onClick={() => window.print()}
            className="bg-gray-500 text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-gray-600 transition-all shadow-md">
            🖨️ طباعة
          </button>

          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('✅ تم نسخ الرابط!'); }}
            className="bg-[#1e7850] text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-[#155c3e] transition-all shadow-md">
            🔗 نسخ
          </button>

          <button
            onClick={() => { if (navigator.share) navigator.share({ title: 'نتيجة Tajweedy', text: `حصلت على ${percentage}%`, url: window.location.href }); }}
            className="bg-purple-500 text-white px-6 py-4 rounded-full font-bold text-lg hover:bg-purple-600 transition-all shadow-md">
            📤 مشاركة
          </button>
        </div>

        {/* QR (placeholder) */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 bg-gradient-to-br from-[#1e7850] to-[#155c3e] rounded-2xl flex items-center justify-center text-white font-bold text-center">
                <div>
                  <p className="text-3xl mb-1">QR</p>
                  <p className="text-xs">امسح للوصول</p>
                </div>
              </div>
              <div>
                <p className="text-gray-700 font-semibold text-lg">📱 رمز الاستجابة السريع</p>
                <p className="text-gray-500 text-sm">امسح الرمز للوصول للتقرير</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-gray-700 font-bold text-xl">منصة Tajweedy</p>
                <p className="text-gray-500 text-sm">التعليم التفاعلي للتجويد</p>
              </div>
              <div className="w-20 h-20 relative">
                <Image src="/logo.png" alt="Tajweedy" fill className="object-contain" />
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        {showDetails && (
          <div className="bg-white rounded-3xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 font-amiri">📊 تفاصيل الإجابات</h2>
            {attempt.questions.length === 0 ? (
              <p className="text-gray-500">لا تتوفر تفاصيل للأسئلة في هذه المحاولة.</p>
            ) : (
              <div className="space-y-6">
                {attempt.questions.map((question, index) => {
                  const userAnswer = attempt.answers[index];
                  const isCorrect = userAnswer === question.answer;
                  return (
                    <div key={index}
                      className={`p-6 rounded-2xl border-2 ${
                        isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <span className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>{index + 1}</span>
                        <div className="flex-1">
                          <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 font-amiri leading-relaxed">
                            {question.question}
                          </p>
                          <p className="text-base text-gray-500">{question.section}</p>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4">
                        {question.options.map((option, optIndex) => {
                          const isUserAnswer = userAnswer === optIndex + 1;
                          const isCorrectAnswer = question.answer === optIndex + 1;
                          return (
                            <div key={optIndex}
                              className={`p-4 rounded-lg text-lg ${
                                isCorrectAnswer ? 'bg-green-100 border-2 border-green-500'
                                : isUserAnswer ? 'bg-red-100 border-2 border-red-500'
                                : 'bg-white border border-gray-200'
                              }`}
                            >
                              <span className="font-semibold">{['أ','ب','ج','د'][optIndex]}.</span>{' '}
                              {option}
                              {isCorrectAnswer && <span className="float-left text-green-600 font-bold text-xl">✓</span>}
                              {isUserAnswer && !isCorrectAnswer && <span className="float-left text-red-600 font-bold text-xl">✗</span>}
                            </div>
                          );
                        })}
                      </div>

                      {question.explain && (
                        <div className="bg-white p-5 rounded-lg border-2 border-gray-200">
                          <p className="text-lg font-semibold text-gray-700 mb-2">💡 التفسير:</p>
                          <p className="text-base md:text-lg text-gray-600 leading-relaxed">{question.explain}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Debug panel */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setDebugOpen(v => !v)}
            className="text-sm text-gray-500 underline"
          >
            {debugOpen ? 'إخفاء التشخيص' : 'عرض التشخيص (Debug)'}
          </button>
          {debugOpen && (
            <div className="mt-3 p-3 bg-white rounded-xl border text-left overflow-auto text-xs">
              <pre dir="ltr">{JSON.stringify(debugList, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== Page wrapper (Suspense) ===== */
export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1e7850] border-t-transparent"></div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  );
}
