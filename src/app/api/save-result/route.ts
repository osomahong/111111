import { NextRequest, NextResponse } from 'next/server';

// 개발 환경용 메모리 저장소
const devStorage = new Map<string, any>();

// Gemini 기반 이메일 생성 함수
async function generateCreativeEmail(senderName) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';
  if (!GEMINI_API_KEY) return 'user@gmail.com';
  const prompt = `아래 인물의 이름/직책 정보를 참고해서, 실제로 존재하지 않는 창의적인 영문 이메일 주소를 만들어줘.\n조건:\n- 20자 이내 영문 소문자/숫자/기호만 사용\n- 이름/직책의 특징을 반영\n- 도메인은 gmail.com\n- 예시: 홍길동 대리 → hongdari@gmail.com, 김철수 팀장 → kimlead@gmail.com\n- 반드시 실제로 존재하지 않을 법한, 창의적이고 짧은 이메일 주소로 만들어줘.\n- 결과는 이메일 주소 한 줄만 반환\n\n이름/직책: ${senderName}`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 32,
      temperature: 0.8,
    },
  };
  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const email = text.match(/[a-z0-9._%+-]+@gmail\.com/i)?.[0];
    if (email && email.length <= 20) return email;
    // 20자 초과면 앞부분만 자르기
    if (email) return email.slice(0, email.indexOf('@')).slice(0, 12) + '@gmail.com';
    return 'user@gmail.com';
  } catch (e) {
    return 'user@gmail.com';
  }
}

export async function POST(request: NextRequest) {
  console.log('save-result API 진입');
  try {
    const { originalText, translatedText, senderName } = await request.json();

    if (!originalText || !translatedText) {
      return NextResponse.json(
        { error: '원본 텍스트와 변환된 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 고유 ID 생성 (랜덤 6자리)
    const id = Math.random().toString(36).substring(2, 8);
    
    // sender, receiver, subject, avatar 생성
    const senderNameFinal = senderName || '발신자';
    const receiverName = request.headers.get('x-receiver-name') || '수신자';
    const subjectRaw = originalText.split('\n')[0].trim();
    const subject = 'Re: ' + (subjectRaw.length > 14 ? subjectRaw.slice(0, 14) + '...' : subjectRaw);
    const avatar = senderNameFinal[0] || '익';
    const senderEmail = await generateCreativeEmail(senderNameFinal);

    // 결과 데이터 구성
    const resultData = {
      id,
      originalText,
      translatedText,
      sender: { name: senderNameFinal, email: senderEmail, avatar },
      receiver: receiverName,
      subject,
      createdAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24시간 후
    };

    // KV 사용 가능한지 확인 후 저장
    try {
      const { kv } = await import('@vercel/kv');
      await kv.set(`result:${id}`, resultData, { ex: 86400 }); // 24시간 TTL
      console.log('✅ KV에 저장 완료:', id);
    } catch (kvError) {
      // KV 사용 불가능시 메모리에 임시 저장 (개발용)
      devStorage.set(`result:${id}`, resultData);
      console.log('⚠️  KV 연결 실패, 메모리에 임시 저장:', id);
    }

    return NextResponse.json({ id, success: true });
  } catch (error) {
    const errObj = error as any;
    console.error('결과 저장 오류:', error, errObj?.stack);
    return NextResponse.json(
      { error: '결과 저장에 실패했습니다.', detail: String(error) },
      { status: 500 }
    );
  }
} 