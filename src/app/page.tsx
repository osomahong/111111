'use client';

import EmailInput from '../components/EmailInput';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-8 text-center text-zinc-800 dark:text-zinc-100">
          K-직장인 속마음 이메일 변환기
        </h1>
        <EmailInput />
      </div>
    </main>
  );
}
