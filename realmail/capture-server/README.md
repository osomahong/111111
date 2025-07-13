# Capture Server (Express + Playwright)

## 소개
- Headless Browser(Playwright) 기반 웹페이지/요소 스크린샷 생성 API 서버
- OG 이미지, 리포트, 인증샷 등 다양한 용도에 활용 가능

## 실행 방법

1. Playwright 브라우저 바이너리 설치 (최초 1회)
   ```bash
   npx playwright install
   ```
2. 서버 실행
   ```bash
   node index.js
   # 또는
   PORT=5000 node index.js
   ```

## API 사용법

### POST /api/capture
- 웹페이지 전체 또는 특정 selector의 스크린샷을 생성

#### 요청 예시
```json
{
  "url": "https://example.com/page",
  "selector": "#main-content", // (선택) 캡처할 요소의 CSS 선택자
  "format": "png",              // (선택) 'png' 또는 'jpeg', 기본값: 'png'
  "quality": 90,                 // (선택) jpeg일 때 1~100
  "fullPage": false              // (선택) 전체 페이지 캡처 여부
}
```

#### 응답 예시
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo..."
}
```

- 에러 발생 시 `{ error: "메시지" }` 형태로 반환

## 참고
- Playwright는 리소스 소모가 크므로, 운영 환경에서는 Docker 사용 권장
- 인증/비공개 페이지 캡처 시 접근 권한/토큰 처리 필요 