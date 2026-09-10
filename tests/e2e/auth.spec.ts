import { test, expect } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "./helpers/setup-user";

test.describe("registration and login", () => {
  let createdUserId: string | null = null;

  test.afterEach(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
      createdUserId = null;
    }
  });

  test("a new user can register, then log in, and lands on onboarding", async ({ page }) => {
    const email = `e2e-register-${Date.now()}@example.test`;

    await page.goto("/register");
    await page.getByLabel("Full name").fill("Playwright Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Create account" }).click();

    // POST /api/auth/register may be a cold first-compile on this slow-filesystem
    // dev server, well past the default assertion timeout.
    await expect(page.getByText("Check your email")).toBeVisible({ timeout: 90_000 });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).not.toBeNull();
    createdUserId = user!.id;

    // Registered users start unverified but can still log in (verification
    // isn't a login gate in this app — only account status is).
    await page.waitForURL("/login");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Password123!");
    await page.getByRole("button", { name: "Log in" }).click();

    // Fresh users have no completed profile, so the dashboard gate redirects here.
    await page.waitForURL("/onboarding");
    await expect(page.getByText(/Step 1 of 4/)).toBeVisible();
  });

  test("rejects an incorrect password", async ({ page }) => {
    const user = await prisma.user.create({
      data: {
        email: `e2e-badpass-${Date.now()}@example.test`,
        passwordHash: await bcrypt.hash("Password123!", 10),
      },
    });
    createdUserId = user.id;

    await page.goto("/login");
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password").fill("WrongPassword!");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Invalid email or password.")).toBeVisible();
  });
});
