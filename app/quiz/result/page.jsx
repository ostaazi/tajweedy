// app/quiz/result/page.jsx
import { Suspense } from 'react';
import QuizResultClient from './QuizResultClient';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <QuizResultClient />
    </Suspense>
  );
}
