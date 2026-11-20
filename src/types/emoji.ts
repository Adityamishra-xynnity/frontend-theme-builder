/**
 * TypeScript interface definitions for Microsoft Fluent Emoji and Google Noto Emoji assets.
 * Matches the backend Spring Boot EditorAsset entity, assetData structure, and REST endpoints.
 */

export interface EmojiAssetData {
  svgContent?: string;
  unicode?: string;
  tags?: string[];
  keywords?: string[];
  isRecommended?: boolean;
  viewBox?: string;
  category?: string;
  colorPalette?: string[];
  source?: "microsoft-fluent" | "google-noto" | string;
  [key: string]: unknown;
}

export interface EmojiAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: "EMOJI";
  category: string;
  sortOrder: number;
  isActive: boolean;
  assetData: EmojiAssetData;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmojiCategory {
  id: string;
  name: string;
  count: number;
  icon?: string;
  previewSvg?: string | null;
}

export interface EmojiPageable {
  pageNumber: number;
  pageSize: number;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset?: number;
  paged?: boolean;
  unpaged?: boolean;
}

export interface EmojiPageResponse {
  content: EmojiAsset[];
  pageable: EmojiPageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements?: number;
  first: boolean;
  empty: boolean;
}

export interface EmojiFilterParams {
  category?: string;
  search?: string;
  recommended?: boolean;
  page?: number;
  size?: number;
}
