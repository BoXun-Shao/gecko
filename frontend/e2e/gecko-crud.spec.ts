import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:8000";

test.describe("守宮 CRUD golden path", () => {
  test("新增 → 編輯 → 刪除守宮", async ({ page, request }) => {
    await page.goto("/");

    // 空狀態或已有守宮都可能發生，統一走「新增守宮」chip 觸發 modal
    const emptyAddButton = page.getByRole("button", { name: "新增第一隻守宮" });
    const rosterAddChip = page.getByText("新增守宮");
    if (await emptyAddButton.isVisible().catch(() => false)) {
      await emptyAddButton.click();
    } else {
      await rosterAddChip.click();
    }

    await page.getByLabel("名字").fill("E2E-新增守宮");
    await page.getByRole("button", { name: "儲存" }).click();
    await page.waitForURL(/\/geckos\/.+\/overview/);

    await expect(page.getByRole("heading", { name: "E2E-新增守宮" })).toBeVisible();
    const geckoId = page.url().match(/\/geckos\/([^/]+)\//)?.[1];
    expect(geckoId).toBeTruthy();

    // 編輯
    await page.getByRole("button", { name: "編輯資料與照片" }).click();
    await page.getByLabel("名字").fill("E2E-已編輯");
    await page.getByRole("button", { name: "儲存" }).click();
    await expect(page.getByRole("heading", { name: "E2E-已編輯" })).toBeVisible();

    // 刪除：透過畫面上的「刪除這隻」按鈕
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "編輯資料與照片" }).click();
    await page.getByRole("button", { name: "刪除這隻" }).click();
    await expect(page.getByText("已刪除").first()).toBeVisible();
    await expect(page).not.toHaveURL(new RegExp(`/geckos/${geckoId}/`));

    // 確認後端也真的刪掉了（軟刪除，GET 應該 404）
    const getRes = await request.get(`${API_BASE_URL}/geckos/${geckoId}`);
    expect(getRes.status()).toBe(404);
  });
});
