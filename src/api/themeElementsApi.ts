import type {
  ThemeElementAsset,
  ThemeElementCategory,
  ThemeElementKind,
  ThemeElementPageResponse,
  ThemeElementQueryParams,
} from "../types/themeElements";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/theme-elements`
  : "http://localhost:8080/api/theme-elements";

export async function getThemeElementCategories(
  kind: ThemeElementKind,
  signal?: AbortSignal
): Promise<ThemeElementCategory[]> {
  const response = await fetch(`${BASE_URL}/${kind}/categories`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${kind} categories (HTTP ${response.status})`);
  }

  return response.json();
}

export async function getThemeElementPage(
  kind: ThemeElementKind,
  params: ThemeElementQueryParams = {},
  signal?: AbortSignal
): Promise<ThemeElementPageResponse> {
  const query = new URLSearchParams();
  if (params.category && params.category !== "all") {
    query.set("category", params.category.trim());
  }
  if (params.search && params.search.trim().length > 0) {
    query.set("search", params.search.trim());
  }
  query.set("page", String(Math.max(0, params.page ?? 0)));
  query.set("size", String(Math.max(1, Math.min(100, params.size ?? 24))));

  const response = await fetch(`${BASE_URL}/${kind}/page?${query.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${kind} items (HTTP ${response.status})`);
  }

  return response.json();
}

export async function getThemeElementByIdOrKey(
  kind: ThemeElementKind,
  identifier: string | number,
  signal?: AbortSignal
): Promise<ThemeElementAsset> {
  const response = await fetch(
    `${BASE_URL}/${kind}/${encodeURIComponent(String(identifier))}`,
    {
      headers: { Accept: "application/json" },
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch ${kind} asset (HTTP ${response.status})`);
  }

  return response.json();
}
