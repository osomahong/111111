import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: '결과 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let resultData = null;

    // KV에서 조회 시도
    try {
      const { kv } = await import('@vercel/kv');
      resultData = await kv.get(`result:${id}`);
      console.log('✅ KV에서 조회 완료:', id);
    } catch (kvError) {
      console.log('⚠️  KV 연결 실패:', kvError);
      // KV 연결 실패 시 바로 에러 반환
      return NextResponse.json(
        { error: '결과를 찾을 수 없거나 만료되었습니다.' },
        { status: 404 }
      );
    }

    if (!resultData) {
      return NextResponse.json(
        { error: '결과를 찾을 수 없거나 만료되었습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(resultData);
  } catch (error) {
    console.error('결과 조회 오류:', error);
    return NextResponse.json(
      { error: '결과 조회에 실패했습니다.' },
      { status: 500 }
    );
  }
} 