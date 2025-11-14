import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwind from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [vue(), tailwind()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist-ce",
    lib: {
      entry: path.resolve(__dirname, "src/ce/register.ts"),
      name: "WorkflowWidget",
      formats: ["iife"],
      fileName: () => "workflow-widget.js",
    },
    rollupOptions: {
      // 打包到一个文件，方便主应用直接 script 引入
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
