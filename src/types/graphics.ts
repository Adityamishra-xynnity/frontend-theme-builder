/**
 * TypeScript interface definitions for Graphics and Animated Elements.
 * Matches the backend Spring Boot entity, assetData structure, and REST endpoints.
 */

export type GraphicAnimationType =
  | "pulse"
  | "bounce"
  | "float"
  | "spin"
  | "glow"
  | "shimmer"
  | "wiggle"
  | "blink";

export type GraphicAnimationEasing =
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

export interface GraphicAnimationConfig {
  type: GraphicAnimationType;
  durationMs: number;
  easing?: GraphicAnimationEasing | string;
  loop?: boolean;
  intensity?: number;
  direction?: "normal" | "reverse" | "alternate";
  delayMs?: number;
}

export interface GraphicAssetData {
  categoryId: string;
  categoryName?: string;
  type: "static" | "animated";
  assetFormat: "svg" | "png" | string;
  isRecommended?: boolean;
  tags?: string[];
  keywords?: string[];
  viewBox: string;
  width: number;
  height: number;
  svgContent: string;
  colorPalette?: string[];
  animationConfig?: GraphicAnimationConfig;
  defaultText?: string;
  isEditableText?: boolean;
  [key: string]: unknown;
}

export interface GraphicAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: "GRAPHIC";
  category: string;
  sortOrder: number;
  isActive: boolean;
  assetData: GraphicAssetData;
  createdAt?: string;
  updatedAt?: string;
}

export interface GraphicCategory {
  id: string;
  name: string;
  count: number;
  iconKey?: string;
  previewSvg?: string | null;
  isAnimated?: boolean;
}

export interface GraphicPageable {
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

export interface GraphicPageResponse {
  content: GraphicAsset[];
  pageable: GraphicPageable;
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

export interface GraphicFilterParams {
  categoryId?: string;
  search?: string;
  type?: "all" | "static" | "animated";
  recommended?: boolean;
  page?: number;
  size?: number;
}
