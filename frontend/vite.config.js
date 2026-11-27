import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Para onde o dev server repassa /api (o FastAPI de `make run` por padrao).
const API_PROXY_TARGET =
  process.env.API_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: [
      "tests/unit/**/*.test.{js,jsx}",
      "tests/integration/**/*.test.{js,jsx}",
    ],
  },
});
