import type { EditorElement } from "../types/editor";
import { templates as localTemplates } from "../data/templates";

const API_URL = "http://localhost:8080/api/templates";

export const TEMPLATE_CATEGORIES: Record<string, string> = {
  "classic-gold": "Achievement",
  "royal-blue": "Professional",
  "elegant-green": "Appreciation",
  "corporate-blue": "Professional",
  "achievement-award": "Achievement",
  "royal-gold-achievement": "Achievement",
  "modern-blue-excellence": "Professional",
  "academic-graduation": "Academic",
  "elegant-appreciation": "Appreciation",
  "minimal-professional": "Completion",
  "creative-participation": "Participation",
};

export interface CertificateTemplate {
  id: number;
  templateKey: string;
  name: string;
  description: string;
  backgroundColor: string;
  category?: string;
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
  try {
    const response = await fetch(
      `${API_URL}/page?page=${page}&size=${size}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch templates");
    }

    const data: TemplatePage = await response.json();
    data.content = data.content.map((t) => ({
      ...t,
      category: t.category || TEMPLATE_CATEGORIES[t.templateKey] || "Achievement",
    }));
    return data;
  } catch (error) {
    console.warn("Backend template fetch failed, falling back to local templates:", error);
    const localContent: CertificateTemplate[] = localTemplates.map((t, idx) => ({
      id: idx + 1,
      templateKey: t.id,
      name: t.name,
      description: t.description,
      backgroundColor: t.backgroundColor,
      category: t.category || TEMPLATE_CATEGORIES[t.id] || "Achievement",
      elementsData: t.elements,
    }));
    const start = page * size;
    const paged = localContent.slice(start, start + size);
    return {
      content: paged,
      number: page,
      size,
      totalElements: localContent.length,
      totalPages: Math.max(1, Math.ceil(localContent.length / size)),
      first: page === 0,
      last: start + size >= localContent.length,
      empty: paged.length === 0,
    };
  }
}

export async function getTemplateByKey(
  templateKey: string
): Promise<CertificateTemplate> {
  try {
    const response = await fetch(
      `${API_URL}/key/${encodeURIComponent(templateKey)}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch template");
    }

    const template: CertificateTemplate = await response.json();
    template.category =
      template.category || TEMPLATE_CATEGORIES[template.templateKey] || "Achievement";
    return template;
  } catch (error) {
    console.warn(
      `Backend fetch for template key "${templateKey}" failed, falling back to local:`,
      error
    );
    const local = localTemplates.find((t) => t.id === templateKey);
    if (local) {
      return {
        id: 0,
        templateKey: local.id,
        name: local.name,
        description: local.description,
        backgroundColor: local.backgroundColor,
        category: local.category || TEMPLATE_CATEGORIES[local.id] || "Achievement",
        elementsData: local.elements,
      };
    }
    throw error;
  }
}
