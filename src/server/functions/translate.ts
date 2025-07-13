import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

// 메모리 캐시 (5분 TTL)
const cache = new Map<string, { value: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 개인정보(전화번호 등) 정규식
const PERSONAL_INFO_REGEX = /((\+82|0)[1-9][0-9]{1,2}-?[0-9]{3,4}-?[0-9]{4})/g;

// Gemini API 호출 (실제 연동)
export async function translateWithGemini(input: { sender: string; receiver: string; body: string }): Promise<{ result: string; blocked: boolean; reason?: string }> {
  if (!GEMINI_API_KEY && !isTestEnv()) {
    return { result: '', blocked: true, reason: '서버에 Gemini API 키가 설정되어 있지 않습니다.' };
  }
  // 프롬프트 교체
  const prompt = `사용자는 아래와 같이 이메일 정보를 입력합니다:\n발신자: ${input.sender}\n수신자: ${input.receiver}\n이메일 본문: ${input.body}\n\n프롬프트:\n아래 이메일 내용을 읽고, 표면적인 표현 뒤에 숨겨진 ‘진짜 속마음’을 추측해줘.\n\n한국 직장인이 겉으론 예의 지키면서도 속으로는 억눌린 짜증, 피로, 허탈감이 가득한\n‘빡침 내재형’ 말투로 재구성해줘.\n\n존댓말은 유지하지만, 말투에 미묘한 체념, 툴툴댐, 짜증 섞인 멘트를 자연스럽게 담아줘.\n질문과 답변식 말투는 피하고,\n그냥 툭툭 내뱉는 직장인 혼잣말처럼 써줘.\n‘하…’, ‘또 이걸...’, ‘이번엔 제발...’, ‘늘 그렇듯...’ 같은\n한국 직장인의 억눌린 감정 토시는 자유롭게 섞어줘.\n지나치게 과장되거나 코믹하지 않아도 돼. 그냥 현실 직장인의 리얼 속마음이면 충분해.\n결과에는 원본 내용이 포함되지 않아야 하며, 번역된 속마음만 출력해.`;
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
    const { result, blocked, reason } = await translateWithGemini({ sender: '', receiver: '', body: text });
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