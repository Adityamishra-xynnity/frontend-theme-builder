
import {
  Canvas as FabricCanvas,
  FabricImage,
  IText,
  Textbox,
  Rect,
  Circle,
  Triangle,
  Polygon,
  Line,
  Path,
  PencilBrush,
} from "fabric";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  type MutableRefObject,
  type ReactNode,
} from "react";

import jsPDF from "jspdf";
import { useEditor } from "./EditorContext";

import type {
  ElementType,
  EditorElement,
} from "../types/editor";

type ToolMode =
  | "select"
  | "pen"
  | "marker"
  | "highlighter"
  | "eraser";

type DrawingSettings = {
  color: string;
  width: number;
  opacity: number;
};

type FabricObjectWithMeta = {
  elementId?: string;
  elementType?: ElementType;
  imageSrc?: string;
  shapeSides?: number;
  isFreehand?: boolean;
  /** Stable scene-space geometry used by the eraser to avoid cumulative transform drift. */
  freehandScenePoints?: Array<{ x: number; y: number }>;
  backgroundColor?: string;
};

type TextElementType = "heading" | "subheading" | "text";

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

interface FabricContextType {
  canvasRef: MutableRefObject<FabricCanvas | null>;
  selectedObject: any;
  setSelectedObject: (object: any) => void;

  convertCanvasToElements: () => EditorElement[];
  selectObjectById: (id: string) => void;

  addText: (type?: TextElementType) => void;
  addShape: (type: ShapeElementType) => void;
  addImage: (dataUrl: string) => void;

  deleteSelected: () => void;
  duplicateSelected: () => void;

  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setShapeColor: (color: string) => void;
  setFontFamily: (fontFamily: string) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  setLineSpacing: (value: number) => void;
  setLetterSpacing: (value: number) => void;

  alignObject: (
    alignment: "left" | "center" | "right"
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
  addSignature: () => void;
  addTable: () => void;

  saveCurrentDesign: (name: string) => Promise<void>;
  downloadPNG: () => void;
  downloadPDF: () => void;
}

const FabricContext =
  createContext<FabricContextType | null>(null);

const SHAPE_TYPES: ElementType[] = [
  "rectangle", "square", "circle", "triangle", "polygon", "pentagon", "hexagon", "heptagon", "octagon",
  "star", "star-outline", "star-4", "star-6", "star-8", "star-12",
  "square-star-4", "square-star-8", "square-star-12", "square-star-16", "square-star-24", "square-star-32",
  "cog-4", "cog-6", "cog-8", "cog-10", "cog-12", "cog-16", "cog-20", "cog-24",
  "organic-blob", "organic-blob-2", "organic-blob-3", "organic-wave", "organic-wave-2", "organic-cloud", "organic-splash", "organic-pebble",
  "flower", "flower-5", "flower-6", "flower-8", "flower-12", "flower-daisy", "flower-sunflower", "flower-rose", "flower-lotus", "flower-lily", "flower-tulip", "flower-hibiscus", "flower-cherry-blossom",
  "leaf", "leaf-rounded", "leaf-pointed", "leaf-pair", "petal", "petal-rounded", "petal-pointed", "vine",
  "flow-process", "flow-decision", "flow-terminator", "flow-io", "flow-document", "flow-connector", "flow-preparation", "flow-manual-input",
  "speech-bubble", "chat-bubble", "thought-bubble", "rounded-bubble",
];

const LINE_TYPES: ElementType[] = [
  "line",
  "arrow",
  "double-arrow",
  "dashed-line",
  "dotted-line",
];

const SERIALIZED_PROPERTIES = [
  "elementId",
  "elementType",
  "imageSrc",
  "shapeSides",
  "isFreehand",
  "backgroundColor",
  "freehandScenePoints",
];

function normalizeOpacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  // Accept both 0–1 and 0–100 input formats.
  const normalized = value > 1 ? value / 100 : value;

  return Math.max(0, Math.min(1, normalized));
}

function colorToRgba(color: string, opacity: number): string {
  const hex = color.trim().replace(/^#/, "");

  const validHex = /^[0-9a-fA-F]{6}$/.test(hex)
    ? hex
    : "222222";

  const red = parseInt(validHex.slice(0, 2), 16);
  const green = parseInt(validHex.slice(2, 4), 16);
  const blue = parseInt(validHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

// Sample Fabric path commands and convert local coordinates to canvas coordinates.
function sampleFreehandPath(path: any): Array<{ x: number; y: number }> {
  const stablePoints = (path as FabricObjectWithMeta).freehandScenePoints;
  if (stablePoints && stablePoints.length > 0) {
    return stablePoints.map((point) => ({ x: point.x, y: point.y }));
  }

  const commands = (path.path ?? []) as Array<Array<string | number>>;
  const matrix = path.calcTransformMatrix();
  const points: Array<{ x: number; y: number }> = [];
  let current = { x: 0, y: 0 };

  // Fabric Path commands are relative to pathOffset. Remove that offset
  // before applying the object's full transform matrix so sampled points
  // match the actual position of the stroke on the canvas.
  const pathOffset = path.pathOffset ?? { x: 0, y: 0 };
  const addLocalPoint = (x: number, y: number) => {
    const localX = x - pathOffset.x;
    const localY = y - pathOffset.y;
    const [a, b, c, d, e, f] = matrix;
    points.push({
      x: a * localX + c * localY + e,
      y: b * localX + d * localY + f,
    });
  };

  for (const command of commands) {
    const op = String(command[0]).toUpperCase();
    const values = command.slice(1).map(Number);

    if (op === "M" || op === "L") {
      current = { x: values[0] ?? current.x, y: values[1] ?? current.y };
      addLocalPoint(current.x, current.y);
    } else if (op === "Q") {
      const start = { ...current };
      const control = { x: values[0], y: values[1] };
      const end = { x: values[2], y: values[3] };
      for (let step = 1; step <= 12; step++) {
        const t = step / 12;
        const inv = 1 - t;
        addLocalPoint(
          inv * inv * start.x + 2 * inv * t * control.x + t * t * end.x,
          inv * inv * start.y + 2 * inv * t * control.y + t * t * end.y,
        );
      }
      current = end;
    } else if (op === "C") {
      const start = { ...current };
      const c1 = { x: values[0], y: values[1] };
      const c2 = { x: values[2], y: values[3] };
      const end = { x: values[4], y: values[5] };
      for (let step = 1; step <= 16; step++) {
        const t = step / 16;
        const inv = 1 - t;
        addLocalPoint(
          inv ** 3 * start.x + 3 * inv ** 2 * t * c1.x + 3 * inv * t ** 2 * c2.x + t ** 3 * end.x,
          inv ** 3 * start.y + 3 * inv ** 2 * t * c1.y + 3 * inv * t ** 2 * c2.y + t ** 3 * end.y,
        );
      }
      current = end;
    }
  }

  return points;
}

function distanceToSegment(
  point: { x: number; y: number },
  start: { x: number; y: number },
  end: { x: number; y: number },
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared));
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function splitFreehandPath(
  path: any,
  pointer: { x: number; y: number },
  radius: number,
  sweepStart: { x: number; y: number } = pointer,
): Array<Array<{ x: number; y: number }>> {
  const original = sampleFreehandPath(path);
  if (original.length < 2) return [];

  // Densify the sampled path so a fast or sharply curved stroke cannot jump
  // across the eraser between two sampled vertices.
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < original.length; i++) {
    const a = original[i - 1];
    const b = original[i];
    if (!a) { points.push(b); continue; }
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(length / Math.max(1.5, radius / 3)));
    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
  }

  const threshold = radius + Math.max(1, Number(path.strokeWidth ?? 1) / 2);
  const inside = (p: { x: number; y: number }) =>
    distanceToSegment(p, sweepStart, pointer) <= threshold;
  const boundary = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    let lo = 0, hi = 1;
    const aInside = inside(a);
    for (let n = 0; n < 18; n++) {
      const t = (lo + hi) / 2;
      const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      if (inside(q) === aInside) lo = t; else hi = t;
    }
    const t = (lo + hi) / 2;
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  };

  const runs: Array<Array<{ x: number; y: number }>> = [];
  let run: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const previous = points[i - 1];
    const pointInside = inside(point);
    if (!previous) {
      if (!pointInside) run = [point];
      continue;
    }
    const previousInside = inside(previous);
    if (!previousInside && !pointInside) {
      if (!run.length) run.push(previous);
      run.push(point);
    } else if (!previousInside && pointInside) {
      if (!run.length) run.push(previous);
      run.push(boundary(previous, point));
      if (run.length > 1) runs.push(run);
      run = [];
    } else if (previousInside && !pointInside) {
      run = [boundary(previous, point), point];
    } else {
      if (run.length > 1) runs.push(run);
      run = [];
    }
  }
  if (run.length > 1) runs.push(run);
  return runs.map(part => part.filter((point, index) => index === 0 ||
    Math.hypot(point.x - part[index - 1].x, point.y - part[index - 1].y) > 0.25))
    .filter(part => part.length > 1);
}

