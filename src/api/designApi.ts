
import type { EditorElement } from "../types/editor";

export type PaperSize = "A1" | "A2" | "A3" | "A4" | "A5";
export type PageOrientation = "portrait" | "landscape";

export interface Design {
  id: number;
  name: string;
  backgroundColor: string;
  elements: EditorElement[];
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

export async function getDesigns(): Promise<Design[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch designs");
  }

  return response.json();
}

export async function getDesignsPage(
  page = 0,
  size = 20
): Promise<DesignPage> {
  const response = await fetch(
    `${API_URL}/page?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch designs page");
  }

  const data = await response.json();

  // Spring Boot Page response
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

  // Fallback if backend returns a plain array
  if (Array.isArray(data)) {
    return {
      content: data,
      totalPages: data.length > 0 ? 1 : 0,
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

  if (!response.ok) {
    throw new Error("Failed to fetch design");
  }

  return response.json();
}

function prepareDesignPayload(design: DesignPayload) {
  return {
    ...design,
    elements: design.elements.map((element) => {
      const { id, backendId, ...elementData } = element;

      return elementData;
    }),
  };
}

export async function createDesign(
  design: DesignPayload
): Promise<Design> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prepareDesignPayload(design)),
  });

  if (!response.ok) {
    throw new Error("Failed to create design");
  }

  return response.json();
}

export async function updateDesign(
  id: number,
  design: DesignPayload
): Promise<Design> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(prepareDesignPayload(design)),
  });

  if (!response.ok) {
    throw new Error("Failed to update design");
  }

  return response.json();
}

export async function deleteDesign(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete design");
  }
}
