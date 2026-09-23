import {
  useEffect,
  useRef,
} from "react";

import {
  Canvas as FabricCanvas,
  Textbox,
  IText,
  Rect,
  Circle,
  Triangle,
  Polygon,
  Line,
  Path,
  FabricImage,
} from "fabric";

import { useEditor } from "../../../context/EditorContext";

import { useFabric } from "../../../context/FabricContext";

import type {
  ElementType,
} from "../../../types/editor";

type FabricObjectWithMeta = {
  elementId?: string;

  elementType?: ElementType;

  imageSrc?: string;

  shapeSides?: number;
};

function getPolygonPoints(
  sides: number,
  radius: number
) {
  const points = [];

  for (
    let index = 0;
    index < sides;
    index++
  ) {
    const angle =
      -Math.PI / 2 +
      (index * 2 * Math.PI) /
        sides;

    points.push({
      x:
        radius +
        radius * Math.cos(angle),

      y:
        radius +
        radius * Math.sin(angle),
    });
  }

  return points;
}

function applyControls(
  object: any
) {
  object.set({
    selectable: true,

    evented: true,

    transparentCorners:
      false,

    cornerColor:
      "#111827",

    cornerStyle:
      "circle",

    borderColor:
      "#111827",

    originX:
      "left",

    originY:
      "top",
  });
}

function createLineObject(
  element: {
    type:
      | "line"
      | "arrow"
      | "double-arrow"
      | "dashed-line"
      | "dotted-line";

    x: number;

    y: number;

    width: number;

    height: number;

    scaleX?: number;

    scaleY?: number;

    angle?: number;

    opacity?: number;

    strokeColor?: string;

    strokeWidth?: number;

    lineDash?: number[];
  }
) {
  const width =
    Math.max(
      40,
      element.width || 220
    );

  const stroke =
    element.strokeColor ??
    "#111827";

  const strokeWidth =
    element.strokeWidth ??
    4;

  const commonOptions = {
    left: element.x,

    top: element.y,

    scaleX:
      element.scaleX ?? 1,

    scaleY:
      element.scaleY ?? 1,

    angle:
      element.angle ?? 0,

    opacity:
      element.opacity ?? 1,

    fill: "",

    stroke,

    strokeWidth,

    strokeLineCap:
      "round" as const,

    strokeLineJoin:
      "round" as const,

    originX:
      "left" as const,

    originY:
      "top" as const,

    selectable: true,

    evented: true,

    transparentCorners:
      false,

    cornerColor:
      "#111827",

    cornerStyle:
      "circle" as const,

    borderColor:
      "#111827",
  };

  if (
    element.type ===
      "line" ||
    element.type ===
      "dashed-line" ||
    element.type ===
      "dotted-line"
  ) {
    return new Line(
      [
        0,
        0,
        width,
        0,
      ],
      {
        ...commonOptions,

        strokeDashArray:
          element.lineDash ??
          (
            element.type ===
            "dashed-line"
              ? [18, 10]
              : element.type ===
                  "dotted-line"
                ? [2, 10]
                : undefined
          ),
      }
    );
  }

  if (
    element.type ===
    "arrow"
  ) {
    return new Path(
      `
      M 0 0
      L ${width} 0

      M ${width} 0
      L ${width - 18} -12

      M ${width} 0
      L ${width - 18} 12
      `,
      commonOptions
    );
  }

  return new Path(
    `
    M 0 0
    L ${width} 0

    M 0 0
    L 18 -12

    M 0 0
    L 18 12

    M ${width} 0
    L ${width - 18} -12

    M ${width} 0
    L ${width - 18} 12
    `,
    commonOptions
  );
}

