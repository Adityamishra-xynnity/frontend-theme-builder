import { useEffect, useRef, useState } from "react";

import {
  Canvas as FabricCanvasInstance,
  FabricImage,
  IText,
  Textbox,
  Rect,
  Circle,
  Triangle,
  Polygon,
  Line,
  Path,
  type FabricObject,
} from "fabric";

import { useEditor } from "../../../context/EditorContext";
import { useFabric } from "../../../context/FabricContext";

import type {
  EditorElement,
  ElementType,
} from "../../../types/editor";

interface FabricEditorCanvasProps {
  pageWidth: number;
  pageHeight: number;
}

type FabricObjectWithMeta = FabricObject & {
  elementId?: string;
  elementType?: ElementType;
  imageSrc?: string;
  shapeSides?: number;
  isFreehand?: boolean;
};

const DEFAULT_WIDTH = 1400;
const DEFAULT_HEIGHT = 800;

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

function getObjectMeta(object: FabricObject): FabricObjectWithMeta {
  return object as FabricObjectWithMeta;
}

function getElementSignature(elements: EditorElement[]): string {
  return JSON.stringify(
    elements.map((element) => ({
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      scaleX: element.scaleX ?? 1,
      scaleY: element.scaleY ?? 1,
      angle: element.angle ?? 0,
      opacity: element.opacity ?? 1,
      text: element.text ?? "",
      fontSize: element.fontSize ?? 32,
      fontFamily: element.fontFamily ?? "Arial",
      color: element.color ?? "#000000",
      backgroundColor: element.backgroundColor ?? "",
      fontWeight: element.fontWeight ?? "normal",
      fontStyle: element.fontStyle ?? "normal",
      textAlign: element.textAlign ?? "left",
      lineHeight: element.lineHeight ?? 1.16,
      charSpacing: element.charSpacing ?? 0,
      strokeColor: element.strokeColor ?? "",
      strokeWidth: element.strokeWidth ?? 0,
      lineDash: element.lineDash ?? [],
      shapeSides: element.shapeSides ?? 0,
      src: element.src ?? "",
      pathData: element.pathData ?? [],
    })),
  );
}

function applyElementMetadata(
  object: FabricObject,
  element: EditorElement,
): void {
  const meta = getObjectMeta(object);

  meta.elementId = element.id;
  meta.elementType = element.type;

  if (element.type === "image" && element.src) {
    meta.imageSrc = element.src;
  }

  if (element.shapeSides !== undefined) {
    meta.shapeSides = element.shapeSides;
  }

  // Keep freehand paths identifiable after a page rebuild.
  meta.isFreehand = Boolean(element.pathData?.length);
}

function applyCommonProperties(
  object: FabricObject,
  element: EditorElement,
): void {
  object.set({
    // Freehand Path data is serialized around its center point. Keep that
    // origin when rebuilding it; all other objects use top-left coordinates.
    originX: element.pathData?.length ? "center" : "left",
    originY: element.pathData?.length ? "center" : "top",
    left: element.x,
    top: element.y,
    scaleX: element.scaleX ?? 1,
    scaleY: element.scaleY ?? 1,
    angle: element.angle ?? 0,
    opacity: element.opacity ?? 1,
    selectable: true,
    evented: true,
    objectCaching: false,
  });

  applyElementMetadata(object, element);
}

function createPolygonPoints(
  sides: number,
  width: number,
  height: number,
): { x: number; y: number }[] {
  const safeSides = Math.max(3, Math.min(12, sides));

  return Array.from({ length: safeSides }, (_, index) => {
    const angle =
      (Math.PI * 2 * index) / safeSides - Math.PI / 2;

    return {
      x: width / 2 + Math.cos(angle) * (width / 2),
      y: height / 2 + Math.sin(angle) * (height / 2),
    };
  });
}