function getStarPoints(points: number, outerRadius: number, innerRadius: number) {
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    result.push({ x: outerRadius + Math.cos(angle) * radius, y: outerRadius + Math.sin(angle) * radius });
  }
  return result;
}

function getCogPoints(teeth: number, radius: number) {
  const result: { x: number; y: number }[] = [];
  const inner = radius * 0.78;
  for (let i = 0; i < teeth * 4; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / (teeth * 4);
    const r = i % 4 < 2 ? radius : inner;
    result.push({ x: radius + Math.cos(angle) * r, y: radius + Math.sin(angle) * r });
  }
  return result;
}

function getFlowerPoints(petals: number, radius: number) {
  const result: { x: number; y: number }[] = [];
  const steps = petals * 24;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius * (0.68 + 0.32 * Math.cos(petals * angle));
    result.push({ x: radius + Math.cos(angle) * r, y: radius + Math.sin(angle) * r });
  }
  return result;
}

function getOrganicPoints(variant: number, radius: number) {
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const wave = Math.sin(angle * (variant + 2)) * 0.09 + Math.cos(angle * (variant + 3)) * 0.06;
    const r = radius * (0.83 + wave);
    result.push({ x: radius + Math.cos(angle) * r, y: radius + Math.sin(angle) * r });
  }
  return result;
}

