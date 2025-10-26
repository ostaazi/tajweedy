// components/recitation/VerseDisplay.jsx
import { useEffect, useState } from 'react';
import { getRandomVerse } from '../../lib/quranAPI';

export default function VerseDisplay() {
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerse();
  }, []);

  const fetchVerse = async () => {
    const newVerse = await getRandomVerse();
    setVerse(newVerse);
    setLoading(false);
  };

  if (loading) return <div className="text-white text-center">جاري تحميل الآية...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h3 className="text-xl font-bold mb-4">تلاوة الآية</h3>
      <div className="text-2xl font-serif mb-4 text-right leading-relaxed" dir="rtl">
        {verse.text}
      </div>
      <p className="text-sm text-gray-600">سورة {verse.surah}، الآية {verse.ayah}</p>
      <button 
        onClick={fetchVerse} 
        className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        آية جديدة
      </button>
    </div>
  );
}