function createStarPoints(
  points: number,
  width: number,
  height: number,
  innerRatio = 0.42,
): { x: number; y: number }[] {
  const count = Math.max(4, Math.min(32, points));

  return Array.from({ length: count * 2 }, (_, index) => {
    const outer = index % 2 === 0;
    const angle = (Math.PI * index) / count - Math.PI / 2;
    const ratio = outer ? 1 : innerRatio;

    return {
      x: width / 2 + Math.cos(angle) * (width / 2) * ratio,
      y: height / 2 + Math.sin(angle) * (height / 2) * ratio,
    };
  });
}

function createCogPoints(teeth: number, width: number, height: number) {
  const count = Math.max(4, Math.min(24, teeth)) * 4;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count - Math.PI / 2;
    const step = i % 4;
    const r = step === 0 || step === 3 ? 1 : 0.78;
    return { x: width / 2 + Math.cos(angle) * width / 2 * r, y: height / 2 + Math.sin(angle) * height / 2 * r };
  });
}

function createFlowerPoints(petals: number, width: number, height: number) {
  const count = Math.max(4, Math.min(16, petals)) * 24;
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count;
    const r = 0.68 + 0.32 * Math.cos(petals * angle);
    return { x: width / 2 + Math.cos(angle) * width / 2 * r, y: height / 2 + Math.sin(angle) * height / 2 * r };
  });
}

function createOrganicPoints(variant: number, width: number, height: number) {
  return Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 80) * Math.PI * 2;
    const wave = Math.sin(angle * (variant + 2)) * 0.09 + Math.cos(angle * (variant + 3)) * 0.06;
    const r = 0.83 + wave;
    return { x: width / 2 + Math.cos(angle) * width / 2 * r, y: height / 2 + Math.sin(angle) * height / 2 * r };
  });
}

