import ResultClient from './ResultClient';
import { Metadata } from 'next';
import { kv } from '@vercel/kv';

export async function generateMetadata(props: any) {
  const { params } = await props;
  const id = (await params).id;
  const captureServer = process.env.CAPTURE_SERVER_URL || process.env.NEXT_PUBLIC_CAPTURE_SERVER_URL || 'https://oow7izfiyiwfutsa.public.blob.vercel-storage.com';
  const ogImageUrl = `${captureServer}/images/${id}.png`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://111111-pi.vercel.app';
  return {
    title: "당신이 받은 메일의 진심은? | K직장인 속마음 번역기",
    description: "이메일의 진짜 속마음을 확인해보세요. K직장인 속마음 번역기가 분석한 결과를 제공합니다.",
    openGraph: {
      title: "당신이 받은 메일의 진심은? | K직장인 속마음 번역기",
      description: "이메일의 진짜 속마음을 확인해보세요.",
      images: [ogImageUrl],
      url: `${baseUrl}/result/${id}`,
    },
    alternates: {
      canonical: `${baseUrl}/result/${id}`,
    },
    metadataBase: new URL(baseUrl),
  };
}

export default async function ResultPage(props: any) {
  const { params } = await props;
  const id = (await params).id;
  // KV에서 결과 데이터 패칭
  let data = null;
  try {
    data = await kv.get(`result:${id}`);
  } catch (e) {
    // 에러 무시, data는 null
  }
  if (!data) {
    return <div className="text-red-500 text-center mt-10">결과를 찾을 수 없습니다.</div>;
  }
  const { subject, sender, receiver, translatedText, originalText } = data;
  return <ResultClient id={id} subject={subject} sender={sender} receiver={receiver} translatedText={translatedText} originalText={originalText} />;
} 