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
} from "fabric";

import {
  createContext,
  useContext,
  useRef,
  useState,
} from "react";

import jsPDF from "jspdf";

import { useEditor } from "./EditorContext";
import { createElement } from "../api/elementApi";

import type {
  ElementType,
  EditorElement,
} from "../types/editor";

type FabricObjectWithMeta = {
  elementId?: string;
  elementType?: ElementType;
  imageSrc?: string;
  shapeSides?: number;
};

interface FabricContextType {
  canvasRef: React.MutableRefObject<FabricCanvas | null>;

  selectedObject: any;

  setSelectedObject: (object: any) => void;

  convertCanvasToElements: () => EditorElement[];

  selectObjectById: (id: string) => void;

  addText: (
    type?: "heading" | "subheading" | "text"
  ) => void;

  addShape: (
    type:
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
      | "dotted-line"
  ) => void;

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

  saveCurrentDesign: (name: string) => void;

  downloadPNG: () => void;

  downloadPDF: () => void;
}

const FabricContext =
  createContext<FabricContextType | null>(
    null
  );

export function FabricProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvasRef =
    useRef<FabricCanvas | null>(null);

  const [selectedObject, setSelectedObject] =
    useState<any>(null);

  const [history, setHistory] = useState<
    string[]
  >([]);

  const [future, setFuture] = useState<
    string[]
  >([]);

  const {
    saveDesign,
    currentDesignName,
  } = useEditor();

  const selectedFontSize =
    selectedObject &&
      (
        selectedObject.type === "i-text" ||
        selectedObject.type === "textbox"
      )
      ? selectedObject.fontSize ?? 18
      : null;

  // function getCanvasJSON(canvas: FabricCanvas) {
  //   return canvas.toJSON([
  //     "elementId",
  //     "elementType",
  //     "imageSrc",
  //     "shapeSides",
  //   ]);
  // }

  function saveCanvasState() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const json = JSON.stringify(
      canvas.toJSON()
    );

    setHistory((previous) => [
      ...previous,
      json,
    ]);

    setFuture([]);
  }

  function convertCanvasToElements(): EditorElement[] {
    const canvas = canvasRef.current;

    if (!canvas) return [];

    return canvas.getObjects().map((object) => {
      const fabricObject =
        object as typeof object &
        FabricObjectWithMeta;

        let elementType =
          fabricObject.elementType;

        if (!elementType) {
          if (
            object.type === "i-text" ||
            object.type === "textbox"
          ) {
            elementType = "text";
          } else if (
            object.type === "rect"
          ) {
            elementType = "rectangle";
          } else if (
            object.type === "circle"
          ) {
            elementType = "circle";
          } else if (
            object.type === "triangle"
          ) {
            elementType = "triangle";
          } else if (
            object.type === "polygon"
          ) {
            elementType = "polygon";
          } else if (
            object.type === "line"
          ) {
            elementType = "line";
          } else if (
            object.type === "path"
          ) {
            elementType = "line";
          } else if (
            object.type === "image"
          ) {
            elementType = "image";
          } else {
            elementType = "text";
          }
        }

        const element: EditorElement = {
          id:
            fabricObject.elementId ??
            crypto.randomUUID(),

          type: elementType,

          x:
            object.left ?? 0,

          y:
            object.top ?? 0,

          width:
            object.width ?? 0,

          height:
            object.height ?? 0,

          scaleX:
            object.scaleX ?? 1,

          scaleY:
            object.scaleY ?? 1,

          angle:
            object.angle ?? 0,

          opacity:
            object.opacity ?? 1,
        };

        /*
         * TEXT
         */
        if (
          object.type === "i-text" ||
          object.type === "textbox"
        ) {
          const textObject =
            object as IText;

          element.text =
            textObject.text ?? "";

          element.fontSize =
            textObject.fontSize ?? 18;

          element.fontFamily =
            textObject.fontFamily ??
            "Arial";

          element.color =
            typeof textObject.fill ===
            "string"
              ? textObject.fill
              : "#111827";

          element.fontWeight =
            textObject.fontWeight ===
            "bold"
              ? "bold"
              : "normal";

          element.fontStyle =
            textObject.fontStyle ===
            "italic"
              ? "italic"
              : "normal";

          element.lineHeight =
            textObject.lineHeight ??
            1.16;

          element.charSpacing =
            textObject.charSpacing ??
            0;

          const textAlign =
            (
              textObject as IText & {
                textAlign?:
                  | "left"
                  | "center"
                  | "right";
              }
            ).textAlign;

          element.textAlign =
            textAlign ??
            "left";
        }

        /*
         * FILLED SHAPES
         */
        const filledShapeTypes: ElementType[] =
          [
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

        if (
          filledShapeTypes.includes(
            elementType
          )
        ) {
          element.backgroundColor =
            typeof object.fill ===
            "string"
              ? object.fill
              : "#2563eb";

          const meta =
            fabricObject as
              FabricObjectWithMeta;

          if (meta.shapeSides) {
            element.shapeSides =
              meta.shapeSides;
          }
        }

        /*
         * LINES
         */
        const lineTypes: ElementType[] =
          [
            "line",
            "arrow",
            "double-arrow",
            "dashed-line",
            "dotted-line",
          ];

        if (
          lineTypes.includes(
            elementType
          )
        ) {
          element.strokeColor =
            typeof object.stroke ===
            "string"
              ? object.stroke
              : "#111827";

          element.strokeWidth =
            typeof object.strokeWidth ===
            "number"
              ? object.strokeWidth
              : 4;

          const dash =
            (
              object as typeof object & {
                strokeDashArray?: number[];
              }
            ).strokeDashArray;

          if (dash) {
            element.lineDash =
              [...dash];
          }
        }

        /*
         * IMAGE
         */
        if (
          object.type === "image"
        ) {
          element.src =
            fabricObject.imageSrc ??
            "";
        }

        return element;
      });
  }

  function selectObjectById(
    id: string
  ) {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const object = canvas
      .getObjects()
      .find(
        (item) =>
          (
            item as typeof item &
            FabricObjectWithMeta
          ).elementId === id
      );

    if (!object) return;

    canvas.setActiveObject(
      object
    );

    setSelectedObject(object);

    canvas.renderAll();
  }

  function addText(
    type:
      | "heading"
      | "subheading"
      | "text" = "text"
  ) {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    const settings = {
      heading: {
        text: "Heading",
        fontSize: 42,
        fontWeight:
          "bold" as const,
      },

      subheading: {
        text: "Subheading",
        fontSize: 26,
        fontWeight:
          "bold" as const,
      },

      text: {
        text: "Add your text here",
        fontSize: 18,
        fontWeight:
          "normal" as const,
      },
    };

    const config =
      settings[type];

    const textObject =
      new Textbox(
        config.text,
        {
          left: 100,

          top: 100,

          width:
            type === "heading"
              ? 500
              : type === "subheading"
                ? 450
                : 400,

          fontSize:
            config.fontSize,

          fontFamily:
            "Arial",

          fill:
            "#111827",

          fontWeight:
            config.fontWeight,

          fontStyle:
            "normal",

          lineHeight:
            1.16,

          charSpacing:
            0,

          textAlign:
            "left",

          originX:
            "left",

          originY:
            "top",

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

    const meta =
      textObject as typeof textObject &
      FabricObjectWithMeta;

    meta.elementId =
      crypto.randomUUID();

    meta.elementType =
      type;

    canvas.add(
      textObject
    );

    canvas.setActiveObject(
      textObject
    );

    setSelectedObject(
      textObject
    );

    canvas.renderAll();
  }

  function getPolygonSides(
    type: string
  ) {
    if (type === "pentagon")
      return 5;

    if (type === "hexagon")
      return 6;

    if (type === "heptagon")
      return 7;

    if (type === "octagon")
      return 8;

    return 6;
  }

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
          radius *
            Math.cos(angle),

        y:
          radius +
          radius *
            Math.sin(angle),
      });
    }

    return points;
  }

  function applyObjectControls(
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
    type:
      | "line"
      | "arrow"
      | "double-arrow"
      | "dashed-line"
      | "dotted-line"
  ) {
    const width = 220;

    const stroke =
      "#111827";

    const strokeWidth =
      4;

    const commonOptions = {
      left: 100,

      top: 100,

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
      type === "line" ||
      type === "dashed-line" ||
      type === "dotted-line"
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
            type === "dashed-line"
              ? [18, 10]
              : type === "dotted-line"
                ? [2, 10]
                : undefined,
        }
      );
    }

    if (
      type === "arrow"
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

  function addShape(
    type:
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
      | "dotted-line"
  ) {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    saveCanvasState();

    let object: any;

    /*
     * RECTANGLE
     */
    if (
      type === "rectangle"
    ) {
      object = new Rect({
        left: 100,
        top: 100,
        width: 180,
        height: 100,
        fill: "#2563eb",
      });
    }

    /*
     * SQUARE
     */
    if (
      type === "square"
    ) {
      object = new Rect({
        left: 100,
        top: 100,
        width: 140,
        height: 140,
        fill: "#2563eb",
      });
    }

    /*
     * CIRCLE
     */
    if (
      type === "circle"
    ) {
      object = new Circle({
        left: 100,
        top: 100,
        radius: 70,
        fill: "#2563eb",
      });
    }

    /*
     * TRIANGLE
     */
    if (
      type === "triangle"
    ) {
      object =
        new Triangle({
          left: 100,
          top: 100,
          width: 150,
          height: 120,
          fill: "#2563eb",
        });
    }

    /*
     * POLYGON FAMILY
     */
    if (
      type === "polygon" ||
      type === "pentagon" ||
      type === "hexagon" ||
      type === "heptagon" ||
      type === "octagon"
    ) {
      const sides =
        getPolygonSides(type);

      const radius = 75;

      object =
        new Polygon(
          getPolygonPoints(
            sides,
            radius
          ),
          {
            left: 100,

            top: 100,

            fill: "#2563eb",
          }
        );

      const polygonMeta =
        object as typeof object &
          FabricObjectWithMeta;

      polygonMeta.shapeSides =
        sides;
    }

    /*
     * LINES
     */
    if (
      type === "line" ||
      type === "arrow" ||
      type === "double-arrow" ||
      type === "dashed-line" ||
      type === "dotted-line"
    ) {
      object =
        createLineObject(type);
    }

    if (!object) {
      return;
    }

    applyObjectControls(
      object
    );

    const meta =
      object as typeof object &
      FabricObjectWithMeta;

    meta.elementId =
      crypto.randomUUID();

    meta.elementType =
      type;

    canvas.add(object);

    canvas.setActiveObject(
      object
    );

    setSelectedObject(
      object
    );

    canvas.renderAll();
  }

  async function addImage(
    dataUrl: string
  ) {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    try {
      saveCanvasState();

      const image =
        await FabricImage.fromURL(
          dataUrl
        );

      const currentCanvas = canvasRef.current;

      if (!currentCanvas) return;

      const maxWidth = 350;

      const originalWidth =
        image.width || 1;

      const scale =
        maxWidth /
        originalWidth;

      image.set({
        left: 100,

        top: 100,

        scaleX: scale,

        scaleY: scale,

        angle: 0,

        opacity: 1,

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

      const meta =
        image as typeof image &
        FabricObjectWithMeta;

      meta.elementId =
        crypto.randomUUID();

      meta.elementType =
        "image";

      meta.imageSrc =
        dataUrl;

      canvas.add(image);

      canvas.setActiveObject(
        image
      );

      setSelectedObject(
        image
      );

      canvas.renderAll();
    } catch (error) {
      console.error(
        "Image could not be loaded:",
        error
      );
    }
  }

  function deleteSelected() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    canvas.remove(
      selectedObject
    );

    canvas.discardActiveObject();

    setSelectedObject(
      null
    );

    canvas.renderAll();
  }

  function duplicateSelected() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    selectedObject
      .clone()
      .then((cloned: any) => {
        cloned.set({
          left:
            (selectedObject.left ??
              0) + 20,

          top:
            (selectedObject.top ??
              0) + 20,
        });

        const originalMeta =
          selectedObject as
          FabricObjectWithMeta;

        const clonedMeta =
          cloned as
          FabricObjectWithMeta;

        clonedMeta.elementId =
          crypto.randomUUID();

        clonedMeta.elementType =
          originalMeta.elementType;

        clonedMeta.imageSrc =
          originalMeta.imageSrc;

        clonedMeta.shapeSides =
          originalMeta.shapeSides;

        canvas.add(cloned);

        canvas.setActiveObject(
          cloned
        );

        setSelectedObject(
          cloned
        );

        canvas.renderAll();
      });
  }

  

  

  function increaseFontSize() {
    if (!selectedObject)
      return;

    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    const current =
      selectedObject.fontSize ??
      18;

    selectedObject.set({
      fontSize:
        current + 2,
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvasRef.current?.renderAll();
  }

  function decreaseFontSize() {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    const current =
      selectedObject.fontSize ??
      18;

    selectedObject.set({
      fontSize:
        Math.max(
          8,
          current - 2
        ),
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvasRef.current?.renderAll();
  }

  function setFontSize(
    size: number
  ) {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    selectedObject.set({
      fontSize: size,
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvasRef.current?.renderAll();
  }

  function setTextColor(
    color: string
  ) {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    selectedObject.set({
      fill: color,
    });

    canvasRef.current?.renderAll();
  }

  function setShapeColor(
    color: string
  ) {
    if (!selectedObject)
      return;

    const meta =
      selectedObject as
        FabricObjectWithMeta;

    const lineTypes: ElementType[] =
      [
        "line",
        "arrow",
        "double-arrow",
        "dashed-line",
        "dotted-line",
      ];

    const shapeTypes: ElementType[] =
      [
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

    if (
      selectedObject.type !==
      "rect" &&
      selectedObject.type !==
      "circle" &&
      selectedObject.type !==
      "triangle"
    ) {
      return;
    }

    saveCanvasState();

    if (
      lineTypes.includes(
        meta.elementType
      )
    ) {
      selectedObject.set({
        stroke: color,
      });
    } else {
      selectedObject.set({
        fill: color,
      });
    }

    canvasRef.current?.renderAll();
  }

  function setFontFamily(
    fontFamily: string
  ) {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    selectedObject.set({
      fontFamily,
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvasRef.current?.renderAll();
  }

  function toggleBold() {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    selectedObject.set({
      fontWeight:
        selectedObject.fontWeight ===
          "bold"
          ? "normal"
          : "bold",
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvasRef.current?.renderAll();
  }

  function toggleItalic() {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    selectedObject.set({
      fontStyle:
        selectedObject.fontStyle ===
          "italic"
          ? "normal"
          : "italic",
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvasRef.current?.renderAll();
  }

  function setLineSpacing(
    value: number
  ) {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    const safeValue =
      Math.min(
        3,
        Math.max(1, value)
      );

    saveCanvasState();

    selectedObject.set({
      lineHeight:
        safeValue,
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    const canvas =
      canvasRef.current;

    if (canvas) {
      canvas.setActiveObject(
        selectedObject
      );

      canvas.requestRenderAll();
    }

    setSelectedObject(
      selectedObject
    );
  }

  function setLetterSpacing(
    value: number
  ) {
    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    const safeValue =
      Math.min(
        200,
        Math.max(0, value)
      );

    const fabricValue =
      safeValue * 10;

    saveCanvasState();

    selectedObject.set({
      charSpacing:
        fabricValue,
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    const canvas =
      canvasRef.current;

    if (canvas) {
      canvas.setActiveObject(
        selectedObject
      );

      canvas.requestRenderAll();
    }

    setSelectedObject(
      selectedObject
    );
  }

  function alignObject(
    alignment:
      | "left"
      | "center"
      | "right"
  ) {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    if (
      selectedObject.type !==
      "i-text" &&
      selectedObject.type !==
      "textbox"
    ) {
      return;
    }

    saveCanvasState();

    selectedObject.set({
      textAlign:
        alignment,
    });

    selectedObject.initDimensions();

    selectedObject.setCoords();

    canvas.setActiveObject(
      selectedObject
    );

    setSelectedObject(
      selectedObject
    );

    canvas.requestRenderAll();
  }

  function rotateSelected(
    degrees: number
  ) {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    const currentAngle =
      selectedObject.angle ??
      0;

    selectedObject.set({
      angle:
        currentAngle +
        degrees,
    });

    selectedObject.setCoords();

    canvas.setActiveObject(
      selectedObject
    );

    setSelectedObject(
      selectedObject
    );

    canvas.renderAll();
  }

  function bringForward() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    canvas.bringObjectForward(
      selectedObject
    );

    canvas.setActiveObject(
      selectedObject
    );

    setSelectedObject(
      selectedObject
    );

    canvas.renderAll();
  }

  function sendBackward() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    canvas.sendObjectBackwards(
      selectedObject
    );

    canvas.setActiveObject(
      selectedObject
    );

    setSelectedObject(
      selectedObject
    );

    canvas.renderAll();
  }

  function bringToFront() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    canvas.bringObjectToFront(
      selectedObject
    );

    canvas.setActiveObject(
      selectedObject
    );

    setSelectedObject(
      selectedObject
    );

    canvas.renderAll();
  }

  function sendToBack() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      !selectedObject
    ) {
      return;
    }

    saveCanvasState();

    canvas.sendObjectToBack(
      selectedObject
    );

    canvas.setActiveObject(
      selectedObject
    );

    setSelectedObject(
      selectedObject
    );

    canvas.renderAll();
  }

  function restoreSelection(
    selectedId:
      | string
      | undefined
  ) {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    if (!selectedId) {
      canvas.discardActiveObject();

      setSelectedObject(
        null
      );

      canvas.renderAll();

      return;
    }

    const object =
      canvas
        .getObjects()
        .find(
          (item) =>
            (
              item as typeof item &
              FabricObjectWithMeta
            ).elementId ===
            selectedId
        );

    if (object) {
      canvas.setActiveObject(
        object
      );

      setSelectedObject(
        object
      );
    } else {
      canvas.discardActiveObject();

      setSelectedObject(
        null
      );
    }

    canvas.renderAll();
  }

  function undo() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      history.length === 0
    ) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    const activeMeta =
      activeObject as
      | (typeof activeObject &
        FabricObjectWithMeta)
      | null;

    const selectedId =
      activeMeta?.elementId;

    const previousState =
      history[
      history.length - 1
      ];

    const currentState =
      JSON.stringify(
        canvas.toJSON()
      );

    setFuture((previous) => [
      ...previous,
      currentState,
    ]);

    setHistory((previous) =>
      previous.slice(0, -1)
    );

    canvas
      .loadFromJSON(
        JSON.parse(
          previousState
        )
      )
      .then(() => {
        restoreSelection(
          selectedId
        );
      });
  }

  function redo() {
    const canvas =
      canvasRef.current;

    if (
      !canvas ||
      future.length === 0
    ) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    const activeMeta =
      activeObject as
      | (typeof activeObject &
        FabricObjectWithMeta)
      | null;

    const selectedId =
      activeMeta?.elementId;

    const nextState =
      future[
      future.length - 1
      ];

    const currentState =
      JSON.stringify(
        (canvas as any).toJSON([
          "elementId",
          "elementType",
          "imageSrc",
        ])
      );

    setHistory((previous) => [
      ...previous,
      currentState,
    ]);

    setFuture((previous) =>
      previous.slice(0, -1)
    );

    canvas
      .loadFromJSON(
        JSON.parse(
          nextState
        )
      )
      .then(() => {
        restoreSelection(
          selectedId
        );
      });
  }

  function saveCurrentDesign(
    name: string
  ) {
    const elements =
      convertCanvasToElements();

    elements.forEach(async (element) => {
      try {
        await createElement(element);
      } catch (error) {
        console.error(
          "Failed to save element to backend:",
          error
        );
      }
    });

    if (elements.length === 0) {
      return;
    }

    const trimmedName =
      name.trim();

    if (!trimmedName) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Yahan pehle clearCanvas()
     * call ho raha tha.
     *
     * Isi wajah se Save ke baad
     * canvas empty ho jaata tha.
     *
     * Ab save ke baad canvas clear
     * nahi hoga.
     */
    saveDesign(
      trimmedName,
      elements
    );

    setHistory([]);

    setFuture([]);

    const canvas =
      canvasRef.current;

    if (canvas) {
      canvas.discardActiveObject();

      canvas.renderAll();
    }

    setSelectedObject(
      null
    );
  }

  function getDownloadName() {
    const name =
      currentDesignName &&
        currentDesignName.trim()
        ? currentDesignName.trim()
        : "certificate";

    return name
      .replace(
        /[^a-zA-Z0-9-_ ]/g,
        ""
      )
      .replace(
        /\s+/g,
        "-"
      )
      .toLowerCase();
  }

  function downloadPNG() {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const activeObject =
      canvas.getActiveObject();

    canvas.discardActiveObject();

    canvas.renderAll();

    const dataUrl =
      canvas.toDataURL({
        format: "png",
        multiplier: 2,
        quality: 1,
      });

    const link =
      document.createElement("a");

    link.href = dataUrl;

    link.download =
      `${getDownloadName()}.png`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    if (activeObject) {
      canvas.setActiveObject(
        activeObject
      );

      setSelectedObject(
        activeObject
      );

      canvas.renderAll();
    }
  }

  function downloadPDF() {
    const canvas =
      canvasRef.current;

    if (!canvas) return;

    const activeObject =
      canvas.getActiveObject();

    canvas.discardActiveObject();

    canvas.renderAll();

    const width =
      canvas.getWidth();

    const height =
      canvas.getHeight();

    const dataUrl =
      canvas.toDataURL({
        format: "png",
        multiplier: 2,
        quality: 1,
      });

    const pdf =
      new jsPDF({
        orientation:
          width >= height
            ? "landscape"
            : "portrait",

        unit: "px",

        format: [
          width,
          height,
        ],
      });

    pdf.addImage(
      dataUrl,
      "PNG",
      0,
      0,
      width,
      height
    );

    pdf.save(
      `${getDownloadName()}.pdf`
    );

    if (activeObject) {
      canvas.setActiveObject(
        activeObject
      );

      setSelectedObject(
        activeObject
      );

      canvas.renderAll();
    }
  }

  const value:
    FabricContextType = {
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

    canUndo:
      history.length > 0,

    canRedo:
      future.length > 0,

    selectedFontSize,

    saveCurrentDesign,

    downloadPNG,

    downloadPDF,
  };

  return (
    <FabricContext.Provider
      value={value}
    >
      {children}
    </FabricContext.Provider>
  );
}

export function useFabric() {
  const context =
    useContext(
      FabricContext
    );

  if (!context) {
    throw new Error(
      "useFabric must be used inside FabricProvider"
    );
  }

  return context;
}