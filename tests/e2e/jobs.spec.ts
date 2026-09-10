import { test, expect } from "./helpers/fixtures";
import { prisma } from "./helpers/setup-user";

// The test branch starts empty — seed a couple of jobs these specs can search/save.
// Titles include a unique run tag so parallel/leftover runs can never collide.
let jobIds: string[] = [];
let remoteTitle: string;
let onsiteTitle: string;

test.beforeEach(async () => {
  const tag = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  remoteTitle = `E2E Remote Engineer ${tag}`;
  onsiteTitle = `E2E Onsite Engineer ${tag}`;

  const remote = await prisma.job.create({
    data: {
      source: "MANUAL",
      externalId: `${tag}-remote`,
      title: remoteTitle,
      company: "PlaywrightCo",
      location: "Remote",
      remoteType: "REMOTE",
      description: "A remote job seeded for E2E testing.",
    },
  });
  const onsite = await prisma.job.create({
    data: {
      source: "MANUAL",
      externalId: `${tag}-onsite`,
      title: onsiteTitle,
      company: "PlaywrightCo",
      location: "San Francisco",
      remoteType: "ONSITE",
      description: "An onsite job seeded for E2E testing.",
    },
  });
  jobIds = [remote.id, onsite.id];
});

test.afterEach(async () => {
  await prisma.job.deleteMany({ where: { id: { in: jobIds } } });
  jobIds = [];
});

test.describe("job search", () => {
  test("saving a job persists across a reload", async ({ loggedInPage: page }) => {
    await page.goto(`/jobs?q=${encodeURIComponent(remoteTitle)}`);
    await expect(page.getByText(remoteTitle)).toBeVisible();

    const card = page.locator('[data-slot="card"]', { hasText: remoteTitle });
    const [saveResponse] = await Promise.all([
      page.waitForResponse((res) => res.url().includes("/save") && res.request().method() === "POST"),
      card.getByRole("button", { name: "Save" }).click(),
    ]);
    expect(saveResponse.ok()).toBe(true);
    await expect(card.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.reload();
    const cardAfterReload = page.locator('[data-slot="card"]', { hasText: remoteTitle });
    await expect(cardAfterReload.getByRole("button", { name: "Saved" })).toBeVisible();
  });

  test("filtering by remote arrangement narrows results", async ({ loggedInPage: page }) => {
    const tag = remoteTitle.split(" ").pop()!;
    await page.goto(`/jobs?q=${encodeURIComponent(tag)}`);
    await expect(page.getByText(remoteTitle)).toBeVisible();
    await expect(page.getByText(onsiteTitle)).toBeVisible();

    await page.locator('select[name="remoteType"]').selectOption("ONSITE");
    await page.getByRole("button", { name: "Search" }).click();
    await page.waitForURL(/remoteType=ONSITE/);
    await page.waitForLoadState("load");

    await expect(page.getByText(onsiteTitle)).toBeVisible();
    await expect(page.getByText(remoteTitle)).not.toBeVisible();
  });
});
