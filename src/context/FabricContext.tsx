
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
  addSignature: () => void;
  addTable: () => void;

  saveCurrentDesign: (name: string) => Promise<void>;
 downloadPNG: (pageIds?: string[]) => Promise<void>;
  downloadPDF: (pageIds?: string[]) => void;
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
  if (!Number.isFinite(value)) return 1;

  const normalized = value > 1 ? value / 100 : value;
  return Math.max(0, Math.min(1, normalized));
}

function colorToRgba(color: string, opacity: number): string {
  const hex = color.trim().replace(/^#/, "");
  const validHex = /^[0-9a-fA-F]{6}$/.test(hex) ? hex : "222222";

  const red = parseInt(validHex.slice(0, 2), 16);
  const green = parseInt(validHex.slice(2, 4), 16);
  const blue = parseInt(validHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function sampleFreehandPath(path: any): Array<{ x: number; y: number }> {
  const stablePoints = (path as FabricObjectWithMeta).freehandScenePoints;

  if (stablePoints && stablePoints.length > 0) {
    return stablePoints.map((point) => ({ x: point.x, y: point.y }));
  }

  const commands = (path.path ?? []) as Array<Array<string | number>>;
  const matrix = path.calcTransformMatrix();
  const points: Array<{ x: number; y: number }> = [];
  let current = { x: 0, y: 0 };
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
      current = {
        x: values[0] ?? current.x,
        y: values[1] ?? current.y,
      };
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

  if (lengthSquared === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared,
    ),
  );

  return Math.hypot(
    point.x - (start.x + t * dx),
    point.y - (start.y + t * dy),
  );
}


function simplifyFreehandPoints(
  points: Array<{ x: number; y: number }>,
  tolerance = 0.45,
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points.map((point) => ({ ...point }));

  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  const toleranceSquared = tolerance * tolerance;

  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxDistance = toleranceSquared;
    let selected = -1;
    const start = points[first];
    const end = points[last];

    for (let i = first + 1; i < last; i++) {
      const distance = distanceToSegment(points[i], start, end);
      if (distance * distance > maxDistance) {
        maxDistance = distance * distance;
        selected = i;
      }
    }

    if (selected !== -1) {
      keep[selected] = 1;
      stack.push([first, selected], [selected, last]);
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

function splitFreehandPath(
  path: any,
  pointer: { x: number; y: number },
  radius: number,
  sweepStart: { x: number; y: number } = pointer,
): Array<Array<{ x: number; y: number }>> {
  const original = sampleFreehandPath(path);
  if (original.length < 2) return [];

  // Densely sample the curve so a short eraser pass cannot jump over
  // a narrow part of the stroke between two sampled points.
  const points: Array<{ x: number; y: number }> = [original[0]];
  const maxStep = Math.max(0.75, Math.min(2, radius / 5));

  for (let i = 1; i < original.length; i++) {
    const a = original[i - 1];
    const b = original[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(length / maxStep));

    for (let j = 1; j <= steps; j++) {
      const t = j / steps;
      points.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
    }
  }

  const threshold =
    Math.max(1, radius) + Math.max(1, Number(path.strokeWidth ?? 1) / 2);

  const inside = (point: { x: number; y: number }) =>
    distanceToSegment(point, sweepStart, pointer) <= threshold;

  // Locate the exact transition between retained and erased portions.
  const findBoundary = (
    outsidePoint: { x: number; y: number },
    insidePoint: { x: number; y: number },
  ) => {
    let low = 0;
    let high = 1;

    for (let iteration = 0; iteration < 22; iteration++) {
      const t = (low + high) / 2;
      const candidate = {
        x: outsidePoint.x + (insidePoint.x - outsidePoint.x) * t,
        y: outsidePoint.y + (insidePoint.y - outsidePoint.y) * t,
      };

      if (inside(candidate)) high = t;
      else low = t;
    }

    return {
      x: outsidePoint.x + (insidePoint.x - outsidePoint.x) * low,
      y: outsidePoint.y + (insidePoint.y - outsidePoint.y) * low,
    };
  };

  const runs: Array<Array<{ x: number; y: number }>> = [];
  let currentRun: Array<{ x: number; y: number }> = [];
  let previous = points[0];
  let previousInside = inside(previous);

  if (!previousInside) currentRun.push(previous);

  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    const pointInside = inside(point);

    if (!previousInside && !pointInside) {
      if (!currentRun.length) currentRun.push(previous);
      currentRun.push(point);
    } else if (!previousInside && pointInside) {
      if (!currentRun.length) currentRun.push(previous);
      const edge = findBoundary(previous, point);
      currentRun.push(edge);
      if (currentRun.length > 1) runs.push(currentRun);
      currentRun = [];
    } else if (previousInside && !pointInside) {
      const edge = findBoundary(point, previous);
      currentRun = [edge, point];
    } else {
      // Both points are inside the eraser sweep.
      currentRun = [];
    }

    previous = point;
    previousInside = pointInside;
  }

  if (currentRun.length > 1) runs.push(currentRun);

  // Remove duplicate neighbouring points and suppress tiny fragments left
  // around the eraser boundary. These fragments render as isolated dots/dashes
  // because round line caps are visible even when only a few pixels remain.
  // The threshold scales with the eraser size so a larger brush does not leave
  // proportionally larger remnants.
  const strokeWidth = Math.max(1, Number(path.strokeWidth ?? 1));
  // Round line caps make even very short retained paths look like isolated
  // dots. Keep only fragments long enough to read as an intentional stroke.
  // Scale this threshold with both the eraser radius and the source stroke,
  // rather than using a fixed pixel cutoff.
  const minimumVisibleLength = Math.max(
    strokeWidth * 4,
    radius * 6,
    24,
  );

  return runs
    .map((run) => {
      const cleaned: Array<{ x: number; y: number }> = [];

      for (const point of run) {
        const previousPoint = cleaned[cleaned.length - 1];
        if (
          !previousPoint ||
          Math.hypot(
            point.x - previousPoint.x,
            point.y - previousPoint.y,
          ) > 0.35
        ) {
          cleaned.push(point);
        }
      }

      return cleaned;
    })
    .filter((run) => {
      if (run.length < 2) return false;

      let length = 0;
      for (let i = 1; i < run.length; i++) {
        length += Math.hypot(
          run[i].x - run[i - 1].x,
          run[i].y - run[i - 1].y,
        );
      }

      return length >= minimumVisibleLength;
    });
}

function getStarPoints(points: number, outerRadius: number, innerRadius: number) {
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < points * 2; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;

    result.push({
      x: outerRadius + Math.cos(angle) * radius,
      y: outerRadius + Math.sin(angle) * radius,
    });
  }

  return result;
}

function getCogPoints(teeth: number, radius: number) {
  const result: { x: number; y: number }[] = [];
  const inner = radius * 0.78;

  for (let i = 0; i < teeth * 4; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI * 2) / (teeth * 4);
    const r = i % 4 < 2 ? radius : inner;

    result.push({
      x: radius + Math.cos(angle) * r,
      y: radius + Math.sin(angle) * r,
    });
  }

  return result;
}

function getFlowerPoints(petals: number, radius: number) {
  const result: { x: number; y: number }[] = [];
  const steps = petals * 24;

  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const r = radius * (0.68 + 0.32 * Math.cos(petals * angle));

    result.push({
      x: radius + Math.cos(angle) * r,
      y: radius + Math.sin(angle) * r,
    });
  }

  return result;
}