export default function FabricEditorCanvas() {
  const canvasElementRef =
    useRef<HTMLCanvasElement | null>(
      null
    );

  const internalChangeRef =
    useRef(false);

  const {
    elements,

    backgroundColor,

    syncElementsFromCanvas,
  } = useEditor();

  const {
    canvasRef,

    setSelectedObject,

    convertCanvasToElements,
  } = useFabric();

  useEffect(() => {
    if (
      !canvasElementRef.current
    ) {
      return;
    }

    const canvas =
      new FabricCanvas(
        canvasElementRef.current,
        {
          width: 900,

          height: 650,

          backgroundColor,

          selection: true,

          preserveObjectStacking:
            true,
        }
      );

    canvasRef.current =
      canvas;

    const updateEditorFromCanvas =
      () => {
        const latestElements =
          convertCanvasToElements();

        internalChangeRef.current =
          true;

        syncElementsFromCanvas(
          latestElements
        );

        const object =
          canvas.getActiveObject();

        setSelectedObject(
          object ?? null
        );
      };

    const handleSelectionCreated =
      (event: any) => {
        const object =
          event.selected?.[0] ??
          null;

        setSelectedObject(
          object
        );
      };

    const handleSelectionUpdated =
      (event: any) => {
        const object =
          event.selected?.[0] ??
          canvas.getActiveObject() ??
          null;

        setSelectedObject(
          object
        );
      };

    const handleSelectionCleared =
      () => {
        setSelectedObject(
          null
        );
      };

    const handleObjectModified =
      () => {
        updateEditorFromCanvas();
      };

    const handleTextChanged =
      () => {
        updateEditorFromCanvas();
      };

    const handleMouseDown =
      (event: any) => {
        const object =
          event.target;

        if (!object) return;

        setSelectedObject(
          object
        );
      };

    const handleDoubleClick =
      (event: any) => {
        const object =
          event.target;

        if (!object) return;

        setSelectedObject(
          object
        );

        if (
          object.type ===
            "i-text" ||
          object.type ===
            "textbox"
        ) {
          const textObject =
            object as IText;

          canvas.setActiveObject(
            textObject
          );

          textObject.enterEditing();

          textObject.selectAll();

          canvas.renderAll();
        }
      };

    canvas.on(
      "selection:created",
      handleSelectionCreated
    );

    canvas.on(
      "selection:updated",
      handleSelectionUpdated
    );

    canvas.on(
      "selection:cleared",
      handleSelectionCleared
    );

    canvas.on(
      "object:modified",
      handleObjectModified
    );

    canvas.on(
      "text:changed",
      handleTextChanged
    );

    canvas.on(
      "mouse:down",
      handleMouseDown
    );

    canvas.on(
      "mouse:dblclick",
      handleDoubleClick
    );

    return () => {
      canvas.off(
        "selection:created",
        handleSelectionCreated
      );

      canvas.off(
        "selection:updated",
        handleSelectionUpdated
      );

      canvas.off(
        "selection:cleared",
        handleSelectionCleared
      );

      canvas.off(
        "object:modified",
        handleObjectModified
      );

      canvas.off(
        "text:changed",
        handleTextChanged
      );

      canvas.off(
        "mouse:down",
        handleMouseDown
      );

      canvas.off(
        "mouse:dblclick",
        handleDoubleClick
      );

      canvas.dispose();

      canvasRef.current =
        null;

      setSelectedObject(
        null
      );
    };
  }, []);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    canvas.backgroundColor =
      backgroundColor;

    canvas.requestRenderAll();
  }, [
    backgroundColor,
  ]);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    if (
      internalChangeRef.current
    ) {
      internalChangeRef.current =
        false;

      return;
    }

    let cancelled = false;

    async function renderElements() {
      if (!canvas) return;
      /*
       * Existing objects remove.
       */
      canvas.clear();

      canvas.backgroundColor =
        backgroundColor;

      for (
        const element of elements
      ) {
        if (cancelled) return;

        /*
         * TEXT
         */
        if (
          element.type ===
            "heading" ||
          element.type ===
            "subheading" ||
          element.type ===
            "text"
        ) {
          const textObject =
            new Textbox(
              element.text ?? "",
              {
                left:
                  element.x,

                top:
                  element.y,

                width:
                  Math.max(
                    80,
                    element.width ||
                      (
                        element.type ===
                        "heading"
                          ? 500
                          : element.type ===
                              "subheading"
                            ? 450
                            : 400
                      )
                  ),

                fontSize:
                  element.fontSize ??
                  18,

                fontFamily:
                  element.fontFamily ??
                  "Arial",

                fill:
                  element.color ??
                  "#111827",

                fontWeight:
                  element.fontWeight ??
                  "normal",

                fontStyle:
                  element.fontStyle ??
                  "normal",

                lineHeight:
                  element.lineHeight ??
                  1.16,

                charSpacing:
                  element.charSpacing ??
                  0,

                textAlign:
                  element.textAlign ??
                  "left",

                originX:
                  "left",

                originY:
                  "top",

                scaleX:
                  element.scaleX ??
                  1,

                scaleY:
                  element.scaleY ??
                  1,

                angle:
                  element.angle ??
                  0,

                opacity:
                  element.opacity ??
                  1,

                editable:
                  true,

                selectable:
                  true,

                evented:
                  true,

                padding:
                  4,

                transparentCorners:
                  false,

                cornerColor:
                  "#111827",

                cornerStyle:
                  "circle",

                borderColor:
                  "#111827",

                splitByGrapheme:
                  false,
              }
            );

          textObject.set({
            lineHeight:
              element.lineHeight ??
              1.16,

            charSpacing:
              element.charSpacing ??
              0,

            textAlign:
              element.textAlign ??
              "left",
          });

          textObject.initDimensions();

          textObject.setCoords();

          const meta =
            textObject as typeof textObject &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(
            textObject
          );

          continue;
        }

        /*
         * RECTANGLE
         */
        if (
          element.type ===
          "rectangle"
        ) {
          const rectangle =
            new Rect({
              left:
                element.x,

              top:
                element.y,

              width:
                element.width ||
                180,

              height:
                element.height ||
                100,

              scaleX:
                element.scaleX ??
                1,

              scaleY:
                element.scaleY ??
                1,

              angle:
                element.angle ??
                0,

              opacity:
                element.opacity ??
                1,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX:
                "left",

              originY:
                "top",
            });

          applyControls(
            rectangle
          );

          const meta =
            rectangle as typeof rectangle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(
            rectangle
          );

          continue;
        }

        /*
         * SQUARE
         */
        if (
          element.type ===
          "square"
        ) {
          const size =
            Math.max(
              40,
              element.width ||
                element.height ||
                140
            );

          const square =
            new Rect({
              left:
                element.x,

              top:
                element.y,

              width:
                size,

              height:
                size,

              scaleX:
                element.scaleX ??
                1,

              scaleY:
                element.scaleY ??
                1,

              angle:
                element.angle ??
                0,

              opacity:
                element.opacity ??
                1,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX:
                "left",

              originY:
                "top",
            });

          applyControls(
            square
          );

          const meta =
            square as typeof square &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            "square";

          canvas.add(
            square
          );

          continue;
        }

        /*
         * CIRCLE
         */
        if (
          element.type ===
          "circle"
        ) {
          const radius =
            70;

          const circle =
            new Circle({
              left:
                element.x,

              top:
                element.y,

              radius,

              scaleX:
                element.scaleX ??
                (
                  element.width
                    ? element.width /
                      (radius * 2)
                    : 1
                ),

              scaleY:
                element.scaleY ??
                (
                  element.height
                    ? element.height /
                      (radius * 2)
                    : 1
                ),

              angle:
                element.angle ??
                0,

              opacity:
                element.opacity ??
                1,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX:
                "left",

              originY:
                "top",
            });

          applyControls(
            circle
          );

          const meta =
            circle as typeof circle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            "circle";

          canvas.add(
            circle
          );

          continue;
        }

        /*
         * TRIANGLE
         */
        if (
          element.type ===
          "triangle"
        ) {
          const triangle =
            new Triangle({
              left:
                element.x,

              top:
                element.y,

              width:
                element.width ||
                150,

              height:
                element.height ||
                120,

              scaleX:
                element.scaleX ??
                1,

              scaleY:
                element.scaleY ??
                1,

              angle:
                element.angle ??
                0,

              opacity:
                element.opacity ??
                1,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX:
                "left",

              originY:
                "top",
            });

          applyControls(
            triangle
          );

          const meta =
            triangle as typeof triangle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            "triangle";

          canvas.add(
            triangle
          );

          continue;
        }

        /*
         * POLYGON FAMILY
         */
        if (
          element.type ===
            "polygon" ||
          element.type ===
            "pentagon" ||
          element.type ===
            "hexagon" ||
          element.type ===
            "heptagon" ||
          element.type ===
            "octagon"
        ) {
          const sides =
            element.shapeSides ??
            (
              element.type ===
              "pentagon"
                ? 5
                : element.type ===
                    "hexagon"
                  ? 6
                  : element.type ===
                      "heptagon"
                    ? 7
                    : element.type ===
                        "octagon"
                      ? 8
                      : 6
            );

          const radius =
            Math.max(
              30,
              Math.max(
                element.width ||
                  140,
                element.height ||
                  140
              ) / 2
            );

          const polygon =
            new Polygon(
              getPolygonPoints(
                sides,
                radius
              ),
              {
                left:
                  element.x,

                top:
                  element.y,

                scaleX:
                  element.scaleX ??
                  1,

                scaleY:
                  element.scaleY ??
                  1,

                angle:
                  element.angle ??
                  0,

                opacity:
                  element.opacity ??
                  1,

                fill:
                  element.backgroundColor ??
                  "#2563eb",

                originX:
                  "left",

                originY:
                  "top",
              }
            );

          applyControls(
            polygon
          );

          const meta =
            polygon as typeof polygon &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          meta.shapeSides =
            sides;

          canvas.add(
            polygon
          );

          continue;
        }

        /*
         * LINES
         */
        if (
          element.type ===
            "line" ||
          element.type ===
            "arrow" ||
          element.type ===
            "double-arrow" ||
          element.type ===
            "dashed-line" ||
          element.type ===
            "dotted-line"
        ) {
          const line =
            createLineObject({
              type:
                element.type,

              x:
                element.x,

              y:
                element.y,

              width:
                element.width,

              height:
                element.height,

              scaleX:
                element.scaleX,

              scaleY:
                element.scaleY,

              angle:
                element.angle,

              opacity:
                element.opacity,

              strokeColor:
                element.strokeColor,

              strokeWidth:
                element.strokeWidth,

              lineDash:
                element.lineDash,
            });

          applyControls(
            line
          );

          const meta =
            line as typeof line &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(
            line
          );

          continue;
        }

        /*
         * IMAGE
         */
        if (
          element.type ===
            "image" &&
          element.src
        ) {
          try {
            const image =
              await FabricImage.fromURL(
                element.src
              );

            if (cancelled)
              return;

            const originalWidth =
              image.width || 1;

            const originalHeight =
              image.height || 1;

            image.set({
              left:
                element.x,

              top:
                element.y,

              scaleX:
                element.scaleX ??
                (
                  element.width /
                  originalWidth
                ),

              scaleY:
                element.scaleY ??
                (
                  element.height /
                  originalHeight
                ),

              angle:
                element.angle ??
                0,

              opacity:
                element.opacity ??
                1,

              selectable:
                true,

              evented:
                true,

              transparentCorners:
                false,

              cornerColor:
                "#111827",

              cornerStyle:
                "circle",

              borderColor:
                "#111827",

              originX:
                "left",

              originY:
                "top",
            });

            const meta =
              image as typeof image &
                FabricObjectWithMeta;

            meta.elementId =
              element.id;

            meta.elementType =
              "image";

            meta.imageSrc =
              element.src;

            canvas.add(
              image
            );
          } catch (error) {
            console.error(
              "Could not restore image:",
              error
            );
          }
        }
      }

      if (cancelled)
        return;

      canvas.discardActiveObject();

      setSelectedObject(
        null
      );

      canvas.renderAll();
    }

    renderElements();

    return () => {
      cancelled = true;
    };
  }, [
    elements,
  ]);

  return (
    <div className="flex-1 overflow-auto bg-gray-200">
      <div className="min-h-full flex items-center justify-center p-10">
        <div
          className="bg-white shadow-2xl"
          style={{
            width: "900px",

            height: "650px",

            flexShrink: 0,
          }}
        >
          <canvas
            ref={
              canvasElementRef
            }

            width={900}

            height={650}

            style={{
              display: "block",

              width: "900px",

              height: "650px",
            }}
          />
        </div>
      </div>
    </div>
  );
}