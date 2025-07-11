import { NextRequest, NextResponse } from 'next/server';

// 개발 환경용 메모리 저장소
const devStorage = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const { originalText, translatedText } = await request.json();

    if (!originalText || !translatedText) {
      return NextResponse.json(
        { error: '원본 텍스트와 변환된 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 고유 ID 생성 (랜덤 6자리)
    const id = Math.random().toString(36).substring(2, 8);
    
    // 결과 데이터 구성
    const resultData = {
      id,
      originalText,
      translatedText,
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
    console.error('결과 저장 오류:', error);
    return NextResponse.json(
      { error: '결과 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 개발용 메모리 저장소 export (get-result에서 사용)
export { devStorage }; 