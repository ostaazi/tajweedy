import './globals.css';
import { Cairo } from 'next/font/google';

const cairo = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-cairo',
});

export const metadata = {
  title: 'Tajweedy - منصة تجويد القرآن',
  description: 'منصة تفاعلية للتدريب على قواعد التجويد بالذكاء الاصطناعي',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable}`}>
      <body className="bg-gray-50 font-cairo">
        {children}
      </body>
    </html>
  );
}
