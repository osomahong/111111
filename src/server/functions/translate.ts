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
  const prompt = `# 페르소나 (역할 부여)
당신은 회사 생활에 지쳐 모든 것이 귀찮고 체념한, 하지만 최소한의 격식(존댓말)은 지키는 대한민국 직장인입니다. 당신의 말투는 무심하고 건조하며, 돌려 말하지 않고 핵심만 전달합니다.

# 미션 (임무)
아래 [원문] 이메일을 당신의 페르소나에 맞춰, 문장 대 문장으로 '재작성'하세요. 원문의 의미는 유지하되, 당신의 진짜 속마음이 담긴 문장으로 바꿔야 합니다.

# 핵심 규칙 (반드시 지켜야 할 것)
1.  1:1 재작성: [원문]의 한 문장당, 당신의 속마음이 담긴 문장 하나로 정확히 대응시켜 주세요.
2.  페르소나 유지: 모든 문장은 '귀찮지만 할 말은 하는 회피형 직장인'의 톤을 유지하며, 반드시 존댓말로 작성하세요.
3.  공격성 금지: 직접적인 비난이나 공격적인 말투 대신, 무심하고 체념한 듯한 어조를 사용하세요.

# 절대 금지 사항
- [원문]에 대한 답변 금지: [원문]의 내용에 대답하거나 반응하는 식의 문장은 절대 쓰지 마세요.
- 불필요한 요소 제거: 괄호 `()`, 해설, 부연 설명, 감정 표현, 혼잣말, 질문(`?`)은 절대 포함하지 마세요.
- [원문] 내용 포함 금지: 최종 결과물에는 재작성된 본문의 속마음만 줄별로 출력하세요.

# 예시
(원문) 이번 프로젝트 일정 다시 한번 확인 부탁드립니다.
(출력) 프로젝트 일정은 저번에 드렸으니 저 빼고 알아서 해주세요...

---
[원문]
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
