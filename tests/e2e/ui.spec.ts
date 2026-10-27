import { readFileSync } from "fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const URL = "/synthwave-drive/?quality=0";
const shot = (p: Page, n: string) => p.screenshot({ path: `docs/screenshots/${n}.png` });
const startViaFile = async (p: Page) => {
  await p.locator("#file").setInputFiles("tests/fixtures/kicks-120bpm.wav");
  await expect(p.locator("#overlay")).toBeHidden();
};
const axe = async (p: Page) => expect((await new AxeBuilder({ page: p }).analyze()).violations).toEqual([]);

test("loads clean with overlay; kicks fixture yields BPM and track name", async ({ page }) => {
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
  await expect(page.locator("#track")).toHaveText("kicks-120bpm");
  await page.mouse.move(10, 10);
  await shot(page, "playing-desktop-dark");
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

test("drag-and-drop loads a dropped audio file", async ({ page }) => {
  await page.goto(URL);
  await expect(page.locator("#overlay")).toBeVisible();
  const b64 = readFileSync("tests/fixtures/kicks-120bpm.wav").toString("base64");
  await page.evaluate(async (data) => {
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const dt = new DataTransfer();
    dt.items.add(new File([bytes], "kicks.wav", { type: "audio/wav" }));
    document.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true, cancelable: true }));
  }, b64);
  await expect(page.locator("#overlay")).toBeHidden();
  await expect(page.locator("#hud")).toBeVisible();
});

test("fullscreen button requests fullscreen", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(document, "fullscreenEnabled", { value: true });
    (window as never as { __fs: number }).__fs = 0;
    Element.prototype.requestFullscreen = () => { (window as never as { __fs: number }).__fs++; return Promise.resolve(); };
  });
  await page.goto(URL);
  await startViaFile(page);
  await page.locator("#full").click();
  expect(await page.evaluate(() => (window as never as { __fs: number }).__fs)).toBe(1);
});

test("pause and ended leave a sensible HUD", async ({ page }) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () { (window as never as { __a: HTMLMediaElement }).__a = this; return play.call(this); };
  });
  await page.goto(URL);
  await startViaFile(page);
  await expect(page.locator("#play")).toHaveText("Pause");
  await page.locator("#play").click();
  await expect(page.locator("#play")).toHaveText("Play");
  await expect(page.locator("#hud")).toBeVisible();
  await page.locator("#play").click();
  await expect(page.locator("#play")).toHaveText("Pause");
  // end the track: the ended handler must flip the button back to Play, HUD stays
  await page.evaluate(() => { const a = (window as never as { __a: HTMLMediaElement }).__a; a.currentTime = Math.max(0, a.duration - 0.05); });
  await expect(page.locator("#play")).toHaveText("Play", { timeout: 10000 });
  await expect(page.locator("#hud")).toBeVisible();
});

test("controls hide while playing and return on input; space pauses", async ({ page }) => {
  await page.goto(URL);
  await startViaFile(page);
  await expect(page.locator("#play")).toHaveText("Pause");
  await expect(page.locator("body")).toHaveClass(/idle/, { timeout: 6000 });
  await page.mouse.move(50, 50);
  await expect(page.locator("body")).not.toHaveClass(/idle/);
  await page.locator("body").focus();
  await page.keyboard.press("Space");
  await expect(page.locator("#play")).toHaveText("Play");
  await page.waitForTimeout(3500);
  await expect(page.locator("body")).not.toHaveClass(/idle/); // paused keeps the controls up
});

test("reduced motion: scene loads without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(URL);
  await startViaFile(page);
  await page.waitForTimeout(1500);
  await shot(page, "playing-desktop-reduced");
  expect(errors).toEqual([]);
});

test("overdrive: quiet then loud song sets data-surge", async ({ page }) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(URL);
  await page.locator("#file").setInputFiles("tests/fixtures/quiet-then-loud.wav");
  await expect(page.locator("#overlay")).toBeHidden();
  await expect(page.locator("body")).toHaveAttribute("data-surge", "1", { timeout: 120000 });
  await page.waitForTimeout(2500); // let the look ease into overdrive
  await shot(page, "playing-desktop-surge");
});
