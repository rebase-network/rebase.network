import { test, expect } from '@playwright/test';

test.describe('manual contributor wall check', () => {
  test('left copy block maintains spacing from avatar wall and avatars do not overlap', async ({ page }) => {
    await page.goto('/');

    const section = page.locator('article.contributors-overview');
    await expect(section).toBeVisible();

    const copy = section.locator('.contributors-copy');
    const cloud = section.locator('.contributors-cloud');
    const copyBox = await copy.boundingBox();
    const cloudBox = await cloud.boundingBox();
    expect(copyBox).toBeTruthy();
    expect(cloudBox).toBeTruthy();

    if (copyBox && cloudBox) {
      expect(copyBox.x + copyBox.width).toBeLessThan(cloudBox.x - 8);
    }

    await expect(copy.locator('.contributors-kicker')).toHaveText('社区照片墙');
    await expect(copy.locator('.contributors-intro h3')).toHaveText(/先看见真实的人/);

    const avatars = cloud.locator('.avatar-token');
    const avatarCount = await avatars.count();
    expect(avatarCount).toBe(10);

    const boxes = await Promise.all(
      Array.from({ length: avatarCount }).map((_, index) =>
        avatars.nth(index).boundingBox(),
      ),
    );

    const overlaps = boxes.some((own, index) => {
      if (!own) return false;
      return boxes.slice(index + 1).some((other) => {
        if (!other) return false;
        return (
          own.x < other.x + other.width &&
          own.x + own.width > other.x &&
          own.y < other.y + other.height &&
          own.y + own.height > other.y
        );
      });
    });

    expect(overlaps).toBeFalsy();
  });
});
