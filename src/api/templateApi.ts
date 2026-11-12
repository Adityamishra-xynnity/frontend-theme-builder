import type { EditorElement } from "../types/editor";

const API_URL = "http://localhost:8080/api/templates";

export interface CertificateTemplate {
  id: number;
  templateKey: string;
  name: string;
  description: string;
  backgroundColor: string;
  elementsData: EditorElement[];
  createdAt?: string;
  updatedAt?: string | null;
}

export interface TemplatePage {
  content: CertificateTemplate[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export async function getTemplatesPage(
  page = 0,
  size = 20
): Promise<TemplatePage> {
  const response = await fetch(
    `${API_URL}/page?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch templates");
  }

  return response.json();
}

export async function getTemplateByKey(
  templateKey: string
): Promise<CertificateTemplate> {
  const response = await fetch(
    `${API_URL}/key/${encodeURIComponent(templateKey)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch template");
  }

  return response.json();
}