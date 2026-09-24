// Builds the whole app as one self-contained HTML page (local engine, no server).
// Usage: node artifact/build.mjs  ->  dist/talk.html
import { build } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const shim = (f) => resolve(root, "artifact/shims", f);
const MAP = {
  react: shim("react.ts"),
  "react-dom/client": shim("react-dom-client.ts"),
  "react/jsx-runtime": shim("jsx-runtime.ts"),
  "next/navigation": shim("next-navigation.ts"),
  "next/link": shim("next-link.tsx"),
};

const swap = {
  name: "swap",
  setup(b) {
    b.onResolve({ filter: /^(react|react-dom\/client|react\/jsx-runtime|next\/navigation|next\/link)$/ }, (a) => ({ path: MAP[a.path] }));
    b.onResolve({ filter: /(^@\/lib\/api$|^\.\/api$)/ }, () => ({ path: resolve(root, "artifact/api-local.ts") }));
  },
};

const out = await build({
  entryPoints: [resolve(root, "artifact/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  plugins: [swap],
  tsconfig: resolve(root, "tsconfig.json"),
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});

const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = readFileSync(resolve(root, "app/globals.css"), "utf8");
const html = `<title>Talk</title>
<meta name="theme-color" content="#0d0b10">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap">
<style>
:root { --font-inter: "Inter"; --font-serif-display: "Instrument Serif"; background: #0d0b10; }
${css}
.chat { height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)); }
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js}</script>
`;
mkdirSync(resolve(root, "dist"), { recursive: true });
writeFileSync(resolve(root, "dist/talk.html"), html);
console.log(`dist/talk.html  ${(html.length / 1024).toFixed(0)} KB`);
