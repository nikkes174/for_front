import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://127.0.0.1:8053",
      "/organizations": "http://127.0.0.1:8053",
      "/crm-api": {
        target: "http://127.0.0.1:8011",
        rewrite: (path) => path.replace(/^\/crm-api/, ""),
      },
      "/loyalty-api": {
        target: "http://127.0.0.1:8041",
        rewrite: (path) => path.replace(/^\/loyalty-api/, ""),
      },
    },
  },
});