function getOrganicPoints(variant: number, radius: number) {
  const result: { x: number; y: number }[] = [];

  for (let i = 0; i < 80; i++) {
    const angle = (i / 80) * Math.PI * 2;
    const wave =
      Math.sin(angle * (variant + 2)) * 0.09 +
      Math.cos(angle * (variant + 3)) * 0.06;
    const r = radius * (0.83 + wave);

    result.push({
      x: radius + Math.cos(angle) * r,
      y: radius + Math.sin(angle) * r,
    });
  }

  return result;
}

function createSpecialShape(type: ShapeElementType): any {
  const common = {
    left: 100,
    top: 100,
    fill: "#2563eb",
    stroke: "#1d4ed8",
    strokeWidth: 2,
    strokeLineJoin: "round" as const,
    strokeLineCap: "round" as const,
    objectCaching: false,
  };

  const starMatch = type.match(/^(star|square-star)-(4|6|8|12|16|24|32)$/);

  if (
    type === "star" ||
    type === "star-outline" ||
    /^star-(4|6|8|12)$/.test(type)
  ) {
    const points =
      type === "star-4" ? 4 :
      type === "star-6" ? 6 :
      type === "star-8" ? 8 :
      type === "star-12" ? 12 : 5;

    return new Polygon(getStarPoints(points, 75, 34), {
      ...common,
      fill: type === "star-outline" ? "rgba(255,255,255,0)" : "#2563eb",
      strokeWidth: 3,
    });
  }

  if (starMatch) {
    const points = Number(starMatch[2]);

    return new Polygon(getStarPoints(points, 75, 41), {
      ...common,
      fill: "#fbbf24",
      stroke: "#b45309",
      strokeWidth: 2,
    });
  }

  const cogMatch = type.match(/^cog-(4|6|8|10|12|16|20|24)$/);

  if (cogMatch) {
    return new Polygon(getCogPoints(Number(cogMatch[1]), 75), {
      ...common,
      fill: "#94a3b8",
      stroke: "#475569",
      strokeWidth: 3,
    });
  }

  const flowers: Record<string, number> = {
    flower: 6,
    "flower-5": 5,
    "flower-6": 6,
    "flower-8": 8,
    "flower-12": 12,
    "flower-daisy": 12,
    "flower-sunflower": 16,
    "flower-rose": 10,
    "flower-lotus": 8,
    "flower-lily": 6,
    "flower-tulip": 5,
    "flower-hibiscus": 5,
    "flower-cherry-blossom": 5,
    petal: 5,
    "petal-rounded": 6,
    "petal-pointed": 4,
  };

  if (type in flowers) {
    const sunflower = type === "flower-sunflower";

    return new Polygon(getFlowerPoints(flowers[type], 75), {
      ...common,
      fill: sunflower ? "#facc15" : "#f9a8d4",
      stroke: sunflower ? "#92400e" : "#be185d",
      strokeWidth: 2,
    });
  }

  const organic: Record<string, number> = {
    "organic-blob": 1,
    "organic-blob-2": 2,
    "organic-blob-3": 3,
    "organic-cloud": 4,
    "organic-splash": 5,
    "organic-pebble": 6,
  };

  if (type in organic) {
    return new Polygon(getOrganicPoints(organic[type], 75), {
      ...common,
      fill: "#c4b5fd",
      stroke: "#7c3aed",
    });
  }

  if (type === "organic-wave" || type === "organic-wave-2") {
    const path =
      type === "organic-wave"
        ? "M 0 35 Q 35 0 70 35 T 140 35 L 140 90 L 0 90 Z"
        : "M 0 45 C 25 0 50 90 75 45 S 125 0 150 45 L 150 90 L 0 90 Z";

    return new Path(path, {
      ...common,
      fill: "#a5f3fc",
      stroke: "#0891b2",
      strokeWidth: 3,
    });
  }

  if (["leaf", "leaf-rounded", "leaf-pointed"].includes(type)) {
    const path =
      type === "leaf-rounded"
        ? "M 0 50 Q 10 0 75 0 Q 75 50 0 50 Z"
        : "M 0 50 Q 15 0 75 0 Q 70 40 0 50 Z";

    return new Path(path, {
      ...common,
      fill: "#86efac",
      stroke: "#15803d",
      strokeWidth: 2,
    });
  }

  if (type === "leaf-pair") {
    return new Path(
      "M 0 50 Q 15 0 75 0 Q 70 40 0 50 Z M 75 50 Q 90 0 150 0 Q 145 40 75 50 Z",
      {
        ...common,
        fill: "#86efac",
        stroke: "#15803d",
        strokeWidth: 2,
      },
    );
  }

  if (type === "vine") {
    return new Path(
      "M 0 100 Q 40 80 30 50 Q 20 20 60 15 Q 100 10 95 45 Q 90 75 130 70 Q 165 65 150 30",
      {
        ...common,
        fill: "",
        stroke: "#15803d",
        strokeWidth: 5,
      },
    );
  }

  if (type === "flow-process") {
    return new Rect({ ...common, width: 180, height: 90 });
  }

  if (type === "flow-decision") {
    return new Polygon(
      [
        { x: 90, y: 0 },
        { x: 180, y: 55 },
        { x: 90, y: 110 },
        { x: 0, y: 55 },
      ],
      common,
    );
  }

  if (type === "flow-terminator") {
    return new Rect({ ...common, width: 180, height: 85, rx: 42, ry: 42 });
  }

  if (type === "flow-io") {
    return new Polygon(
      [
        { x: 35, y: 0 },
        { x: 180, y: 0 },
        { x: 145, y: 90 },
        { x: 0, y: 90 },
      ],
      common,
    );
  }

  if (type === "flow-document") {
    return new Path(
      "M 0 0 L 180 0 L 180 75 Q 150 95 120 80 Q 90 65 60 80 Q 30 95 0 80 Z",
      common,
    );
  }

  if (type === "flow-connector") {
    return new Circle({ ...common, radius: 32 });
  }

  if (type === "flow-preparation") {
    return new Polygon(
      [
        { x: 45, y: 0 },
        { x: 135, y: 0 },
        { x: 180, y: 45 },
        { x: 135, y: 90 },
        { x: 45, y: 90 },
        { x: 0, y: 45 },
      ],
      common,
    );
  }

  if (type === "flow-manual-input") {
    return new Polygon(
      [
        { x: 0, y: 25 },
        { x: 180, y: 0 },
        { x: 180, y: 90 },
        { x: 0, y: 90 },
      ],
      common,
    );
  }

  if (type === "speech-bubble") {
    return new Path(
      "M 0 0 L 180 0 L 180 90 L 55 90 L 30 115 L 35 90 L 0 90 Z",
      common,
    );
  }

  if (type === "chat-bubble") {
    return new Path(
      "M 20 0 L 160 0 Q 180 0 180 20 L 180 70 Q 180 90 160 90 L 55 90 L 25 115 L 30 90 L 20 90 Q 0 90 0 70 L 0 20 Q 0 0 20 0 Z",
      common,
    );
  }

  if (type === "thought-bubble") {
    return new Path(
      "M 30 15 C 5 15 0 45 15 60 C 0 85 25 105 50 95 C 70 120 100 105 105 90 C 135 100 155 80 145 60 C 170 35 145 10 125 20 C 105 -5 70 0 60 15 C 50 10 40 10 30 15 Z",
      common,
    );
  }

  if (type === "rounded-bubble") {
    return new Rect({ ...common, width: 180, height: 95, rx: 24, ry: 24 });
  }

  return null;
}

