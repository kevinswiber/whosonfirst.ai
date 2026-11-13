// The color theme follows the system setting, live, and a theme picked with
// the header button lasts only until the system setting next changes.
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { frames, open, useBrowser } from "../support/browser.mjs";

const site = useBrowser();

test("theme follows the system setting, and a picked theme ends when it changes", async (t) => {
  const ctx = await site.context({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
  });
  t.after(() => ctx.close());
  const page = await ctx.newPage();
  await open(page, site.url("/"));
  const steps = [];
  const step = async (name, want) => {
    await frames(page);
    const got = await page.evaluate(() => {
      const [r, g, b] = getComputedStyle(document.body)
        .backgroundColor.match(/[\d.]+/g)
        .map(Number);
      return {
        dark: r + g + b < 384,
        picked: document.documentElement.dataset.theme ?? null,
        stored: localStorage.getItem("theme"),
      };
    });
    const ok =
      got.dark === want.dark &&
      got.picked === want.picked &&
      got.stored === want.picked;
    if (!ok) steps.push(`${name}: ${JSON.stringify(got)}`);
  };
  await step("light system", { dark: false, picked: null });
  await page.emulateMedia({ colorScheme: "dark" });
  await step("system changes to dark", { dark: true, picked: null });
  await page.emulateMedia({ colorScheme: "light" });
  await page.click("button.theme");
  await step("button on a light system", { dark: true, picked: "dark" });
  await page.reload({ waitUntil: "load" });
  await step("reload keeps the choice", { dark: true, picked: "dark" });
  await page.emulateMedia({ colorScheme: "dark" });
  await step("system changes to dark: choice dropped", {
    dark: true,
    picked: null,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await step("system changes to light: page follows", {
    dark: false,
    picked: null,
  });
  assert.deepEqual(steps, []);
});
