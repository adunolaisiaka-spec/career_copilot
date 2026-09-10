import { test as base, type Page } from "@playwright/test";
import { createOnboardedUser, cleanupE2eUser, type E2eUser } from "./setup-user";

export const test = base.extend<{ onboardedUser: E2eUser; loggedInPage: Page }>({
  onboardedUser: async ({}, use, testInfo) => {
    const user = await createOnboardedUser(testInfo.title.replace(/\W+/g, "-").slice(0, 20));
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture API, not a React hook; `use` here is Playwright's fixture-injection callback.
    await use(user);
    await cleanupE2eUser(user.id);
  },

  loggedInPage: async ({ page, onboardedUser }, use) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(onboardedUser.email);
    await page.getByLabel("Password").fill(onboardedUser.password);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL("/dashboard");
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture API, not a React hook; `use` here is Playwright's fixture-injection callback.
    await use(page);
  },
});

export { expect } from "@playwright/test";
