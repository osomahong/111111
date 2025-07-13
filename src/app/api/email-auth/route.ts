import { NextRequest, NextResponse } from 'next/server';

const allowedDomains = [
  'gmail.com',
  'naver.com',
  'hanmail.net',
  'daum.net',
];
const emailRegex = /^[\w-.]+@([\w-]+\.)?(gmail\.com|naver\.com|hanmail\.net|daum\.net)$/;
const LIMIT = 3;
const WINDOW = 10 * 60; // 10분(초)
const BLOCK = 30 * 60; // 30분(초)

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !emailRegex.test(email)) {
      return NextResponse.json({ error: '지원하는 이메일 도메인만 입력 가능합니다.' }, { status: 400 });
    }
    const emailKey = `email-auth:${email}`;
    const blockKey = `email-auth-block:${email}`;
    try {
      const { kv } = await import('@vercel/kv');
      // 차단 여부 확인
      const blocked = await kv.get(blockKey);
      if (blocked) {
        return NextResponse.json({ error: '짧은 시간 내 여러 번 시도하셨습니다. 30분 후 다시 시도해 주세요.' }, { status: 429 });
      }
      // 시도 기록 가져오기
      let attemptsRaw = await kv.get(emailKey);
      let now = Math.floor(Date.now() / 1000);
      let attempts: number[] = [];
      if (Array.isArray(attemptsRaw)) {
        attempts = attemptsRaw.map(Number).filter((n) => !isNaN(n));
      }
      // 최근 10분 내 시도만 남김
      attempts = attempts.filter((t: number) => now - t < WINDOW);
      if (attempts.length >= LIMIT) {
        // 차단 플래그 30분간 저장
        await kv.set(blockKey, '1', { ex: BLOCK });
        return NextResponse.json({ error: '짧은 시간 내 여러 번 시도하셨습니다. 30분 후 다시 시도해 주세요.' }, { status: 429 });
      }
      // 시도 기록 추가 및 저장
      attempts.push(now);
      await kv.set(emailKey, attempts, { ex: WINDOW });
      return NextResponse.json({ ok: true });
    } catch (kvError) {
      // KV 연결 실패 시 서버 에러
      return NextResponse.json({ error: '서버 인증 저장소 오류' }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
} 