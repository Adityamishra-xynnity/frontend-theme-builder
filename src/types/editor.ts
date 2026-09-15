export type ElementType =
  | "heading"
  | "subheading"
  | "text"
  | "rectangle"
  | "circle"
  | "triangle";

export interface EditorElement {
  id: string;
  type: ElementType;

  x: number;
  y: number;

  width: number;
  height: number;

  text?: string;

  fontSize?: number;
  fontFamily?: string;

  color?: string;

  backgroundColor?: string;

  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
}