function createSpecialShape(type: ShapeElementType): any {
  const common = { left: 100, top: 100, fill: "#2563eb", stroke: "#1d4ed8", strokeWidth: 2, strokeLineJoin: "round" as const, strokeLineCap: "round" as const, objectCaching: false };
  const starMatch = type.match(/^(star|square-star)-(4|6|8|12|16|24|32)$/);
  if (type === "star" || type === "star-outline" || /^star-(4|6|8|12)$/.test(type)) {
    const points = type === "star-4" ? 4 : type === "star-6" ? 6 : type === "star-8" ? 8 : type === "star-12" ? 12 : 5;
    return new Polygon(getStarPoints(points, 75, 34), { ...common, fill: type === "star-outline" ? "rgba(255,255,255,0)" : "#2563eb", strokeWidth: 3 });
  }
  if (starMatch) {
    const points = Number(starMatch[2]);
    return new Polygon(getStarPoints(points, 75, 41), { ...common, fill: "#fbbf24", stroke: "#b45309", strokeWidth: 2 });
  }
  const cogMatch = type.match(/^cog-(4|6|8|10|12|16|20|24)$/);
  if (cogMatch) return new Polygon(getCogPoints(Number(cogMatch[1]), 75), { ...common, fill: "#94a3b8", stroke: "#475569", strokeWidth: 3 });
  const flowers: Record<string, number> = { flower: 6, "flower-5": 5, "flower-6": 6, "flower-8": 8, "flower-12": 12, "flower-daisy": 12, "flower-sunflower": 16, "flower-rose": 10, "flower-lotus": 8, "flower-lily": 6, "flower-tulip": 5, "flower-hibiscus": 5, "flower-cherry-blossom": 5, petal: 5, "petal-rounded": 6, "petal-pointed": 4 };
  if (type in flowers) {
    const sunflower = type === "flower-sunflower";
    return new Polygon(getFlowerPoints(flowers[type], 75), { ...common, fill: sunflower ? "#facc15" : "#f9a8d4", stroke: sunflower ? "#92400e" : "#be185d", strokeWidth: 2 });
  }
  const organic: Record<string, number> = { "organic-blob": 1, "organic-blob-2": 2, "organic-blob-3": 3, "organic-cloud": 4, "organic-splash": 5, "organic-pebble": 6 };
  if (type in organic) return new Polygon(getOrganicPoints(organic[type], 75), { ...common, fill: "#c4b5fd", stroke: "#7c3aed" });
  if (type === "organic-wave" || type === "organic-wave-2") {
    const path = type === "organic-wave" ? "M 0 35 Q 35 0 70 35 T 140 35 L 140 90 L 0 90 Z" : "M 0 45 C 25 0 50 90 75 45 S 125 0 150 45 L 150 90 L 0 90 Z";
    return new Path(path, { ...common, fill: "#a5f3fc", stroke: "#0891b2", strokeWidth: 3 });
  }
  if (["leaf", "leaf-rounded", "leaf-pointed"].includes(type)) {
    const path = type === "leaf-rounded" ? "M 0 50 Q 10 0 75 0 Q 75 50 0 50 Z" : "M 0 50 Q 15 0 75 0 Q 70 40 0 50 Z";
    return new Path(path, { ...common, fill: "#86efac", stroke: "#15803d", strokeWidth: 2 });
  }
  if (type === "leaf-pair") return new Path("M 0 50 Q 15 0 75 0 Q 70 40 0 50 Z M 75 50 Q 90 0 150 0 Q 145 40 75 50 Z", { ...common, fill: "#86efac", stroke: "#15803d", strokeWidth: 2 });
  if (type === "vine") return new Path("M 0 100 Q 40 80 30 50 Q 20 20 60 15 Q 100 10 95 45 Q 90 75 130 70 Q 165 65 150 30", { ...common, fill: "", stroke: "#15803d", strokeWidth: 5 });
  if (type === "flow-process") return new Rect({ ...common, width: 180, height: 90 });
  if (type === "flow-decision") return new Polygon([{ x: 90, y: 0 }, { x: 180, y: 55 }, { x: 90, y: 110 }, { x: 0, y: 55 }], common);
  if (type === "flow-terminator") return new Rect({ ...common, width: 180, height: 85, rx: 42, ry: 42 });
  if (type === "flow-io") return new Polygon([{ x: 35, y: 0 }, { x: 180, y: 0 }, { x: 145, y: 90 }, { x: 0, y: 90 }], common);
  if (type === "flow-document") return new Path("M 0 0 L 180 0 L 180 75 Q 150 95 120 80 Q 90 65 60 80 Q 30 95 0 80 Z", common);
  if (type === "flow-connector") return new Circle({ ...common, radius: 32 });
  if (type === "flow-preparation") return new Polygon([{ x: 45, y: 0 }, { x: 135, y: 0 }, { x: 180, y: 45 }, { x: 135, y: 90 }, { x: 45, y: 90 }, { x: 0, y: 45 }], common);
  if (type === "flow-manual-input") return new Polygon([{ x: 0, y: 25 }, { x: 180, y: 0 }, { x: 180, y: 90 }, { x: 0, y: 90 }], common);
  if (type === "speech-bubble") return new Path("M 0 0 L 180 0 L 180 90 L 55 90 L 30 115 L 35 90 L 0 90 Z", common);
  if (type === "chat-bubble") return new Path("M 20 0 L 160 0 Q 180 0 180 20 L 180 70 Q 180 90 160 90 L 55 90 L 25 115 L 30 90 L 20 90 Q 0 90 0 70 L 0 20 Q 0 0 20 0 Z", common);
  if (type === "thought-bubble") return new Path("M 30 15 C 5 15 0 45 15 60 C 0 85 25 105 50 95 C 70 120 100 105 105 90 C 135 100 155 80 145 60 C 170 35 145 10 125 20 C 105 -5 70 0 60 15 C 50 10 40 10 30 15 Z", common);
  if (type === "rounded-bubble") return new Rect({ ...common, width: 180, height: 95, rx: 24, ry: 24 });
  return null;
}

