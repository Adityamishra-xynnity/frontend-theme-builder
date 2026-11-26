import { assetLibraryService } from "../services/assetLibraryService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";
const ADMIN_API = `${API_BASE}/api/admin/assets`;

export const ASSET_TYPES = [
  "GRAPHIC",
  "ANIMATED_DESIGN",
  "EMOJI",
  "SHAPE",
  "PHOTO",
  "BORDER",
  "ANIMATION",
  "TEXT",
  "TEMPLATE",
] as const;

export interface AdminAssetItem {
  id: number;
  assetKey: string;
  name: string;
  type: string;
  category: string;
  subcategory: string | null;
  sortOrder: number;
  jsonData: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminAssetPayload {
  assetKey: string;
  name: string;
  type: string;
  category: string;
  subcategory: string | null;
  sortOrder?: number;
  jsonData: Record<string, unknown>;
  isActive: boolean;
  isDeleted: boolean;
}

export interface AdminAssetPage {
  content: AdminAssetItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface AdminAssetStats {
  total: number;
  byType: Record<string, number>;
}

export interface BulkImportResult {
  total: number;
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const adminKey = import.meta.env.VITE_ADMIN_KEY;
  if (adminKey) {
    headers["X-Admin-Key"] = adminKey;
  }
  return headers;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || fallback;
  } catch {
    return `${fallback} (HTTP ${res.status})`;
  }
}

export async function getAdminAssets(params: {
  type?: string;
  category?: string;
  isActive?: boolean | null;
  isDeleted?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<AdminAssetPage> {
  const q = new URLSearchParams();
  if (params.type && params.type !== "ALL") q.set("type", params.type);
  if (params.category && params.category !== "ALL") q.set("category", params.category);
  if (params.isActive !== undefined && params.isActive !== null) {
    q.set("isActive", String(params.isActive));
  }
  q.set("isDeleted", String(Boolean(params.isDeleted)));
  if (params.search?.trim()) q.set("search", params.search.trim());
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 20));

  const res = await fetch(`${ADMIN_API}?${q.toString()}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to load assets"));
  return res.json();
}

export async function getAdminAssetStats(): Promise<AdminAssetStats> {
  const res = await fetch(`${ADMIN_API}/stats`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to load stats"));
  return res.json();
}

export async function getAdminCategories(type?: string): Promise<string[]> {
  const q = type && type !== "ALL" ? `?type=${encodeURIComponent(type)}` : "";
  const res = await fetch(`${ADMIN_API}/categories${q}`, { headers: getHeaders() });
  if (!res.ok) throw new Error(await parseError(res, "Failed to load categories"));
  return res.json();
}

export async function createAdminAsset(payload: AdminAssetPayload): Promise<AdminAssetItem> {
  const res = await fetch(ADMIN_API, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to create asset"));
  assetLibraryService.clearCache();
  return res.json();
}

export async function updateAdminAsset(
  id: number,
  payload: AdminAssetPayload
): Promise<AdminAssetItem> {
  const res = await fetch(`${ADMIN_API}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update asset"));
  assetLibraryService.clearCache();
  return res.json();
}

export async function toggleAdminAssetStatus(
  id: number,
  isActive: boolean
): Promise<AdminAssetItem> {
  const res = await fetch(`${ADMIN_API}/${id}/status?isActive=${isActive}`, {
    method: "PATCH",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update status"));
  assetLibraryService.clearCache();
  return res.json();
}

export async function deleteOrRestoreAdminAsset(
  id: number,
  restore = false
): Promise<AdminAssetItem> {
  const res = await fetch(`${ADMIN_API}/${id}?restore=${restore}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res, "Failed to update delete state"));
  assetLibraryService.clearCache();
  return res.json();
}

/*
export async function bulkImportAdminAssets(
  items: AdminAssetPayload[]
): Promise<BulkImportResult> {
  const res = await fetch(`${ADMIN_API}/bulk-import`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(items),
  });
  if (!res.ok) throw new Error(await parseError(res, "Bulk import failed"));
  assetLibraryService.clearCache();
  return res.json();
}
*/
