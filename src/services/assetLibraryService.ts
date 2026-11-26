import { supabase } from "../lib/supabaseClient";
import type {
  GraphicAsset,
  GraphicCategory,
  GraphicFilterParams,
  GraphicPageResponse,
  GraphicAssetData,
} from "../types/graphics";
import type {
  EmojiAsset,
  EmojiCategory,
  EmojiFilterParams,
  EmojiPageResponse,
  EmojiAssetData,
} from "../types/emoji";
import type { CertificateTemplate, TemplatePage } from "../api/templateApi";

export interface AssetLibraryRecord {
  id: string; // UUID or number
  asset_key: string;
  name: string;
  type: string;
  category: string;
  subcategory?: string | null;
  sort_order: number;
  json_data: any;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetQueryOptions {
  category?: string;
  subcategory?: string;
  page?: number;
  size?: number;
  search?: string;
  orderBy?: string;
  ascending?: boolean;
}

const BACKEND_BASE =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

function hasSupabaseKey(): boolean {
  const key =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    "sb_publishable_jXBanX1E7GY2AqzmtR86kQ_o8Goaibs";
  return Boolean(
    key &&
      key.trim() &&
      !key.includes("dummy_anon_key") &&
      !key.includes("your-supabase")
  );
}

// ------------------------------------------------------------------
// In-Memory Cache (TTL: 5 minutes)
// ------------------------------------------------------------------
interface CacheEntry<T> {
  data: T;
  expiry: number;
}
const cache = new Map<string, CacheEntry<any>>();
const inFlight = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T, ttl = CACHE_TTL_MS): void {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

function dedupe<T>(key: string, fn: () => Promise<T>, cacheResult = true): Promise<T> {
  if (cacheResult) {
    const cached = getCached<T>(key);
    if (cached !== null) return Promise.resolve(cached);
  }
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn()
    .then((res) => {
      if (cacheResult) setCached(key, res);
      return res;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

// ------------------------------------------------------------------
// Mappers
// ------------------------------------------------------------------
export function toGraphicAsset(r: AssetLibraryRecord): GraphicAsset {
  const jd = (r.json_data || {}) as GraphicAssetData;
  const inferredType =
    jd.type || (r.type === "ANIMATED_DESIGN" ? "animated" : "static");
  return {
    id: r.id as any,
    assetKey: r.asset_key,
    name: r.name,
    assetType: "GRAPHIC",
    category: r.category,
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active,
    assetData: {
      ...jd,
      type: inferredType,
    },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function graphicDbTypes(type?: "all" | "animated" | "static"): string[] {
  if (type === "animated") return ["ANIMATED_DESIGN"];
  if (type === "static") return ["GRAPHIC"];
  return ["GRAPHIC", "ANIMATED_DESIGN"];
}

export function toEmojiAsset(r: AssetLibraryRecord): EmojiAsset {
  return {
    id: r.id as any,
    assetKey: r.asset_key,
    name: r.name,
    assetType: "EMOJI",
    category: r.category,
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active,
    assetData: (r.json_data || {}) as EmojiAssetData,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toCertificateTemplate(r: AssetLibraryRecord): CertificateTemplate {
  const data = r.json_data || {};
  return {
    id: r.id as any,
    templateKey: r.asset_key,
    name: r.name || data.title || r.asset_key,
    description: data.description || "",
    backgroundColor: data.backgroundColor || "#ffffff",
    category: r.category || "Achievement",
    elementsData: data.elementsData || [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ------------------------------------------------------------------
// Main Supabase Asset Library Service with Resilient Backend Fallback
// ------------------------------------------------------------------
export const assetLibraryService = {
  /**
   * Generic fetch by type with pagination, category filter, and search.
   * Tries direct Supabase PostgreSQL first; falls back seamlessly to backend.
   */
  async getAssetsByType(
    type: string,
    options: AssetQueryOptions = {}
  ): Promise<{ data: AssetLibraryRecord[]; total: number }> {
    const {
      category,
      subcategory,
      page = 0,
      size = 50,
      search,
      orderBy = "sort_order",
      ascending = true,
    } = options;

    const cacheKey = `assets_${type}_${category || "all"}_${subcategory || "all"}_${page}_${size}_${search || ""}`;
    return dedupe(
      cacheKey,
      async () => {
        // Mode 1: Direct Supabase query
        if (hasSupabaseKey()) {
          try {
            let query = supabase
              .from("asset_library")
              .select("*", { count: "exact" })
              .eq("type", type.toUpperCase())
              .eq("is_active", true)
              .eq("is_deleted", false);

            if (category && category !== "All" && category !== "all") {
              query = query.eq("category", category);
            }

            if (subcategory && subcategory !== "All" && subcategory !== "all") {
              query = query.eq("subcategory", subcategory);
            }

            if (search && search.trim()) {
              const sanitized = search.trim();
              query = query.or(
                `name.ilike.%${sanitized}%,category.ilike.%${sanitized}%,asset_key.ilike.%${sanitized}%`
              );
            }

            const from = page * size;
            const to = from + size - 1;

            query = query.order(orderBy, { ascending }).range(from, to);

            const { data, count, error } = await query;
            if (!error && data) {
              return {
                data: (data as AssetLibraryRecord[]) || [],
                total: count || 0,
              };
            }
          } catch (err) {
            console.warn(`[AssetLibrary] Supabase query for ${type} failed, falling back to backend:`, err);
          }
        }

        // Mode 2: Resilient backend fallback (connected to same Supabase PostgreSQL)
        try {
          const params = new URLSearchParams({
            page: String(page),
            size: String(size),
          });
          if (category && category !== "All" && category !== "all") {
            params.set("category", category);
          }
          if (search && search.trim()) {
            params.set("search", search.trim());
          }

          let endpoint = `${BACKEND_BASE}/api/assets/${type}/page?${params}`;
          if (type.toUpperCase() === "SHAPE") {
            endpoint = `${BACKEND_BASE}/api/assets/shapes/page?${params}`;
          } else if (type.toUpperCase() === "TEXT") {
            endpoint = `${BACKEND_BASE}/api/assets/text/page?${params}`;
          }

          const response = await fetch(endpoint, {
            headers: { Accept: "application/json" },
          });
          if (response.ok) {
            const json = await response.json();
            const content = Array.isArray(json) ? json : json.content || [];
            const mapped: AssetLibraryRecord[] = content.map((item: any) => ({
              id: String(item.id || item.assetKey),
              asset_key: item.assetKey,
              name: item.name,
              type: item.assetType || type.toUpperCase(),
              category: item.category,
              subcategory: item.subcategory || null,
              sort_order: item.sortOrder || 0,
              json_data: item.assetData || {},
              is_active: item.isActive !== false,
              is_deleted: false,
              created_at: item.createdAt || new Date().toISOString(),
              updated_at: item.updatedAt || new Date().toISOString(),
            }));
            return {
              data: mapped,
              total: json.totalElements || mapped.length,
            };
          }
        } catch (backendErr) {
          console.error(`[AssetLibrary] Both Supabase and Backend queries failed for ${type}:`, backendErr);
        }

        return { data: [], total: 0 };
      },
      !search
    );
  },

  /**
   * Distinct categories for any asset type.
   */
  async getCategoriesByType(type: string): Promise<string[]> {
    const cacheKey = `categories_${type}`;
    const cached = getCached<string[]>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        const { data, error } = await supabase
          .from("asset_library")
          .select("category")
          .eq("type", type.toUpperCase())
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("category", { ascending: true });

        if (!error && data) {
          const unique = Array.from(
            new Set(data.map((row) => row.category).filter(Boolean))
          );
          setCached(cacheKey, unique);
          return unique;
        }
      } catch (err) {
        console.warn(`[AssetLibrary] Failed fetching Supabase categories for ${type}:`, err);
      }
    }

    // Fallback: fetch a sample batch from backend to get categories
    const batch = await this.getAssetsByType(type, { page: 0, size: 100 });
    const unique = Array.from(
      new Set(batch.data.map((r) => r.category).filter(Boolean))
    );
    setCached(cacheKey, unique);
    return unique;
  },

  // ================================================================
  // GRAPHICS (Dual Mode: Supabase Direct + Backend Fallback)
  // ================================================================

  /**
   * Single-call bootstrap for Graphics or Animated Designs browser:
   * Fetches all active rows for that type in ONE query and computes categories,
   * recommended rail, and per-category preview rails in memory.
   */
  async getGraphicsBootstrap(type: "animated" | "static"): Promise<{
    categories: GraphicCategory[];
    recommended: GraphicAsset[];
    railsByCategoryId: Record<string, GraphicAsset[]>;
  }> {
    const cacheKey = `graphics_bootstrap_${type}`;
    return dedupe(cacheKey, async () => {
      if (hasSupabaseKey()) {
        try {
          const { data, error } = await supabase
            .from("asset_library")
            .select("*")
            .in("type", graphicDbTypes(type))
            .eq("is_active", true)
            .eq("is_deleted", false)
            .order("sort_order", { ascending: true });

          if (!error && data) {
            const assets = (data as AssetLibraryRecord[]).map(toGraphicAsset);
            const categoryMap = new Map<
              string,
              {
                id: string;
                count: number;
                previewSvg: string | null;
                isAnimated: boolean;
                iconKey?: string;
              }
            >();
            const railsByCategoryId: Record<string, GraphicAsset[]> = {};

            for (const asset of assets) {
              const catName = asset.category || "Uncategorized";
              const catId = slugify(catName);
              const jd = asset.assetData || ({} as GraphicAssetData);
              const isAnim = type === "animated" || jd.type === "animated";

              if (!categoryMap.has(catName)) {
                categoryMap.set(catName, {
                  id: catId,
                  count: 1,
                  previewSvg: jd.svgContent || null,
                  isAnimated: isAnim,
                  iconKey: jd.categoryId || catId,
                });
              } else {
                const existing = categoryMap.get(catName)!;
                existing.count += 1;
                if (!existing.previewSvg && jd.svgContent) {
                  existing.previewSvg = jd.svgContent;
                }
              }

              if (!railsByCategoryId[catId]) {
                railsByCategoryId[catId] = [];
              }
              if (railsByCategoryId[catId].length < 10) {
                railsByCategoryId[catId].push(asset);
              }
            }

            const categories: GraphicCategory[] = Array.from(categoryMap.entries())
              .map(([name, details]) => ({
                id: details.id,
                name,
                count: details.count,
                previewSvg: details.previewSvg,
                isAnimated: details.isAnimated,
                iconKey: details.iconKey,
              }))
              .sort((a, b) => b.count - a.count);

            const recommended = assets
              .filter((g) => g.assetData?.isRecommended)
              .concat(assets.filter((g) => !g.assetData?.isRecommended))
              .slice(0, 20);

            return { categories, recommended, railsByCategoryId };
          }
        } catch (err) {
          console.warn(`[AssetLibrary] Supabase bootstrap failed for ${type}, falling back:`, err);
        }
      }

      const [categories, recommended] = await Promise.all([
        this.getGraphicCategories(type),
        this.getRecommendedGraphics(20, type),
      ]);
      return { categories, recommended, railsByCategoryId: {} };
    });
  },

  /**
   * Fetch all graphic categories with preview SVGs, counts, and animation flags.
   */
  async getGraphicCategories(
    type?: "all" | "animated" | "static"
  ): Promise<GraphicCategory[]> {
    const cacheKey = `graphic_categories_${type || "all"}`;
    const cached = getCached<GraphicCategory[]>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        const targetTypes = graphicDbTypes(type);
        let query = supabase
          .from("asset_library")
          .select("type, category, json_data, sort_order")
          .in("type", targetTypes)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("sort_order", { ascending: true });

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const categoryMap = new Map<
            string,
            { count: number; previewSvg: string | null; isAnimated: boolean; iconKey?: string }
          >();

          for (const item of data) {
            const cat = item.category || "Uncategorized";
            const jd = item.json_data || {};
            const isAnim = item.type === "ANIMATED_DESIGN" || jd.type === "animated";

            if (type === "animated" && !isAnim) continue;
            if (type === "static" && isAnim) continue;

            if (!categoryMap.has(cat)) {
              categoryMap.set(cat, {
                count: 1,
                previewSvg: jd.svgContent || null,
                isAnimated: isAnim,
                iconKey: jd.categoryId || slugify(cat),
              });
            } else {
              const existing = categoryMap.get(cat)!;
              existing.count += 1;
              if (!existing.previewSvg && jd.svgContent) {
                existing.previewSvg = jd.svgContent;
              }
            }
          }

          const categories: GraphicCategory[] = Array.from(categoryMap.entries()).map(
            ([name, details]) => ({
              id: slugify(name),
              name,
              count: details.count,
              previewSvg: details.previewSvg,
              isAnimated: details.isAnimated,
              iconKey: details.iconKey,
            })
          );

          categories.sort((a, b) => b.count - a.count);
          setCached(cacheKey, categories);
          return categories;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase graphic categories failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    try {
      const url =
        type && type !== "all"
          ? `${BACKEND_BASE}/api/graphics/categories?type=${encodeURIComponent(type)}`
          : `${BACKEND_BASE}/api/graphics/categories`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data: GraphicCategory[] = await res.json();
        setCached(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.error("[AssetLibrary] Failed to fetch graphic categories from backend:", e);
    }

    return [];
  },

  /**
   * Fetch recommended graphics for the top rail.
   */
  async getRecommendedGraphics(
    limit = 20,
    type?: "all" | "animated" | "static"
  ): Promise<GraphicAsset[]> {
    const cacheKey = `recommended_graphics_${limit}_${type || "all"}`;
    const cached = getCached<GraphicAsset[]>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        let query = supabase
          .from("asset_library")
          .select("*")
          .in("type", graphicDbTypes(type))
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("sort_order", { ascending: true })
          .limit(limit * 3);

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const filtered = (data as AssetLibraryRecord[]).map(toGraphicAsset);
          const recommended = filtered
            .filter((g) => g.assetData?.isRecommended)
            .concat(filtered.filter((g) => !g.assetData?.isRecommended))
            .slice(0, limit);

          setCached(cacheKey, recommended);
          return recommended;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase recommended graphics failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (type && type !== "all") params.set("type", type);
      const res = await fetch(`${BACKEND_BASE}/api/graphics/recommended?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data: GraphicAsset[] = await res.json();
        setCached(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.error("[AssetLibrary] Failed to fetch recommended graphics from backend:", e);
    }

    return [];
  },

  /**
   * Filter and paginate graphics.
   */
  async getGraphicsPage(
    params: GraphicFilterParams = {}
  ): Promise<GraphicPageResponse> {
    const { categoryId, search, type, recommended, page = 0, size = 20 } = params;
    const cacheKey = `graphics_page_${categoryId || "all"}_${type || "all"}_${recommended ?? "any"}_${page}_${size}_${search || ""}`;

    return dedupe(
      cacheKey,
      async () => {
        if (hasSupabaseKey()) {
          try {
            let query = supabase
              .from("asset_library")
              .select("*", { count: "exact" })
              .in("type", graphicDbTypes(type))
              .eq("is_active", true)
              .eq("is_deleted", false);

            if (categoryId && categoryId !== "all") {
              const ids = categoryId
                .split(",")
                .map((s) => s.trim().toLowerCase())
                .filter(Boolean);
              if (ids.length > 0) {
                const orClause = ids
                  .map((id) => {
                    const pattern = id.replace(/-/g, "%");
                    return `category.ilike.%${pattern}%,asset_key.ilike.%${id}%,json_data->>categoryId.eq.${id}`;
                  })
                  .join(",");
                query = query.or(orClause);
              }
            }

            if (recommended !== undefined) {
              query = query.eq("json_data->>isRecommended", String(recommended));
            }

            if (search && search.trim()) {
              const term = search.trim();
              query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,asset_key.ilike.%${term}%`);
            }

            const from = page * size;
            const to = from + size - 1;
            query = query.order("sort_order", { ascending: true }).range(from, to);

            const { data, count, error } = await query;
            if (!error && data) {
              const content = (data as AssetLibraryRecord[]).map(toGraphicAsset);

              const totalElements = count || content.length;
              const totalPages = Math.max(1, Math.ceil(totalElements / size));

              return {
                content,
                pageable: { pageNumber: page, pageSize: size },
                totalElements,
                totalPages,
                last: page >= totalPages - 1,
                size,
                number: page,
                numberOfElements: content.length,
                first: page === 0,
                empty: content.length === 0,
              };
            }
          } catch (e) {
            console.warn("[AssetLibrary] Supabase graphics query failed, falling back to backend:", e);
          }
        }

        // Backend fallback
        try {
          const q = new URLSearchParams({
            page: String(page),
            size: String(size),
          });
          if (categoryId && categoryId !== "all") q.set("categoryId", categoryId);
          if (search && search.trim()) q.set("search", search.trim());
          if (type && type !== "all") q.set("type", type);
          if (recommended !== undefined) q.set("recommended", String(recommended));

          const res = await fetch(`${BACKEND_BASE}/api/graphics?${q}`, {
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.error("[AssetLibrary] Failed to fetch graphics from backend:", e);
        }

        return {
          content: [],
          pageable: { pageNumber: page, pageSize: size },
          totalElements: 0,
          totalPages: 0,
          last: true,
          size,
          number: page,
          numberOfElements: 0,
          first: true,
          empty: true,
        };
      },
      !search
    );
  },

  /**
   * Fetch single graphic by ID or assetKey.
   */
  async getGraphicByIdOrKey(identifier: string | number): Promise<GraphicAsset> {
    const key = String(identifier).trim();
    const cacheKey = `graphic_single_${key}`;
    const cached = getCached<GraphicAsset>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        let query = supabase
          .from("asset_library")
          .select("*")
          .in("type", ["GRAPHIC", "ANIMATED_DESIGN"])
          .eq("is_active", true)
          .eq("is_deleted", false);

        const isNumericId = /^\d+$/.test(key);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
        if (isNumericId || isUuid) {
          query = query.eq("id", key);
        } else {
          query = query.eq("asset_key", key);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          const asset = toGraphicAsset(data as AssetLibraryRecord);
          setCached(cacheKey, asset);
          return asset;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase single graphic fetch failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    const res = await fetch(`${BACKEND_BASE}/api/graphics/${encodeURIComponent(key)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Graphic not found: ${identifier}`);
    const asset: GraphicAsset = await res.json();
    setCached(cacheKey, asset);
    return asset;
  },

  // ================================================================
  // EMOJIS (Dual Mode: Supabase Direct + Backend Fallback)
  // ================================================================

  /**
   * Single-call bootstrap for EmojiBrowser:
   * Fetches all active EMOJI rows in ONE query and computes categories,
   * recommended rail, and per-category preview rails in memory.
   */
  async getEmojisBootstrap(): Promise<{
    categories: EmojiCategory[];
    recommended: EmojiAsset[];
    railsByCategoryId: Record<string, EmojiAsset[]>;
  }> {
    return dedupe("emojis_bootstrap", async () => {
      if (hasSupabaseKey()) {
        try {
          const { data, error } = await supabase
            .from("asset_library")
            .select("*")
            .eq("type", "EMOJI")
            .eq("is_active", true)
            .eq("is_deleted", false)
            .order("sort_order", { ascending: true });

          if (!error && data) {
            const assets = (data as AssetLibraryRecord[]).map(toEmojiAsset);
            const categoryMap = new Map<
              string,
              { id: string; count: number; previewSvg: string | null }
            >();
            const railsByCategoryId: Record<string, EmojiAsset[]> = {};

            for (const asset of assets) {
              const catName = asset.category || "General";
              const catId = slugify(catName);
              const jd = asset.assetData || {};

              if (!categoryMap.has(catName)) {
                categoryMap.set(catName, {
                  id: catId,
                  count: 1,
                  previewSvg: jd.svgContent || null,
                });
              } else {
                const existing = categoryMap.get(catName)!;
                existing.count += 1;
                if (!existing.previewSvg && jd.svgContent) {
                  existing.previewSvg = jd.svgContent;
                }
              }

              if (!railsByCategoryId[catId]) {
                railsByCategoryId[catId] = [];
              }
              if (railsByCategoryId[catId].length < 10) {
                railsByCategoryId[catId].push(asset);
              }
            }

            const categories: EmojiCategory[] = Array.from(categoryMap.entries())
              .map(([name, details]) => ({
                id: details.id,
                name,
                count: details.count,
                previewSvg: details.previewSvg,
              }))
              .sort((a, b) => b.count - a.count);

            const recommended = assets
              .filter((e) => e.assetData?.isRecommended)
              .concat(assets.filter((e) => !e.assetData?.isRecommended))
              .slice(0, 20);

            return { categories, recommended, railsByCategoryId };
          }
        } catch (err) {
          console.warn("[AssetLibrary] Supabase emoji bootstrap failed, falling back:", err);
        }
      }

      const [categories, recommended] = await Promise.all([
        this.getEmojiCategories(),
        this.getRecommendedEmojis(20),
      ]);
      return { categories, recommended, railsByCategoryId: {} };
    });
  },

  async getEmojiCategories(): Promise<EmojiCategory[]> {
    const cacheKey = "emoji_categories";
    const cached = getCached<EmojiCategory[]>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        const { data, error } = await supabase
          .from("asset_library")
          .select("category, json_data, sort_order")
          .eq("type", "EMOJI")
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const categoryMap = new Map<string, { count: number; previewSvg: string | null }>();
          for (const item of data) {
            const cat = item.category || "General";
            const jd = item.json_data || {};
            if (!categoryMap.has(cat)) {
              categoryMap.set(cat, { count: 1, previewSvg: jd.svgContent || null });
            } else {
              const existing = categoryMap.get(cat)!;
              existing.count += 1;
              if (!existing.previewSvg && jd.svgContent) existing.previewSvg = jd.svgContent;
            }
          }
          const categories: EmojiCategory[] = Array.from(categoryMap.entries()).map(
            ([name, details]) => ({
              id: slugify(name),
              name,
              count: details.count,
              previewSvg: details.previewSvg,
            })
          );
          categories.sort((a, b) => b.count - a.count);
          setCached(cacheKey, categories);
          return categories;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase emoji categories failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    try {
      const res = await fetch(`${BACKEND_BASE}/api/emojis/categories`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data: EmojiCategory[] = await res.json();
        setCached(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.error("[AssetLibrary] Failed to fetch emoji categories from backend:", e);
    }
    return [];
  },

  async getRecommendedEmojis(limit = 20): Promise<EmojiAsset[]> {
    const cacheKey = `recommended_emojis_${limit}`;
    const cached = getCached<EmojiAsset[]>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        const { data, error } = await supabase
          .from("asset_library")
          .select("*")
          .eq("type", "EMOJI")
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("sort_order", { ascending: true })
          .limit(limit);

        if (!error && data && data.length > 0) {
          const emojis = (data as AssetLibraryRecord[]).map(toEmojiAsset);
          setCached(cacheKey, emojis);
          return emojis;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase recommended emojis failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    try {
      const res = await fetch(`${BACKEND_BASE}/api/emojis/recommended?limit=${limit}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data: EmojiAsset[] = await res.json();
        setCached(cacheKey, data);
        return data;
      }
    } catch (e) {
      console.error("[AssetLibrary] Failed to fetch recommended emojis from backend:", e);
    }
    return [];
  },

  async getEmojisPage(params: EmojiFilterParams = {}): Promise<EmojiPageResponse> {
    const { category, search, recommended, page = 0, size = 20 } = params;
    const cacheKey = `emojis_page_${category || "all"}_${recommended ?? "any"}_${page}_${size}_${search || ""}`;

    return dedupe(
      cacheKey,
      async () => {
        if (hasSupabaseKey()) {
          try {
            let query = supabase
              .from("asset_library")
              .select("*", { count: "exact" })
              .eq("type", "EMOJI")
              .eq("is_active", true)
              .eq("is_deleted", false);

            if (category && category !== "all") {
              const catSlug = category.trim().toLowerCase();
              const pattern = catSlug.replace(/-/g, "%");
              query = query.or(
                `category.ilike.%${pattern}%,asset_key.ilike.%${catSlug}%,json_data->>category.ilike.%${pattern}%`
              );
            }
            if (recommended !== undefined) {
              query = query.eq("json_data->>isRecommended", String(recommended));
            }
            if (search && search.trim()) {
              const term = search.trim();
              query = query.or(`name.ilike.%${term}%,category.ilike.%${term}%,asset_key.ilike.%${term}%`);
            }

            const from = page * size;
            const to = from + size - 1;
            query = query.order("sort_order", { ascending: true }).range(from, to);

            const { data, count, error } = await query;
            if (!error && data) {
              const content = (data as AssetLibraryRecord[]).map(toEmojiAsset);
              const totalElements = count || content.length;
              const totalPages = Math.max(1, Math.ceil(totalElements / size));

              return {
                content,
                pageable: { pageNumber: page, pageSize: size },
                totalElements,
                totalPages,
                last: page >= totalPages - 1,
                size,
                number: page,
                numberOfElements: content.length,
                first: page === 0,
                empty: content.length === 0,
              };
            }
          } catch (e) {
            console.warn("[AssetLibrary] Supabase emojis query failed, falling back to backend:", e);
          }
        }

        // Backend fallback
        try {
          const q = new URLSearchParams({ page: String(page), size: String(size) });
          if (category && category !== "all") q.set("category", category);
          if (search && search.trim()) q.set("search", search.trim());
          if (recommended !== undefined) q.set("recommended", String(recommended));

          const res = await fetch(`${BACKEND_BASE}/api/emojis?${q}`, {
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            return await res.json();
          }
        } catch (e) {
          console.error("[AssetLibrary] Failed to fetch emojis from backend:", e);
        }

        return {
          content: [],
          pageable: { pageNumber: page, pageSize: size },
          totalElements: 0,
          totalPages: 0,
          last: true,
          size,
          number: page,
          numberOfElements: 0,
          first: true,
          empty: true,
        };
      },
      !search
    );
  },

  async getEmojiById(identifier: string | number): Promise<EmojiAsset> {
    const key = String(identifier).trim();
    const cacheKey = `emoji_single_${key}`;
    const cached = getCached<EmojiAsset>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        let query = supabase
          .from("asset_library")
          .select("*")
          .eq("type", "EMOJI")
          .eq("is_active", true)
          .eq("is_deleted", false);

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
        if (isUuid) {
          query = query.eq("id", key);
        } else {
          query = query.eq("asset_key", key);
        }

        const { data, error } = await query.maybeSingle();
        if (!error && data) {
          const asset = toEmojiAsset(data as AssetLibraryRecord);
          setCached(cacheKey, asset);
          return asset;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase single emoji fetch failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    const res = await fetch(`${BACKEND_BASE}/api/emojis/${encodeURIComponent(key)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Emoji not found: ${identifier}`);
    const asset: EmojiAsset = await res.json();
    setCached(cacheKey, asset);
    return asset;
  },

  // ================================================================
  // TEMPLATES
  // ================================================================

  async getTemplatesPage(page = 0, size = 20): Promise<TemplatePage> {
    const cacheKey = `templates_${page}_${size}`;
    const cached = getCached<TemplatePage>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        const from = page * size;
        const to = from + size - 1;

        const { data, count, error } = await supabase
          .from("asset_library")
          .select("*", { count: "exact" })
          .eq("type", "TEMPLATE")
          .eq("is_active", true)
          .eq("is_deleted", false)
          .order("sort_order", { ascending: true })
          .range(from, to);

        if (!error && data && data.length > 0) {
          const content = (data as AssetLibraryRecord[]).map(toCertificateTemplate);
          const totalElements = count || content.length;
          const totalPages = Math.max(1, Math.ceil(totalElements / size));
          const result: TemplatePage = {
            content,
            number: page,
            size,
            totalElements,
            totalPages,
            first: page === 0,
            last: page >= totalPages - 1,
            empty: content.length === 0,
          };
          setCached(cacheKey, result);
          return result;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase templates query failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    const res = await fetch(`${BACKEND_BASE}/api/templates/page?page=${page}&size=${size}`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const data: TemplatePage = await res.json();
      setCached(cacheKey, data);
      return data;
    }

    return {
      content: [],
      number: page,
      size,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
      empty: true,
    };
  },

  async getTemplateByKey(templateKey: string): Promise<CertificateTemplate> {
    const cacheKey = `template_single_${templateKey}`;
    const cached = getCached<CertificateTemplate>(cacheKey);
    if (cached) return cached;

    if (hasSupabaseKey()) {
      try {
        const { data, error } = await supabase
          .from("asset_library")
          .select("*")
          .eq("type", "TEMPLATE")
          .eq("asset_key", templateKey)
          .eq("is_active", true)
          .eq("is_deleted", false)
          .maybeSingle();

        if (!error && data) {
          const template = toCertificateTemplate(data as AssetLibraryRecord);
          setCached(cacheKey, template);
          return template;
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase single template fetch failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    const res = await fetch(`${BACKEND_BASE}/api/templates/key/${encodeURIComponent(templateKey)}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Template not found: ${templateKey}`);
    const template: CertificateTemplate = await res.json();
    setCached(cacheKey, template);
    return template;
  },

  // ================================================================
  // GLOBAL SEARCH & UTILITY
  // ================================================================

  async searchAssets(
    searchTerm: string,
    options: {
      type?: string;
      category?: string;
      page?: number;
      size?: number;
    } = {}
  ): Promise<{ data: AssetLibraryRecord[]; total: number }> {
    const { type, category, page = 0, size = 60 } = options;
    const trimmed = searchTerm.trim();
    if (!trimmed) return { data: [], total: 0 };

    if (hasSupabaseKey()) {
      try {
        let query = supabase
          .from("asset_library")
          .select("*", { count: "exact" })
          .eq("is_active", true)
          .eq("is_deleted", false);

        if (type) query = query.eq("type", type.toUpperCase());
        if (category && category !== "All") query = query.eq("category", category);

        query = query
          .or(`name.ilike.%${trimmed}%,category.ilike.%${trimmed}%,asset_key.ilike.%${trimmed}%`)
          .order("sort_order", { ascending: true })
          .range(page * size, (page + 1) * size - 1);

        const { data, count, error } = await query;
        if (!error && data) {
          return {
            data: (data as AssetLibraryRecord[]) || [],
            total: count || 0,
          };
        }
      } catch (e) {
        console.warn("[AssetLibrary] Supabase search query failed, falling back to backend:", e);
      }
    }

    // Backend fallback
    try {
      const q = new URLSearchParams({ search: trimmed, size: String(size) });
      if (type) q.set("assetType", type);
      if (category && category !== "All") q.set("category", category);

      const res = await fetch(`${BACKEND_BASE}/api/assets/search?${q}`, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        const content = Array.isArray(json) ? json : json.content || [];
        const mapped: AssetLibraryRecord[] = content.map((item: any) => ({
          id: String(item.id || item.assetKey),
          asset_key: item.assetKey,
          name: item.name,
          type: item.assetType || (type ? type.toUpperCase() : "UNKNOWN"),
          category: item.category,
          subcategory: item.subcategory || null,
          sort_order: item.sortOrder || 0,
          json_data: item.assetData || {},
          is_active: item.isActive !== false,
          is_deleted: false,
          created_at: item.createdAt || new Date().toISOString(),
          updated_at: item.updatedAt || new Date().toISOString(),
        }));
        return { data: mapped, total: json.totalElements || mapped.length };
      }
    } catch (e) {
      console.error("[AssetLibrary] Failed backend search:", e);
    }

    return { data: [], total: 0 };
  },

  clearCache(): void {
    cache.clear();
  },
};
