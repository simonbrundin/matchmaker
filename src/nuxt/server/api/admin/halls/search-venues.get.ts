/**
 * GET /api/admin/halls/search-venues?system=court22&query=sundsvall
 *
 * Searches for venues in Court22 or Matchi and returns their IDs and names.
 * Court22: fetches the sitemap and filters by name.
 * Matchi: fetches their search page.
 *
 * Caches results for 5 minutes to avoid hammering external sites.
 */
import { H3Event } from "h3";

const cache = new Map<string, { data: VenueSearchResult[]; expires: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

interface VenueSearchResult {
  id: string;
  name: string;
  city?: string;
  url: string;
  system: "court22" | "matchi";
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event);
  const system = query.system as "court22" | "matchi" | undefined;
  const q = ((query.query as string) ?? "").trim();

  if (!system) {
    throw createError({
      statusCode: 400,
      message: "system query param required (court22|matchi)",
    });
  }

  const cacheKey = `${system}:${q}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return { results: cached.data, cached: true };
  }

  let results: VenueSearchResult[] = [];

  if (system === "court22") {
    results = await searchCourt22Venues(q);
  } else if (system === "matchi") {
    results = await searchMatchiVenues(q);
  }

  cache.set(cacheKey, { data: results, expires: Date.now() + CACHE_TTL_MS });
  return { results, cached: false };
});

// ─── Court22 ───────────────────────────────────────────────────────────────

async function searchCourt22Venues(
  query: string,
): Promise<VenueSearchResult[]> {
  try {
    const sitemap = await fetch("https://www.court22.com/sitemap.xml", {
      headers: { Accept: "application/xml", "User-Agent": "Mozilla/5.0" },
    }).then((r) => r.text());

    const venues: VenueSearchResult[] = [];
    const seen = new Set<string>();
    // Parse: <loc>https://www.court22.com/.../venues/{uuid}/{slug}</loc>
    const locMatches = sitemap.matchAll(
      /<loc>([^<]*venues\/([^/]+)\/([^<]+))<\/loc>/gi,
    );
    for (const m of locMatches) {
      const [, rawUrl, rawId, rawSlug] = m;
      const url = rawUrl ?? "";
      const id = rawId ?? "";
      const slug = rawSlug ?? "";
      if (!url || !id || !slug) continue;
      if (seen.has(id)) continue; // deduplicate across locales
      seen.add(id);
      const name = formatSlug(slug);
      if (!query || name.toLowerCase().includes(query.toLowerCase())) {
        venues.push({ id, name, url, system: "court22" });
      }
    }

    // Sort by relevance: exact match first, then starts-with, then contains
    if (query) {
      venues.sort((a, b) => {
        const al = a.name.toLowerCase();
        const bl = b.name.toLowerCase();
        const ql = query.toLowerCase();
        if (al === ql) return -1;
        if (bl === ql) return 1;
        if (al.startsWith(ql)) return -1;
        if (bl.startsWith(ql)) return 1;
        return al.localeCompare(bl);
      });
    }

    return venues.slice(0, 30);
  } catch (err) {
    console.error("[court22 search] failed:", err);
    return [];
  }
}

function formatSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Matchi ───────────────────────────────────────────────────────────────

// API: POST https://www.matchi.se/facilities/findFacilities
// Body (form-urlencoded): lat, lng, offset, q, municipality, sport, asJson=true
// Returns: { facilities: [...nearby...], restOfFacilities: [...all...] }
async function searchMatchiVenues(query: string): Promise<VenueSearchResult[]> {
  try {
    const formData = new URLSearchParams({
      lat: "62.39",
      lng: "17.30",
      offset: "0",
      q: query,
      municipality: "",
      sport: "",
      asJson: "true",
    }).toString();

    const res = await fetch("https://www.matchi.se/facilities/findFacilities", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://www.matchi.se",
        Referer: "https://www.matchi.se/facilities/index",
        "User-Agent": "Mozilla/5.0",
      },
      body: formData,
    });

    if (!res.ok) {
      console.error(`[matchi search] HTTP ${res.status}`);
      return [];
    }

    const body = (await res.json()) as {
      facilities?: any[];
      restOfFacilities?: any[];
    };
    const allFacilities = [
      ...(body.facilities ?? []),
      ...(body.restOfFacilities ?? []),
    ];
    const seen = new Set<string>();
    const venues: VenueSearchResult[] = [];

    for (const f of allFacilities) {
      if (!f.id || seen.has(String(f.id))) continue;
      seen.add(String(f.id));
      const name = (f.name ?? "").trim();
      if (!query || name.toLowerCase().includes(query.toLowerCase())) {
        venues.push({
          id: String(f.id),
          name,
          city: f.city ?? undefined,
          url: `https://www.matchi.se/facilities/${f.shortname ?? f.id}`,
          system: "matchi",
        });
      }
    }
    return venues.slice(0, 30);
  } catch (err) {
    console.error("[matchi search] failed:", err);
    return [];
  }
}
