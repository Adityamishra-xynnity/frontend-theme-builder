import { createContext, useContext, type MutableRefObject } from "react";
import type { Canvas as FabricCanvas } from "fabric";
import type { EditorElement } from "../types/editor";
import type { GraphicAsset } from "../types/graphics";
import type { EmojiAsset } from "../types/emoji";

export type ToolMode =
  | "select"
  | "pen"
  | "marker"
  | "highlighter"
  | "eraser";

export type DrawingSettings = {
  color: string;
  width: number;
  opacity: number;
};

export type TextElementType = "heading" | "subheading" | "text";

export type ShapeElementType =
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
  | "speech-bubble" | "chat-bubble" | "thought-bubble" | "rounded-bubble";

export interface FabricContextType {
  canvasRef: MutableRefObject<FabricCanvas | null>;
  selectedObject: any;
  setSelectedObject: (object: any) => void;

  convertCanvasToElements: () => EditorElement[];
  isRecentCanvasSync: (pageId: string, signature: string, elements?: EditorElement[]) => boolean;
  selectObjectById: (id: string) => void;

  addText: (type?: TextElementType) => void;
  addEmoji: (emoji: string | EmojiAsset) => void;
  addTextCombination: (items: Array<{
    text: string;
    fontSize: number;
    fontFamily: string;
    fill: string;
    fontWeight?: string;
    fontStyle?: string;
    charSpacing?: number;
    textAlign?: "left" | "center" | "right";
    textEffect?: "none" | "neon" | "outline" | "3d" | "retro" | "striped" | "outside-striped";
    textStripeColor?: string;
    textStripeBaseColor?: string;
    textStrokeColor?: string;
    textStrokeWidth?: number;
  }>) => void;
  addShape: (type: ShapeElementType) => void;
  addImage: (
    dataUrl: string,
    options?: { pendingUploadId?: string; offsetIndex?: number }
  ) => Promise<void>;
  addGraphic: (graphic: GraphicAsset) => Promise<void>;
  setGraphicColor: (colorIndex: number, newColor: string) => void;

  deleteSelected: () => void;
  /** Run the element currently being dragged from the panel and place it at the given client point. */
  dropDraggedElement: (clientX: number, clientY: number) => Promise<boolean>;
  duplicateSelected: () => void;

  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setTextShadow: (amount: number, side: "all" | "top" | "bottom" | "left" | "right", color: string) => void;
  setShapeColor: (color: string) => void;
  setFontFamily: (fontFamily: string) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  setLineSpacing: (value: number) => void;
  setLetterSpacing: (value: number) => void;
  setTextBend: (value: number) => void;

  alignObject: (
    alignment: "left" | "center" | "right" | "justify"
  ) => void;

  rotateSelected: (degrees: number) => void;

  bringForward: () => void;
  sendBackward: () => void;
  bringToFront: () => void;
  sendToBack: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedFontSize: number | null;

  setToolMode: (mode: ToolMode) => void;
  setDrawingSettings: (
    settings: Partial<DrawingSettings>
  ) => void;

  addStickyNote: () => void;
  addSignature: (text?: string, fontFamily?: string, color?: string) => void;
  addTable: () => void;
  activeTableCell: { row: number; column: number } | null;
  setActiveTableCell: (cell: { row: number; column: number } | null) => void;
  setTableCellText: (row: number, column: number, text: string) => void;
  setTableCellTextColor: (row: number, column: number, color: string) => void;
  setTableCellFontSize: (row: number, column: number, size: number) => void;
  setTableColumnWidth: (column: number, width: number) => void;
  setTableRowHeight: (row: number, height: number) => void;
  setTableCellBackground: (row: number, column: number, color: string) => void;
  setTableRowBackground: (row: number, color: string) => void;
  setTableColumnBackground: (column: number, color: string) => void;
  setTableBorder: (color: string, width: number) => void;
  addTableRow: () => void;
  deleteTableRow: (row: number) => void;
  addTableColumn: () => void;
  deleteTableColumn: (column: number) => void;

  saveCurrentDesign: (name: string) => Promise<void>;
  downloadPNG: (pageIds?: string[]) => Promise<void>;
  downloadPDF: (pageIds?: string[]) => void;
}

export const FabricContext = createContext<FabricContextType | null>(null);

export function useFabric(): FabricContextType {
  const context = useContext(FabricContext);

  if (!context) {
    throw new Error("useFabric must be used inside FabricProvider");
  }

  return context;
}
