import { useEffect, useRef } from "react";

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

type FabricObjectWithMeta = FabricObject & {
  elementId?: string;
  elementType?: ElementType;
  imageSrc?: string;
  shapeSides?: number;
};

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 650;

function getObjectMeta(
  object: FabricObject,
): FabricObjectWithMeta {
  return object as FabricObjectWithMeta;
}

function getElementSignature(
  elements: EditorElement[],
): string {
  return JSON.stringify(
    elements.map((element) => ({
      id: element.id,
      type: element.type,
      x: Math.round(element.x * 100) / 100,
      y: Math.round(element.y * 100) / 100,
      width: Math.round(element.width * 100) / 100,
      height: Math.round(element.height * 100) / 100,
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
}

function applyCommonProperties(
  object: FabricObject,
  element: EditorElement,
): void {
  object.set({
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
  const radiusX = width / 2;
  const radiusY = height / 2;

  return Array.from({ length: safeSides }, (_, index) => {
    const angle =
      (Math.PI * 2 * index) / safeSides - Math.PI / 2;

    return {
      x: radiusX + Math.cos(angle) * radiusX,
      y: radiusY + Math.sin(angle) * radiusY,
    };
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
      rx: 0,
      ry: 0,
    });
  } else if (element.type === "circle") {
    object = new Circle({
      radius: Math.max(width, height) / 2,
      scaleX: width / Math.max(width, height),
      scaleY: height / Math.max(width, height),
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

    object = new Line([0, 0, width, 0], {
      stroke: strokeColor,
      strokeWidth: strokeWidth || 2,
      strokeDashArray: dash,
      fill: "",
      originX: "left",
      originY: "top",
    });

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
    }
  }

  if (object) {
    applyCommonProperties(object, element);
  }

  return object;
}

export default function FabricEditorCanvas() {
  const htmlCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalChangeRef = useRef(false);
  const mountedRef = useRef(false);
  const rebuildingCanvasRef = useRef(false);
  const imageLoadTokenRef = useRef(0);
  const lastSyncedSignatureRef = useRef("");

  const {
    elements,
    backgroundColor,
    syncElementsFromCanvas,
  } = useEditor();

  const {
    canvasRef,
    selectedObject,
    setSelectedObject,
    convertCanvasToElements,
  } = useFabric();

  function syncCanvasToEditor() {
    const canvas = canvasRef.current;

    if (!canvas || rebuildingCanvasRef.current) {
      return;
    }

    const converted = convertCanvasToElements();
    const signature = getElementSignature(converted);

    lastSyncedSignatureRef.current = signature;
    internalChangeRef.current = true;

    syncElementsFromCanvas(converted);
  }

  useEffect(() => {
    const htmlCanvas = htmlCanvasRef.current;

    if (!htmlCanvas || mountedRef.current) {
      return;
    }

    mountedRef.current = true;

    const canvas = new FabricCanvasInstance(htmlCanvas, {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
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

    const handleDoubleClick = (event: {
      target?: FabricObject;
    }) => {
      const target = event.target;

      if (
        target instanceof IText ||
        target instanceof Textbox
      ) {
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
      canvas.off("object:added", handleObjectAdded);
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:dblclick", handleDoubleClick);

      canvas.dispose();

      if (canvasRef.current === canvas) {
        canvasRef.current = null;
      }

      rebuildingCanvasRef.current = false;
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.backgroundColor = backgroundColor || "#ffffff";
    canvas.requestRenderAll();
  }, [backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const incomingSignature = getElementSignature(elements);

    // Canvas se sync hui state ko dobara rebuild nahi karna.
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      lastSyncedSignatureRef.current = "";
      return;
    }

    const currentSignature = getElementSignature(
      convertCanvasToElements(),
    );

    // Dono taraf data same hai, isliye rebuild ki zaroorat nahi.
    if (
      incomingSignature === currentSignature ||
      incomingSignature === lastSyncedSignatureRef.current
    ) {
      lastSyncedSignatureRef.current = "";
      return;
    }

    let cancelled = false;
    const loadToken = ++imageLoadTokenRef.current;

    const rebuildCanvas = async () => {
      rebuildingCanvasRef.current = true;

      try {
        const activeObject = canvas.getActiveObject();

        const activeId = activeObject
          ? getObjectMeta(activeObject).elementId
          : undefined;

        canvas.discardActiveObject();
        canvas.clear();
        canvas.backgroundColor = backgroundColor || "#ffffff";

        for (const element of elements) {
          if (cancelled) {
            return;
          }

          if (element.type === "image") {
            if (!element.src) {
              continue;
            }

            try {
              const image = await FabricImage.fromURL(
                element.src,
                { crossOrigin: "anonymous" },
              );

              if (
                cancelled ||
                imageLoadTokenRef.current !== loadToken
              ) {
                return;
              }

              const imageWidth =
                image.width || element.width || 1;

              const imageHeight =
                image.height || element.height || 1;

              image.set({
                left: element.x,
                top: element.y,
                scaleX:
                  element.scaleX ??
                  (element.width
                    ? element.width / imageWidth
                    : 1),
                scaleY:
                  element.scaleY ??
                  (element.height
                    ? element.height / imageHeight
                    : 1),
                angle: element.angle ?? 0,
                opacity: element.opacity ?? 1,
                selectable: true,
                evented: true,
                objectCaching: false,
              });

              applyElementMetadata(image, element);
              canvas.add(image);
            } catch (error) {
              console.error(
                "Unable to load canvas image:",
                error,
              );
            }

            continue;
          }

          const object = createElementObject(element);

          if (object) {
            canvas.add(object);
          }
        }

        if (cancelled) {
          return;
        }

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
        rebuildingCanvasRef.current = false;
      }
    };

    void rebuildCanvas();

    return () => {
      cancelled = true;
      rebuildingCanvasRef.current = false;
    };
  }, [elements, backgroundColor]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    if (!selectedObject) {
      if (canvas.getActiveObject()) {
        canvas.discardActiveObject();
        canvas.requestRenderAll();
      }

      return;
    }

    const meta = getObjectMeta(selectedObject);

    if (!meta.elementId) {
      return;
    }

    const matchingObject = canvas
      .getObjects()
      .find(
        (object) =>
          getObjectMeta(object).elementId === meta.elementId,
      );

    if (
      matchingObject &&
      canvas.getActiveObject() !== matchingObject
    ) {
      canvas.setActiveObject(matchingObject);
      canvas.requestRenderAll();
    }
  }, [selectedObject]);

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-gray-100 p-4">
      <div className="relative shrink-0 rounded-md bg-white shadow-lg">
        <canvas
          ref={htmlCanvasRef}
          aria-label="Certificate editor canvas"
        />
      </div>
    </div>
  );
}