import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

// One build for the whole site. Every page listed here ends up in dist/ at the same path.
const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        team: page("./index.html"),
        bruno: page("./prototypes/bruno/index.html"),
        dashboard: page("./web-app-signal-club/index.html"),
      },
    },
  },
});
