import type {
  GraphicAsset,
  GraphicCategory,
  GraphicFilterParams,
  GraphicPageResponse,
} from "../types/graphics";
import { assetLibraryService } from "../services/assetLibraryService";

export async function getGraphicsBootstrap(
  type: "animated" | "static"
): Promise<{
  categories: GraphicCategory[];
  recommended: GraphicAsset[];
  railsByCategoryId: Record<string, GraphicAsset[]>;
}> {
  return assetLibraryService.getGraphicsBootstrap(type);
}

/**
 * Fetch all available graphic categories with item counts and preview icons.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getGraphicCategories(
  type?: "all" | "animated" | "static"
): Promise<GraphicCategory[]> {
  return assetLibraryService.getGraphicCategories(type);
}

/**
 * Fetch top recommended graphics for the top horizontal carousel rail.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getRecommendedGraphics(
  limit = 20,
  type?: "all" | "animated" | "static"
): Promise<GraphicAsset[]> {
  return assetLibraryService.getRecommendedGraphics(limit, type);
}

/**
 * Query and filter graphics with Supabase database pagination and search.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getGraphics(
  params: GraphicFilterParams = {}
): Promise<GraphicPageResponse> {
  return assetLibraryService.getGraphicsPage(params);
}

/**
 * Fetch a single graphic asset by numeric ID, UUID or string assetKey.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getGraphicByIdOrKey(
  identifier: string | number
): Promise<GraphicAsset> {
  return assetLibraryService.getGraphicByIdOrKey(identifier);
}
