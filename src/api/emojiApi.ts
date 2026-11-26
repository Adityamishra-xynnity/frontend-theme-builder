import type {
  EmojiAsset,
  EmojiCategory,
  EmojiFilterParams,
  EmojiPageResponse,
} from "../types/emoji";
import { assetLibraryService } from "../services/assetLibraryService";

export async function getEmojisBootstrap(): Promise<{
  categories: EmojiCategory[];
  recommended: EmojiAsset[];
  railsByCategoryId: Record<string, EmojiAsset[]>;
}> {
  return assetLibraryService.getEmojisBootstrap();
}

/**
 * Fetch all emoji categories with counts, icons, and preview SVGs.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getEmojiCategories(): Promise<EmojiCategory[]> {
  return assetLibraryService.getEmojiCategories();
}

/**
 * Fetch top recommended emojis for the Canva-style horizontal rail.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getRecommendedEmojis(limit = 20): Promise<EmojiAsset[]> {
  return assetLibraryService.getRecommendedEmojis(limit);
}

/**
 * Query and filter emojis with Supabase database pagination and full search.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getEmojis(
  params: EmojiFilterParams = {}
): Promise<EmojiPageResponse> {
  return assetLibraryService.getEmojisPage(params);
}

/**
 * Fetch a single emoji asset by ID or asset key.
 * Directly queried from Supabase PostgreSQL public.asset_library.
 */
export async function getEmojiById(
  identifier: string | number
): Promise<EmojiAsset> {
  return assetLibraryService.getEmojiById(identifier);
}
