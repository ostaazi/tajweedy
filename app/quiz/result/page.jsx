'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

// ـــــــــــــــ أدوات عامة: مودال + مُنشئ روابط QuickChart ـــــــــــــــ
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-[#1e7850]">{title}</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
          >
            إغلاق ✖
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}

// توليد رابط صورة QuickChart من تهيئة Chart.js
function chartURL(config) {
  const base = 'https://quickchart.io/chart';
  const c = encodeURIComponent(JSON.stringify(config));
  return `${base}?c=${c}&backgroundColor=transparent`;
}

// ألوان الهوية
const COLORS = {
  primary: '#1e7850',
  primaryDark: '#155c3e',
  blue: '#2563eb',
  red: '#ef4444',
  gray: '#64748b',
};

// ـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ

export default function ResultPage() {
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [qrSrc, setQrSrc] = useState('');
  const [attemptId, setAttemptId] = useState('');
  const [attempt, setAttempt] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);

  // Modals
  const [openQStats, setOpenQStats] = useState(false);
  const [openSectionStats, setOpenSectionStats] = useState(false);
  const [openProgress, setOpenProgress] = useState(false);

  // Charts urls
  const [chartQuestionsBest, setChartQuestionsBest] = useState('');
  const [chartQuestionsWorst, setChartQuestionsWorst] = useState('');
  const [chartSections, setChartSections] = useState('');
  const [chartTimeline, setChartTimeline] = useState('');

  // اجلب آخر محاولة + كل المحاولات
  useEffect(() => {
    const attempts = JSON.parse(localStorage.getItem('quizAttempts') || '[]');
    setAllAttempts(attempts);
    const latest = attempts[attempts.length - 1];
    if (latest) {
      setScore(Number(latest.score || 0));
      setTotal(Number(latest.total || 0));
      setAttemptId(latest.id || '');
      setAttempt(latest);
    }
  }, []);

  const percentage = total ? Math.round((score / total) * 100) : 0;

  // رابط التقرير
  const reportUrl = useMemo(() => {
    if (typeof window === 'undefined' || !attemptId) return '';
    return `${window.location.origin}/quiz/report/${attemptId}`;
  }, [attemptId]);

  // توليد QR مع شعار Tajweedy في الوسط + fallback
  useEffect(() => {
    if (!reportUrl || typeof window === 'undefined') return;

    const logo = `${window.location.origin}/logo.png`;
    const services = [
      `https://quickchart.io/qr?text=${encodeURIComponent(
        reportUrl
      )}&size=300&centerImageUrl=${encodeURIComponent(
        logo
      )}&centerImageSizeRatio=0.25&margin=2`,
      `https://quickchart.io/qr?text=${encodeURIComponent(reportUrl)}&size=300&margin=2`,
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        reportUrl
      )}`,
      `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(
        reportUrl
      )}`,
    ];

    let i = 0;
    let cancelled = false;
    const tryNext = () => {
      if (cancelled) return;
      if (i >= services.length) {
        setQrSrc('');
        return;
      }
      const candidate = services[i++];
      const img = new Image();
      img.onload = () => !cancelled && setQrSrc(candidate);
      img.onerror = () => !cancelled && tryNext();
      img.referrerPolicy = 'no-referrer';
      img.src = candidate;
    };

    tryNext();
    return () => {
      cancelled = true;
    };
  }, [reportUrl]);

  const handleDownloadQR = () => {
    if (!qrSrc) return alert('⚠️ لم يتم توليد الكود بعد.');
    const link = document.createElement('a');
    link.href = qrSrc;
    link.download = `tajweedy-qr-${attemptId || 'report'}.png`;
    link.click();
  };

  // === تجميع الإحصاءات من كل المحاولات ===
  const aggregates = useMemo(() => {
    const byQuestion = new Map(); // نص السؤال -> {right, wrong, section, subsection}
    const bySection = new Map();  // section -> { right, wrong, subs: Map(subsection -> {right, wrong}) }
    const timeline = [];          // [{id, date, score, total, pct}]

    for (const att of allAttempts) {
      const qs = Array.isArray(att?.questions) ? att.questions : [];
      const ans = Array.isArray(att?.answers) ? att.answers : [];
      const n = Math.min(qs.length, ans.length);

      timeline.push({
        id: att.id,
        date: att.date,
        score: Number(att.score || 0),
        total: Number(att.total || n || 0),
        pct:
          Number(att.total || n || 0) > 0
            ? Math.round((Number(att.score || 0) / Number(att.total || n || 0)) * 100)
            : 0,
      });

      for (let i = 0; i < n; i++) {
        const q = qs[i] || {};
        const user = Number(ans[i]);
        const correct = Number(q?.answer);
        const isRight = user === correct;

        const qKey = (q?.question || `سؤال ${i + 1}`).trim();
        if (!byQuestion.has(qKey))
          byQuestion.set(qKey, {
            right: 0,
            wrong: 0,
            section: q?.section || 'غير محدد',
            subsection: q?.subsection || 'غير محدد',
          });
        byQuestion.get(qKey)[isRight ? 'right' : 'wrong']++;

        const sKey = (q?.section || 'غير محدد').trim();
        if (!bySection.has(sKey)) bySection.set(sKey, { right: 0, wrong: 0, subs: new Map() });
        const sObj = bySection.get(sKey);
        sObj[isRight ? 'right' : 'wrong']++;

        const subKey = (q?.subsection || 'غير محدد').trim();
        if (!sObj.subs.has(subKey)) sObj.subs.set(subKey, { right: 0, wrong: 0 });
        sObj.subs.get(subKey)[isRight ? 'right' : 'wrong']++;
      }
    }

    const questionArr = Array.from(byQuestion.entries()).map(([k, v]) => ({
      question: k,
      section: v.section,
      subsection: v.subsection,
      right: v.right,
      wrong: v.wrong,
      total: v.right + v.wrong,
      pct: v.right + v.wrong ? Math.round((v.right / (v.right + v.wrong)) * 100) : 0,
    }));

    questionArr.sort((a, b) =>
      a.pct === b.pct ? b.total - a.total : b.pct - a.pct
    );

    const sectionArr = Array.from(bySection.entries()).map(([sec, val]) => {
      const subs = Array.from(val.subs.entries())
        .map(([sub, r]) => ({
          subsection: sub,
          right: r.right,
          wrong: r.wrong,
          total: r.right + r.wrong,
          pct: r.right + r.wrong ? Math.round((r.right / (r.right + r.wrong)) * 100) : 0,
        }))
        .sort((a, b) => b.pct - a.pct);
      return {
        section: sec,
        right: val.right,
        wrong: val.wrong,
        total: val.right + val.wrong,
        pct: val.right + val.wrong ? Math.round((val.right / (val.right + val.wrong)) * 100) : 0,
        subs,
      };
    });
    sectionArr.sort((a, b) => b.pct - a.pct);

    timeline.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    return { questionArr, sectionArr, timeline };
  }, [allAttempts]);

  // === إنشاء الروابط البيانية عبر QuickChart ===
  useEffect(() => {
    // أفضل 10 أسئلة (نسبة صحيحة أعلى)
    if (aggregates.questionArr.length) {
      const best = aggregates.questionArr.slice(0, 10).reverse(); // نعكس لنظهر الأعلى أسفل المحور
      const cfgBest = {
        type: 'bar',
        data: {
          labels: best.map((q) => (q.question.length > 24 ? q.question.slice(0, 24) + '…' : q.question)),
          datasets: [
            {
              label: 'نسبة الإجابة الصحيحة',
              data: best.map((q) => q.pct),
              backgroundColor: COLORS.primary,
              borderRadius: 8,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'أفضل 10 أسئلة', color: COLORS.primaryDark, font: { size: 16, weight: 'bold' } },
          },
          scales: {
            x: { min: 0, max: 100, ticks: { color: COLORS.gray }, grid: { color: 'rgba(0,0,0,0.05)' } },
            y: { ticks: { color: COLORS.gray } },
          },
        },
      };
      setChartQuestionsBest(chartURL(cfgBest));
    } else {
      setChartQuestionsBest('');
    }

    // أسوأ 10 أسئلة (أقل نسبة صحيحة)
    if (aggregates.questionArr.length) {
      const worst = [...aggregates.questionArr]
        .sort((a, b) => a.pct - b.pct || b.total - a.total)
        .slice(0, 10)
        .reverse();
      const cfgWorst = {
        type: 'bar',
        data: {
          labels: worst.map((q) => (q.question.length > 24 ? q.question.slice(0, 24) + '…' : q.question)),
          datasets: [
            {
              label: 'نسبة الإجابة الصحيحة',
              data: worst.map((q) => q.pct),
              backgroundColor: COLORS.red,
              borderRadius: 8,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            title: { display: true, text: 'أضعف 10 أسئلة', color: COLORS.primaryDark, font: { size: 16, weight: 'bold' } },
          },
          scales: {
            x: { min: 0, max: 100, ticks: { color: COLORS.gray }, grid: { color: 'rgba(0,0,0,0.05)' } },
            y: { ticks: { color: COLORS.gray } },
          },
        },
      };
      setChartQuestionsWorst(chartURL(cfgWorst));
    } else {
      setChartQuestionsWorst('');
    }

    // الأقسام (مكدّس صحيح/خطأ)
    if (aggregates.sectionArr.length) {
      const top = aggregates.sectionArr.slice(0, 8); // يكفي للعرض
      const labels = top.map((s) => (s.section.length > 18 ? s.section.slice(0, 18) + '…' : s.section));
      const cfgSec = {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'صحيح',
              data: top.map((s) => s.right),
              backgroundColor: COLORS.primary,
              stack: 'tot',
              borderRadius: 6,
            },
            {
              label: 'خطأ',
              data: top.map((s) => s.wrong),
              backgroundColor: COLORS.red,
              stack: 'tot',
              borderRadius: 6,
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: 'top', labels: { color: COLORS.gray } },
            title: {
              display: true,
              text: 'الأقسام (صحيح/خطأ)',
              color: COLORS.primaryDark,
              font: { size: 16, weight: 'bold' },
            },
          },
          scales: {
            x: { ticks: { color: COLORS.gray }, grid: { color: 'rgba(0,0,0,0.05)' } },
            y: { ticks: { color: COLORS.gray }, grid: { color: 'rgba(0,0,0,0.05)' } },
          },
        },
      };
      setChartSections(chartURL(cfgSec));
    } else {
      setChartSections('');
    }

    // خط زمني للنسبة المئوية عبر المحاولات
    if (aggregates.timeline.length) {
      const cfgTL = {
        type: 'line',
        data: {
          labels: aggregates.timeline.map((t, i) =>
            t.date ? new Date(t.date).toLocaleDateString('ar-EG') : `محاولة ${i + 1}`
          ),
          datasets: [
            {
              label: 'النسبة %',
              data: aggregates.timeline.map((t) => t.pct),
              fill: false,
              borderColor: COLORS.blue,
              backgroundColor: COLORS.blue,
              tension: 0.3,
              pointRadius: 3,
            },
          ],
        },
        options: {
          plugins: {
            legend: { position: 'top', labels: { color: COLORS.gray } },
            title: {
              display: true,
              text: 'تقدّم المتدرب عبر المحاولات',
              color: COLORS.primaryDark,
              font: { size: 16, weight: 'bold' },
            },
          },
          scales: {
            y: { min: 0, max: 100, ticks: { color: COLORS.gray }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { color: COLORS.gray } },
          },
        },
      };
      setChartTimeline(chartURL(cfgTL));
    } else {
      setChartTimeline('');
    }
  }, [aggregates]);

  // ـــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-green-50 p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">

        {/* شريط أعلى: الصفحة الرئيسية / العودة للاختبار */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-white border text-[#1e7850] font-bold hover:bg-green-50"
          >
            🏠 الصفحة الرئيسية
          </Link>
          <Link
            href="/quiz"
            className="px-4 py-2 rounded-xl bg-white border text-[#2563eb] font-bold hover:bg-blue-50"
          >
            ↩️ العودة للاختبار
          </Link>
        </div>

        {/* النتيجة */}
        <h1 className="text-3xl font-bold text-[#1e7850] mb-6 text-center">نتيجة الاختبار 🎓</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-6 text-center">
            <p className="text-green-800 font-bold mb-2">إجابات صحيحة ✅</p>
            <p className="text-5xl font-bold">{score}</p>
          </div>
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-6 text-center">
            <p className="text-red-800 font-bold mb-2">إجابات خاطئة ❌</p>
            <p className="text-5xl font-bold">{Math.max(0, total - score)}</p>
          </div>
          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-6 text-center">
            <p className="text-blue-800 font-bold mb-2">إجمالي الأسئلة 📝</p>
            <p className="text-5xl font-bold">{total}</p>
          </div>
        </div>

        {/* النسبة */}
        <div className="bg-[#1e7850] text-white rounded-3xl p-8 mb-6 text-center shadow">
          <p className="text-8xl font-bold mb-3">{percentage}%</p>
          <p className="text-lg">
            {percentage >= 80 ? '🎉 ممتاز جداً!' : percentage >= 60 ? '👏 أداء جيد' : '📖 يحتاج مراجعة'}
          </p>
        </div>

        {/* أزرار الإجراءات */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => window.print()} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-2xl">
            طباعة 🖨️
          </button>

          {reportUrl ? (
            <Link href={reportUrl} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl text-center">
              التفاصيل 📄
            </Link>
          ) : (
            <button disabled className="bg-blue-400 text-white font-bold py-3 rounded-2xl opacity-60">
              التفاصيل 📄
            </button>
          )}

          <button
            onClick={() => {
              if (navigator.share && reportUrl) {
                navigator.share({
                  title: 'تقرير التجويد',
                  text: `حصلت على ${percentage}% في اختبار التجويد.`,
                  url: reportUrl,
                });
              } else if (reportUrl) {
                navigator.clipboard.writeText(reportUrl);
                alert('تم نسخ الرابط!');
              }
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-2xl"
          >
            مشاركة 📤
          </button>

          <button
            onClick={() => {
              if (!reportUrl) return;
              navigator.clipboard.writeText(reportUrl);
              alert('تم نسخ الرابط!');
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-2xl"
          >
            نسخ 🔗
          </button>
        </div>

        {/* QR */}
        <div className="bg-white border-2 border-green-200 rounded-3xl shadow-md p-8 text-center mb-6">
          <h2 className="text-xl font-bold text-gray-700 mb-4 flex justify-center items-center gap-2">
            <span>📱</span> رمز الاستجابة السريع للوصول السريع
          </h2>

          {qrSrc ? (
            <div className="flex flex-col items-center justify-center gap-3">
              <img
                src={qrSrc}
                alt="QR Code"
                className="w-56 h-56 border-4 border-green-400 rounded-2xl shadow-lg"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={handleDownloadQR}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl mt-3"
              >
                تحميل QR 📥
              </button>
            </div>
          ) : (
            <p className="text-gray-500 mt-4">جارٍ توليد الكود...</p>
          )}

          <p className="mt-4 text-gray-600 text-sm">
            امسح الكود باستخدام كاميرا الهاتف أو تطبيق قارئ QR 📸
          </p>

          <div className="mt-6 flex flex-col items-center">
            <img src="/logo.png" alt="Tajweedy Logo" className="w-20 opacity-80" />
            <p className="text-gray-700 font-bold mt-2">Tajweedy — التجويد التفاعلي</p>
          </div>
        </div>

        {/* أزرار الإحصاءات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <button
            onClick={() => setOpenQStats(true)}
            className="w-full bg-white border-2 border-blue-200 hover:bg-blue-50 rounded-2xl p-4 font-bold"
          >
            إحصاءات الأسئلة 📊
          </button>
          <button
            onClick={() => setOpenSectionStats(true)}
            className="w-full bg-white border-2 border-emerald-200 hover:bg-emerald-50 rounded-2xl p-4 font-bold"
          >
            الأقسام والأجزاء الفرعية 🧭
          </button>
          <button
            onClick={() => setOpenProgress(true)}
            className="w-full bg-white border-2 border-purple-200 hover:bg-purple-50 rounded-2xl p-4 font-bold"
          >
            متابعة تقدّم المتدرب 📈
          </button>
        </div>
      </div>

      {/* نافذة: إحصاءات الأسئلة */}
      <Modal open={openQStats} title="إحصاءات الأسئلة" onClose={() => setOpenQStats(false)}>
        {aggregates.questionArr.length ? (
          <div className="space-y-6">
            {chartQuestionsBest && (
              <img src={chartQuestionsBest} alt="أفضل الأسئلة" className="w-full" />
            )}
            {chartQuestionsWorst && (
              <img src={chartQuestionsWorst} alt="أضعف الأسئلة" className="w-full" />
            )}

            <div className="border rounded-xl p-4">
              <p className="font-bold mb-2 text-[#1e7850]">قائمة مختصرة</p>
              <div className="space-y-2">
                {aggregates.questionArr.slice(0, 8).map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {q.question.length > 36 ? q.question.slice(0, 36) + '…' : q.question}
                    </span>
                    <span className="text-gray-600">
                      {q.section} / {q.subsection} — {q.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">لا توجد بيانات مفصلة للأسئلة حتى الآن.</p>
        )}
      </Modal>

      {/* نافذة: الأقسام والأجزاء الفرعية */}
      <Modal
        open={openSectionStats}
        title="إحصاءات الأقسام والأجزاء الفرعية"
        onClose={() => setOpenSectionStats(false)}
      >
        {aggregates.sectionArr.length ? (
          <div className="space-y-6">
            {chartSections && <img src={chartSections} alt="الأقسام" className="w-full" />}

            <div className="border rounded-xl p-4">
              <p className="font-bold mb-3 text-[#1e7850]">تفصيل الأجزاء الفرعية</p>
              <div className="space-y-4">
                {aggregates.sectionArr.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{s.section}</span>
                      <span className="text-sm text-gray-600">النسبة: {s.pct}%</span>
                    </div>
                    {s.subs.length ? (
                      <div className="grid md:grid-cols-2 gap-2">
                        {s.subs.slice(0, 6).map((sub, i2) => (
                          <div
                            key={i2}
                            className="p-2 rounded-lg border flex items-center justify-between text-sm bg-white"
                          >
                            <span className="font-semibold">{sub.subsection}</span>
                            <span className="text-gray-600">
                              صحيح {sub.right} / خطأ {sub.wrong} — {sub.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">لا توجد أجزاء فرعية مسجّلة.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">لا توجد بيانات للأقسام حتى الآن.</p>
        )}
      </Modal>

      {/* نافذة: تقدّم المتدرب */}
      <Modal open={openProgress} title="متابعة تقدّم المتدرب" onClose={() => setOpenProgress(false)}>
        {aggregates.timeline.length ? (
          <div className="space-y-6">
            {chartTimeline && <img src={chartTimeline} alt="الزمن" className="w-full" />}
            <div className="border rounded-xl p-4">
              <p className="font-bold mb-2 text-[#1e7850]">سجل المحاولات</p>
              <div className="space-y-2">
                {aggregates.timeline.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-semibold">
                      {t.date ? new Date(t.date).toLocaleString('ar-EG') : `محاولة ${i + 1}`}
                    </span>
                    <span className="text-gray-600">
                      درجة: {t.score}/{t.total} — {t.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">لا توجد محاولات مسجّلة بعد.</p>
        )}
      </Modal>
    </div>
  );
}
