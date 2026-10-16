
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
  backgroundColor?: string;
};

type TextElementType = "heading" | "subheading" | "text";

type ShapeElementType =
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
  | "dotted-line";

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
  "rectangle",
  "square",
  "circle",
  "triangle",
  "polygon",
  "pentagon",
  "hexagon",
  "heptagon",
  "octagon",
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
  }>({});

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
    } else {
      object = createLineObject(type);
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

    const pointer = canvas.getScenePoint(event.e);

    const radius = Math.max(
      8,
      drawingSettingsRef.current.width * 2
    );

    const target = [...canvas.getObjects()]
      .reverse()
      .find((object) => {
        const item =
          object as typeof object & FabricObjectWithMeta;

        if (!item.isFreehand) return false;

        const bounds = object.getBoundingRect();

        return (
          pointer.x >= bounds.left - radius &&
          pointer.x <= bounds.left + bounds.width + radius &&
          pointer.y >= bounds.top - radius &&
          pointer.y <= bounds.top + bounds.height + radius
        );
      });

    if (!target) return;

    saveCanvasState();
    canvas.remove(target);
    canvas.requestRenderAll();
    syncCanvasToEditor();
  }

  function removeToolHandlers(canvas: FabricCanvas) {
    const previousEraser = eraserHandlersRef.current;

    if (previousEraser.down) {
      canvas.off("mouse:down", previousEraser.down);
    }

    if (previousEraser.move) {
      canvas.off("mouse:move", previousEraser.move);
    }

    eraserHandlersRef.current = {};

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
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.skipTargetFind = true;

      const downHandler = (event: any) => {
        eraseAtPointer(event);
      };

      const moveHandler = (event: any) => {
        eraseAtPointer(event);
      };

      eraserHandlersRef.current = {
        down: downHandler,
        move: moveHandler,
      };

      canvas.on("mouse:down", downHandler);
      canvas.on("mouse:move", moveHandler);
    } else {
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
      selectedObject.set({ fill: color });
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
