import { NextRequest, NextResponse } from 'next/server';
import { translateWithGemini } from '@/server/functions/translate';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 메모리 캐시 (5분 TTL)
const cache = new Map<string, { value: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 개인정보(전화번호 등) 정규식
const PERSONAL_INFO_REGEX = /((\+82|0)[1-9][0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4})/g;

// server/functions/translate.ts에서 translateWithGemini를 import한다고 가정하고, 이 파일 내의 translateWithGemini 정의를 제거합니다.

function isTestEnv() {
  return !!process.env.VITEST;
}

export async function POST(req: NextRequest) {
  console.log('translate API 진입');
  try {
    const { sender, receiver, body } = await req.json();
    if (typeof body !== 'string' || typeof sender !== 'string' || typeof receiver !== 'string') {
      const err = { error: '입력 형식 오류' };
      console.log('입력 형식 오류', { sender, receiver, body });
      return NextResponse.json(err, { status: 400 });
    }
    if (body.length > 5000) {
      const err = { error: '입력은 5,000자 이내여야 합니다.' };
      console.log('본문 길이 초과', { bodyLength: body.length });
      return NextResponse.json(err, { status: 400 });
    }
    if (PERSONAL_INFO_REGEX.test(body)) {
      const err = { error: '개인정보(전화번호 등) 포함 불가' };
      console.log('개인정보 포함 감지', { body });
      return NextResponse.json(err, { status: 400 });
    }
    // 캐시 체크 (테스트 환경에서는 무시)
    if (!isTestEnv()) {
      const hash = Buffer.from(sender + receiver + body).toString('base64');
      const cached = cache.get(hash);
      if (cached && cached.expires > Date.now()) {
        const ok = { result: typeof cached.value === 'string' ? cached.value : cached.value?.result, cached: true };
        console.log('캐시 사용', ok);
        return NextResponse.json(ok);
      }
    }
    // Gemini API 호출 (입력/출력 모두 safety_settings 적용)
    const { result, blocked, reason } = await translateWithGemini({ sender, receiver, body });
    console.log('Gemini 변환 결과', { result, blocked, reason });
    if (blocked) {
      const err = { error: '안전 필터에 의해 차단된 콘텐츠입니다.', reason };
      console.log('Gemini 안전 필터 차단', err);
      return NextResponse.json(err, { status: 400 });
    }
    // 캐시 저장 (테스트 환경에서는 저장하지 않음)
    if (!isTestEnv()) {
      const hash = Buffer.from(sender + receiver + body).toString('base64');
      cache.set(hash, { value: result, expires: Date.now() + CACHE_TTL });
    }
    const ok = { result };
    console.log('최종 응답', ok);
    return NextResponse.json(ok);
  } catch (e) {
    const err = { error: '서버 오류', detail: String(e) };
    console.error('translate API 서버 오류', err);
    return NextResponse.json(err, { status: 500 });
  }
} 