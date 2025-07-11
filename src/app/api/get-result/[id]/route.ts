import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: '결과 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    let resultData = null;

    // 먼저 KV에서 조회 시도
    try {
      const { kv } = await import('@vercel/kv');
      resultData = await kv.get(`result:${id}`);
      console.log('✅ KV에서 조회 완료:', id);
    } catch (kvError) {
      console.log('⚠️  KV 연결 실패, 메모리에서 조회 시도:', id);
      
      // KV 실패시 메모리 저장소에서 조회 (개발용)
      try {
        const { devStorage } = await import('../../save-result/route');
        resultData = devStorage.get(`result:${id}`);
        
        // 만료 시간 체크 (메모리 저장소의 경우)
        if (resultData && resultData.expiresAt < Date.now()) {
          devStorage.delete(`result:${id}`);
          resultData = null;
        }
      } catch (memError) {
        console.log('메모리 저장소 조회 실패:', memError);
      }
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