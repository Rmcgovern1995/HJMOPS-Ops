// Simple ESBuild bundle/minify to dist/
import { build } from "https://unpkg.com/esbuild-wasm@0.19.2/esm/browser.js";

await build({
  entryPoints: ["index.html"],
  bundle: true,
  minify: true,
  outfile: "dist/index.html",
  loader: { ".html": "copy", ".css": "copy", ".js": "copy", ".png": "copy" }
});
