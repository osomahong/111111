import { test, expect } from '@playwright/test';

test.describe('결과 이미지화 및 SNS 공유 기능', () => {
  test('이메일 변환 후 이미지 저장/공유 버튼 동작', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    
    // 이메일 입력 및 변환
    const textarea = page.getByPlaceholder('이메일 내용을 입력하세요...');
    const submitButton = page.getByRole('button', { name: /속마음 변환/ });
    
    await textarea.fill('테스트 이메일 내용입니다.');
    await submitButton.click();
    
    // 변환 결과 대기 (성공 또는 과부하 메시지)
    try {
      await expect(page.getByText('속마음 변환 결과')).toBeVisible({ timeout: 10000 });
      
      // 이미지 저장/공유 버튼 확인
      const captureButton = page.getByRole('button', { name: /이미지로 저장\/공유하기/ });
      await expect(captureButton).toBeVisible();
      
      // 이미지 캡처 실행
      await captureButton.click();
      
      // 캡처 완료 대기 (최대 5초)
      await expect(page.getByText('이미지 변환 성공')).toBeVisible({ timeout: 5000 });
      
      // PNG 다운로드 버튼 확인
      const downloadButton = page.getByRole('button', { name: /PNG 다운로드/ });
      await expect(downloadButton).toBeVisible();
      
      // SNS 공유 버튼들 확인
      await expect(page.getByRole('button', { name: /인스타그램/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /트위터/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /페이스북/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /카카오톡/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /링크드인/ })).toBeVisible();
    } catch {
      // API 과부하 등으로 인해 변환이 실패한 경우
      await expect(page.getByText('AI 서버가 현재 바쁩니다')).toBeVisible({ timeout: 1000 });
      console.log('Gemini API 과부하로 인해 테스트 스킵');
    }
  });

  test('이미지 캡처 성능 테스트 (2초 이내)', async ({ page }) => {
    await page.goto('http://localhost:3001/');
    
    const textarea = page.getByPlaceholder('이메일 내용을 입력하세요...');
    const submitButton = page.getByRole('button', { name: /속마음 변환/ });
    
    await textarea.fill('성능 테스트용 이메일');
    await submitButton.click();
    
    try {
      await expect(page.getByText('속마음 변환 결과')).toBeVisible({ timeout: 10000 });
      
      const captureButton = page.getByRole('button', { name: /이미지로 저장\/공유하기/ });
      
      // 이미지 캡처 시간 측정
      const startTime = Date.now();
      await captureButton.click();
      await expect(page.getByText('이미지 변환 성공')).toBeVisible({ timeout: 5000 });
      const endTime = Date.now();
      
      const captureTime = endTime - startTime;
      console.log(`이미지 캡처 시간: ${captureTime}ms`);
      
      // 2초(2000ms) 이내 완료 확인
      expect(captureTime).toBeLessThan(2000);
    } catch {
      // API 과부하 등으로 인해 변환이 실패한 경우, 성능 테스트 스킵
      await expect(page.getByText('AI 서버가 현재 바쁩니다')).toBeVisible({ timeout: 1000 });
      console.log('Gemini API 과부하로 인해 성능 테스트 스킵');
    }
  });
}); 