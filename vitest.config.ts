import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
    setupFiles: ["dotenv/config"],
  },
});
