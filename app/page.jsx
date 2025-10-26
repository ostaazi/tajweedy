export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-green-800 text-white px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 animate-fade-in">
          Tajweedy
        </h1>
        <p className="text-2xl md:text-3xl mb-8 opacity-90">
          منصة التدريب التفاعلية على قواعد تجويد القرآن الكريم
        </p>
        <p className="text-xl mb-12 opacity-80">
          تعلم قواعد التجويد بسهولة باستخدام الذكاء الاصطناعي وتقارير تفصيلية
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a 
            href="/login" 
            className="bg-white text-green-700 px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition-all"
          >
            ابدأ الآن
          </a>
          <a 
            href="/dashboard" 
            className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white hover:text-green-700 transition-all"
          >
            شاهد المميزات
          </a>
        </div>
      </div>
    </div>
  );
}
