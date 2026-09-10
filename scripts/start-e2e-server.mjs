import { spawn } from "child_process";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

try {
  process.loadEnvFile(path.join(root, ".env"));
} catch {
  // ignore — env may already be set by the shell
}

if (!process.env.TEST_DATABASE_URL) {
  console.error(
    "TEST_DATABASE_URL is not set — refusing to start the E2E server against an unknown database.",
  );
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: process.env.TEST_DATABASE_URL,
  NEXTAUTH_URL: "http://localhost:3100",
  PORT: "3100",
};

const child = spawn("npx", ["next", "dev", "-p", "3100"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => child.kill("SIGTERM"));
process.on("SIGINT", () => child.kill("SIGINT"));
