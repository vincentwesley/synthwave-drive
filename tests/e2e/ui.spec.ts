import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const URL = "/synthwave-drive/";
const shot = (p: Page, n: string) => p.screenshot({ path: `docs/screenshots/${n}.png` });
const startViaFile = async (p: Page) => {
  await p.locator("#file").setInputFiles("tests/fixtures/kicks-120bpm.wav");
  await expect(p.locator("#overlay")).toBeHidden();
};
const axe = async (p: Page) => expect((await new AxeBuilder({ page: p }).analyze()).violations).toEqual([]);

test("loads clean with overlay; kicks fixture yields BPM; theme", async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(URL);
  await expect(page.locator("#overlay")).toBeVisible();
  await page.waitForTimeout(1500);
  await shot(page, "overlay-desktop-dark");
  await axe(page);
  await startViaFile(page);
  const bpm = async () => parseInt((await page.locator("#bpm").textContent()) ?? "", 10);
  await expect.poll(async () => { const b = await bpm(); return b >= 110 && b <= 130; }, { timeout: 40000 }).toBe(true);
  await shot(page, "playing-desktop-dark");
  await axe(page);
  await page.locator("#theme").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.waitForTimeout(300);
  await shot(page, "playing-desktop-light");
  await axe(page);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await axe(page);
  expect(errors).toEqual([]);
});

test("375px overlay, playing, credits", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto(URL);
  await page.waitForTimeout(1500);
  await shot(page, "overlay-375-dark");
  await axe(page);
  await startViaFile(page);
  await page.waitForTimeout(1000);
  await shot(page, "playing-375-dark");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator(".creator").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, "credits-375-dark");
});

test("rejects non-audio file with a message", async ({ page }) => {
  await page.goto(URL);
  await page.locator("#file").setInputFiles({ name: "a.txt", mimeType: "text/plain", buffer: new Uint8Array([120]) as never });
  await expect(page.locator("#msg")).toContainText("not an audio file");
  await expect(page.locator("#overlay")).toBeVisible();
});

test("mic denied shows message", async ({ page }) => {
  await page.goto(URL);
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("x", "NotAllowedError")); });
  await page.getByRole("button", { name: "Use microphone" }).click();
  await expect(page.locator("#msg")).toContainText("denied");
});
