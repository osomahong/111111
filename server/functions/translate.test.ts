import fetch from 'node-fetch';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './translate';

// node 환경에서 fetch가 없을 수 있으므로 강제 바인딩
globalThis.fetch = globalThis.fetch || vi.fn();

// NextRequest mocking
class MockRequest {
  private body: any;
  constructor(body: any) { this.body = body; }
  async json() { return this.body; }
}

function getField(res: any, key: string) {
  // 테스트 환경에서는 객체, 실제 런타임에서는 NextResponse
  if (typeof res === 'object' && res !== null && key in res) return res[key];
  return undefined;
}

describe('translate Edge Function', () => {
  beforeEach(() => {
    // 캐시 완전 초기화
    if (global.cache && typeof global.cache.clear === 'function') global.cache.clear();
    // fetch mock 초기화
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('정상 입력 시 변환 결과 반환', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '속마음 변환 결과' }] } }],
      }),
    } as any);
    const req = new MockRequest({ text: '안녕하세요' });
    const res = await POST(req as any);
    expect(getField(res, 'result')).toContain('속마음 변환 결과');
  });

  it('5,000자 초과 입력 시 에러 반환', async () => {
    const req = new MockRequest({ text: 'a'.repeat(5001) });
    const res = await POST(req as any);
    expect(getField(res, 'error')).toContain('5,000자');
    expect(getField(res, 'status')).toBe(400);
  });

  it('전화번호 등 개인정보 포함 시 에러 반환', async () => {
    const req = new MockRequest({ text: '010-1234-5678' });
    const res = await POST(req as any);
    expect(getField(res, 'error')).toContain('개인정보');
    expect(getField(res, 'status')).toBe(400);
  });

  it('Gemini 안전 필터에 의해 차단 시 에러 반환', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      json: async () => ({
        candidates: [{ finishReason: 'SAFETY' }],
      }),
    } as any);
    const req = new MockRequest({ text: '금지된 내용' });
    const res = await POST(req as any);
    expect(getField(res, 'error')).toContain('안전 필터');
    expect(getField(res, 'status')).toBe(400);
  });
}); 