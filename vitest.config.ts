import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Integration tests hit a real Neon branch, which can cold-start (compute
    // scale-from-zero) on the first query after idling — well above the 5s default.
    testTimeout: 30000,
  },
});
