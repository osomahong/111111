'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ResultImage from '../../../features/sharing/ResultImage';

interface ResultData {
  id: string;
  originalText: string;
  translatedText: string;
  createdAt: number;
  expiresAt: number;
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchResult = async () => {
      if (!params.id) return;
      
      try {
        const response = await fetch(`/api/get-result/${params.id}`);
        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else {
          setResultData(data);
        }
      } catch (err) {
        setError('결과를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [params.id]);

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    toast({
      description: '링크가 클립보드에 복사되었습니다!',
    });
  };

  const handleShare = async () => {
    const currentUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'K-직장인 속마음 변환 결과',
          text: resultData?.translatedText.slice(0, 100) + '...',
          url: currentUrl,
        });
      } catch (err) {
        // 사용자가 공유를 취소한 경우 무시
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            결과를 찾을 수 없습니다
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            {error || '링크가 만료되었거나 존재하지 않는 결과입니다.'}
          </p>
          <Button onClick={() => router.push('/')} className="w-full">
            새로 변환하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <h1 className="font-semibold text-zinc-800 dark:text-zinc-100">
            변환 결과
          </h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleCopyLink}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 결과 내용 */}
      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100 mb-4">
            K-직장인 속마음 변환 결과
          </h2>
          
          {/* 원본 텍스트 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              원본 이메일
            </h3>
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-md p-3 text-sm text-zinc-700 dark:text-zinc-300">
              {resultData.originalText}
            </div>
          </div>

          {/* 변환된 텍스트 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2">
              속마음 변환 결과
            </h3>
            <div className="bg-blue-50 dark:bg-blue-950 rounded-md p-4 text-zinc-800 dark:text-zinc-100">
              {resultData.translatedText}
            </div>
          </div>

          {/* 이미지 공유 */}
          <ResultImage result={resultData.translatedText} />
        </div>

        {/* 만료 정보 */}
        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          이 결과는 {new Date(resultData.expiresAt).toLocaleDateString()}까지 유효합니다
        </div>
      </main>
    </div>
  );
} 