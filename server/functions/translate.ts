import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// 메모리 캐시 (5분 TTL)
const cache = new Map<string, { value: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 개인정보(전화번호 등) 정규식
const PERSONAL_INFO_REGEX = /((\+82|0)[1-9][0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4})/g;

// Gemini API 호출 (실제 연동)
async function translateWithGemini(input: string): Promise<{ result: string; blocked: boolean; reason?: string }> {
  if (!GEMINI_API_KEY && !isTestEnv()) {
    return { result: '', blocked: true, reason: '서버에 Gemini API 키가 설정되어 있지 않습니다.' };
  }
  // 프롬프트: K-직장인 스타일로 변환
  const prompt = `아래 이메일을 K-직장인 특유의 솔직하고 유머러스한 속마음으로 변환해줘.\n\n이메일 원문:\n${input}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  };
  try {
    const res = await globalThis.fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    console.log('GEMINI API RESPONSE', JSON.stringify(data));
    // 안전 필터링 결과 확인
    const candidate = data.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      return { result: '', blocked: true, reason: 'Gemini 안전 필터' };
    }
    const text = candidate?.content?.parts?.[0]?.text || '';
    console.log('GEMINI API TEXT', text);
    return { result: text, blocked: false };
  } catch (e) {
    return { result: '', blocked: true, reason: 'Gemini API 호출 오류: ' + String(e) };
  }
}

function isTestEnv() {
  return !!process.env.VITEST;
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (typeof text !== 'string') {
      const err = { error: '입력 형식 오류' };
      return isTestEnv() ? { ...err, status: 400 } : NextResponse.json(err, { status: 400 });
    }
    if (text.length > 5000) {
      const err = { error: '입력은 5,000자 이내여야 합니다.' };
      return isTestEnv() ? { ...err, status: 400 } : NextResponse.json(err, { status: 400 });
    }
    if (PERSONAL_INFO_REGEX.test(text)) {
      const err = { error: '개인정보(전화번호 등) 포함 불가' };
      return isTestEnv() ? { ...err, status: 400 } : NextResponse.json(err, { status: 400 });
    }
    // 캐시 체크 (테스트 환경에서는 무시)
    if (!isTestEnv()) {
      const hash = Buffer.from(text).toString('base64');
      const cached = cache.get(hash);
      if (cached && cached.expires > Date.now()) {
        const ok = { result: typeof cached.value === 'string' ? cached.value : cached.value?.result, cached: true };
        return NextResponse.json(ok);
      }
    }
    // Gemini API 호출 (입력/출력 모두 safety_settings 적용)
    const { result, blocked, reason } = await translateWithGemini(text);
    if (blocked) {
      const err = { error: '안전 필터에 의해 차단된 콘텐츠입니다.', reason };
      return isTestEnv() ? { ...err, status: 400 } : NextResponse.json(err, { status: 400 });
    }
    // 캐시 저장 (테스트 환경에서는 저장하지 않음)
    if (!isTestEnv()) {
      const hash = Buffer.from(text).toString('base64');
      cache.set(hash, { value: result, expires: Date.now() + CACHE_TTL });
    }
    const ok = { result };
    return isTestEnv() ? ok : NextResponse.json(ok);
  } catch (e) {
    const err = { error: '서버 오류', detail: String(e) };
    return isTestEnv() ? { ...err, status: 500 } : NextResponse.json(err, { status: 500 });
  }
} 