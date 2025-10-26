export const metadata = {
  title: 'Tajweedy - منصة تجويد القرآن',
  description: 'منصة تفاعلية للتدريب على التجويد'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}