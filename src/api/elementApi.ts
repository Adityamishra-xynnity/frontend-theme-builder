import type { EditorElement } from "../types/editor";

const API_URL = "http://localhost:8080/api/elements";

export async function getElements(): Promise<EditorElement[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch elements");
  }

  return response.json();
}

export async function createElement(
  element: EditorElement
): Promise<EditorElement> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
  ...element,
  id: undefined,
  backendId: undefined,
}),
  });

  if (!response.ok) {
    throw new Error("Failed to create element");
  }

  return response.json();
}