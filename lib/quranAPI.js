// lib/quranAPI.js
export async function getRandomVerse() {
  try {
    // جلب آية عشوائية باستخدام API Quran.com
    const response = await fetch('https://api.quran.com/api/v4/verses/random?limit=1&text_uthmani=true&fields=text_uthmani,chapter_id,verse_number');
    const data = await response.json();
    const verse = data.verses[0];
    
    return {
      text: verse.text_uthmani,
      surah: verse.chapter_id,
      ayah: verse.verse_number,
      reference: `${verse.chapter_id}:${verse.verse_number}`
    };
  } catch (error) {
    console.error('خطأ في جلب الآية:', error);
    return null;
  }
}
