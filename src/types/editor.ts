
export type ElementType =
  | "heading"
  | "subheading"
  | "text"
  | "rectangle"
  | "circle"
  | "triangle"
  | "image";

export interface EditorElement {
  id: string;

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

  /*
   * Text line spacing.
   */
  lineHeight?: number;

  /*
   * Fabric charSpacing value.
   *
   * UI value is converted inside FabricContext.
   */
  charSpacing?: number;

  /*
   * Text alignment inside the text box.
   */
  textAlign?:
    | "left"
    | "center"
    | "right";
}