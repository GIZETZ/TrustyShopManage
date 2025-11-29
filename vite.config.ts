import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  root: ".",
  server: {
    middlewareMode: true,
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
    minify: "terser",
  },
});
