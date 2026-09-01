import { expect, test } from "@playwright/test";

const API_BASE_URL = "http://localhost:8000";

test.describe("環境紀錄 golden path", () => {
  let geckoId: string | undefined;

  test.afterEach(async ({ request }) => {
    if (geckoId) {
      await request.delete(`${API_BASE_URL}/geckos/${geckoId}`);
      geckoId = undefined;
    }
  });

  test("未設定安全範圍時顯示提示；新增/編輯/刪除一筆環境紀錄，明細列表同步更新", async ({ page, request }) => {
    const createRes = await request.post(`${API_BASE_URL}/geckos`, {
      data: { name: "E2E-環境測試", feeding_interval_days: 7 },
    });
    expect(createRes.status()).toBe(201);
    geckoId = (await createRes.json()).id;

    await page.goto(`/geckos/${geckoId}/environment`);
    await expect(page.getByText("尚未設定安全溫濕度範圍")).toBeVisible();

    await page.getByLabel("溫度 (°C)").fill("28");
    await page.getByLabel("濕度 (%)").fill("60");
    await page.getByRole("button", { name: "儲存紀錄" }).click();

    // 表單切換成編輯模式，且紀錄明細出現這筆
    await expect(page.getByRole("heading", { name: "編輯環境紀錄" })).toBeVisible();
    const row = page.locator("table tbody tr").first();
    await expect(row).toContainText("28");
    await expect(row).toContainText("60");

    // 編輯：更新溫度
    await page.getByLabel("溫度 (°C)").fill("29");
    await page.getByRole("button", { name: "更新這筆紀錄" }).click();
    await expect(page.getByText("已更新").first()).toBeVisible();
    await expect(row).toContainText("29");

    // 刪除紀錄
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "刪除", exact: true }).click();
    await expect(page.getByText("E2E-環境測試 還沒有環境紀錄")).toBeVisible();
  });

  test("已設定安全範圍時不顯示提示，超出範圍的量測會標示警示", async ({ page, request }) => {
    const createRes = await request.post(`${API_BASE_URL}/geckos`, {
      data: {
        name: "E2E-環境警示測試",
        feeding_interval_days: 7,
        safe_temp_min: 20,
        safe_temp_max: 30,
        safe_humidity_min: 40,
        safe_humidity_max: 70,
      },
    });
    expect(createRes.status()).toBe(201);
    geckoId = (await createRes.json()).id;

    await page.goto(`/geckos/${geckoId}/environment`);
    await expect(page.getByText("尚未設定安全溫濕度範圍")).not.toBeVisible();

    // 溫度超出安全範圍（35 > 30），濕度在範圍內（50）
    await page.getByLabel("溫度 (°C)").fill("35");
    await page.getByLabel("濕度 (%)").fill("50");
    await page.getByRole("button", { name: "儲存紀錄" }).click();

    const row = page.locator("table tbody tr").first();
    await expect(row).toContainText("35°C ⚠ 超出範圍");
    await expect(row).not.toContainText("50% ⚠ 超出範圍");
  });
});
