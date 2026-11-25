import type {
  GraphicAsset,
  GraphicCategory,
  GraphicFilterParams,
  GraphicPageResponse,
} from "../types/graphics";

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/graphics`
  : "http://localhost:8080/api/graphics";

/**
 * Fetch all available graphic categories with item counts and preview icons.
 * @param type optional filter for "all", "animated", or "static"
 */
export async function getGraphicCategories(
  type?: "all" | "animated" | "static"
): Promise<GraphicCategory[]> {
  const url = type && type !== "all"
    ? `${BASE_URL}/categories?type=${encodeURIComponent(type)}`
    : `${BASE_URL}/categories`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch graphic categories (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Fetch top recommended graphics for the top horizontal carousel rail.
 * @param limit maximum items to return (defaults to 20)
 * @param type optional filter for "all", "animated", or "static"
 */
export async function getRecommendedGraphics(
  limit = 20,
  type?: "all" | "animated" | "static"
): Promise<GraphicAsset[]> {
  const params = new URLSearchParams();
  params.set("limit", String(Math.max(1, limit)));
  if (type && type !== "all") {
    params.set("type", type);
  }

  const response = await fetch(`${BASE_URL}/recommended?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recommended graphics (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Query and filter graphics with backend pagination.
 * Supports search, categoryId, type (all | static | animated), recommended flag, page and size.
 */
export async function getGraphics(
  params: GraphicFilterParams = {}
): Promise<GraphicPageResponse> {
  const result = await fetchGraphicsPage(params);

  // Merged sections pass several category ids ("a,b,c"). Older backend builds don't
  // understand that and return nothing, so fall back to merging per category here.
  const ids = (params.categoryId ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length > 1 && result.totalElements === 0) {
    return mergeCategoryPages(params, ids);
  }
  return result;
}

async function mergeCategoryPages(
  params: GraphicFilterParams,
  ids: string[]
): Promise<GraphicPageResponse> {
  const pages = await Promise.all(
    ids.map((id) =>
      fetchGraphicsPage({ ...params, categoryId: id, page: 0, size: 100 }).catch(
        () => null
      )
    )
  );
  const lists = pages.map((p) => p?.content ?? []);
  const mixed: GraphicAsset[] = [];
  for (let i = 0; mixed.length < lists.reduce((n, l) => n + l.length, 0); i++) {
    for (const list of lists) if (i < list.length) mixed.push(list[i]);
  }

  const size = typeof params.size === "number" && params.size > 0 ? params.size : 20;
  const page = typeof params.page === "number" && params.page >= 0 ? params.page : 0;
  const totalPages = Math.max(1, Math.ceil(mixed.length / size));
  const content = mixed.slice(page * size, page * size + size);
  return {
    content,
    pageable: { pageNumber: page, pageSize: size },
    totalElements: mixed.length,
    totalPages,
    last: page >= totalPages - 1,
    size,
    number: page,
    numberOfElements: content.length,
    first: page === 0,
    empty: content.length === 0,
  };
}

async function fetchGraphicsPage(
  params: GraphicFilterParams = {}
): Promise<GraphicPageResponse> {
  const queryParams = new URLSearchParams();

  if (params.categoryId && params.categoryId !== "all") {
    queryParams.set("categoryId", params.categoryId.trim());
  }

  if (params.search && params.search.trim().length > 0) {
    queryParams.set("search", params.search.trim());
  }

  if (params.type && params.type !== "all") {
    queryParams.set("type", params.type.trim());
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
    throw new Error(`Failed to fetch graphics (HTTP ${response.status})`);
  }

  return response.json();
}

/**
 * Fetch a single graphic asset by numeric ID or string assetKey.
 * @param identifier numeric database ID or string assetKey
 */
export async function getGraphicByIdOrKey(
  identifier: string | number
): Promise<GraphicAsset> {
  if (!identifier) {
    throw new Error("Graphic identifier is required.");
  }

  const encoded = encodeURIComponent(String(identifier).trim());
  const response = await fetch(`${BASE_URL}/${encoded}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Graphic not found: ${identifier}`);
    }
    throw new Error(`Failed to fetch graphic ${identifier} (HTTP ${response.status})`);
  }

  return response.json();
}