export function FabricProvider({
  children,
}: {
  children: ReactNode;
}) {
  const canvasRef = useRef<FabricCanvas | null>(null);

  const [selectedObject, setSelectedObjectState] =
    useState<any>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const [, setToolModeState] =
    useState<ToolMode>("select");

  const toolModeRef = useRef<ToolMode>("select");

  const [, setDrawingSettingsState] =
    useState<DrawingSettings>({
      color: "#222222",
      width: 5,
      opacity: 100,
    });

  const drawingSettingsRef = useRef<DrawingSettings>({
    color: "#222222",
    width: 5,
    opacity: 100,
  });

  const objectInteractionRef = useRef(
    new Map<string, { selectable: boolean; evented: boolean }>()
  );

  const eraserHandlersRef = useRef<{
    down?: (event: any) => void;
    move?: (event: any) => void;
    up?: (event: any) => void;
  }>({});

  // Keep one undo snapshot and the previous scene point for each eraser gesture.
  const eraserGestureSavedRef = useRef(false);
  const eraserPreviousPointRef = useRef<{ x: number; y: number } | null>(null);
  const eraserCursorRef = useRef<HTMLDivElement | null>(null);
  const eraserCursorMoveRef = useRef<((event: PointerEvent) => void) | null>(null);

  const drawingHistoryHandlerRef = useRef<
    ((event: any) => void) | null
  >(null);

  const pathCreatedHandlerRef = useRef<
    ((event: any) => void) | null
  >(null);

  const {
    saveDesign,
    currentDesignName,
    syncElementsFromCanvas,
  } = useEditor();

  const setSelectedObject = (object: any) => {
    setSelectedObjectState(object ?? null);
  };

  const selectedFontSize =
    selectedObject &&
    (selectedObject.type === "i-text" ||
      selectedObject.type === "textbox")
      ? selectedObject.fontSize ?? 18
      : null;

  function getCanvasJSON(canvas: FabricCanvas) {
    return JSON.stringify(
      canvas.toObject(SERIALIZED_PROPERTIES)
    );
  }

  function saveCanvasState() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const snapshot = getCanvasJSON(canvas);

    setHistory((previous) => [...previous, snapshot]);
    setFuture([]);
  }

  function syncCanvasToEditor() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    syncElementsFromCanvas(convertCanvasToElements());
  }

  function convertCanvasToElements(): EditorElement[] {
    const canvas = canvasRef.current;

    if (!canvas) return [];

    return canvas.getObjects().map((object) => {
      const item =
        object as typeof object & FabricObjectWithMeta;

      let type = item.elementType;

      if (!type) {
        if (
          object.type === "i-text" ||
          object.type === "textbox"
        ) {
          type = "text";
        } else if (object.type === "rect") {
          type = "rectangle";
        } else if (object.type === "circle") {
          type = "circle";
        } else if (object.type === "triangle") {
          type = "triangle";
        } else if (object.type === "polygon") {
          type = "polygon";
        } else if (
          object.type === "line" ||
          object.type === "path"
        ) {
          type = "line";
        } else if (object.type === "image") {
          type = "image";
        } else {
          type = "text";
        }
      }

      const element: EditorElement = {
        id: item.elementId ?? crypto.randomUUID(),
        type,
        x: object.left ?? 0,
        y: object.top ?? 0,
        width: object.width ?? 0,
        height: object.height ?? 0,
        scaleX: object.scaleX ?? 1,
        scaleY: object.scaleY ?? 1,
        angle: object.angle ?? 0,
        opacity: object.opacity ?? 1,
      };

      if (
        object.type === "i-text" ||
        object.type === "textbox"
      ) {
        const textObject = object as IText;

        element.text = textObject.text ?? "";
        element.fontSize = textObject.fontSize ?? 18;
        element.fontFamily =
          textObject.fontFamily ?? "Arial";

        element.color =
          typeof textObject.fill === "string"
            ? textObject.fill
            : "#111827";

        element.fontWeight =
          textObject.fontWeight === "bold"
            ? "bold"
            : "normal";

        element.fontStyle =
          textObject.fontStyle === "italic"
            ? "italic"
            : "normal";

        element.lineHeight =
          textObject.lineHeight ?? 1.16;

        element.charSpacing =
          textObject.charSpacing ?? 0;

        element.textAlign =
          (
            textObject as IText & {
              textAlign?: "left" | "center" | "right";
            }
          ).textAlign ?? "left";

        const backgroundColor = (
          textObject as IText & {
            backgroundColor?: string;
          }
        ).backgroundColor;

        if (backgroundColor) {
          element.backgroundColor = backgroundColor;
        }
      }

      if (SHAPE_TYPES.includes(type)) {
        element.backgroundColor =
          typeof object.fill === "string"
            ? object.fill
            : "#2563eb";

        if (item.shapeSides) {
          element.shapeSides = item.shapeSides;
        }
      }

      if (item.isFreehand && object.type === "path") {
        element.pathData = ((object as any).path ?? []).map((command: any[]) => [...command]);
      }

      if (LINE_TYPES.includes(type) || item.isFreehand) {
        element.strokeColor =
          typeof object.stroke === "string"
            ? object.stroke
            : typeof object.fill === "string"
              ? object.fill
              : "#111827";

        element.strokeWidth =
          typeof object.strokeWidth === "number"
            ? object.strokeWidth
            : 4;

        const dash = (
          object as typeof object & {
            strokeDashArray?: number[];
          }
        ).strokeDashArray;

        if (dash) {
          element.lineDash = [...dash];
        }
      }

      if (object.type === "image") {
        element.src = item.imageSrc ?? "";
      }

      return element;
    });
  }

  function selectObjectById(id: string) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const object = canvas.getObjects().find(
      (item) =>
        (item as typeof item & FabricObjectWithMeta)
          .elementId === id
    );

    if (!object) return;

    setToolMode("select");
    canvas.setActiveObject(object);
    setSelectedObject(object);
    canvas.requestRenderAll();
  }

  function applyObjectControls(object: any) {
    object.set({
      selectable: true,
      evented: true,
      transparentCorners: false,
      cornerColor: "#2563eb",
      cornerStyle: "circle",
      borderColor: "#2563eb",
      originX: "left",
      originY: "top",
    });
  }

  function attachMetadata(
    object: any,
    type: ElementType,
    id = crypto.randomUUID(),
    extra?: {
      imageSrc?: string;
      shapeSides?: number;
      isFreehand?: boolean;
    }
  ) {
    const item = object as FabricObjectWithMeta;

    item.elementId = id;
    item.elementType = type;

    if (extra?.imageSrc) {
      item.imageSrc = extra.imageSrc;
    }

    if (extra?.shapeSides) {
      item.shapeSides = extra.shapeSides;
    }

    if (extra?.isFreehand) {
      item.isFreehand = true;
    }
  }

  function activateObject(object: any) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    setToolMode("select");
    canvas.setActiveObject(object);
    setSelectedObject(object);
    canvas.requestRenderAll();
  }

  function addText(type: TextElementType = "text") {
    const canvas = canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    const settings = {
      heading: {
        text: "Heading",
        fontSize: 42,
        fontWeight: "bold" as const,
        width: 500,
      },
      subheading: {
        text: "Subheading",
        fontSize: 26,
        fontWeight: "bold" as const,
        width: 450,
      },
      text: {
        text: "Add your text here",
        fontSize: 18,
        fontWeight: "normal" as const,
        width: 400,
      },
    };

    const config = settings[type];

    const textObject = new Textbox(config.text, {
      left: 100,
      top: 100,
      width: config.width,
      fontSize: config.fontSize,
      fontFamily: "Arial",
      fill: "#111827",
      fontWeight: config.fontWeight,
      fontStyle: "normal",
      lineHeight: 1.16,
      charSpacing: 0,
      textAlign: "left",
      originX: "left",
      originY: "top",
      editable: true,
      selectable: true,
      evented: true,
      padding: 4,
      transparentCorners: false,
      cornerColor: "#2563eb",
      cornerStyle: "circle",
      borderColor: "#2563eb",
      splitByGrapheme: false,
    });

    applyObjectControls(textObject);
    attachMetadata(textObject, type);

    canvas.add(textObject);
    activateObject(textObject);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function getPolygonSides(type: string) {
    if (type === "pentagon") return 5;
    if (type === "hexagon") return 6;
    if (type === "heptagon") return 7;
    if (type === "octagon") return 8;

    return 6;
  }

  function getPolygonPoints(sides: number, radius: number) {
    return Array.from({ length: sides }, (_, index) => {
      const angle =
        -Math.PI / 2 + (index * 2 * Math.PI) / sides;

      return {
        x: radius + radius * Math.cos(angle),
        y: radius + radius * Math.sin(angle),
      };
    });
  }

  function createLineObject(
    type: Extract<
      ElementType,
      | "line"
      | "arrow"
      | "double-arrow"
      | "dashed-line"
      | "dotted-line"
    >
  ) {
    const width = 220;

    const commonOptions = {
      left: 100,
      top: 100,
      fill: "",
      stroke: "#111827",
      strokeWidth: 4,
      strokeLineCap: "round" as const,
      strokeLineJoin: "round" as const,
      originX: "left" as const,
      originY: "top" as const,
      selectable: true,
      evented: true,
    };

    if (
      type === "line" ||
      type === "dashed-line" ||
      type === "dotted-line"
    ) {
      return new Line([0, 0, width, 0], {
        ...commonOptions,
        strokeDashArray:
          type === "dashed-line"
            ? [18, 10]
            : type === "dotted-line"
              ? [2, 10]
              : undefined,
      });
    }

    if (type === "arrow") {
      return new Path(
        `M 0 0 L ${width} 0
         M ${width} 0 L ${width - 18} -12
         M ${width} 0 L ${width - 18} 12`,
        commonOptions
      );
    }

    return new Path(
      `M 0 0 L ${width} 0
       M 0 0 L 18 -12
       M 0 0 L 18 12
       M ${width} 0 L ${width - 18} -12
       M ${width} 0 L ${width - 18} 12`,
      commonOptions
    );
  }

  function addShape(type: ShapeElementType) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    let object: any;
    let sides: number | undefined;

    if (type === "rectangle") {
      object = new Rect({
        left: 100,
        top: 100,
        width: 180,
        height: 100,
        fill: "#2563eb",
      });
    } else if (type === "square") {
      object = new Rect({
        left: 100,
        top: 100,
        width: 140,
        height: 140,
        fill: "#2563eb",
      });
    } else if (type === "circle") {
      object = new Circle({
        left: 100,
        top: 100,
        radius: 70,
        fill: "#2563eb",
      });
    } else if (type === "triangle") {
      object = new Triangle({
        left: 100,
        top: 100,
        width: 150,
        height: 120,
        fill: "#2563eb",
      });
    } else if (
      type === "polygon" ||
      type === "pentagon" ||
      type === "hexagon" ||
      type === "heptagon" ||
      type === "octagon"
    ) {
      sides = getPolygonSides(type);

      object = new Polygon(
        getPolygonPoints(sides, 75),
        {
          left: 100,
          top: 100,
          fill: "#2563eb",
        }
      );
    } else if (LINE_TYPES.includes(type)) {
      object = createLineObject(type as Extract<ElementType, "line" | "arrow" | "double-arrow" | "dashed-line" | "dotted-line">);
    } else {
      object = createSpecialShape(type);
      if (!object) {
        console.error(`Unsupported shape type: ${type}`);
        return;
      }
    }

    applyObjectControls(object);

    attachMetadata(object, type, crypto.randomUUID(), {
      shapeSides: sides,
    });

    canvas.add(object);
    activateObject(object);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  async function addImage(dataUrl: string) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    try {
      const image = await FabricImage.fromURL(dataUrl);
      const currentCanvas = canvasRef.current;

      if (!currentCanvas) return;

      saveCanvasState();

      const originalWidth = image.width || 1;
      const scale = Math.min(1, 350 / originalWidth);

      image.set({
        left: 100,
        top: 100,
        scaleX: scale,
        scaleY: scale,
        angle: 0,
        opacity: 1,
      });

      applyObjectControls(image);

      attachMetadata(image, "image", crypto.randomUUID(), {
        imageSrc: dataUrl,
      });

      currentCanvas.add(image);
      activateObject(image);
      currentCanvas.requestRenderAll();
      syncCanvasToEditor();
    } catch (error) {
      console.error("Image could not be loaded:", error);
    }
  }

  function configureDrawingBrush(
    canvas: FabricCanvas,
    mode: ToolMode,
    settings: DrawingSettings
  ) {
    if (
      mode !== "pen" &&
      mode !== "marker" &&
      mode !== "highlighter"
    ) {
      return;
    }

    const brush =
      canvas.freeDrawingBrush instanceof PencilBrush
        ? canvas.freeDrawingBrush
        : new PencilBrush(canvas);

    const width =
      mode === "marker"
        ? Math.max(settings.width, 12)
        : mode === "highlighter"
          ? Math.max(settings.width, 18)
          : settings.width;

    const configuredOpacity = normalizeOpacity(
      settings.opacity
    );

    const opacity =
      mode === "highlighter"
        ? Math.min(configuredOpacity, 0.3)
        : configuredOpacity;

    brush.color = colorToRgba(settings.color, opacity);
    brush.width = width;

    canvas.freeDrawingBrush = brush;
  }

  function setDrawingSettings(
    settings: Partial<DrawingSettings>
  ) {
    const next: DrawingSettings = {
      ...drawingSettingsRef.current,
      ...settings,
    };

    next.width = Number.isFinite(next.width)
      ? Math.max(1, next.width)
      : 5;

    next.opacity = normalizeOpacity(next.opacity);

    drawingSettingsRef.current = next;
    setDrawingSettingsState(next);

    const canvas = canvasRef.current;

    if (!canvas) return;

    configureDrawingBrush(
      canvas,
      toolModeRef.current,
      next
    );

    canvas.requestRenderAll();
  }

  function handleFreehandPathCreated(event: any) {
    const canvas = canvasRef.current;

    const path = event.path as
      | (Path & FabricObjectWithMeta)
      | undefined;

    if (!canvas || !path) return;

    path.elementId = crypto.randomUUID();
    path.elementType = "line";
    path.isFreehand = true;

    path.set({
      selectable: false,
      evented: false,
      objectCaching: false,
      strokeLineCap: "round",
      strokeLineJoin: "round",
    });

    path.setCoords();
    canvas.requestRenderAll();

    syncCanvasToEditor();
  }

  function eraseAtPointer(event: any) {
    const canvas = canvasRef.current;
    if (!canvas || !event.e) return;

    const pointer = event.e.__eraserScenePoint ?? canvas.getScenePoint(event.e);
    const sweepStart = event.e.__eraserPreviousScenePoint ?? pointer;
    const radius = Math.max(5, drawingSettingsRef.current.width * 1.15);
    const freehandObjects = [...canvas.getObjects()].reverse().filter((object) =>
      Boolean((object as typeof object & FabricObjectWithMeta).isFreehand) && object.type === "path"
    );

    for (const target of freehandObjects) {
      const bounds = target.getBoundingRect();
      const sweepMinX = Math.min(pointer.x, sweepStart.x) - radius;
      const sweepMaxX = Math.max(pointer.x, sweepStart.x) + radius;
      const sweepMinY = Math.min(pointer.y, sweepStart.y) - radius;
      const sweepMaxY = Math.max(pointer.y, sweepStart.y) + radius;
      if (
        sweepMaxX < bounds.left ||
        sweepMinX > bounds.left + bounds.width ||
        sweepMaxY < bounds.top ||
        sweepMinY > bounds.top + bounds.height
      ) continue;

      const item = target as typeof target & FabricObjectWithMeta;
      const runs = splitFreehandPath(target, pointer, radius, sweepStart);
      const sampled = sampleFreehandPath(target);
      const threshold = radius + Math.max(1, ((target as any).strokeWidth ?? 1) / 2);
      const actuallyTouched = sampled.some((point, index) => {
        const previous = sampled[index - 1];
        return distanceToSegment(point, sweepStart, pointer) <= threshold ||
          Boolean(previous && distanceToSegment(sweepStart, previous, point) <= threshold) ||
          Boolean(previous && distanceToSegment(pointer, previous, point) <= threshold);
      });
      if (!actuallyTouched) continue;

      if (!eraserGestureSavedRef.current) {
        saveCanvasState();
        eraserGestureSavedRef.current = true;
      }

      const replacements: Path[] = [];
      for (const run of runs) {
        const minX = Math.min(...run.map((point) => point.x));
        const minY = Math.min(...run.map((point) => point.y));
        const maxX = Math.max(...run.map((point) => point.x));
        const maxY = Math.max(...run.map((point) => point.y));
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Build path coordinates around (0, 0), then place the Fabric object
        // at the scene-space center. This avoids pathOffset/left/top mismatches
        // that can turn curved strokes into scattered straight fragments.
        const commands: (string | number)[][] = [
          ["M", run[0].x - centerX, run[0].y - centerY],
          ...run.slice(1).map((point) => ["L", point.x - centerX, point.y - centerY] as (string | number)[]),
        ];
        const replacement = new Path(commands as any, {
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
          fill: "",
          stroke: (target as any).stroke ?? "#222222",
          strokeWidth: (target as any).strokeWidth ?? 2,
          strokeDashArray: (target as any).strokeDashArray ?? undefined,
          opacity: target.opacity ?? 1,
          strokeLineCap: "round",
          strokeLineJoin: "round",
          selectable: false,
          evented: false,
          objectCaching: false,
        });
        const replacementMeta = replacement as Path & FabricObjectWithMeta;
        replacementMeta.elementId = crypto.randomUUID();
        replacementMeta.elementType = item.elementType ?? "line";
        replacementMeta.isFreehand = true;
        // Keep the remaining geometry in scene coordinates. Re-sampling the
        // replacement Path on every eraser move can otherwise accumulate
        // Fabric pathOffset/bounds rounding and make strokes distort or stop erasing.
        replacementMeta.freehandScenePoints = run.map((point) => ({ x: point.x, y: point.y }));
        replacement.setCoords();
        replacements.push(replacement);
      }

      canvas.remove(target);
      replacements.forEach((replacement) => canvas.add(replacement));
      canvas.requestRenderAll();
      syncCanvasToEditor();
      // Continue through the other strokes too; one eraser move may cross
      // more than one independent pen/marker/highlighter path.
    }
  }

  function removeToolHandlers(canvas: FabricCanvas) {
    const previousEraser = eraserHandlersRef.current;

    if (previousEraser.down) {
      canvas.off("mouse:down", previousEraser.down);
    }

    if (previousEraser.move) {
      canvas.off("mouse:move", previousEraser.move);
    }

    if (previousEraser.up) {
      canvas.off("mouse:up", previousEraser.up);
    }

    eraserHandlersRef.current = {};
    eraserPreviousPointRef.current = null;
    if (eraserCursorMoveRef.current) {
      window.removeEventListener("pointermove", eraserCursorMoveRef.current, true);
      eraserCursorMoveRef.current = null;
    }
    if (eraserCursorRef.current) {
      eraserCursorRef.current.remove();
      eraserCursorRef.current = null;
    }

    if (drawingHistoryHandlerRef.current) {
      canvas.off("mouse:down", drawingHistoryHandlerRef.current);
      drawingHistoryHandlerRef.current = null;
    }

    if (pathCreatedHandlerRef.current) {
      canvas.off("path:created", pathCreatedHandlerRef.current);
      pathCreatedHandlerRef.current = null;
    }
  }

  function setToolMode(mode: ToolMode) {
    const canvas = canvasRef.current;

    toolModeRef.current = mode;
    setToolModeState(mode);

    // Canvas may not have mounted yet. The latest mode is kept
    // in the ref and reapplied when the canvas becomes available.
    if (!canvas) return;

    removeToolHandlers(canvas);

    canvas.isDrawingMode = false;
    canvas.selection = mode === "select";
    canvas.skipTargetFind = mode !== "select";

    if (mode === "pen" || mode === "marker" || mode === "highlighter") {
      configureDrawingBrush(
        canvas,
        mode,
        drawingSettingsRef.current
      );

      canvas.selection = false;
      canvas.skipTargetFind = true;
      canvas.isDrawingMode = true;

      objectInteractionRef.current.clear();

      canvas.getObjects().forEach((object) => {
        const item = object as typeof object & FabricObjectWithMeta;
        const id = item.elementId;

        if (id) {
          objectInteractionRef.current.set(id, {
            selectable: object.selectable ?? true,
            evented: object.evented ?? true,
          });
        }

        object.set({
          selectable: false,
          evented: false,
        });
      });

      const historyHandler = () => {
        saveCanvasState();
      };

      drawingHistoryHandlerRef.current = historyHandler;
      canvas.on("mouse:down", historyHandler);

      const pathHandler = (event: any) => {
        handleFreehandPathCreated(event);
      };

      pathCreatedHandlerRef.current = pathHandler;
      canvas.on("path:created", pathHandler);
    } else if (mode === "eraser") {
      // Use a real DOM overlay as the eraser cursor. Browser custom cursors
      // can silently fall back to an arrow when an SVG data URL is rejected.
      canvas.upperCanvasEl.style.cursor = "none";
      const cursorSize = Math.max(18, Math.min(48, Math.round(drawingSettingsRef.current.width * 2 + 10)));
      const cursor = document.createElement("div");
      cursor.setAttribute("aria-hidden", "true");
      cursor.style.position = "fixed";
      cursor.style.left = "-100px";
      cursor.style.top = "-100px";
      cursor.style.width = `${cursorSize}px`;
      cursor.style.height = `${cursorSize}px`;
      cursor.style.boxSizing = "border-box";
      cursor.style.border = "1.5px solid #111827";
      cursor.style.background = "rgba(255,255,255,0.2)";
      cursor.style.pointerEvents = "none";
      cursor.style.zIndex = "2147483647";
      cursor.style.transform = "translate(-50%, -50%)";
      document.body.appendChild(cursor);
      eraserCursorRef.current = cursor;
      const moveCursor = (event: PointerEvent) => {
        if (!eraserCursorRef.current) return;
        eraserCursorRef.current.style.left = `${event.clientX}px`;
        eraserCursorRef.current.style.top = `${event.clientY}px`;
      };
      eraserCursorMoveRef.current = moveCursor;
      window.addEventListener("pointermove", moveCursor, true);
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.skipTargetFind = true;

      const downHandler = (event: any) => {
        eraserGestureSavedRef.current = false;
        eraserPreviousPointRef.current = event.e
          ? canvas.getScenePoint(event.e)
          : null;
        eraseAtPointer(event);
      };

      const moveHandler = (event: any) => {
        if (!event.e) return;
        const current = canvas.getScenePoint(event.e);
        const previous = eraserPreviousPointRef.current;

        // Erase the entire swept capsule between pointer events in one pass.
        // This avoids repeatedly splitting the already-split stroke, which
        // caused curves to collapse into straight-looking fragments.
        // Keep the native pointer event intact. Spreading a MouseEvent creates
        // a plain object without reliable clientX/clientY properties, which
        // makes Fabric calculate the pointer as (0, 0) on subsequent moves.
        // Pass both scene-space points explicitly so every move keeps erasing.
        const eraseEvent = {
          ...event,
          e: Object.assign(event.e, {
            __eraserScenePoint: current,
            __eraserPreviousScenePoint: previous ?? current,
          }),
        };
        eraseAtPointer(eraseEvent);
        eraserPreviousPointRef.current = current;
      };

      const upHandler = () => {
        eraserGestureSavedRef.current = false;
        eraserPreviousPointRef.current = null;
      };

      eraserHandlersRef.current = {
        down: downHandler,
        move: moveHandler,
        up: upHandler,
      };

      canvas.on("mouse:down", downHandler);
      canvas.on("mouse:move", moveHandler);
      canvas.on("mouse:up", upHandler);
    } else {
      canvas.upperCanvasEl.style.cursor = "default";
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.skipTargetFind = false;

      canvas.getObjects().forEach((object) => {
        const item = object as typeof object & FabricObjectWithMeta;
        const id = item.elementId;
        const previous = id
          ? objectInteractionRef.current.get(id)
          : undefined;

        object.set({
          selectable: previous?.selectable ?? true,
          evented: previous?.evented ?? true,
        });
      });

      objectInteractionRef.current.clear();
    }

    canvas.requestRenderAll();
  }

  // Reapply the selected mode after the canvas is mounted.
  useEffect(() => {
    const timer = window.setInterval(() => {
      const canvas = canvasRef.current;

      if (canvas && canvas.freeDrawingBrush) {
        window.clearInterval(timer);
        setToolMode(toolModeRef.current);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  function addStickyNote() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    const note = new Textbox("Write your note here...", {
      left: 100,
      top: 100,
      width: 220,
      fontSize: 18,
      fontFamily: "Arial",
      fill: "#713f12",
      backgroundColor: "#fef08a",
      padding: 16,
      lineHeight: 1.3,
      editable: true,
      splitByGrapheme: false,
    });

    applyObjectControls(note);
    attachMetadata(note, "text");

    canvas.add(note);
    activateObject(note);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function addSignature() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    const signature = new IText("Your Signature", {
      left: 120,
      top: 120,
      fontSize: 36,
      fontFamily: "cursive",
      fontStyle: "italic",
      fill: "#111827",
      editable: true,
    });

    applyObjectControls(signature);
    attachMetadata(signature, "text");

    canvas.add(signature);
    activateObject(signature);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function addTable() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    const left = 100;
    const top = 100;
    const width = 360;
    const height = 180;
    const columns = 3;
    const rows = 4;
    const objects: any[] = [];

    for (let row = 0; row <= rows; row++) {
      const y = (height / rows) * row;

      const line = new Line([0, 0, width, 0], {
        left,
        top: top + y,
        stroke: "#374151",
        strokeWidth: 2,
        selectable: true,
        evented: true,
      });

      attachMetadata(line, "line");
      objects.push(line);
    }

    for (let column = 0; column <= columns; column++) {
      const x = (width / columns) * column;

      const line = new Line([0, 0, 0, height], {
        left: left + x,
        top,
        stroke: "#374151",
        strokeWidth: 2,
        selectable: true,
        evented: true,
      });

      attachMetadata(line, "line");
      objects.push(line);
    }

    objects.forEach((object) => canvas.add(object));

    activateObject(objects[0]);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function deleteSelected() {
    const canvas = canvasRef.current;

    if (!canvas || !selectedObject) return;

    saveCanvasState();

    canvas.remove(selectedObject);
    canvas.discardActiveObject();
    setSelectedObject(null);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  async function duplicateSelected() {
    const canvas = canvasRef.current;
    const original = selectedObject;

    if (!canvas || !original) return;

    saveCanvasState();

    try {
      const cloned = await original.clone(SERIALIZED_PROPERTIES);

      cloned.set({
        left: (original.left ?? 0) + 20,
        top: (original.top ?? 0) + 20,
      });

      const originalMeta = original as FabricObjectWithMeta;

      attachMetadata(
        cloned,
        originalMeta.elementType ?? "text",
        crypto.randomUUID(),
        {
          imageSrc: originalMeta.imageSrc,
          shapeSides: originalMeta.shapeSides,
          isFreehand: originalMeta.isFreehand,
        }
      );

      canvas.add(cloned);
      activateObject(cloned);
      canvas.requestRenderAll();
      syncCanvasToEditor();
    } catch (error) {
      console.error("Could not duplicate object:", error);
    }
  }

  function isTextSelected() {
    return Boolean(
      selectedObject &&
        (selectedObject.type === "i-text" ||
          selectedObject.type === "textbox")
    );
  }

  function updateSelectedText(
    updates: Record<string, unknown>,
    refreshDimensions = false
  ) {
    if (!isTextSelected()) return;

    saveCanvasState();
    selectedObject.set(updates);

    if (refreshDimensions) {
      selectedObject.initDimensions();
    }

    selectedObject.setCoords();
    canvasRef.current?.requestRenderAll();
    syncCanvasToEditor();
  }

  function increaseFontSize() {
    if (!isTextSelected()) return;

    updateSelectedText(
      { fontSize: (selectedObject.fontSize ?? 18) + 2 },
      true
    );
  }

  function decreaseFontSize() {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        fontSize: Math.max(
          8,
          (selectedObject.fontSize ?? 18) - 2
        ),
      },
      true
    );
  }

  function setFontSize(size: number) {
    if (!isTextSelected() || !Number.isFinite(size)) return;

    updateSelectedText(
      { fontSize: Math.max(8, Math.min(200, size)) },
      true
    );
  }

  function setTextColor(color: string) {
    if (!isTextSelected()) return;

    updateSelectedText({ fill: color });
  }

  function setShapeColor(color: string) {
    const canvas = canvasRef.current;

    if (!canvas || !selectedObject) return;

    const meta = selectedObject as FabricObjectWithMeta;

    if (
      meta.elementType &&
      LINE_TYPES.includes(meta.elementType)
    ) {
      saveCanvasState();
      selectedObject.set({ stroke: color });
    } else if (
      SHAPE_TYPES.includes(meta.elementType ?? "rectangle")
    ) {
      saveCanvasState();

      // Keep the outline in sync with the selected color for every shape.
      // Outline-only shapes (for example star-outline and vine) keep their fill transparent.
      const outlineOnly =
        meta.elementType === "star-outline" ||
        meta.elementType === "vine";

      selectedObject.set(
        outlineOnly
          ? { stroke: color }
          : { fill: color, stroke: color },
      );
    } else {
      return;
    }

    selectedObject.setCoords();
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function setFontFamily(fontFamily: string) {
    if (!isTextSelected()) return;

    updateSelectedText({ fontFamily }, true);
  }

  function toggleBold() {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        fontWeight:
          selectedObject.fontWeight === "bold"
            ? "normal"
            : "bold",
      },
      true
    );
  }

  function toggleItalic() {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        fontStyle:
          selectedObject.fontStyle === "italic"
            ? "normal"
            : "italic",
      },
      true
    );
  }

  function setLineSpacing(value: number) {
    if (!isTextSelected()) return;

    updateSelectedText(
      { lineHeight: Math.min(3, Math.max(1, value)) },
      true
    );
  }

  function setLetterSpacing(value: number) {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        charSpacing: Math.min(200, Math.max(0, value)) * 10,
      },
      true
    );
  }

  function alignObject(
    alignment: "left" | "center" | "right"
  ) {
    if (!isTextSelected()) return;

    updateSelectedText({ textAlign: alignment }, true);
  }

  function rotateSelected(degrees: number) {
    const canvas = canvasRef.current;

    if (!canvas || !selectedObject) return;

    saveCanvasState();

    selectedObject.set({
      angle: (selectedObject.angle ?? 0) + degrees,
    });

    selectedObject.setCoords();
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function changeObjectOrder(
    action: "forward" | "backward" | "front" | "back"
  ) {
    const canvas = canvasRef.current;

    if (!canvas || !selectedObject) return;

    saveCanvasState();

    if (action === "forward") {
      canvas.bringObjectForward(selectedObject);
    } else if (action === "backward") {
      canvas.sendObjectBackwards(selectedObject);
    } else if (action === "front") {
      canvas.bringObjectToFront(selectedObject);
    } else {
      canvas.sendObjectToBack(selectedObject);
    }

    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function bringForward() {
    changeObjectOrder("forward");
  }

  function sendBackward() {
    changeObjectOrder("backward");
  }

  function bringToFront() {
    changeObjectOrder("front");
  }

  function sendToBack() {
    changeObjectOrder("back");
  }

  function restoreSelection(id?: string) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const object = id
      ? canvas.getObjects().find(
          (item) =>
            (item as typeof item & FabricObjectWithMeta).elementId === id
        )
      : undefined;

    if (object) {
      canvas.setActiveObject(object);
      setSelectedObject(object);
    } else {
      canvas.discardActiveObject();
      setSelectedObject(null);
    }

    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  async function restoreCanvasState(
    snapshot: string,
    selectionId?: string
  ) {
    const canvas = canvasRef.current;

    if (!canvas) return;

    await canvas.loadFromJSON(JSON.parse(snapshot));
    restoreSelection(selectionId);
    setToolMode(toolModeRef.current);
  }

  function undo() {
    const canvas = canvasRef.current;

    if (!canvas || history.length === 0) return;

    const active = canvas.getActiveObject() as
      | (FabricObjectWithMeta & { [key: string]: any })
      | undefined;

    const previousState = history[history.length - 1];
    const currentState = getCanvasJSON(canvas);

    setFuture((previous) => [...previous, currentState]);
    setHistory((previous) => previous.slice(0, -1));

    void restoreCanvasState(previousState, active?.elementId).catch(
      (error) => console.error("Undo failed:", error)
    );
  }

  function redo() {
    const canvas = canvasRef.current;

    if (!canvas || future.length === 0) return;

    const active = canvas.getActiveObject() as
      | (FabricObjectWithMeta & { [key: string]: any })
      | undefined;

    const nextState = future[future.length - 1];
    const currentState = getCanvasJSON(canvas);

    setHistory((previous) => [...previous, currentState]);
    setFuture((previous) => previous.slice(0, -1));

    void restoreCanvasState(nextState, active?.elementId).catch(
      (error) => console.error("Redo failed:", error)
    );
  }

  async function saveCurrentDesign(name: string) {
    const elements = convertCanvasToElements();
    const trimmedName = name.trim();

    if (elements.length === 0 || !trimmedName) return;

    await saveDesign(trimmedName, elements);

    setHistory([]);
    setFuture([]);

    const canvas = canvasRef.current;

    if (canvas) {
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    }

    setSelectedObject(null);
  }

  function getDownloadName() {
    const name = currentDesignName.trim() || "certificate";

    return name
      .replace(/[^a-zA-Z0-9-_ ]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
  }

  function downloadPNG() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const activeObject = canvas.getActiveObject();

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 2,
      quality: 1,
    });

    const link = document.createElement("a");

    link.href = dataUrl;
    link.download = `${getDownloadName()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (activeObject) {
      canvas.setActiveObject(activeObject);
      setSelectedObject(activeObject);
    }

    canvas.requestRenderAll();
  }

  function downloadPDF() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const activeObject = canvas.getActiveObject();

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const width = canvas.getWidth();
    const height = canvas.getHeight();

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 2,
      quality: 1,
    });

    const pdf = new jsPDF({
      orientation: width >= height ? "landscape" : "portrait",
      unit: "px",
      format: [width, height],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
    pdf.save(`${getDownloadName()}.pdf`);

    if (activeObject) {
      canvas.setActiveObject(activeObject);
      setSelectedObject(activeObject);
    }

    canvas.requestRenderAll();
  }

  const value: FabricContextType = {
    canvasRef,
    selectedObject,
    setSelectedObject,

    convertCanvasToElements,
    selectObjectById,

    addText,
    addShape,
    addImage,

    deleteSelected,
    duplicateSelected,

    increaseFontSize,
    decreaseFontSize,
    setFontSize,
    setTextColor,
    setShapeColor,
    setFontFamily,
    toggleBold,
    toggleItalic,
    setLineSpacing,
    setLetterSpacing,

    alignObject,
    rotateSelected,

    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,

    undo,
    redo,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    selectedFontSize,

    setToolMode,
    setDrawingSettings,

    addStickyNote,
    addSignature,
    addTable,

    saveCurrentDesign,
    downloadPNG,
    downloadPDF,
  };

  return (
    <FabricContext.Provider value={value}>
      {children}
    </FabricContext.Provider>
  );
}

export function useFabric() {
  const context = useContext(FabricContext);

  if (!context) {
    throw new Error(
      "useFabric must be used inside FabricProvider"
    );
  }

  return context;
}
