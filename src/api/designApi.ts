
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

type DesignPayload = Omit<Design, "id">;

export async function getDesigns(): Promise<Design[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch designs");
  }

  return response.json();
}

export async function getDesign(id: number): Promise<Design> {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch design");
  }

  return response.json();
}

const API_URL = "http://localhost:8080/api/designs";

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
