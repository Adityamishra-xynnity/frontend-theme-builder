import type {
  EmojiAsset,
  EmojiCategory,
  EmojiFilterParams,
  EmojiPageResponse,
} from "../types/emoji";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/emojis`
  : "http://localhost:8080/api/emojis";

/**
 * Fetch all 14 canonical emoji categories with counts, icons, and preview SVGs.
 */
export async function getEmojiCategories(): Promise<EmojiCategory[]> {
  const response = await fetch(`${BASE_URL}/categories`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch emoji categories (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Fetch top recommended emojis for the Canva-style horizontal rail.
 * @param limit maximum items to return (default: 20)
 */
export async function getRecommendedEmojis(limit = 20): Promise<EmojiAsset[]> {
  const params = new URLSearchParams();
  params.set("limit", String(Math.max(1, limit)));

  const response = await fetch(`${BASE_URL}/recommended?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recommended emojis (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Query and filter emojis with backend pagination and full database search.
 * Strictly queries the Spring Boot backend and PostgreSQL database.
 */
export async function getEmojis(
  params: EmojiFilterParams = {}
): Promise<EmojiPageResponse> {
  const queryParams = new URLSearchParams();

  if (params.category && params.category !== "all") {
    queryParams.set("category", params.category.trim());
  }

  if (params.search && params.search.trim().length > 0) {
    queryParams.set("search", params.search.trim());
  }

  if (params.recommended !== undefined) {
    queryParams.set("recommended", String(params.recommended));
  }

  const page = typeof params.page === "number" && params.page >= 0 ? params.page : 0;
  const size = typeof params.size === "number" && params.size > 0 ? params.size : 20;

  queryParams.set("page", String(page));
  queryParams.set("size", String(size));

  const url = `${BASE_URL}?${queryParams.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch emojis (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Fetch a single emoji asset by ID or asset key.
 */
export async function getEmojiById(
  identifier: string | number
): Promise<EmojiAsset> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(identifier)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch emoji with identifier "${identifier}" (HTTP ${response.status})`
    );
  }

  return response.json();
}