export function FabricProvider({
  children,
}: {
  children: ReactNode;
}) {
  const canvasRef = useRef<FabricCanvas | null>(null);

  const [selectedObject, setSelectedObjectState] = useState<any>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const [, setToolModeState] = useState<ToolMode>("select");
  const toolModeRef = useRef<ToolMode>("select");

  const [, setDrawingSettingsState] = useState<DrawingSettings>({
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
    new Map<string, { selectable: boolean; evented: boolean }>(),
  );

  const eraserHandlersRef = useRef<{
    down?: (event: any) => void;
    move?: (event: any) => void;
    up?: (event: any) => void;
  }>({});

  const eraserGestureSavedRef = useRef(false);
  const eraserPreviousPointRef = useRef<{ x: number; y: number } | null>(null);
  const eraserPointerDownRef = useRef(false);
  const eraserCursorRef = useRef<HTMLDivElement | null>(null);
  const eraserCursorMoveRef = useRef<((event: PointerEvent) => void) | null>(null);
  const eraserCursorEnterRef = useRef<(() => void) | null>(null);
  const eraserCursorLeaveRef = useRef<(() => void) | null>(null);

  const drawingHistoryHandlerRef = useRef<((event: any) => void) | null>(null);
  const pathCreatedHandlerRef = useRef<((event: any) => void) | null>(null);

  const {
    saveDesign,
    currentDesignName,
    syncElementsFromCanvas,
    pages,
    activePageId,
    selectPage,
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
    return JSON.stringify(canvas.toObject(SERIALIZED_PROPERTIES));
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

    syncElementsFromCanvas(convertCanvasToElements(), activePageId);
  }

  function convertCanvasToElements(): EditorElement[] {
    const canvas = canvasRef.current;
    if (!canvas) return [];

    return canvas.getObjects().map((object) => {
      const item = object as typeof object & FabricObjectWithMeta;
      let type = item.elementType;

      if (!type) {
        if (object.type === "i-text" || object.type === "textbox") {
          type = "text";
        } else if (object.type === "rect") {
          type = "rectangle";
        } else if (object.type === "circle") {
          type = "circle";
        } else if (object.type === "triangle") {
          type = "triangle";
        } else if (object.type === "polygon") {
          type = "polygon";
        } else if (object.type === "line" || object.type === "path") {
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
        // Freehand Path objects are reconstructed around their center origin.
        // Store that center point so eraser-created fragments keep the exact
        // same position after page switching and page duplication.
        x: item.isFreehand && object.type === "path"
          ? object.getCenterPoint().x
          : object.left ?? 0,
        y: item.isFreehand && object.type === "path"
          ? object.getCenterPoint().y
          : object.top ?? 0,
        width: object.width ?? 0,
        height: object.height ?? 0,
        scaleX: object.scaleX ?? 1,
        scaleY: object.scaleY ?? 1,
        angle: object.angle ?? 0,
        opacity: object.opacity ?? 1,
      };

      if (object.type === "i-text" || object.type === "textbox") {
        const textObject = object as IText;

        element.text = textObject.text ?? "";
        element.fontSize = textObject.fontSize ?? 18;
        element.fontFamily = textObject.fontFamily ?? "Arial";
        element.color =
          typeof textObject.fill === "string"
            ? textObject.fill
            : "#111827";

        element.fontWeight =
          textObject.fontWeight === "bold" ? "bold" : "normal";

        element.fontStyle =
          textObject.fontStyle === "italic" ? "italic" : "normal";

        element.lineHeight = textObject.lineHeight ?? 1.16;
        element.charSpacing = textObject.charSpacing ?? 0;

        element.textAlign =
          (
            textObject as IText & {
              textAlign?: "left" | "center" | "right" | "justify";
            }
          ).textAlign ?? "left";

        const backgroundColor = (
          textObject as IText & { backgroundColor?: string }
        ).backgroundColor;

        if (backgroundColor) {
          element.backgroundColor = backgroundColor;
        }
      }

      if (SHAPE_TYPES.includes(type)) {
        element.backgroundColor =
          typeof object.fill === "string" ? object.fill : "#2563eb";

        // Preserve outlines on every shape (including stars, cogs and flowers)
        // when the canvas is serialized and reconstructed for a copied page.
        element.strokeColor =
          typeof object.stroke === "string" ? object.stroke : "";
        element.strokeWidth =
          typeof object.strokeWidth === "number" ? object.strokeWidth : 0;

        if (item.shapeSides) {
          element.shapeSides = item.shapeSides;
        }
      }

      if (item.isFreehand && object.type === "path") {
        element.pathData = ((object as any).path ?? []).map(
          (command: any[]) => [...command],
        );
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
          object as typeof object & { strokeDashArray?: number[] }
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
        (item as typeof item & FabricObjectWithMeta).elementId === id,
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
    },
  ) {
    const item = object as FabricObjectWithMeta;
    item.elementId = id;
    item.elementType = type;

    if (extra?.imageSrc) item.imageSrc = extra.imageSrc;
    if (extra?.shapeSides) item.shapeSides = extra.shapeSides;
    if (extra?.isFreehand) item.isFreehand = true;
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
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / sides;

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
    >,
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

    if (type === "line" || type === "dashed-line" || type === "dotted-line") {
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
        commonOptions,
      );
    }

    return new Path(
      `M 0 0 L ${width} 0
       M 0 0 L 18 -12
       M 0 0 L 18 12
       M ${width} 0 L ${width - 18} -12
       M ${width} 0 L ${width - 18} 12`,
      commonOptions,
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

      object = new Polygon(getPolygonPoints(sides, 75), {
        left: 100,
        top: 100,
        fill: "#2563eb",
      });
    } else if (LINE_TYPES.includes(type)) {
      object = createLineObject(
        type as Extract<
          ElementType,
          "line" | "arrow" | "double-arrow" | "dashed-line" | "dotted-line"
        >,
      );
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
    settings: DrawingSettings,
  ) {
    if (mode !== "pen" && mode !== "marker" && mode !== "highlighter") {
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

    const configuredOpacity = normalizeOpacity(settings.opacity);
    const opacity =
      mode === "highlighter"
        ? Math.min(configuredOpacity, 0.3)
        : configuredOpacity;

    brush.color = colorToRgba(settings.color, opacity);
    brush.width = width;
    canvas.freeDrawingBrush = brush;
  }

  function setDrawingSettings(settings: Partial<DrawingSettings>) {
  const next: DrawingSettings = {
    ...drawingSettingsRef.current,
    ...settings,
  };

  next.width = Number.isFinite(next.width)
    ? Math.max(1, Math.min(50, next.width))
    : 5;

  next.opacity = normalizeOpacity(next.opacity);

  drawingSettingsRef.current = next;
  setDrawingSettingsState(next);

  const canvas = canvasRef.current;

  if (!canvas) return;

  configureDrawingBrush(canvas, toolModeRef.current, next);

  // Update the visible eraser cursor immediately when its size changes.
  if (toolModeRef.current === "eraser" && eraserCursorRef.current) {
    const cursorSize = Math.max(
      18,
      Math.min(110, Math.round(next.width * 2 + 10)),
    );

    eraserCursorRef.current.style.width = `${cursorSize}px`;
    eraserCursorRef.current.style.height = `${cursorSize}px`;
  }

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

    const pointer =
      event.e.__eraserScenePoint ?? canvas.getScenePoint(event.e);

    const sweepStart =
      event.e.__eraserPreviousScenePoint ?? pointer;

    const radius = Math.max(5, drawingSettingsRef.current.width * 1.15);

    const freehandObjects = [...canvas.getObjects()]
      .reverse()
      .filter((object) =>
        Boolean((object as typeof object & FabricObjectWithMeta).isFreehand) &&
        object.type === "path",
      );

    let canvasChanged = false;

    for (const target of freehandObjects) {
      // Use the same scene-space points that the eraser uses for clipping.
      // Fabric's getBoundingRect() can become stale/inconsistent after a
      // replacement Path is created, causing the eraser to stop detecting
      // the remaining pieces after the first pass.
      const sampled = sampleFreehandPath(target);
      if (sampled.length < 2) continue;

      const bounds = sampled.reduce(
        (result, point) => ({
          minX: Math.min(result.minX, point.x),
          minY: Math.min(result.minY, point.y),
          maxX: Math.max(result.maxX, point.x),
          maxY: Math.max(result.maxY, point.y),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        },
      );

      const sweepMinX = Math.min(pointer.x, sweepStart.x) - radius;
      const sweepMaxX = Math.max(pointer.x, sweepStart.x) + radius;
      const sweepMinY = Math.min(pointer.y, sweepStart.y) - radius;
      const sweepMaxY = Math.max(pointer.y, sweepStart.y) + radius;

      if (
        sweepMaxX < bounds.minX ||
        sweepMinX > bounds.maxX ||
        sweepMaxY < bounds.minY ||
        sweepMinY > bounds.maxY
      ) {
        continue;
      }

      const item = target as typeof target & FabricObjectWithMeta;
      const runs = splitFreehandPath(target, pointer, radius, sweepStart);
      const threshold =
        radius + Math.max(1, ((target as any).strokeWidth ?? 1) / 2);

      const actuallyTouched = sampled.some((point, index) => {
        const previous = sampled[index - 1];

        return (
          distanceToSegment(point, sweepStart, pointer) <= threshold ||
          Boolean(
            previous &&
            distanceToSegment(sweepStart, previous, point) <= threshold,
          ) ||
          Boolean(
            previous &&
            distanceToSegment(pointer, previous, point) <= threshold,
          )
        );
      });

      if (!actuallyTouched) continue;

      // If the pointer actually crossed this stroke and no visible retained
      // segment remains, the stroke has been fully erased. Do not keep the
      // original object: doing so leaves tiny caps/dots after repeated passes.
      if (runs.length === 0) {
        if (!eraserGestureSavedRef.current) {
          saveCanvasState();
          eraserGestureSavedRef.current = true;
        }
        canvas.remove(target);
        canvasChanged = true;
        continue;
      }

      if (!eraserGestureSavedRef.current) {
        saveCanvasState();
        eraserGestureSavedRef.current = true;
      }

      const replacements: Path[] = [];

      for (const rawRun of runs) {
        // The clipping pass samples densely for accuracy. Simplify only the
        // retained geometry before building Fabric paths, preventing path
        // command counts from growing on every mouse-move event.
        const run = simplifyFreehandPoints(rawRun, 0.45);
        if (run.length < 2) continue;

        const minX = Math.min(...run.map((point) => point.x));
        const minY = Math.min(...run.map((point) => point.y));
        const maxX = Math.max(...run.map((point) => point.x));
        const maxY = Math.max(...run.map((point) => point.y));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Keep the remaining freehand stroke smooth after erasing.
        // Using L for every sampled point turns curved pen/marker/highlighter
        // strokes into visibly straight, angular segments.
        const toLocal = (point: { x: number; y: number }) => ({
          x: point.x - centerX,
          y: point.y - centerY,
        });
        const firstPoint = toLocal(run[0]);
        const commands: (string | number)[][] = [
          ["M", firstPoint.x, firstPoint.y],
        ];

        if (run.length === 2) {
          const lastPoint = toLocal(run[1]);
          commands.push(["L", lastPoint.x, lastPoint.y]);
        } else {
          // Quadratic curves through midpoints approximate the original
          // freehand curve without changing the untouched portions' path.
          for (let i = 1; i < run.length - 1; i++) {
            const control = toLocal(run[i]);
            const next = toLocal(run[i + 1]);
            const midpoint = {
              x: (control.x + next.x) / 2,
              y: (control.y + next.y) / 2,
            };
            commands.push(["Q", control.x, control.y, midpoint.x, midpoint.y]);
          }
          const lastPoint = toLocal(run[run.length - 1]);
          commands.push(["Q", lastPoint.x, lastPoint.y, lastPoint.x, lastPoint.y]);
        }

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
        replacementMeta.freehandScenePoints = run.map((point) => ({
          x: point.x,
          y: point.y,
        }));

        replacement.setCoords();
        replacements.push(replacement);
      }

      // A touched stroke must not be restored when every retained fragment
      // is below the visibility threshold. Remove the original in that case.
      if (replacements.length === 0) {
        canvas.remove(target);
        canvasChanged = true;
        continue;
      }

      canvas.remove(target);
      replacements.forEach((replacement) => canvas.add(replacement));
      canvasChanged = true;
    }

    if (canvasChanged) {
      canvas.requestRenderAll();
      // Sync once per pointer event, not once per affected stroke. This keeps
      // long erase gestures responsive when a page contains many strokes.
      syncCanvasToEditor();
    }
  }

  function removeToolHandlers(canvas: FabricCanvas) {
    const previousEraser = eraserHandlersRef.current;

    if (previousEraser.down) canvas.off("mouse:down", previousEraser.down);
    if (previousEraser.move) canvas.off("mouse:move", previousEraser.move);
    if (previousEraser.up) canvas.off("mouse:up", previousEraser.up);

    eraserHandlersRef.current = {};
    eraserPreviousPointRef.current = null;

    if (eraserCursorEnterRef.current) {
      canvas.upperCanvasEl.removeEventListener(
        "pointerenter",
        eraserCursorEnterRef.current,
      );
      eraserCursorEnterRef.current = null;
    }

    if (eraserCursorLeaveRef.current) {
      canvas.upperCanvasEl.removeEventListener(
        "pointerleave",
        eraserCursorLeaveRef.current,
      );
      eraserCursorLeaveRef.current = null;
    }

    canvas.upperCanvasEl.style.cursor = "default";

    if (eraserCursorMoveRef.current) {
      window.removeEventListener(
        "pointermove",
        eraserCursorMoveRef.current,
        true,
      );
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

    if (!canvas) return;

    removeToolHandlers(canvas);
    canvas.isDrawingMode = false;
    canvas.selection = mode === "select";
    canvas.skipTargetFind = mode !== "select";

    if (mode === "pen" || mode === "marker" || mode === "highlighter") {
      configureDrawingBrush(canvas, mode, drawingSettingsRef.current);
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

        object.set({ selectable: false, evented: false });
      });

      const historyHandler = () => saveCanvasState();
      drawingHistoryHandlerRef.current = historyHandler;
      canvas.on("mouse:down", historyHandler);

      const pathHandler = (event: any) => handleFreehandPathCreated(event);
      pathCreatedHandlerRef.current = pathHandler;
      canvas.on("path:created", pathHandler);
    } else if (mode === "eraser") {
      canvas.upperCanvasEl.style.cursor = "default";

      const cursorSize = Math.max(
        18,
        Math.min(48, Math.round(drawingSettingsRef.current.width * 2 + 10)),
      );

      const cursor = document.createElement("div");
      cursor.setAttribute("aria-hidden", "true");
      cursor.style.position = "fixed";
      cursor.style.left = "-100px";
      cursor.style.top = "-100px";
      cursor.style.width = `${cursorSize}px`;
      cursor.style.height = `${cursorSize}px`;
      cursor.style.boxSizing = "border-box";
      cursor.style.border = "1.5px solid #111827";
      cursor.style.borderRadius = "0";
      cursor.style.background = "rgba(255,255,255,0.2)";
      cursor.style.display = "none";
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

      const showCursor = () => {
        if (!eraserCursorRef.current) return;
        eraserCursorRef.current.style.display = "block";
        canvas.upperCanvasEl.style.cursor = "none";
      };

      const hideCursor = () => {
        if (eraserCursorRef.current) {
          eraserCursorRef.current.style.display = "none";
        }
        canvas.upperCanvasEl.style.cursor = "default";
      };

      eraserCursorEnterRef.current = showCursor;
      eraserCursorLeaveRef.current = hideCursor;

      canvas.upperCanvasEl.addEventListener("pointerenter", showCursor);
      canvas.upperCanvasEl.addEventListener("pointerleave", hideCursor);

      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.skipTargetFind = true;

      const downHandler = (event: any) => {
        // Erasing starts only after an actual primary-button press inside canvas.
        if (!event.e || (typeof event.e.button === "number" && event.e.button !== 0)) return;
        eraserPointerDownRef.current = true;
        eraserGestureSavedRef.current = false;
        const point = canvas.getScenePoint(event.e);
        eraserPreviousPointRef.current = point;
        const eraseEvent = {
          ...event,
          e: Object.assign(event.e, {
            __eraserScenePoint: point,
            __eraserPreviousScenePoint: point,
          }),
        };
        eraseAtPointer(eraseEvent);
      };

      const moveHandler = (event: any) => {
        // Moving/hovering the eraser must never modify the drawing.
        if (!eraserPointerDownRef.current || !event.e) return;

        const current = canvas.getScenePoint(event.e);
        const previous = eraserPreviousPointRef.current ?? current;
        const eraseEvent = {
          ...event,
          e: Object.assign(event.e, {
            __eraserScenePoint: current,
            __eraserPreviousScenePoint: previous,
          }),
        };

        eraseAtPointer(eraseEvent);
        eraserPreviousPointRef.current = current;
      };

      const upHandler = () => {
        eraserPointerDownRef.current = false;
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
        },
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
        selectedObject.type === "textbox"),
    );
  }

  function updateSelectedText(
    updates: Record<string, unknown>,
    refreshDimensions = false,
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
      true,
    );
  }

  function decreaseFontSize() {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        fontSize: Math.max(8, (selectedObject.fontSize ?? 18) - 2),
      },
      true,
    );
  }

  function setFontSize(size: number) {
    if (!isTextSelected() || !Number.isFinite(size)) return;

    updateSelectedText(
      { fontSize: Math.max(8, Math.min(200, size)) },
      true,
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

    if (meta.elementType && LINE_TYPES.includes(meta.elementType)) {
      saveCanvasState();
      selectedObject.set({ stroke: color });
    } else if (SHAPE_TYPES.includes(meta.elementType ?? "rectangle")) {
      saveCanvasState();

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
          selectedObject.fontWeight === "bold" ? "normal" : "bold",
      },
      true,
    );
  }

  function toggleItalic() {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        fontStyle:
          selectedObject.fontStyle === "italic" ? "normal" : "italic",
      },
      true,
    );
  }

  function setLineSpacing(value: number) {
    if (!isTextSelected()) return;

    updateSelectedText(
      { lineHeight: Math.min(3, Math.max(1, value)) },
      true,
    );
  }

  function setLetterSpacing(value: number) {
    if (!isTextSelected()) return;

    updateSelectedText(
      {
        charSpacing: Math.min(200, Math.max(0, value)) * 10,
      },
      true,
    );
  }

  // UPDATED: justify alignment is now supported.
  function alignObject(
    alignment: "left" | "center" | "right" | "justify"
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
    action: "forward" | "backward" | "front" | "back",
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
            (item as typeof item & FabricObjectWithMeta).elementId === id,
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
    selectionId?: string,
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
      (error) => console.error("Undo failed:", error),
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
      (error) => console.error("Redo failed:", error),
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

  async function downloadPNG(pageIds?: string[]) {
    const initialCanvas = canvasRef.current;
    if (!initialCanvas) return;

    // Save any text currently being edited before exporting.
    const editingObject = initialCanvas.getActiveObject();

    if (
      (editingObject instanceof IText || editingObject instanceof Textbox) &&
      editingObject.isEditing
    ) {
      editingObject.exitEditing();
      initialCanvas.requestRenderAll();
    }

    // Synchronize the currently visible page with EditorContext.
    syncCanvasToEditor();

    const liveElements = convertCanvasToElements();

    const sourcePages =
      Array.isArray(pages) && pages.length > 0
        ? pages
        : [
            {
              id: activePageId,
              name: "Page 1",
              elements: [],
              backgroundColor: String(
                initialCanvas.backgroundColor || "#ffffff",
              ),
              pageSize: "A4" as const,
              orientation: "landscape" as const,
            },
          ];

    // Always use live canvas data for the currently active page.
    const pageList = sourcePages.map((page) =>
      page.id === activePageId
        ? {
            ...page,
            elements: liveElements,
            backgroundColor: String(
              initialCanvas.backgroundColor ||
                page.backgroundColor ||
                "#ffffff",
            ),
          }
        : page,
    );

    // If pageIds is undefined, export all pages.
    // If an empty array is passed, export nothing.
    const pagesToExport =
      pageIds === undefined
        ? pageList
        : pageList.filter((page) => pageIds.includes(page.id));

    if (pagesToExport.length === 0) {
      console.warn("PNG export cancelled: no pages were selected.");
      return;
    }

    const originalPageId = activePageId;

    const originalActiveObjectId = (
      initialCanvas.getActiveObject() as any
    )?.elementId as string | undefined;

    let currentPageId = activePageId;

    const waitFrame = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

    const pageIsRendered = (
      page: (typeof pagesToExport)[number],
    ) => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return false;

      const actual = convertCanvasToElements();
      const expected = page.elements ?? [];

      if (expected.length !== actual.length) return false;

      const normalizeColor = (value: unknown) => {
        const color = String(value ?? "#ffffff")
          .trim()
          .toLowerCase();

        if (/^#[0-9a-f]{3}$/.test(color)) {
          return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
        }

        return color;
      };

      if (
        normalizeColor(page.backgroundColor) !==
        normalizeColor(currentCanvas.backgroundColor)
      ) {
        return false;
      }

      const close = (
        a: number | undefined,
        b: number | undefined,
      ) => Math.abs(Number(a ?? 0) - Number(b ?? 0)) <= 2;

      return expected.every((item, index) => {
        const rendered = actual[index];

        if (
          !rendered ||
          item.id !== rendered.id ||
          item.type !== rendered.type
        ) {
          return false;
        }

        return (
          close(item.x, rendered.x) &&
          close(item.y, rendered.y)
        );
      });
    };

    const waitForPage = async (
      page: (typeof pagesToExport)[number],
    ) => {
      const timeoutAt = Date.now() + 15000;
      let matches = 0;

      while (Date.now() < timeoutAt) {
        await waitFrame();

        if (pageIsRendered(page)) {
          matches += 1;

          if (matches >= 2) {
            canvasRef.current?.requestRenderAll();
            await waitFrame();
            return;
          }
        } else {
          matches = 0;
        }
      }

      throw new Error(
        `Page "${page.name}" did not finish rendering for PNG export.`,
      );
    };

    try {
      for (let index = 0; index < pagesToExport.length; index++) {
        const page = pagesToExport[index];

        // Switch to the page that needs to be exported.
        if (page.id !== currentPageId) {
          selectPage(page.id);
          currentPageId = page.id;
        }

        // Wait until Fabric has loaded the correct page.
        await waitForPage(page);

        const currentCanvas = canvasRef.current;

        if (!currentCanvas) {
          throw new Error(
            "The editor canvas is unavailable during PNG export.",
          );
        }

        // Remove selection borders and controls from the exported image.
        const active = currentCanvas.getActiveObject();

        if (
          (active instanceof IText || active instanceof Textbox) &&
          active.isEditing
        ) {
          active.exitEditing();
        }

        currentCanvas.discardActiveObject();
        currentCanvas.requestRenderAll();

        await waitFrame();
        await waitFrame();

        // Capture this page as a separate PNG.
        const dataUrl = currentCanvas.toDataURL({
          format: "png",
          multiplier: 2,
          quality: 1,
        });

        const safePageName = String(
          page.name || `page-${index + 1}`,
        )
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .toLowerCase();

        const link = document.createElement("a");

        link.href = dataUrl;
        link.download = `${getDownloadName()}-${safePageName || `page-${index + 1}`}.png`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Give the browser time to start this download before
        // triggering the next page's download.
        await waitFrame();
        await new Promise<void>((resolve) => {
          window.setTimeout(resolve, 250);
        });
      }
    } catch (error) {
      console.error("Failed to export PNG pages:", error);

      window.alert(
        "PNG download nahi ho paya. Please console error check karein aur dobara try karein.",
      );
    } finally {
      // Restore the page that was open before exporting.
      if (originalPageId && originalPageId !== currentPageId) {
        selectPage(originalPageId);
        currentPageId = originalPageId;

        const originalPage = pageList.find(
          (page) => page.id === originalPageId,
        );

        if (originalPage) {
          try {
            await waitForPage(originalPage);
          } catch (restoreError) {
            console.error(
              "Unable to restore the original page after PNG export:",
              restoreError,
            );
          }
        }
      }

      // Restore the previously selected object.
      const restoredCanvas = canvasRef.current;

      if (restoredCanvas && originalActiveObjectId) {
        const restoredObject = restoredCanvas
          .getObjects()
          .find(
            (object: any) =>
              object.elementId === originalActiveObjectId,
          );

        if (restoredObject) {
          restoredCanvas.setActiveObject(restoredObject);
          setSelectedObject(restoredObject);
        }
      }

      restoredCanvas?.requestRenderAll();
    }
  }


  async function downloadPDF(pageIds?: string[]) {
    const initialCanvas = canvasRef.current;
    if (!initialCanvas) return;

    // Commit in-progress text editing before reading the page snapshot.
    const editingObject = initialCanvas.getActiveObject();
    if (
      (editingObject instanceof IText || editingObject instanceof Textbox) &&
      editingObject.isEditing
    ) {
      editingObject.exitEditing();
      initialCanvas.requestRenderAll();
    }

    // This synchronously updates EditorContext's latest-elements ref before any
    // page switch can occur. The current page is always taken from the live canvas.
    syncCanvasToEditor();
    const liveElements = convertCanvasToElements();

    const sourcePages = Array.isArray(pages) && pages.length > 0
      ? pages
      : [{
          id: activePageId,
          name: "Page 1",
          elements: [],
          backgroundColor: String(initialCanvas.backgroundColor || "#ffffff"),
          pageSize: "A4" as const,
          orientation: "landscape" as const,
        }];

    // Do not use stale React page data for the page currently displayed.
    const pageList = sourcePages.map((page) =>
      page.id === activePageId
        ? {
            ...page,
            elements: liveElements,
            backgroundColor: String(initialCanvas.backgroundColor || page.backgroundColor || "#ffffff"),
          }
        : page,
    );

    // An explicitly empty selection means export nothing, not every page.
    const pagesToExport = pageIds === undefined
      ? pageList
      : pageList.filter((page) => pageIds.includes(page.id));

    if (pagesToExport.length === 0) {
      console.warn("PDF export cancelled: no pages were selected.");
      return;
    }

    const originalPageId = activePageId;
    const originalActiveObjectId = (initialCanvas.getActiveObject() as any)?.elementId as string | undefined;
    let currentPageId = activePageId;
    let pdf: jsPDF | null = null;

    const waitFrame = () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const pageIsRendered = (page: (typeof pagesToExport)[number]) => {
      const currentCanvas = canvasRef.current;
      if (!currentCanvas) return false;

      const actual = convertCanvasToElements();
      const expected = page.elements ?? [];
      if (expected.length !== actual.length) return false;

      // Normalize common hex color forms so equivalent backgrounds compare equal.
      const normalizeColor = (value: unknown) => {
        const color = String(value ?? "#ffffff").trim().toLowerCase();
        if (/^#[0-9a-f]{3}$/.test(color)) {
          return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
        }
        return color;
      };
      if (
        normalizeColor(page.backgroundColor) !==
        normalizeColor(currentCanvas.backgroundColor)
      ) return false;

      // Element IDs can be normalized while Fabric rebuilds a page. Match visible
      // content and scene positions instead, so export waits for the target page.
      const close = (a: number | undefined, b: number | undefined) =>
        Math.abs(Number(a ?? 0) - Number(b ?? 0)) <= 2;

      return expected.every((item, index) => {
        const rendered = actual[index];
        if (!rendered || item.id !== rendered.id || item.type !== rendered.type) {
          return false;
        }
        // Text is intentionally not used as a render-readiness signal: the
        // React page snapshot may lag one render behind the live Fabric text.
        // The synchronous EditorContext snapshot fix ensures page switches
        // reload the latest text; coordinates still must match before capture.
        return close(item.x, rendered.x) && close(item.y, rendered.y);
      });
    };

    const waitForPage = async (page: (typeof pagesToExport)[number]) => {
      const timeoutAt = Date.now() + 15000;
      let matches = 0;

      while (Date.now() < timeoutAt) {
        await waitFrame();
        if (pageIsRendered(page)) {
          matches += 1;
          if (matches >= 2) {
            // Let Fabric complete the render after the target content is present.
            canvasRef.current?.requestRenderAll();
            await waitFrame();
            return;
          }
        } else {
          matches = 0;
        }
      }

      throw new Error(`Page "${page.name}" did not finish rendering for PDF export.`);
    };

    try {
      for (const page of pagesToExport) {
        if (page.id !== currentPageId) {
          selectPage(page.id);
          currentPageId = page.id;
        }

        await waitForPage(page);

        const currentCanvas = canvasRef.current;
        if (!currentCanvas) {
          throw new Error("The editor canvas is unavailable during PDF export.");
        }

        // Exit active text editing and remove only selection controls. No object
        // coordinates are recalculated or repositioned during export.
        const active = currentCanvas.getActiveObject();
        if ((active instanceof IText || active instanceof Textbox) && active.isEditing) {
          active.exitEditing();
        }
        currentCanvas.discardActiveObject();
        currentCanvas.requestRenderAll();
        await waitFrame();
        await waitFrame();

        const width = currentCanvas.getWidth();
        const height = currentCanvas.getHeight();
        const dataUrl = currentCanvas.toDataURL({
          format: "png",
          multiplier: 2,
          quality: 1,
        });

        const orientation = width >= height ? "landscape" : "portrait";
        if (!pdf) {
          pdf = new jsPDF({
            orientation,
            unit: "px",
            format: [width, height],
            compress: true,
          });
        } else {
          pdf.addPage([width, height], orientation);
        }

        // The captured raster is the exact Fabric canvas, placed edge-to-edge.
        // This preserves all visible text, images and object positions as drawn.
        pdf.addImage(dataUrl, "PNG", 0, 0, width, height, undefined, "FAST");

        // Keep the live page selection visually unchanged until the next page.
        currentCanvas.requestRenderAll();
      }

      if (pdf) pdf.save(`${getDownloadName()}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF pages:", error);
      window.alert("PDF download nahi ho paya. Please console error check karein aur dobara try karein.");
    } finally {
      // Return to the page the user was editing before export.
      if (originalPageId && originalPageId !== currentPageId) {
        selectPage(originalPageId);
        currentPageId = originalPageId;
        const originalPage = pageList.find((page) => page.id === originalPageId);
        if (originalPage) {
          try {
            await waitForPage(originalPage);
          } catch (restoreError) {
            console.error("Unable to restore the original page after PDF export:", restoreError);
          }
        }
      }

      const restoredCanvas = canvasRef.current;
      if (restoredCanvas && originalActiveObjectId) {
        const restoredObject = restoredCanvas.getObjects().find(
          (object: any) => object.elementId === originalActiveObjectId,
        );
        if (restoredObject) {
          restoredCanvas.setActiveObject(restoredObject);
          setSelectedObject(restoredObject);
        }
      }
      restoredCanvas?.requestRenderAll();
    }
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
      "useFabric must be used inside FabricProvider",
    );
  }

  return context;
}
