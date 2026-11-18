
export type ElementType =
  | "heading" | "subheading" | "text"
  | "rectangle" | "circle" | "triangle" | "square" | "polygon"
  | "pentagon" | "hexagon" | "heptagon" | "octagon"
  | "line" | "arrow" | "double-arrow" | "dashed-line" | "dotted-line"
  | "star" | "star-outline" | "star-4" | "star-6" | "star-8" | "star-12"
  | "square-star-4" | "square-star-8" | "square-star-12" | "square-star-16" | "square-star-24" | "square-star-32"
  | "cog-4" | "cog-6" | "cog-8" | "cog-10" | "cog-12" | "cog-16" | "cog-20" | "cog-24"
  | "organic-blob" | "organic-blob-2" | "organic-blob-3" | "organic-wave" | "organic-wave-2" | "organic-cloud" | "organic-splash" | "organic-pebble"
  | "flower" | "flower-5" | "flower-6" | "flower-8" | "flower-12" | "flower-daisy" | "flower-sunflower" | "flower-rose" | "flower-lotus" | "flower-lily" | "flower-tulip" | "flower-hibiscus" | "flower-cherry-blossom"
  | "leaf" | "leaf-rounded" | "leaf-pointed" | "leaf-pair" | "petal" | "petal-rounded" | "petal-pointed" | "vine"
  | "flow-process" | "flow-decision" | "flow-terminator" | "flow-io" | "flow-document" | "flow-connector" | "flow-preparation" | "flow-manual-input"
  | "speech-bubble" | "chat-bubble" | "thought-bubble" | "rounded-bubble"
  | "table" | "image";

export interface TableCellData {
  text: string;
  backgroundColor: string;
}

export interface TableData {
  rows: number;
  columns: number;
  cells: TableCellData[][];
  borderColor: string;
  borderWidth: number;
}

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
  richTextHtml?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  src?: string;
  lineHeight?: number;
  charSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";

  // Text Bend: negative = downward, zero = straight, positive = upward.
  textBend?: number;

  textEffect?: "none" | "neon" | "outline" | "3d" | "retro" | "striped" | "outside-striped";
  textStripeColor?: string;
  textStripeBaseColor?: string;
  textStrokeColor?: string;
  textStrokeWidth?: number;
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  strokeColor?: string;
  strokeWidth?: number;
  lineDash?: number[];
  shapeSides?: number;
  pathData?: (string | number)[][];
  tableData?: TableData;
}
