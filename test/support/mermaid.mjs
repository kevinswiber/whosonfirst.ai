/**
 * A reader of Mermaid, to ask whether what the site writes is Mermaid.
 *
 * It is mmdflux, built for WebAssembly, and not Mermaid itself, which needs a
 * browser to say anything. The package is laid out for a bundler, which loads a
 * `.wasm` file as a module; Node does that only behind a flag in some of the
 * versions the site allows, so the two halves are put together here by hand.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const dir = dirname(createRequire(import.meta.url).resolve("@mmds/wasm"));
const glue = await import(join(dir, "mmdflux_wasm_bg.js"));
const { instance } = await WebAssembly.instantiate(
  readFileSync(join(dir, "mmdflux_wasm_bg.wasm")),
  { "./mmdflux_wasm_bg.js": glue },
);
glue.__wbg_set_wasm(instance.exports);
instance.exports.__wbindgen_start();

/** The kind of diagram the text opens as, such as "sequence", or undefined. */
export const kind = (source) => glue.detect(source);

/**
 * What is wrong with the text as Mermaid, one line each; none when it parses.
 * A line the parser skipped counts: it passes over what it does not know.
 */
export const faults = (source) => {
  const { valid, diagnostics = [] } = JSON.parse(glue.validate(source));
  const said = diagnostics.map((d) => `line ${d.line}: ${d.message}`);
  return valid || said.length ? said : ["not valid, and no reason given"];
};
