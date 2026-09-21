import { useEffect, useRef } from "react";

import {
  Canvas as FabricCanvas,
  Textbox,
  IText,
  Rect,
  Circle,
  Triangle,
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
};

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

  /*
   * CREATE FABRIC CANVAS
   *
   * Canvas sirf ek baar create hota hai.
   */
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

    /*
     * Fabric se EditorContext
     * ko latest elements sync karna.
     */
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

        /*
         * Both old IText and new
         * Textbox can be edited.
         */
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

  /*
   * BACKGROUND COLOR
   *
   * Important:
   * Background change par objects
   * clear nahi honge.
   */
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

  /*
   * RESTORE / RENDER ELEMENTS
   */
  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    /*
     * Agar update directly Fabric
     * se aaya hai to dobara objects
     * recreate nahi karne.
     */
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

      /*
       * Background preserve.
       */
      canvas.backgroundColor =
        backgroundColor;

      for (
        const element of elements
      ) {
        if (cancelled) return;

        /*
         * TEXT
         *
         * IMPORTANT:
         *
         * New elements are created as
         * Fabric Textbox.
         *
         * This gives:
         * - resizable width
         * - wrapping
         * - textAlign
         * - Canva-like behaviour
         */
        if (
          element.type ===
            "heading" ||
          element.type ===
            "subheading" ||
          element.type ===
            "text"
        ) {
          /*
           * Existing saved designs may
           * contain old IText objects.
           *
           * For restored EditorElements,
           * always create a Textbox.
           */

          const textObject =
            new Textbox(
              element.text ?? "",
              {
                left:
                  element.x,

                top:
                  element.y,

                /*
                 * Saved width restore.
                 *
                 * Prevent extremely small
                 * or zero width boxes.
                 */
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

                /*
                 * LINE SPACING
                 */
                lineHeight:
                  element.lineHeight ??
                  1.16,

                /*
                 * LETTER SPACING
                 */
                charSpacing:
                  element.charSpacing ??
                  0,

                /*
                 * TEXT ALIGNMENT
                 */
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

          /*
           * Explicitly restore all
           * text properties.
           */
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
                element.width,

              height:
                element.height,

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
            });

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
                element.width /
                  (radius * 2),

              scaleY:
                element.scaleY ??
                element.height /
                  (radius * 2),

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
            });

          const meta =
            circle as typeof circle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(circle);

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
                element.width,

              height:
                element.height,

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
            });

          const meta =
            triangle as typeof triangle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(
            triangle
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
                element.width /
                  originalWidth,

              scaleY:
                element.scaleY ??
                element.height /
                  originalHeight,

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

            canvas.add(image);
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