# K-직장인 속마음 이메일 변환기

AI가 평범한 업무 이메일을 K-직장인의 솔직하고 유머러스한 속마음으로 번역해 주는 웹 서비스입니다.

## 🚀 서비스 소개

- **이메일 변환**: 딱딱한 업무 이메일 → K-직장인 스타일 솔직한 속마음
- **이미지 공유**: 변환 결과를 밈처럼 이미지로 저장하여 SNS 공유
- **안전 필터**: 개인정보 및 부적절한 내용 자동 필터링

## 🛠 기술 스택

- **Frontend**: Next.js 15, Tailwind CSS, Zustand
- **AI**: Google Gemini API
- **배포**: Vercel Edge Functions
- **테스트**: Vitest, Playwright

## 🎯 사용법

1. 업무 이메일 내용을 입력창에 붙여넣기
2. '속마음으로 번역하기' 버튼 클릭
3. AI가 생성한 K-직장인 스타일 결과 확인
4. 이미지로 저장하여 SNS 공유

## 🔧 개발 환경 설정

```bash
npm install
npm run dev
```

환경변수 설정을 위해 `.env.example`을 `.env.local`로 복사하고 Gemini API 키를 설정하세요.
