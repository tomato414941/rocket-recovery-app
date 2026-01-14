/**
 * 天気API連携のE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('天気API連携', () => {
  test('天気データを取得できる', async ({ page }) => {
    await page.goto('/');

    // 天気取得ボタンをクリック
    const fetchButton = page.getByRole('button', { name: /発射地点の天気を取得/i });
    await expect(fetchButton).toBeVisible();
    await fetchButton.click();

    // ローディング状態が表示される
    await expect(page.getByText(/取得中/i)).toBeVisible();

    // API取得成功メッセージが表示される（タイムアウト長めに）
    await expect(page.getByText(/API取得済み/i)).toBeVisible({ timeout: 15000 });

    // 風速フィールドに値が入る（0以上の値）
    const windSpeedInput = page.locator('input[type="number"]').first();
    const value = await windSpeedInput.inputValue();
    expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
  });

  test('天気データ取得後も手動で編集できる', async ({ page }) => {
    await page.goto('/');

    // 天気取得
    await page.getByRole('button', { name: /発射地点の天気を取得/i }).click();
    await expect(page.getByText(/API取得済み/i)).toBeVisible({ timeout: 15000 });

    // 風速を手動で変更
    const windSpeedInput = page.locator('input[type="number"]').first();
    await windSpeedInput.fill('5.5');

    // 値が更新される
    await expect(windSpeedInput).toHaveValue('5.5');
  });
});
