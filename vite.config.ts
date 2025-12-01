import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: "./client",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(fileURLToPath(new URL('.', import.meta.url)), "./client/src"),
      "@shared": path.resolve(fileURLToPath(new URL('.', import.meta.url)), "./shared"),
    },
  },
  server: {
    middlewareMode: true,
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
    minify: "terser",
  },
});
