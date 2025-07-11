import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEmailStore } from '../store/emailStore';

/**
 * 이메일 입력창 컴포넌트
 * - 5,000자 제한, 실시간 글자수, 에러 메시지, 로딩 인디케이터, 반응형
 * - 변환 완료 후 결과 페이지로 라우팅
 */
const MAX_LENGTH = 5000;

export default function EmailInput() {
  const router = useRouter();
  const {
    input,
    setInput,
    error,
    setError,
    loading,
    setLoading,
  } = useEmailStore();
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    setTouched(true);
    if (e.target.value.length > MAX_LENGTH) {
      setError('입력은 5,000자 이내여야 합니다.');
    } else {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (input.length === 0) {
      setError('이메일 내용을 입력해 주세요.');
      return;
    }
    if (input.length > MAX_LENGTH) {
      setError('입력은 5,000자 이내여야 합니다.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. AI 변환 요청
      const translateRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
      const translateData = await translateRes.json();
      
      if (translateData.error) {
        setError(translateData.error);
        return;
      }

      // 2. 결과 저장
      const saveRes = await fetch('/api/save-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalText: input,
          translatedText: translateData.result,
        }),
      });
      const saveData = await saveRes.json();
      
      if (saveData.error) {
        setError(saveData.error);
        return;
      }

      // 3. 결과 페이지로 라우팅
      router.push(`/result/${saveData.id}`);
      
    } catch (e) {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 bg-white dark:bg-zinc-900 rounded-lg shadow-md flex flex-col gap-4">
      <label htmlFor="email-input" className="font-semibold text-zinc-800 dark:text-zinc-100">
        이메일 입력
      </label>
      
      <textarea
        id="email-input"
        className="w-full min-h-[120px] max-h-[300px] resize-y p-3 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        maxLength={MAX_LENGTH + 100}
        value={input}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        placeholder="이메일 내용을 입력하세요..."
        disabled={loading}
      />
      
      <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
        <span>{input.length} / {MAX_LENGTH}자</span>
        {error && touched && <span className="text-red-500">{error}</span>}
      </div>
      
      <button
        className="mt-2 py-3 px-4 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors"
        onClick={handleSubmit}
        disabled={loading || !!error || input.length === 0}
      >
        {loading ? '변환 중...' : 'K-직장인 속마음으로 변환하기'}
      </button>
    </div>
  );
} 