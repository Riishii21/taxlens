import { test, expect, request } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

test.beforeEach(async () => {
  const ctx = await request.newContext();
  await ctx.post(`${API}/demo/reset`);          // guarantee a clean state
  await ctx.dispose();
});

test("citizen completes the full notice journey", async ({ page }) => {
  await page.goto("/");

  // Landing -> understand a notice
  await page.getByText("Understand a notice").click();

  // Verify -> Understand -> Documents
  await page.getByRole("button", { name: /understand this notice/i }).click();
  await page.getByRole("button", { name: /check my documents/i }).click();

  // Readiness < 100, add the missing document -> prepare response
  await expect(page.getByText(/% ready/)).toBeVisible();
  await page.getByRole("button", { name: /add the missing document/i }).click();
  await page.getByRole("button", { name: /prepare my response/i }).click();

  // Draft -> cannot submit until approved
  const submit = page.getByRole("button", { name: /approve & submit/i });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await submit.click();

  // Submitted -> waiting -> clarification
  await expect(page.getByText(/reference it-demo/i)).toBeVisible();
  await page.getByRole("button", { name: /see what happens next/i }).click();
  await page.getByRole("button", { name: /simulate the department/i }).click();

  // Clarification -> resolve
  await expect(page.getByText(/needs one more thing/i)).toBeVisible();
  await page.getByRole("button", { name: /send the clarification/i }).click();

  await expect(page.getByText(/your response is complete/i)).toBeVisible();
});

test("suspicious message is flagged high risk", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Check a suspicious message").click();
  await page.getByRole("button", { name: /check this message/i }).click();
  await expect(page.getByText(/looks suspicious/i)).toBeVisible();
});
