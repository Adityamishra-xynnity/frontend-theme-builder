export type EmailNodeType =
  | "logo"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "link"
  | "container";

// Position and dimensions of an element or section on the canvas
export interface EmailBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Individual editable element inside an email section
export interface EmailNode extends EmailBounds {
  id: string;
  type: EmailNodeType;
  content: string;
  fontSize?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  url?: string;
  linkUrl?: string; // Reusable Canva-style destination URL
  tagName?: "div" | "section";
  backgroundColor?: string;
  color?: string;
  borderRadius?: number | string;
}

// A distinct section of an email containing layout geometry and nodes
export interface EmailSection extends EmailBounds {
  id: string;
  templateId: string;
  category: string;
  name: string;
  backgroundColor: string;
  padding: string;
  nodes: EmailNode[];
}

// Section template used by the Elements panel (supports predefined coordinates and styles)
export interface EmailSectionTemplate {
  id: string;
  category: string;
  name: string;
  backgroundColor: string;
  padding: string;
  height?: number;
  nodes: (Omit<EmailNode, "id" | "x" | "y" | "width" | "height"> & {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number | string;
    linkUrl?: string;
  })[];
}

// Backend Email Template DTO matching EmailTemplateResponse
export interface EmailTemplateResponse {
  id: number;
  templateKey: string;
  name: string;
  category: string;
  description: string;
  sectionsData: EmailSection[];
  thumbnailUrl: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Backend Email Campaign Header Template DTO matching EmailCampaignHeaderTemplateResponse
export interface EmailCampaignHeaderTemplateResponse {
  id: number;
  templateKey: string;
  name: string;
  category: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  templateData: EmailSectionTemplate;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// Backend Email Campaign DTO matching EmailCampaignResponse
export interface EmailCampaignResponse {
  id: number;
  name: string;
  subject: string;
  previewText?: string;
  sectionsData: EmailSection[];
  thumbnailUrl?: string | null;
  status: string;
  ownerScope?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Backend Email Campaign request matching EmailCampaignRequest
export interface EmailCampaignRequest {
  name: string;
  subject: string;
  previewText?: string;
  sectionsData: EmailSection[];
  thumbnailUrl?: string;
  status?: string;
}

// Email Campaign send request
export interface EmailCampaignSendRequest {
  recipientEmail: string;
  designName: string;
  htmlContent: string;
}

// Spring Boot Page response wrapper
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
