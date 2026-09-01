import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:8000";

test.describe("下蛋紀錄 golden path", () => {
  let geckoId: string | undefined;

  test.afterEach(async ({ request }) => {
    if (geckoId) {
      await request.delete(`${API_BASE_URL}/geckos/${geckoId}`);
      geckoId = undefined;
    }
  });

  test("新增一筆下蛋紀錄、編輯、刪除，明細列表與圖表同步更新", async ({ page, request }) => {
    const createRes = await request.post(`${API_BASE_URL}/geckos`, {
      data: { name: "E2E-下蛋測試", feeding_interval_days: 7 },
    });
    expect(createRes.status()).toBe(201);
    geckoId = (await createRes.json()).id;

    await page.goto(`/geckos/${geckoId}/egg`);
    await expect(page.getByRole("heading", { name: "新增下蛋紀錄" })).toBeVisible();

    await page.getByLabel("蛋數").fill("3");
    await page.getByRole("button", { name: "儲存紀錄" }).click();

    // 表單切換成編輯模式，紀錄明細與圖表同步出現這筆
    await expect(page.getByRole("heading", { name: "編輯下蛋紀錄" })).toBeVisible();
    const row = page.locator("table tbody tr").first();
    await expect(row).toContainText("3");
    await expect(page.getByText("累計 3 顆蛋")).toBeVisible();

    // 編輯蛋數
    await page.getByLabel("蛋數").fill("5");
    await page.getByRole("button", { name: "更新這筆紀錄" }).click();
    await expect(page.getByText("已更新").first()).toBeVisible();
    await expect(row).toContainText("5");
    await expect(page.getByText("累計 5 顆蛋")).toBeVisible();

    // 刪除紀錄
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "刪除", exact: true }).click();
    await expect(page.getByText("E2E-下蛋測試 還沒有下蛋紀錄")).toBeVisible();
  });
});
