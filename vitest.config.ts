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
    // Each test file gets its own PrismaClient (and therefore its own connection
    // pool) in a separate worker. Running files in parallel multiplies that across
    // workers and was exhausting the free-tier test branch's connection limit
    // ("Can't reach database server") once enough integration suites existed.
    // Sequential files still allow concurrency *within* one file's own tests.
    fileParallelism: false,
  },
});
