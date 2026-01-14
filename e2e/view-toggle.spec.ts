/**
 * 2D/3D切り替えのE2Eテスト
 */

import { test, expect } from '@playwright/test';

test.describe('2D/3D切り替え', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // シミュレーション実行して予測モードに
    await page.getByRole('button', { name: /シミュレーション実行/i }).click();
    await expect(page.getByText('予測結果')).toBeVisible({ timeout: 10000 });
  });

  test('2D/3D切り替えボタンが表示される', async ({ page }) => {
    // 2Dボタンがアクティブ
    const button2D = page.getByRole('button', { name: '2D' });
    await expect(button2D).toBeVisible();

    // 3Dボタンも表示
    const button3D = page.getByRole('button', { name: '3D' });
    await expect(button3D).toBeVisible();
  });

  test('3Dビューに切り替えできる', async ({ page }) => {
    // 3Dボタンをクリック
    await page.getByRole('button', { name: '3D' }).click();

    // Three.jsキャンバスが表示される
    await expect(page.locator('canvas')).toBeVisible();

    // 凡例が表示される
    await expect(page.getByText('上昇')).toBeVisible();
    await expect(page.getByText('降下')).toBeVisible();
    await expect(page.getByText('頂点')).toBeVisible();
    await expect(page.getByText('着地点')).toBeVisible();
  });

  test('2Dに戻れる', async ({ page }) => {
    // 3Dに切り替え
    await page.getByRole('button', { name: '3D' }).click();
    await expect(page.locator('canvas')).toBeVisible();

    // 2Dに戻す
    await page.getByRole('button', { name: '2D' }).click();

    // 地図が表示される
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('3D操作説明が表示される', async ({ page }) => {
    await page.getByRole('button', { name: '3D' }).click();

    // 操作説明が表示される
    await expect(page.getByText(/ドラッグ.*回転/)).toBeVisible();
  });
});