function createElementObject(
  element: EditorElement,
): FabricObject | null {
  const width = Math.max(1, element.width || 1);
  const height = Math.max(1, element.height || 1);
  const color = element.color || "#000000";
  const strokeColor = element.strokeColor || color;
  const strokeWidth = element.strokeWidth ?? 0;

  let object: FabricObject | null = null;

  if (
    element.type === "heading" ||
    element.type === "subheading" ||
    element.type === "text"
  ) {
    const textOptions = {
      left: element.x,
      top: element.y,
      width,
      fontSize: element.fontSize ?? 32,
      fontFamily: element.fontFamily || "Arial",
      fill: color,
      fontWeight: element.fontWeight ?? "normal",
      fontStyle: element.fontStyle ?? "normal",
      textAlign: element.textAlign ?? "left",
      lineHeight: element.lineHeight ?? 1.16,
      charSpacing: element.charSpacing ?? 0,
      // Match the padding used when text is first created in FabricContext.
      // Without this, a rebuilt body Textbox can appear offset after page copy.
      padding: 4,
      angle: element.angle ?? 0,
      opacity: element.opacity ?? 1,
      editable: true,
      splitByGrapheme: false,
      objectCaching: false,
    };

    object =
      element.type === "text"
        ? new Textbox(element.text || "Text", textOptions)
        : new IText(
            element.text ||
              (element.type === "heading"
                ? "Certificate Heading"
                : "Certificate Subheading"),
            textOptions,
          );
  } else if (
    element.type === "rectangle" ||
    element.type === "square"
  ) {
    object = new Rect({
      width,
      height,
      fill: element.backgroundColor || color,
      stroke: strokeColor,
      strokeWidth,
    });
  } else if (element.type === "circle") {
    const diameter = Math.max(width, height);

    object = new Circle({
      radius: diameter / 2,
      scaleX: width / diameter,
      scaleY: height / diameter,
      fill: element.backgroundColor || color,
      stroke: strokeColor,
      strokeWidth,
    });
  } else if (element.type === "triangle") {
    object = new Triangle({
      width,
      height,
      fill: element.backgroundColor || color,
      stroke: strokeColor,
      strokeWidth,
    });
  } else if (
    /^star(?:-outline|-\d+)?$/.test(element.type) ||
    /^square-star-\d+$/.test(element.type)
  ) {
    const match = element.type.match(/(\d+)$/);
    const points = match ? Number(match[1]) : 5;
    const isSquareStar = element.type.startsWith("square-star");
    const isOutline = element.type === "star-outline";

    object = new Polygon(
      createStarPoints(
        points,
        width,
        height,
        isSquareStar ? 0.7 : 0.42,
      ),
      {
        fill: isOutline
          ? "rgba(0,0,0,0)"
          : element.backgroundColor || color,
        stroke: strokeColor,
        strokeWidth: strokeWidth || (isOutline ? 2 : 0),
      },
    );
  } else if (
    element.type === "polygon" ||
    element.type === "pentagon" ||
    element.type === "hexagon" ||
    element.type === "heptagon" ||
    element.type === "octagon"
  ) {
    const sides =
      element.shapeSides ??
      (element.type === "pentagon"
        ? 5
        : element.type === "hexagon"
          ? 6
          : element.type === "heptagon"
            ? 7
            : element.type === "octagon"
              ? 8
              : 6);

    object = new Polygon(
      createPolygonPoints(sides, width, height),
      {
        fill: element.backgroundColor || color,
        stroke: strokeColor,
        strokeWidth,
      },
    );
  } else if (
    element.type === "line" &&
    element.pathData &&
    element.pathData.length > 0
  ) {
    // Restore freehand strokes as their original Fabric Path, not as a straight Line.
    object = new Path(
      element.pathData.map((command) => [...command]) as any,
      {
        fill: "",
        stroke: element.strokeColor || color,
        strokeWidth: element.strokeWidth ?? 4,
        strokeDashArray: element.lineDash,
        strokeLineCap: "round",
        strokeLineJoin: "round",
        originX: "center",
        originY: "center",
        objectCaching: false,
      },
    );
  } else if (
    element.type === "line" ||
    element.type === "arrow" ||
    element.type === "double-arrow" ||
    element.type === "dashed-line" ||
    element.type === "dotted-line"
  ) {
    const isArrow =
      element.type === "arrow" ||
      element.type === "double-arrow";

    const dash =
      element.lineDash ??
      (element.type === "dashed-line"
        ? [10, 6]
        : element.type === "dotted-line"
          ? [2, 5]
          : undefined);

    if (isArrow) {
      const arrowHead = 12;

      const arrowPath =
        element.type === "double-arrow"
          ? `M 0 0 L ${width} 0 M ${arrowHead} -${arrowHead / 2} L 0 0 L ${arrowHead} ${arrowHead / 2} M ${width - arrowHead} -${arrowHead / 2} L ${width} 0 L ${width - arrowHead} ${arrowHead / 2}`
          : `M 0 0 L ${width} 0 M ${width - arrowHead} -${arrowHead / 2} L ${width} 0 L ${width - arrowHead} ${arrowHead / 2}`;

      object = new Path(arrowPath, {
        fill: "",
        stroke: strokeColor,
        strokeWidth: strokeWidth || 2,
        strokeDashArray: dash,
      });
    } else {
      object = new Line([0, 0, width, 0], {
        stroke: strokeColor,
        strokeWidth: strokeWidth || 2,
        strokeDashArray: dash,
        fill: "",
        originX: "left",
        originY: "top",
      });
    }
  }

  else {
    const type = element.type as string;
    const cog = type.match(/^cog-(4|6|8|10|12|16|20|24)$/);
    const flowerMap: Record<string, number> = { flower: 6, "flower-5": 5, "flower-6": 6, "flower-8": 8, "flower-12": 12, "flower-daisy": 12, "flower-sunflower": 16, "flower-rose": 10, "flower-lotus": 8, "flower-lily": 6, "flower-tulip": 5, "flower-hibiscus": 5, "flower-cherry-blossom": 5, petal: 5, "petal-rounded": 6, "petal-pointed": 4 };
    const organicMap: Record<string, number> = { "organic-blob": 1, "organic-blob-2": 2, "organic-blob-3": 3, "organic-cloud": 4, "organic-splash": 5, "organic-pebble": 6 };
    const fill = element.backgroundColor || color;
    const outline = { fill, stroke: strokeColor, strokeWidth: strokeWidth || 2, objectCaching: false };
    if (cog) object = new Polygon(createCogPoints(Number(cog[1]), width, height), outline);
    else if (flowerMap[type]) object = new Polygon(createFlowerPoints(flowerMap[type], width, height), outline);
    else if (organicMap[type]) object = new Polygon(createOrganicPoints(organicMap[type], width, height), outline);
    else {
      const paths: Record<string, string> = {
        "organic-wave": `M 0 ${height*.39} Q ${width*.25} 0 ${width*.5} ${height*.39} T ${width} ${height*.39} L ${width} ${height} L 0 ${height} Z`,
        "organic-wave-2": `M 0 ${height*.5} C ${width*.17} 0 ${width*.33} ${height} ${width*.5} ${height*.5} S ${width*.83} 0 ${width} ${height*.5} L ${width} ${height} L 0 ${height} Z`,
        leaf: `M 0 ${height} Q ${width*.2} 0 ${width} 0 Q ${width*.9} ${height*.8} 0 ${height} Z`,
        "leaf-rounded": `M 0 ${height} Q ${width*.1} 0 ${width} 0 Q ${width} ${height} 0 ${height} Z`,
        "leaf-pointed": `M 0 ${height} Q ${width*.2} 0 ${width} 0 Q ${width*.7} ${height*.8} 0 ${height} Z`,
        "leaf-pair": `M 0 ${height*.5} Q ${width*.1} 0 ${width*.5} 0 Q ${width*.5} ${height*.5} 0 ${height*.5} Z M ${width*.5} ${height} Q ${width*.55} ${height*.3} ${width} ${height*.3} Q ${width*.95} ${height} ${width*.5} ${height} Z`,
        vine: `M 0 ${height} Q ${width*.25} ${height*.8} ${width*.2} ${height*.5} T ${width*.5} ${height*.2} T ${width} 0`,
        "flow-document": `M 0 0 L ${width} 0 L ${width} ${height*.8} Q ${width*.75} ${height*1.1} ${width*.5} ${height*.85} Q ${width*.25} ${height*.65} 0 ${height*.85} Z`,
        "speech-bubble": `M 0 0 L ${width} 0 L ${width} ${height*.8} L ${width*.3} ${height*.8} L ${width*.15} ${height} L ${width*.18} ${height*.8} L 0 ${height*.8} Z`,
        "chat-bubble": `M ${width*.1} 0 L ${width*.9} 0 Q ${width} 0 ${width} ${height*.15} L ${width} ${height*.7} Q ${width} ${height*.85} ${width*.85} ${height*.85} L ${width*.3} ${height*.85} L ${width*.15} ${height} L ${width*.18} ${height*.85} L ${width*.1} ${height*.85} Q 0 ${height*.85} 0 ${height*.7} L 0 ${height*.15} Q 0 0 ${width*.1} 0 Z`,
        "thought-bubble": `M ${width*.2} ${height*.2} C 0 ${height*.1} 0 ${height*.5} ${width*.15} ${height*.6} C 0 ${height} ${width*.5} ${height} ${width*.6} ${height*.8} C ${width} ${height} ${width} ${height*.4} ${width*.8} ${height*.3} C ${width*.7} 0 ${width*.3} 0 ${width*.2} ${height*.2} Z`,
      };
      if (paths[type]) object = new Path(paths[type], { ...outline, fill: type === "vine" ? "" : fill });
      else if (type === "flow-process") object = new Rect({ width, height, ...outline });
      else if (type === "flow-terminator" || type === "rounded-bubble") object = new Rect({ width, height, rx: Math.min(width, height) / 3, ry: Math.min(width, height) / 3, ...outline });
      else if (type === "flow-connector") object = new Circle({ radius: Math.min(width, height) / 2, ...outline });
      else if (type === "flow-decision") object = new Polygon([{x:width/2,y:0},{x:width,y:height/2},{x:width/2,y:height},{x:0,y:height/2}], outline);
      else if (type === "flow-io") object = new Polygon([{x:width*.2,y:0},{x:width,y:0},{x:width*.8,y:height},{x:0,y:height}], outline);
      else if (type === "flow-preparation") object = new Polygon([{x:width*.25,y:0},{x:width*.75,y:0},{x:width,y:height/2},{x:width*.75,y:height},{x:width*.25,y:height},{x:0,y:height/2}], outline);
      else if (type === "flow-manual-input") object = new Polygon([{x:0,y:height*.25},{x:width,y:0},{x:width,y:height},{x:0,y:height}], outline);
    }
  }

  if (object) {
    applyCommonProperties(object, element);
  }

  return object;
}

