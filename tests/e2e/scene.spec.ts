import { expect, test } from "@playwright/test";

for (const [name, size] of [["desktop", { width: 1280, height: 720 }], ["375", { width: 375, height: 700 }]] as const) {
  test(`scene renders (${name})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize(size);
    await page.goto("/synthwave-drive/");
    await page.waitForTimeout(2500);
    const shot = await page.screenshot({ path: `docs/screenshots/m1-${name}.png` });
    // decode the screenshot in-page and count distinct quantised colours
    const colours = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, Math.floor(c.height * 0.8)).data;
      const set = new Set<number>();
      for (let i = 0; i < d.length; i += 4 * 17) set.add(((d[i]! >> 4) << 8) | ((d[i + 1]! >> 4) << 4) | (d[i + 2]! >> 4));
      return set.size;
    }, shot.toString("base64"));
    expect(colours).toBeGreaterThan(20);
    expect(errors).toEqual([]);
  });
}
