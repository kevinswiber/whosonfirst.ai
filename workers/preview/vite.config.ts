import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import { BUILT_ASSETS } from "../../scripts/built-site.mjs";

export default defineConfig({
  publicDir: BUILT_ASSETS,
  plugins: [cloudflare()],
});
