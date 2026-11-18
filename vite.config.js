import { defineConfig } from "vite";
import { cpSync, existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// One build for the whole site. Every page ends up in dist/ at the same path.
const root = fileURLToPath(new URL(".", import.meta.url));
const page = (path) => fileURLToPath(new URL(path, import.meta.url));

// Each folder in prototypes/ is handled by how its index.html loads scripts:
// - <script type="module"> pages are bundled by Vite (shared data, npm packages).
// - plain HTML/JS pages (inline onclick handlers, classic scripts, CDN Tailwind) are copied as-is.
// Teammates can add either kind without touching this file.
const prototypes = readdirSync(page("./prototypes"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(page(`./prototypes/${d.name}/index.html`)))
  .map((d) => {
    const html = readFileSync(page(`./prototypes/${d.name}/index.html`), "utf8");
    return { name: d.name, bundled: /<script[^>]*type=["']module["']/i.test(html) };
  });

const input = {
  team: page("./index.html"),
  dashboard: page("./web-app-signal-club/index.html"),
  ...Object.fromEntries(prototypes.filter((p) => p.bundled).map((p) => [p.name, page(`./prototypes/${p.name}/index.html`)])),
};

function copyStaticPrototypes() {
  return {
    name: "copy-static-prototypes",
    apply: "build",
    closeBundle() {
      for (const p of prototypes.filter((x) => !x.bundled)) {
        cpSync(page(`./prototypes/${p.name}`), `${root}dist/prototypes/${p.name}`, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [copyStaticPrototypes()],
  build: { rollupOptions: { input } },
});
