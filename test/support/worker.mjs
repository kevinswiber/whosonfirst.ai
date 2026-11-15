/**
 * The built site, served as it is deployed: by the Workers runtime, with the
 * Worker in front of the pages. What the tests in test/worker/ start from.
 *
 * `wrangler dev` is sent to the same configuration `wrangler deploy` is,
 * `dist/client/wrangler.json`, so it bundles src/worker.ts and puts it in
 * front of the same addresses. It runs on this machine and needs no account.
 * Each test file that calls this gets a server of its own, on ports that
 * were free when it asked.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const repository = fileURLToPath(new URL("../../", import.meta.url));

/** A port nothing is listening on. */
const freePort = () =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });

/**
 * Starts the site in the Workers runtime and waits until it answers. Gives
 * its origin and a function that stops it.
 */
export async function startWorker() {
  const port = await freePort();
  const inspector = await freePort();
  const child = spawn(
    process.execPath,
    [
      join(repository, "node_modules/wrangler/bin/wrangler.js"),
      "dev",
      "--ip=127.0.0.1",
      `--port=${port}`,
      `--inspector-port=${inspector}`,
      "--show-interactive-dev-session=false",
    ],
    {
      cwd: repository,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false", CI: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      // a group of its own, so that the runtime it starts stops with it
      detached: true,
    },
  );
  let said = "";
  child.stdout.on("data", (text) => {
    said += text;
  });
  child.stderr.on("data", (text) => {
    said += text;
  });
  let ended = false;
  const exit = new Promise((resolve) => {
    child.once("exit", () => {
      ended = true;
      resolve();
    });
  });
  const stop = async () => {
    if (ended) return;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
    const late = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        // it had already gone
      }
    }, 5000);
    await exit;
    clearTimeout(late);
  };

  const origin = `http://127.0.0.1:${port}`;
  const until = Date.now() + 90_000;
  for (;;) {
    if (ended)
      throw new Error(`wrangler dev stopped before it answered:\n${said}`);
    try {
      const answer = await fetch(`${origin}/`, { redirect: "manual" });
      await answer.arrayBuffer();
      break;
    } catch {
      // not listening yet
    }
    if (Date.now() > until) {
      await stop();
      throw new Error(`wrangler dev did not answer in 90 seconds:\n${said}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return { origin, stop };
}
