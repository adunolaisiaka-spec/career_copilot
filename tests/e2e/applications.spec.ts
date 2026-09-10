import { test, expect } from "./helpers/fixtures";

test.describe("application tracker", () => {
  test("adding an application shows it in the Kanban board, and editing its status moves it", async ({
    loggedInPage: page,
  }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: "Add application" }).click();

    await page.getByLabel("Company").fill("Nimbus Cloud");
    await page.getByLabel("Job title").fill("Playwright Engineer");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Nimbus Cloud")).toBeVisible();
    await expect(page.getByText("Playwright Engineer")).toBeVisible();

    // Open it again and change status.
    await page.getByText("Playwright Engineer").click();
    await page.getByLabel("Status").click();
    await page.getByRole("option", { name: "Applied" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator('[data-slot="dialog-overlay"]')).toBeHidden();

    // Re-open the card to confirm the status change persisted.
    await page.getByText("Playwright Engineer").click();
    await expect(page.getByLabel("Status")).toContainText("Applied");
  });

  test("deleting an application removes it from the board", async ({ loggedInPage: page }) => {
    await page.goto("/applications");
    await page.getByRole("button", { name: "Add application" }).click();
    await page.getByLabel("Company").fill("Harborlight");
    await page.getByLabel("Job title").fill("Temp Role");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByText("Harborlight")).toBeVisible();

    await page.getByText("Temp Role").click();
    await page.getByRole("button", { name: "Delete" }).click();

    await expect(page.getByText("Harborlight")).not.toBeVisible();
  });
});
