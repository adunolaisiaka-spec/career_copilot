import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/tests/integration/helpers/db";
import type { AdzunaJobResult } from "@/lib/jobs/adzuna";

// syncExternalJobs() hits the real Adzuna API via searchAdzunaJobs(). Mocked
// here (rather than making live network calls) so this suite has no network
// dependency and runs in CI, which has no ADZUNA_APP_ID/ADZUNA_APP_KEY
// configured. The live end-to-end path (real Adzuna API + real credentials,
// upsert idempotency across repeat runs) was verified manually during
// development.
const searchMock = vi.fn<(query: string) => Promise<AdzunaJobResult[]>>();
vi.mock("@/lib/jobs/adzuna", () => ({
  searchAdzunaJobs: (query: string) => searchMock(query),
}));

const { syncExternalJobs } = await import("@/server/services/job-sync.service");

const TEST_ID_PREFIX = "test-adzuna-";

afterEach(async () => {
  await prisma.job.deleteMany({ where: { source: "EXTERNAL", externalId: { startsWith: TEST_ID_PREFIX } } });
  searchMock.mockReset();
});

function testJobs() {
  return prisma.job.findMany({ where: { source: "EXTERNAL", externalId: { startsWith: TEST_ID_PREFIX } } });
}

function fakeResult(query: string, overrides: Partial<AdzunaJobResult> = {}): AdzunaJobResult {
  return {
    id: `${TEST_ID_PREFIX}${query.replace(/\s/g, "-")}`,
    title: "Test Software Engineer",
    company: { display_name: "Acme Test Co" },
    location: { display_name: "Remote" },
    description: "A test job.",
    salary_min: 100000,
    salary_max: 150000,
    category: { label: "IT Jobs" },
    created: new Date().toISOString(),
    redirect_url: "https://example.test/job/1",
    ...overrides,
  };
}

describe("syncExternalJobs (real DB, mock Adzuna client)", () => {
  it("upserts a result from every query into Job rows with source EXTERNAL", async () => {
    searchMock.mockImplementation((query) => Promise.resolve([fakeResult(query)]));

    const result = await syncExternalJobs();

    expect(result.failed).toBe(0);
    expect(result.synced).toBeGreaterThan(0);
    const rows = await testJobs();
    expect(rows.length).toBe(result.synced);
    expect(rows.every((r) => r.source === "EXTERNAL")).toBe(true);
  });

  it("re-running syncs into the same rows rather than creating duplicates", async () => {
    searchMock.mockImplementation((query) => Promise.resolve([fakeResult(query, { title: "First title" })]));
    await syncExternalJobs();
    const first = await testJobs();

    searchMock.mockImplementation((query) => Promise.resolve([fakeResult(query, { title: "Updated title" })]));
    await syncExternalJobs();
    const second = await testJobs();

    expect(second.length).toBe(first.length);
    expect(second.map((j) => j.id).sort()).toEqual(first.map((j) => j.id).sort());
    expect(second.every((j) => j.title === "Updated title")).toBe(true);
  });

  it("continues syncing remaining queries when one query's search fails", async () => {
    let call = 0;
    searchMock.mockImplementation((query) => {
      call++;
      if (call === 1) return Promise.reject(new Error("Adzuna down"));
      return Promise.resolve([fakeResult(query)]);
    });

    const result = await syncExternalJobs();

    expect(result.failed).toBe(1);
    expect(result.synced).toBeGreaterThan(0);
  });

  it("maps missing optional fields to null rather than throwing", async () => {
    searchMock.mockImplementation((query) =>
      Promise.resolve([
        fakeResult(query, { location: undefined, salary_min: undefined, salary_max: undefined, category: undefined }),
      ]),
    );

    await syncExternalJobs();

    const rows = await testJobs();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.location).toBeNull();
      expect(row.salaryMin).toBeNull();
      expect(row.salaryMax).toBeNull();
      expect(row.industry).toBeNull();
    }
  });
});
