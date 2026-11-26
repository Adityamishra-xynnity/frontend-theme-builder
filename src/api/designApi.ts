import type { EditorElement } from "../types/editor";

export type PaperSize = "A1" | "A2" | "A3" | "A4" | "A5";
export type PageOrientation = "portrait" | "landscape";

export interface DesignAssetData {
  id: number;
  assetKey: string;
  name: string;
  category: string;
  assetData: Record<string, unknown>;
}

export interface DesignPageData {
  id: string;
  name: string;
  elements: EditorElement[];
  backgroundColor: string;
  pageSize: PaperSize;
  orientation: PageOrientation;
  borderAsset?: DesignAssetData | null;
  animationAsset?: DesignAssetData | null;
}

export interface DesignPreviewElement {
  id: string;
  type: string;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
}

export interface Design {
  id: number;
  name: string;
  backgroundColor: string;
  elements?: EditorElement[];
  pages?: DesignPageData[];
  previewElements?: DesignPreviewElement[];
  createdAt?: string;
  updatedAt?: string;
  pageSize?: PaperSize;
  orientation?: PageOrientation;
}

export interface DesignPage {
  content: Design[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

type DesignPayload = Omit<Design, "id">;

const API_URL = "http://localhost:8080/api/designs";

function cleanElements(elements: EditorElement[] = []) {
  return elements.map((element) => {
    const { id, backendId, ...elementData } = element;
    return elementData;
  });
}

function prepareDesignPayload(design: DesignPayload) {
  return {
    ...design,
    // Keep the legacy single-page fields for older backend/frontend versions.
    elements: cleanElements(design.elements),
    // Spreading each page preserves borderAsset and animationAsset JSON data.
    pages: (design.pages ?? []).map((page) => ({
      ...page,
      elements: cleanElements(page.elements),
    })),
  };
}

export async function getDesigns(): Promise<Design[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Failed to fetch designs");
  return response.json();
}

export async function getDesignsPage(page = 0, size = 20): Promise<DesignPage> {
  const response = await fetch(`${API_URL}/page?page=${page}&size=${size}`);
  if (!response.ok) throw new Error("Failed to fetch designs page");
  const data = await response.json();

  if (data && Array.isArray(data.content)) {
    return {
      content: data.content,
      totalPages: data.totalPages ?? 0,
      totalElements: data.totalElements ?? data.content.length,
      number: data.number ?? page,
      size: data.size ?? size,
      first: data.first ?? page === 0,
      last: data.last ?? true,
      empty: data.empty ?? data.content.length === 0,
    };
  }

  if (Array.isArray(data)) {
    return {
      content: data,
      totalPages: data.length ? 1 : 0,
      totalElements: data.length,
      number: 0,
      size,
      first: true,
      last: true,
      empty: data.length === 0,
    };
  }

  throw new Error("Invalid designs page response");
}

export async function getDesign(id: number): Promise<Design> {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error("Failed to fetch design");
  return response.json();
}

export async function createDesign(design: DesignPayload): Promise<Design> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prepareDesignPayload(design)),
  });
  if (!response.ok) throw new Error("Failed to create design");
  return response.json();
}

export async function updateDesign(id: number, design: DesignPayload): Promise<Design> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prepareDesignPayload(design)),
  });
  if (!response.ok) throw new Error("Failed to update design");
  return response.json();
}

export async function deleteDesign(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete design");
}
