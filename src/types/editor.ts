export type ElementType =
  | "heading"
  | "subheading"
  | "text"
  | "rectangle"
  | "circle"
  | "triangle"
  | "square"
  | "polygon"
  | "pentagon"
  | "hexagon"
  | "heptagon"
  | "octagon"
  | "line"
  | "arrow"
  | "double-arrow"
  | "dashed-line"
  | "dotted-line"
  | "image";

export interface EditorElement {
  id: string;
  backendId?: number;

  type: ElementType;

  x: number;
  y: number;

  width: number;
  height: number;

  scaleX?: number;
  scaleY?: number;

  angle?: number;

  opacity?: number;

  text?: string;

  fontSize?: number;

  fontFamily?: string;

  color?: string;

  backgroundColor?: string;

  fontWeight?: "normal" | "bold";

  fontStyle?: "normal" | "italic";

  src?: string;

  lineHeight?: number;

  charSpacing?: number;

  textAlign?:
    | "left"
    | "center"
    | "right";

  strokeColor?: string;

  strokeWidth?: number;

  lineDash?: number[];

  shapeSides?: number;
}