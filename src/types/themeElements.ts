export type ThemeElementKind = "icons" | "bricks" | "columns";

export interface StructuredChildElement {
  kind: "rect" | "circle" | "text" | "svg";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rx?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  svgContent?: string;
}

export interface ThemeElementAssetData {
  version?: number;
  subcategory?: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
  colorPalette?: string[];
  svgContent?: string;
  width?: number;
  height?: number;
  columnsCount?: number;
  elements?: StructuredChildElement[];
  [key: string]: unknown;
}

export interface ThemeElementAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: "ICON" | "BRICK" | "COLUMN" | string;
  category: string;
  assetData: ThemeElementAssetData;
  sortOrder: number;
  isActive: boolean;
}

export interface ThemeElementCategory {
  id: string;
  name: string;
  count: number;
  previewSvg?: string | null;
  previewData?: ThemeElementAssetData | null;
}

export interface ThemeElementPageResponse {
  content: ThemeElementAsset[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ThemeElementQueryParams {
  category?: string;
  search?: string;
  page?: number;
  size?: number;
}
