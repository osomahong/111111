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
  const prompt = `원문내용에 한줄씩 대응하는 진솔한 내용으로 변경해줘\n\n아래 이메일 본문을 문장별(줄별)로 분리해서, 각 문장마다 그 문장에 담긴 진짜 의도, 상황, 속마음을 꾸밈없이, 직설적이고 시크하게, 힘 빠진 현실 직장인 스타일로 써줘.

- 각 문장은 반드시 발신자(보내는 사람)가 수신자(받는 사람)에게 직접 말하는 존댓말로만 써줘.
- 내적 해설, 혼잣말, 괄호, 상황 설명, 자기소개, 감정 리액션, 이름 언급 등은 절대 쓰지 마.
- '문장(해설)' 구조, 해설/설명/부연/내적 코멘트도 절대 쓰지 마.
- 상대방의 요청에 반응하는 대화체, 내적 해설, 감정 리액션 등은 절대 쓰지 마.
- 상대에게 질문하는 식의 문장은 쓰지마. (물음표로 끝나는 문장도 금지)
- 물음표(‘?’)가 들어가는 문장은 절대 쓰지마.
- 전체 문장은 이어지게 구성하고 중간에 뜬금없이 "알겠습니다" 같은 대답형태의 문장은 쓰지마.
- 오직 발신자가 본인 입장에서 하고 싶은 말을, 현실 직장인 톤의 존댓말로만 써줘.
- 상대방의 요청을 받아치는 식이 아니라, 내가 진짜 하고 싶은 말을 바꿔서 말하는 구조로 써줘.
- 불필요한 예의, 돌려 말하기, 과장, 코믹함, 혼잣말, 대화체(리액션)는 피하고, 현실적인 직장인 톤으로 솔직하게. 기본적으로 존댓말을 유지해줘.
- 출력은 반드시 속마음만, 원문은 포함하지 마.
- 각 줄이 원문 한 문장에 1:1로 대응해야 해.
- () 괄호 안에 들어가는 내용도 절대 생성하지 마.
- - 전체적인 대화톤은 살짝 버릇없는 느낌으로 작성해.

예시:
(원문)
이번 프로젝트 일정 다시 한번 확인 부탁드립니다.

(출력)
프로젝트 일정 알아서 확인해서 잘 처리해주세요. 전 빠지고 싶네요 정말

아래 이메일 본문:
${input.body}

위와 같은 형식으로, 각 줄마다 발신자의 '꾸밈없는' 속마음이 반영된 내용으로 출력해줘. 원문은 절대 포함하지 마.`;
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
    // 쿼터/요금제 초과 등 에러 감지
    if (data.error && (
      data.error.message?.toLowerCase().includes('quota') ||
      data.error.message?.toLowerCase().includes('billing') ||
      data.error.message?.toLowerCase().includes('rate limit')
    )) {
      return { result: '', blocked: true, reason: 'quota' };
    }
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
      if (reason === 'quota') {
        const err = { error: 'AI 번역 쿼터가 초과되어 잠시 이용이 제한됩니다. 잠시 후 다시 시도해 주세요.', reason };
        return isTestEnv() ? { ...err, status: 429 } : NextResponse.json(err, { status: 429 });
      }
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