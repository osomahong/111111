import { test, expect, devices } from '@playwright/test';

test.describe('K-직장인 속마음 이메일 변환기', () => {
  test('이메일 입력, 글자수, 에러, 변환 버튼, 결과 UI 동작', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    // 입력창, 버튼, 글자수 표시 확인
    const textarea = page.getByPlaceholder('이메일 내용을 입력하세요...');
    const button = page.getByRole('button', { name: /속마음 변환/ });
    const counter = page.getByText(/\/ 5000자/);
    await expect(textarea).toBeVisible();
    await expect(button).toBeVisible();
    await expect(counter).toBeVisible();

    // 입력 및 글자수 증가
    await textarea.fill('테스트 이메일 내용');
    await expect(page.getByText('10 / 5000자')).toBeVisible();

    // 5,000자 초과 시 에러
    await textarea.fill('a'.repeat(5001));
    await expect(page.getByText('입력은 5,000자 이내여야 합니다.')).toBeVisible();
    await expect(button).toBeDisabled();

    // 정상 입력 시 버튼 활성화
    await textarea.fill('정상 입력');
    await expect(button).toBeEnabled();
  });

  test('다크모드에서 UI 렌더링', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('http://localhost:3001/');
    await expect(page.getByText('K-직장인 속마음 이메일 변환기')).toBeVisible();
    // 입력창 배경이 dark 스타일인지 확인(스냅샷 등 추가 가능)
  });

  test('모바일(아이폰)에서 반응형 UI', async ({ browser }) => {
    const iphone = await browser.newContext({ ...devices['iPhone 13'] });
    const mobilePage = await iphone.newPage();
    await mobilePage.goto('http://localhost:3001/');
    await expect(mobilePage.getByPlaceholder('이메일 내용을 입력하세요...')).toBeVisible();
    await iphone.close();
  });
}); 