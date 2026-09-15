import {
  useEffect,
  useRef,
} from "react";

import {
  Canvas as FabricCanvas,
  IText,
  Rect,
  Circle,
  Triangle,
} from "fabric";

import { useEditor } from "../../../context/EditorContext";
import { useFabric } from "../../../context/FabricContext";

import type {
  ElementType,
} from "../../../types/editor";

type FabricObjectWithMeta = {
  elementId?: string;
  elementType?: ElementType;
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

  useEffect(() => {
    if (!canvasElementRef.current) {
      return;
    }

    const canvas = new FabricCanvas(
      canvasElementRef.current,
      {
        width: 900,
        height: 650,

        backgroundColor,

        selection: true,

        preserveObjectStacking: true,
      }
    );

    canvasRef.current = canvas;

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

    const handleSelectionCreated = (
      event: any
    ) => {
      const object =
        event.selected?.[0] ??
        null;

      setSelectedObject(object);
    };

    const handleSelectionUpdated = (
      event: any
    ) => {
      const object =
        event.selected?.[0] ??
        canvas.getActiveObject() ??
        null;

      setSelectedObject(object);
    };

    const handleSelectionCleared =
      () => {
        setSelectedObject(null);
      };

    const handleObjectModified =
      () => {
        updateEditorFromCanvas();
      };

    const handleTextChanged = () => {
      updateEditorFromCanvas();
    };

    const handleMouseDown = (
      event: any
    ) => {
      const object =
        event.target;

      if (!object) {
        return;
      }

      setSelectedObject(object);
    };

    const handleDoubleClick = (
      event: any
    ) => {
      const object =
        event.target;

      if (!object) {
        return;
      }

      setSelectedObject(object);

      if (
        object.type === "i-text" ||
        object.type === "textbox"
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

      canvasRef.current = null;

      setSelectedObject(null);
    };
  }, []);

  useEffect(() => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    if (
      internalChangeRef.current
    ) {
      internalChangeRef.current =
        false;

      canvas.backgroundColor =
        backgroundColor;

      canvas.renderAll();

      return;
    }

    canvas.clear();

    canvas.backgroundColor =
      backgroundColor;

    elements.forEach(
      (element) => {
        if (
          element.type ===
            "heading" ||
          element.type ===
            "subheading" ||
          element.type ===
            "text"
        ) {
          const text =
            new IText(
              element.text ?? "",
              {
                left: element.x,
                top: element.y,

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

                originX: "left",
                originY: "top",

                editable: true,
                selectable: true,
                evented: true,

                padding: 4,

                transparentCorners:
                  false,

                cornerColor:
                  "#111827",

                cornerStyle:
                  "circle",

                borderColor:
                  "#111827",
              }
            );

          const meta =
            text as typeof text &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(text);

          return;
        }

        if (
          element.type ===
          "rectangle"
        ) {
          const rectangle =
            new Rect({
              left: element.x,
              top: element.y,

              width: element.width,
              height: element.height,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX: "left",
              originY: "top",

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
            });

          const meta =
            rectangle as typeof rectangle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(rectangle);

          return;
        }

        if (
          element.type ===
          "circle"
        ) {
          const radius =
            Math.min(
              element.width,
              element.height
            ) / 2;

          const circle =
            new Circle({
              left: element.x,
              top: element.y,

              radius,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX: "left",
              originY: "top",

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
            });

          const meta =
            circle as typeof circle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(circle);

          return;
        }

        if (
          element.type ===
          "triangle"
        ) {
          const triangle =
            new Triangle({
              left: element.x,
              top: element.y,

              width: element.width,
              height: element.height,

              fill:
                element.backgroundColor ??
                "#2563eb",

              originX: "left",
              originY: "top",

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
            });

          const meta =
            triangle as typeof triangle &
              FabricObjectWithMeta;

          meta.elementId =
            element.id;

          meta.elementType =
            element.type;

          canvas.add(triangle);
        }
      }
    );

    canvas.discardActiveObject();

    setSelectedObject(null);

    canvas.renderAll();
  }, [
    elements,
    backgroundColor,
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
            ref={canvasElementRef}
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