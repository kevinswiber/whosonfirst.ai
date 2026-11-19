/**
 * The built site served as the host serves it, and a browser to read it with.
 *
 * Every test file under test/browser/ calls useBrowser() once, at its top. It
 * starts a server for the built assets and a Chromium for the file's tests, and
 * closes both when they are done. Each file has its own, so the files run side
 * by side.
 *
 * While the file's tests run, every page they open is watched for a script
 * error and for anything the site's content security policy refuses. After the
 * last test the file fails if any page had either, and names the page.
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import { cleanup } from "ubqtest";
import { root, SITE_HEADERS } from "./site.mjs";

export const axePath = createRequire(import.meta.url).resolve(
  "axe-core/axe.min.js",
);

export const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844, isMobile: true, hasTouch: true },
];
export const THEMES = ["light", "dark"];

/** Context options for one of the VIEWPORTS. */
export const device = (vp, options = {}) => ({
  viewport: { width: vp.width, height: vp.height },
  isMobile: vp.isMobile,
  hasTouch: vp.hasTouch,
  ...options,
});

const TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".xml": "application/xml",
  ".txt": "text/plain",
  ".png": "image/png",
  ".md": "text/markdown",
};

/**
 * A static server for the built assets. It sends the headers the host sends, so a
 * page that breaks the site's own content security policy fails here and not
 * after it is deployed.
 */
const serve = async () => {
  const server = createServer((req, res) => {
    let file = normalize(
      join(root, decodeURIComponent(new URL(req.url, "http://x").pathname)),
    );
    if (file !== root && !file.startsWith(`${root}/`))
      return res.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory())
      file = join(file, "index.html");
    if (!existsSync(file)) return res.writeHead(404).end("not found");
    res
      .writeHead(200, {
        ...SITE_HEADERS,
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
      })
      .end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return server;
};

/** A console message that says the content security policy refused something. */
export const refusal = (m) =>
  m.type() === "error" && /Content Security Policy/i.test(m.text());

/**
 * Starts the server and the browser when a test first asks for a context, and
 * stops them when the file ends. What it returns:
 *
 *   site.ready()          starts them, if they have not started, and waits
 *   site.origin           where the server listens, once started
 *   site.url(path)        the address of a page on it
 *   site.context(opts)    a new browser context, watched as described above
 *
 * Call useBrowser() at the top level of a test file: the stop is a cleanup of
 * the file. When the file ends, it fails if any page had a script error or a
 * refusal, and names the page.
 */
export function useBrowser() {
  let server;
  let browser;
  let started;
  const contexts = new Set();
  const trouble = [];
  const start = async () => {
    server = await serve();
    site.origin = `http://127.0.0.1:${server.address().port}`;
    // Chromium on Linux takes font hinting from the system's settings, and
    // hinted text runs a few pixels wider, so a line that just fits on one
    // machine did not on another. No hinting is what phones and Macs draw, and
    // it is the same here and in continuous integration.
    browser = await chromium.launch({ args: ["--font-render-hinting=none"] });
  };
  const site = {
    origin: "",
    url: (path) => `${site.origin}${path}`,
    ready: () => (started ??= start()),
    async context(options = {}) {
      await site.ready();
      const ctx = await browser.newContext(options);
      // ubq counts each line a test runs, with a counter it writes into the
      // test's own code, so a function handed to page.evaluate() carries it
      // into the page. A counter that counts nothing lets it run there, as
      // ubq's own browser() does.
      await ctx.addInitScript(
        "globalThis.__ubqc = new Proxy({}, { get: () => 0, set: () => true })",
      );
      if (options.javaScriptEnabled === false) scriptless.add(ctx);
      contexts.add(ctx);
      ctx.on("close", () => contexts.delete(ctx));
      ctx.on("page", (page) => {
        const where = () => page.url().replace(site.origin, "");
        page.on("pageerror", (e) => trouble.push(`${where()}: ${e}`));
        page.on("console", (m) => {
          if (refusal(m)) trouble.push(`${where()}: ${m.text().slice(0, 160)}`);
        });
      });
      return ctx;
    },
  };
  cleanup(async () => {
    await started?.catch(() => {});
    for (const ctx of contexts) await ctx.close();
    await browser?.close();
    await new Promise((r) => (server ? server.close(r) : r()));
    const pages = [...new Set(trouble)];
    if (pages.length)
      throw new Error(
        `a page threw a script error, or its content security policy refused something:\n${pages.join("\n")}`,
      );
  });
  return site;
}

/** Contexts that run no script, where no frame callback ever fires. */
const scriptless = new WeakSet();

/** Waits for the next frame to be drawn, and the one after it. */
export const frames = (page) =>
  page.evaluate(
    () =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );

/**
 * Goes to a page and waits until it is ready to be measured: loaded, its
 * fonts in, and a frame drawn after its scripts have run. That is enough to
 * measure what is drawn. It is not enough to see everything a script asks for
 * after the load event: csp.test.mjs waits for network idle for that.
 */
export async function open(page, url) {
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  if (!scriptless.has(page.context())) await frames(page);
}
