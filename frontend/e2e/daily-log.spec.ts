import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:8000";

test.describe("進食紀錄 golden path", () => {
  let geckoId: string | undefined;

  test.afterEach(async ({ request }) => {
    if (geckoId) {
      await request.delete(`${API_BASE_URL}/geckos/${geckoId}`);
      geckoId = undefined;
    }
  });

  test("新增一筆進食紀錄後，統計列、斑帶圖、圖表、紀錄明細都同步更新", async ({ page, request }) => {
    const createRes = await request.post(`${API_BASE_URL}/geckos`, {
      data: { name: "E2E-進食測試", feeding_interval_days: 7 },
    });
    expect(createRes.status()).toBe(201);
    geckoId = (await createRes.json()).id;

    await page.goto(`/geckos/${geckoId}/feeding`);
    await expect(page.getByText("紀錄筆數")).toBeVisible();

    await page.getByLabel("進食數量（0 ＝ 拒食／沒餵）").fill("5");
    await page.getByRole("button", { name: "儲存紀錄" }).click();

    // StatsRow：紀錄筆數應該變成 1
    await expect(page.locator("text=紀錄筆數").locator("..").getByText("1")).toBeVisible();

    // 表單切換成編輯模式
    await expect(page.getByRole("heading", { name: "編輯紀錄" })).toBeVisible();

    // 紀錄明細出現這筆
    const row = page.locator("table tbody tr").first();
    await expect(row).toContainText("5");

    // 食物比例圖出現
    await expect(page.getByText(/100%/)).toBeVisible();

    // 編輯：把狀態改成「部分進食」
    await page.getByText("部分進食").click();
    await page.getByRole("button", { name: "更新這筆紀錄" }).click();
    await expect(page.getByText("已更新").first()).toBeVisible();

    // 刪除紀錄
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "刪除" }).click();
    await expect(page.getByText("E2E-進食測試 還沒有紀錄")).toBeVisible();
  });
});
