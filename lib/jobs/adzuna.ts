export interface AdzunaJobResult {
  id: string;
  title: string;
  company: { display_name: string };
  location?: { display_name?: string };
  description: string;
  salary_min?: number;
  salary_max?: number;
  category?: { label?: string };
  created: string;
  redirect_url: string;
}

interface AdzunaSearchResponse {
  results: AdzunaJobResult[];
}

/**
 * Searches Adzuna's live job listings API. Requires ADZUNA_APP_ID/
 * ADZUNA_APP_KEY (free tier, https://developer.adzuna.com). Adzuna doesn't
 * structurally classify remote/hybrid/onsite or seniority the way this
 * app's own fields do, so those are left null on the resulting Job rows
 * rather than guessed — the existing full-text search already covers
 * "remote" appearing in a title/description.
 */
export async function searchAdzunaJobs(query: string, page = 1): Promise<AdzunaJobResult[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    throw new Error("ADZUNA_APP_ID/ADZUNA_APP_KEY are not set — job sync is not configured.");
  }
  const country = process.env.ADZUNA_COUNTRY || "us";

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("what", query);
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Adzuna search failed for "${query}": ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as AdzunaSearchResponse;
  return body.results;
}