export default function FabricEditorCanvas({
  pageWidth,
  pageHeight,
}: FabricEditorCanvasProps) {
  const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  const [canvasScale, setCanvasScale] = useState(1);
  const [zoomPercent, setZoomPercent] = useState(100);

  const userZoomRef = useRef(1);
  const internalChangeRef = useRef(false);
  const mountedRef = useRef(false);
  const rebuildingCanvasRef = useRef(false);
  const imageLoadTokenRef = useRef(0);
  const {
    elements,
    backgroundColor,
    activePageId,
    syncElementsFromCanvas,
    registerCanvasSnapshotProvider,
  } = useEditor();

  const lastSyncedSignatureRef = useRef("");
  const canvasPageIdRef = useRef(activePageId);
  const latestSyncRef = useRef(syncElementsFromCanvas);
  latestSyncRef.current = syncElementsFromCanvas;

  const {
    canvasRef,
    selectedObject,
    setSelectedObject,
    convertCanvasToElements,
  } = useFabric();

  const safeWidth = Math.max(1, pageWidth || DEFAULT_WIDTH);
  const safeHeight = Math.max(1, pageHeight || DEFAULT_HEIGHT);

  function syncCanvasToEditor() {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      rebuildingCanvasRef.current ||
      internalChangeRef.current
    ) {
      return;
    }

    // Ignore events emitted by the previous page after a page switch.
    if (canvasPageIdRef.current !== activePageId) {
      return;
    }

    const converted = convertCanvasToElements();

    lastSyncedSignatureRef.current =
      getElementSignature(converted);

    internalChangeRef.current = true;
    latestSyncRef.current(converted, canvasPageIdRef.current);
  }

  // Expose a live, synchronous canvas snapshot to Copy Page. If a text box is
  // being edited, commit it before serialization so the latest text is copied.
  useEffect(() => {
    registerCanvasSnapshotProvider(() => {
      const canvas = canvasRef.current;
      if (!canvas) return convertCanvasToElements();

      const activeObject = canvas.getActiveObject();
      if (activeObject instanceof IText || activeObject instanceof Textbox) {
        if (activeObject.isEditing) {
          activeObject.exitEditing();
        }
      }

      canvas.requestRenderAll();
      return convertCanvasToElements();
    });

    return () => registerCanvasSnapshotProvider(null);
  }, [registerCanvasSnapshotProvider, canvasRef, convertCanvasToElements]);

  function applyZoom(nextZoom: number) {
    const clampedZoom = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, Math.round(nextZoom * 100) / 100),
    );

    userZoomRef.current = clampedZoom;
    setCanvasScale(clampedZoom);
    setZoomPercent(Math.round(clampedZoom * 100));
  }

  function zoomIn() {
    applyZoom(userZoomRef.current + ZOOM_STEP);
  }

  function zoomOut() {
    applyZoom(userZoomRef.current - ZOOM_STEP);
  }

  function fitToScreen() {
    const viewport = viewportRef.current;

    if (!viewport) return;

    const availableWidth = Math.max(1, viewport.clientWidth - 48);
    const availableHeight = Math.max(1, viewport.clientHeight - 24);

    const nextScale = Math.min(
      1,
      availableWidth / safeWidth,
      availableHeight / safeHeight,
    );

    const fittedScale = Math.max(0.01, nextScale);

    userZoomRef.current = fittedScale;
    setCanvasScale(fittedScale);
    setZoomPercent(Math.round(fittedScale * 100));
  }

  useEffect(() => {
    const htmlCanvas = htmlCanvasRef.current;

    if (!htmlCanvas || mountedRef.current) return;

    mountedRef.current = true;

    const canvas = new FabricCanvasInstance(htmlCanvas, {
      width: safeWidth,
      height: safeHeight,
      backgroundColor: backgroundColor || "#ffffff",
      preserveObjectStacking: true,
      selection: true,
      stopContextMenu: true,
      fireRightClick: true,
    });

    canvasRef.current = canvas;

    const handleSelection = () => {
      setSelectedObject(canvas.getActiveObject() ?? null);
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null);
    };

    const handleObjectModified = () => {
      syncCanvasToEditor();
    };

    const handleTextChanged = () => {
      syncCanvasToEditor();
    };

    // Fabric can finish committing an actively edited Textbox only when editing
    // exits (for example, when the user clicks Copy Page). Sync once more here
    // so the latest typed content is stored before the page is duplicated.
    const handleTextEditingExited = () => {
      syncCanvasToEditor();
    };

    const handleObjectAdded = () => {
      if (
        internalChangeRef.current ||
        rebuildingCanvasRef.current
      ) {
        return;
      }

      syncCanvasToEditor();
    };

    const handleMouseDown = () => {
      setSelectedObject(canvas.getActiveObject() ?? null);
    };

    const handleDoubleClick = (event: { target?: FabricObject }) => {
      const target = event.target;

      if (target instanceof IText || target instanceof Textbox) {
        canvas.setActiveObject(target);
        setSelectedObject(target);
        target.enterEditing();
        target.selectAll();
        canvas.requestRenderAll();
      }
    };

    canvas.on("selection:created", handleSelection);
    canvas.on("selection:updated", handleSelection);
    canvas.on("selection:cleared", handleSelectionCleared);
    canvas.on("object:modified", handleObjectModified);
    canvas.on("text:changed", handleTextChanged);
    canvas.on("text:editing:exited", handleTextEditingExited);
    canvas.on("object:added", handleObjectAdded);
    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:dblclick", handleDoubleClick);

    return () => {
      imageLoadTokenRef.current += 1;

      canvas.off("selection:created", handleSelection);
      canvas.off("selection:updated", handleSelection);
      canvas.off("selection:cleared", handleSelectionCleared);
      canvas.off("object:modified", handleObjectModified);
      canvas.off("text:changed", handleTextChanged);
      canvas.off("text:editing:exited", handleTextEditingExited);
      canvas.off("object:added", handleObjectAdded);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:dblclick", handleDoubleClick);

      void canvas.dispose();

      if (canvasRef.current === canvas) {
        canvasRef.current = null;
      }

      rebuildingCanvasRef.current = false;
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.setDimensions({
      width: safeWidth,
      height: safeHeight,
    });

    canvas.requestRenderAll();
  }, [safeWidth, safeHeight]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    canvas.backgroundColor = backgroundColor || "#ffffff";
    canvas.requestRenderAll();
  }, [backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const incomingSignature = getElementSignature(elements);
    const currentSignature = getElementSignature(
      convertCanvasToElements(),
    );

    if (incomingSignature === currentSignature) {
      internalChangeRef.current = false;
      lastSyncedSignatureRef.current = "";
      return;
    }

    if (incomingSignature === lastSyncedSignatureRef.current) {
      internalChangeRef.current = false;
      lastSyncedSignatureRef.current = "";
      return;
    }

    internalChangeRef.current = false;

    const loadToken = ++imageLoadTokenRef.current;
    let cancelled = false;

    const isCurrentRebuild = () =>
      !cancelled && imageLoadTokenRef.current === loadToken;

    const rebuildCanvas = async () => {
      rebuildingCanvasRef.current = true;
      canvasPageIdRef.current = activePageId;

      try {
        const activeObject = canvas.getActiveObject();

        const activeId = activeObject
          ? getObjectMeta(activeObject).elementId
          : undefined;

        canvas.discardActiveObject();
        canvas.clear();
        canvas.backgroundColor = backgroundColor || "#ffffff";

        for (const element of elements) {
          if (!isCurrentRebuild()) return;

          if (element.type === "image") {
            if (!element.src) continue;

            try {
              const image = await FabricImage.fromURL(
                element.src,
                { crossOrigin: "anonymous" },
              );

              if (!isCurrentRebuild()) return;

              const imageWidth = image.width || element.width || 1;
              const imageHeight = image.height || element.height || 1;

              image.set({
                originX: "left",
                originY: "top",
                left: element.x,
                top: element.y,
                scaleX:
                  element.scaleX ??
                  (element.width ? element.width / imageWidth : 1),
                scaleY:
                  element.scaleY ??
                  (element.height ? element.height / imageHeight : 1),
                angle: element.angle ?? 0,
                opacity: element.opacity ?? 1,
                selectable: true,
                evented: true,
                objectCaching: false,
              });

              applyElementMetadata(image, element);
              canvas.add(image);
            } catch (error) {
              if (isCurrentRebuild()) {
                console.error("Unable to load canvas image:", error);
              }
            }

            continue;
          }

          const object = createElementObject(element);

          if (object) {
            canvas.add(object);
          }
        }

        if (!isCurrentRebuild()) return;

        const objectToRestore = activeId
          ? canvas.getObjects().find(
              (object) =>
                getObjectMeta(object).elementId === activeId,
            )
          : undefined;

        if (objectToRestore) {
          canvas.setActiveObject(objectToRestore);
          setSelectedObject(objectToRestore);
        } else {
          canvas.discardActiveObject();
          setSelectedObject(null);
        }

        canvas.requestRenderAll();

        lastSyncedSignatureRef.current =
          getElementSignature(convertCanvasToElements());
      } finally {
        if (imageLoadTokenRef.current === loadToken) {
          rebuildingCanvasRef.current = false;
        }
      }
    };

    void rebuildCanvas();

    return () => {
      cancelled = true;
    };
  }, [elements, backgroundColor, activePageId]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    if (!selectedObject) {
      if (canvas.getActiveObject()) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }

      return;
    }

    const selectedMeta = getObjectMeta(selectedObject);

    if (!selectedMeta.elementId) return;

    const matchingObject = canvas.getObjects().find(
      (object) =>
        getObjectMeta(object).elementId === selectedMeta.elementId,
    );

    if (matchingObject && canvas.getActiveObject() !== matchingObject) {
      canvas.setActiveObject(matchingObject);
      canvas.requestRenderAll();
    }
  }, [selectedObject]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) return;

    const updateFitScale = () => {
      const availableWidth = Math.max(1, viewport.clientWidth - 48);
      const availableHeight = Math.max(1, viewport.clientHeight - 24);

      const nextScale = Math.min(
        1,
        availableWidth / safeWidth,
        availableHeight / safeHeight,
      );

      if (!Number.isFinite(nextScale)) return;
    };

    updateFitScale();

    const observer = new ResizeObserver(updateFitScale);
    observer.observe(viewport);

    window.addEventListener("resize", updateFitScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateFitScale);
    };
  }, [safeWidth, safeHeight]);

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-100">
      <div className="flex shrink-0 items-center justify-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoomPercent <= MIN_ZOOM * 100}
          title="Zoom out"
          aria-label="Zoom out"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>

        <span
          className="min-w-[58px] text-center text-sm font-medium text-slate-700"
          aria-live="polite"
        >
          {zoomPercent}%
        </span>

        <button
          type="button"
          onClick={zoomIn}
          disabled={zoomPercent >= MAX_ZOOM * 100}
          title="Zoom in"
          aria-label="Zoom in"
          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-lg text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          +
        </button>

        <span className="mx-1 h-5 w-px bg-slate-200" />

        <button
          type="button"
          onClick={fitToScreen}
          title="Fit page to screen"
          className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Fit to screen
        </button>
      </div>

      <div
        ref={viewportRef}
        className="flex min-h-0 w-full flex-1 items-center justify-center overflow-auto p-3"
      >
        <div
          className="relative shrink-0 bg-white"
          style={{
            width: safeWidth * canvasScale,
            height: safeHeight * canvasScale,
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              width: safeWidth,
              height: safeHeight,
              transform: `scale(${canvasScale})`,
              transformOrigin: "top left",
            }}
          >
            <canvas
              ref={htmlCanvasRef}
              aria-label="Certificate editor canvas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}