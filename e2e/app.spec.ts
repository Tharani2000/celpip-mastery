import { test, expect, type Page } from "@playwright/test";

const email = `e2e-${Date.now()}@example.com`;
async function confirm(page: Page) { await page.getByTestId("confirm").click(); }

test.describe.configure({ mode: "serial" });
let page: Page;
test.beforeAll(async ({ browser }) => { page = await browser.newPage(); });

test("protected pages redirect to sign-in", async () => {
  await page.goto("/dashboard"); await expect(page).toHaveURL(/\/login/);
});
test("register and land on the dashboard", async () => {
  await page.goto("/register");
  await page.getByLabel("Name").fill("E2E Learner"); await page.getByLabel("Email").fill(email); await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/); await expect(page.getByText("Your four skills")).toBeVisible();
});
test("complete a listening exercise and review answers", async () => {
  await page.goto("/listening"); await page.getByText("The leak that came back").click();
  await page.getByRole("button", { name: "Answer questions now" }).click();
  for (let i = 0; i < 6; i++) { await page.getByRole("radio").first().click(); await page.waitForTimeout(320); }
  await page.getByTestId("submit-answers").click(); await confirm(page);
  await expect(page.getByText("Unofficial practice estimate")).toBeVisible(); await expect(page.getByText("Question 1", { exact: true })).toBeVisible();
});
test("highlight text and answer a reading part", async () => {
  await page.goto("/reading"); await page.getByText("Choosing a summer program").click();
  await page.getByTestId("passage").locator("p").nth(1).selectText(); await page.getByRole("button", { name: "Highlight selection" }).click();
  await expect(page.getByTestId("passage").locator("mark")).toHaveCount(1);
  for (let i = 0; i < 5; i++) { await page.getByRole("radio").nth(1).click(); await page.waitForTimeout(320); }
  await expect(page.getByTestId("passage").locator("mark")).toHaveCount(1);
  await page.getByTestId("submit-answers").click(); await confirm(page); await expect(page.getByText(/\d\/5|\d+\s*\/5/).first()).toBeVisible();
});
test("write and get labelled feedback", async () => {
  await page.goto("/writing"); await page.getByText("A delayed renovation").first().click();
  await page.getByTestId("editor").fill("Dear Mr. Patel,\n\nI am writing about my kitchen renovation, which is now three weeks behind schedule. However, nobody has been on site since Tuesday.\n\nConsequently, my family has no working sink. Moreover, I took two days off for deliveries that never arrived.\n\nTherefore, please send a written schedule by Friday.\n\nSincerely,\nAmira");
  await page.getByTestId("submit-writing").click(); await confirm(page);
  await expect(page.getByText("Dimension ratings")).toBeVisible({ timeout: 60_000 }); await expect(page.getByText("not an official CELPIP score")).toBeVisible();
});
test("record a speaking response with the fake microphone", async () => {
  await page.goto("/speaking"); await page.getByText("Giving Advice").click();
  await page.getByTestId("start-prep").click(); await page.getByTestId("skip-prep").click();
  await expect(page.getByText("Recording")).toBeVisible(); await page.waitForTimeout(1500); await page.getByTestId("stop-rec").click();
  await page.getByTestId("transcript").fill("I would advise you to weigh up the promotion carefully. The salary is higher, but longer hours could affect your health and your family, so ask about flexibility first.");
  await page.getByTestId("submit-speaking").click();
  await expect(page.getByText("Filler words and repetition")).toBeVisible({ timeout: 60_000 }); await expect(page.getByText(/Pronunciation isn’t assessed/)).toBeVisible();
});
test("flip and grade a flashcard", async () => {
  await page.goto("/vocabulary"); await page.getByTestId("flashcard").click(); await page.getByTestId("grade-2").click();
  await expect(page.getByText(/Card 2 of/)).toBeVisible();
});
test("take a reading section mock and see results", async () => {
  await page.goto("/mock"); await page.getByTestId("section-READING").click();
  await page.getByTestId("begin-test").click();
  for (let part = 0; part < 4; part++) {
    await expect(page.getByText(`Reading Part ${part + 1}`)).toBeVisible();
    await page.getByRole("radio").first().click(); await page.getByTestId("submit-answers").click(); await confirm(page);
  }
  await expect(page).toHaveURL(/\/results/, { timeout: 30_000 }); await expect(page.getByText("unofficial practice estimates")).toBeVisible();
});
test("analytics and achievements render with data", async () => {
  await page.goto("/progress"); await expect(page.getByText("Estimated level over time")).toBeVisible(); await expect(page.locator(".recharts-surface").first()).toBeVisible();
  await page.goto("/achievements"); await expect(page.getByText("First Steps")).toBeVisible();
});
