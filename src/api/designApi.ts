import type { EditorElement } from "../types/editor";



const API_URL = "http://localhost:8080/api/designs";

export interface Design {
  id: number;

  name: string;

  backgroundColor: string;

  elements: EditorElement[];

  createdAt?: string;

  updatedAt?: string;
}

export async function getDesigns(): Promise<Design[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch designs");
  }

  return response.json();
}

export async function getDesign(
  id: number
): Promise<Design> {
  const response = await fetch(
    `${API_URL}/${id}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch design");
  }

  return response.json();
}

export async function createDesign(
  design: Omit<Design, "id">
): Promise<Design> {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      ...design,
      elements: design.elements.map(
        (element) => {
          const {
            id,
            backendId,
            ...elementData
          } = element;

          return elementData;
        }
      ),
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create design");
  }

  return response.json();
}


export async function updateDesign(
  id: number,
  design: Omit<Design, "id">
): Promise<Design> {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        ...design,
        elements: design.elements.map(
          (element) => {
            const {
              id,
              backendId,
              ...elementData
            } = element;

            return elementData;
          }
        ),
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update design");
  }

  return response.json();
}

export async function deleteDesign(
  id: number
): Promise<void> {
  const response = await fetch(
    `${API_URL}/${id}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete design");
  }
}