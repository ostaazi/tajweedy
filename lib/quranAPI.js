export async function getRandomVerse(surahId = null, ayahId = null) {
  const baseUrl = 'https://api.alquran.cloud/v1';
  
  try {
    const url = surahId 
      ? `${baseUrl}/surah/${surahId}/editions/quran-uthmani`
      : `${baseUrl}/ayah/random/editions/quran-uthmani`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    return data.data;
  } catch (error) {
    console.error('خطأ في جلب الآية:', error);
    return null;
  }
}

export async function getRecitersList() {
  const reciters = [
    { id: 1, name: 'مشاري العفاسي', audio: 'https://example.com/mishary' },
    { id: 2, name: 'سعود الشريم', audio: 'https://example.com/saud' },
    // إضافة المزيد...
  ];
  return reciters;
}
