import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({ 
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  variable: '--font-cairo'
});

export const metadata = {
  title: 'Tajweedy - مُدرّب أحكام التجويد',
  description: 'منصة تفاعلية لتعلم قواعد تجويد القرآن الكريم بالذكاء الاصطناعي',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.variable}>{children}</body>
    </html>
  );
}
