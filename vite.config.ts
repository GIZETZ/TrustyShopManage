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
  server: {
    middlewareMode: true,
  },
  build: {
    root: path.resolve(__dirname, "."),
    outDir: "dist/client",
    emptyOutDir: true,
    minify: "terser",
  },
});
