import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:8000";

const TINY_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQMDAwQDBAgEBAgQCwkLEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBD/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "base64",
);

test.describe("蛻皮紀錄 golden path", () => {
  let geckoId: string | undefined;

  test.afterEach(async ({ request }) => {
    if (geckoId) {
      await request.delete(`${API_BASE_URL}/geckos/${geckoId}`);
      geckoId = undefined;
    }
  });

  test("新增一筆蛻皮紀錄、上傳/刪除照片、編輯、刪除，明細列表同步更新", async ({ page, request }) => {
    const createRes = await request.post(`${API_BASE_URL}/geckos`, {
      data: { name: "E2E-蛻皮測試", feeding_interval_days: 7 },
    });
    expect(createRes.status()).toBe(201);
    geckoId = (await createRes.json()).id;

    await page.goto(`/geckos/${geckoId}/shedding`);
    await expect(page.getByRole("heading", { name: "新增蛻皮紀錄" })).toBeVisible();

    await page.getByLabel("備註").fill("完整蛻皮");
    await page.getByRole("button", { name: "儲存紀錄" }).click();

    // 表單切換成編輯模式，且紀錄明細出現這筆
    await expect(page.getByRole("heading", { name: "編輯蛻皮紀錄" })).toBeVisible();
    const row = page.locator("table tbody tr").first();
    await expect(row).toContainText("完整蛻皮");

    // 上傳兩張照片
    await page.locator('input[type="file"]').setInputFiles([
      { name: "shed-1.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG },
      { name: "shed-2.jpg", mimeType: "image/jpeg", buffer: TINY_JPEG },
    ]);
    await expect(page.getByText("已上傳 2 張照片")).toBeVisible();
    await expect(page.getByAltText("蛻皮照片")).toHaveCount(2);

    // 點縮圖可放大檢視
    await page.getByAltText("蛻皮照片").first().click();
    await expect(page.getByAltText("蛻皮照片")).toHaveCount(3); // 2 張縮圖 + 1 張放大檢視
    await page.keyboard.press("Escape");
    await expect(page.getByAltText("蛻皮照片")).toHaveCount(2);

    // 刪除其中一張，另一張應保留（每張照片的刪除按鈕有各自獨立的 aria-label）
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "刪除第 1 張照片" }).click();
    await expect(page.getByAltText("蛻皮照片")).toHaveCount(1);

    // 編輯備註
    await page.getByLabel("備註").fill("已編輯備註");
    await page.getByRole("button", { name: "更新這筆紀錄" }).click();
    await expect(page.getByText("已更新").first()).toBeVisible();
    await expect(row).toContainText("已編輯備註");

    // 刪除紀錄
    await page.getByRole("button", { name: "刪除", exact: true }).click();
    await expect(page.getByText("E2E-蛻皮測試 還沒有蛻皮紀錄")).toBeVisible();
  });
});
