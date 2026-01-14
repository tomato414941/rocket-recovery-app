/**
 * 基本フローのE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('基本フロー', () => {
  test('アプリが起動し、地図が表示される', async ({ page }) => {
    await page.goto('/');

    // アプリタイトルが表示される
    await expect(page.locator('header')).toContainText('Rocket Recovery');

    // 地図が表示される（Leafletコンテナ）
    await expect(page.locator('.leaflet-container')).toBeVisible();

    // セットアップタブがアクティブ
    await expect(page.getByRole('button', { name: /setup/i })).toBeVisible();
  });

  test('シミュレーションを実行して結果が表示される', async ({ page }) => {
    await page.goto('/');

    // シミュレーション実行ボタンをクリック
    await page.getByRole('button', { name: /シミュレーション実行/i }).click();

    // 予測タブに切り替わる
    await expect(page.getByText('予測結果')).toBeVisible({ timeout: 10000 });

    // 結果が表示される
    await expect(page.getByText(/最高高度/)).toBeVisible();
    await expect(page.getByText(/飛行時間/)).toBeVisible();
    await expect(page.getByText(/最高速度/)).toBeVisible();

    // 軌道が地図上に表示される（PolylineはSVGパス）
    await expect(page.locator('.leaflet-overlay-pane svg path')).toBeVisible();
  });

  test('タブ切り替えが動作する', async ({ page }) => {
    await page.goto('/');

    // シミュレーション実行
    await page.getByRole('button', { name: /シミュレーション実行/i }).click();
    await expect(page.getByText('予測結果')).toBeVisible({ timeout: 10000 });

    // 回収タブに切り替え
    await page.getByRole('button', { name: /回収/i }).click();
    await expect(page.getByText('回収支援')).toBeVisible();

    // セットアップタブに戻る
    await page.getByRole('button', { name: /setup/i }).click();
    await expect(page.getByText('発射地点')).toBeVisible();
  });

  test('フライトチャートが表示される', async ({ page }) => {
    await page.goto('/');

    // シミュレーション実行
    await page.getByRole('button', { name: /シミュレーション実行/i }).click();
    await expect(page.getByText('予測結果')).toBeVisible({ timeout: 10000 });

    // フライトチャートが表示される（Rechartsコンテナ）
    await expect(page.locator('.recharts-wrapper')).toBeVisible();

    // 軸ラベルが表示される
    await expect(page.getByText('高度 (m)')).toBeVisible();
    await expect(page.getByText('時間 (s)')).toBeVisible();
  });
});
