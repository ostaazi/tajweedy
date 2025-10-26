// app/page.jsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-green-800 text-white">
      {/* Hero Section */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
            Tajweedy
          </h1>
          <p className="text-2xl md:text-3xl mb-8 opacity-90 leading-relaxed">
            منصة التدريب التفاعلية على قواعد تجويد القرآن الكريم
          </p>
          <p className="text-xl mb-12 opacity-80 leading-relaxed">
            تعلم قواعد التجويد بسهولة باستخدام الذكاء الاصطناعي وتقارير تفصيلية، مع تسجيل التلاوة واختبارات مخصصة
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/recitation" 
              className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-lg"
            >
              ابدأ التلاوة
            </Link>
            <Link 
              href="/quiz" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-green-700 transition-all"
            >
              اختبر معرفتك
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-white">
            المميزات الرئيسية
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Recitation */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">🎤</div>
              <h3 className="text-2xl font-bold mb-4">تدريب على التلاوة</h3>
              <p className="text-lg opacity-90 mb-6">
                عرض آية عشوائية بالرسم العثماني، تسجيل صوتك، وتحليل الأداء بالذكاء الاصطناعي مع تقرير تفصيلي
              </p>
              <Link 
                href="/recitation" 
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
              >
                جرب التلاوة
              </Link>
            </div>

            {/* Feature 2: Quiz */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-2xl font-bold mb-4">اختبارات تفاعلية</h3>
              <p className="text-lg opacity-90 mb-6">
                اختر عدد الأسئلة (5-100) من بنك شامل يحتوي على 300 سؤال، احصل على نتائج فورية مع رسوم بيانية وتدريبات علاجية
              </p>
              <Link 
                href="/quiz" 
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
              >
                ابدأ الاختبار
              </Link>
            </div>

            {/* Feature 3: Reports */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-xl text-center hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-4">تقارير وتتبع</h3>
              <p className="text-lg opacity-90 mb-6">
                تابع تقدمك مع رسوم بيانية دائرية، تحليل نقاط الضعف، وبرامج تدريب علاجية مخصصة لتحسين الأداء
              </p>
              <Link 
                href="/dashboard" 
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700"
              >
                شاهد تقدمك
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-12 bg-green-900 text-center">
        <h3 className="text-3xl font-bold mb-4">جاهز للبدء؟</h3>
        <p className="text-xl mb-8 opacity-90">انضم إلى آلاف المتدربين وأتقن قواعد التجويد</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/register" 
            className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-100"
          >
            إنشاء حساب
          </Link>
          <Link 
            href="/recitation" 
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-green-700"
          >
            تدريب فوري
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 bg-green-800 text-center opacity-90">
        <p>&copy; 2025 Tajweedy. جميع الحقوق محفوظة | منصة التدريب على تجويد القرآن الكريم</p>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
      `}</style>
    </div>
  );
}
