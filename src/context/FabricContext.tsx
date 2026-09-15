import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  Canvas as FabricCanvas,
  IText,
  Rect,
  Circle,
  Triangle,
} from "fabric";

import { useEditor } from "./EditorContext";

import type {
  EditorElement,
  ElementType,
} from "../types/editor";

type FabricObjectWithMeta = {
  elementId?: string;
  elementType?: ElementType;
};

interface FabricContextType {
  canvasRef: React.MutableRefObject<FabricCanvas | null>;

  selectedObject: any;

  setSelectedObject: (object: any) => void;

  selectedFontSize: number;

  addHeading: () => void;
  addSubheading: () => void;
  addText: () => void;

  addRectangle: () => void;
  addCircle: () => void;
  addTriangle: () => void;

  deleteSelected: () => void;
  duplicateSelected: () => void;

  increaseFontSize: () => void;
  decreaseFontSize: () => void;

  setFontSize: (size: number) => void;

  setFontFamily: (fontFamily: string) => void;

  setTextColor: (color: string) => void;

  setShapeColor: (color: string) => void;

  toggleBold: () => void;
  toggleItalic: () => void;

  alignObject: (
    position: "left" | "center" | "right"
  ) => void;

  undo: () => void;
  redo: () => void;

  canUndo: boolean;
  canRedo: boolean;

  saveCanvasState: () => void;

  saveCurrentDesign: (name?: string) => void;

  convertCanvasToElements: () => EditorElement[];
}

const FabricContext =
  createContext<FabricContextType | null>(null);

interface FabricProviderProps {
  children: ReactNode;
}

export function FabricProvider({
  children,
}: FabricProviderProps) {
  const canvasRef =
    useRef<FabricCanvas | null>(null);

  const {
    backgroundColor,
    saveDesign,
  } = useEditor();

  const [selectedObjectState, setSelectedObjectState] =
    useState<any>(null);

  const [selectedFontSize, setSelectedFontSize] =
    useState(18);

  const historyRef =
    useRef<string[]>([]);

  const futureRef =
    useRef<string[]>([]);

  const [canUndo, setCanUndo] =
    useState(false);

  const [canRedo, setCanRedo] =
    useState(false);

  /*
   * Ye function selected object ko React ke saath
   * properly sync karta hai.
   */
  const setSelectedObject = (object: any) => {
    setSelectedObjectState(object);

    if (object instanceof IText) {
      setSelectedFontSize(
        object.fontSize ?? 18
      );
    } else {
      setSelectedFontSize(18);
    }
  };

  const createId = () => {
    return crypto.randomUUID();
  };

  const updateHistoryButtons = () => {
    setCanUndo(
      historyRef.current.length > 0
    );

    setCanRedo(
      futureRef.current.length > 0
    );
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const json = JSON.stringify(
      canvas.toJSON()
    );

    historyRef.current.push(json);

    futureRef.current = [];

    updateHistoryButtons();
  };

  /*
   * =========================
   * ADD HEADING
   * =========================
   */

  const addHeading = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    saveCanvasState();

    const text = new IText(
      "Heading",
      {
        left: 200,
        top: 100,

        fontSize: 40,
        fontFamily: "Arial",

        fontWeight: "bold",
        fontStyle: "normal",

        fill: "#111827",

        originX: "left",
        originY: "top",

        editable: true,
        selectable: true,
        evented: true,
      }
    );

    const fabricText =
      text as typeof text &
        FabricObjectWithMeta;

    fabricText.elementId =
      createId();

    fabricText.elementType =
      "heading";

    canvas.add(text);

    canvas.setActiveObject(text);

    setSelectedObject(text);

    canvas.renderAll();
  };

  /*
   * =========================
   * ADD SUBHEADING
   * =========================
   */

  const addSubheading = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    saveCanvasState();

    const text = new IText(
      "Subheading",
      {
        left: 250,
        top: 180,

        fontSize: 28,
        fontFamily: "Arial",

        fontWeight: "bold",
        fontStyle: "normal",

        fill: "#374151",

        originX: "left",
        originY: "top",

        editable: true,
        selectable: true,
        evented: true,
      }
    );

    const fabricText =
      text as typeof text &
        FabricObjectWithMeta;

    fabricText.elementId =
      createId();

    fabricText.elementType =
      "subheading";

    canvas.add(text);

    canvas.setActiveObject(text);

    setSelectedObject(text);

    canvas.renderAll();
  };

  /*
   * =========================
   * ADD TEXT
   * =========================
   */

  const addText = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    saveCanvasState();

    const text = new IText(
      "Add your text",
      {
        left: 250,
        top: 250,

        fontSize: 18,
        fontFamily: "Arial",

        fontWeight: "normal",
        fontStyle: "normal",

        fill: "#111827",

        originX: "left",
        originY: "top",

        editable: true,
        selectable: true,
        evented: true,
      }
    );

    const fabricText =
      text as typeof text &
        FabricObjectWithMeta;

    fabricText.elementId =
      createId();

    fabricText.elementType =
      "text";

    canvas.add(text);

    canvas.setActiveObject(text);

    setSelectedObject(text);

    canvas.renderAll();
  };

  /*
   * =========================
   * ADD RECTANGLE
   * =========================
   */

  const addRectangle = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    saveCanvasState();

    const rectangle = new Rect({
      left: 150,
      top: 150,

      width: 220,
      height: 120,

      fill: "#2563eb",

      originX: "left",
      originY: "top",

      selectable: true,
      evented: true,
    });

    const fabricRectangle =
      rectangle as typeof rectangle &
        FabricObjectWithMeta;

    fabricRectangle.elementId =
      createId();

    fabricRectangle.elementType =
      "rectangle";

    canvas.add(rectangle);

    canvas.setActiveObject(
      rectangle
    );

    setSelectedObject(
      rectangle
    );

    canvas.renderAll();
  };

  /*
   * =========================
   * ADD CIRCLE
   * =========================
   */

  const addCircle = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    saveCanvasState();

    const circle = new Circle({
      left: 300,
      top: 200,

      radius: 70,

      fill: "#7c3aed",

      originX: "left",
      originY: "top",

      selectable: true,
      evented: true,
    });

    const fabricCircle =
      circle as typeof circle &
        FabricObjectWithMeta;

    fabricCircle.elementId =
      createId();

    fabricCircle.elementType =
      "circle";

    canvas.add(circle);

    canvas.setActiveObject(
      circle
    );

    setSelectedObject(
      circle
    );

    canvas.renderAll();
  };

  /*
   * =========================
   * ADD TRIANGLE
   * =========================
   */

  const addTriangle = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    saveCanvasState();

    const triangle = new Triangle({
      left: 350,
      top: 150,

      width: 150,
      height: 150,

      fill: "#059669",

      originX: "left",
      originY: "top",

      selectable: true,
      evented: true,
    });

    const fabricTriangle =
      triangle as typeof triangle &
        FabricObjectWithMeta;

    fabricTriangle.elementId =
      createId();

    fabricTriangle.elementType =
      "triangle";

    canvas.add(triangle);

    canvas.setActiveObject(
      triangle
    );

    setSelectedObject(
      triangle
    );

    canvas.renderAll();
  };

  /*
   * =========================
   * DELETE
   * =========================
   */

  const deleteSelected = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (!activeObject) {
      return;
    }

    saveCanvasState();

    canvas.remove(activeObject);

    canvas.discardActiveObject();

    setSelectedObject(null);

    canvas.renderAll();
  };

  /*
   * =========================
   * DUPLICATE
   * =========================
   */

  const duplicateSelected = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (!activeObject) {
      return;
    }

    saveCanvasState();

    activeObject
      .clone()
      .then((clonedObject: any) => {
        const cloned =
          clonedObject as FabricObjectWithMeta;

        const original =
          activeObject as FabricObjectWithMeta;

        cloned.elementId =
          createId();

        cloned.elementType =
          original.elementType;

        cloned.left =
          (activeObject.left ?? 0) +
          30;

        cloned.top =
          (activeObject.top ?? 0) +
          30;

        canvas.add(clonedObject);

        canvas.setActiveObject(
          clonedObject
        );

        setSelectedObject(
          clonedObject
        );

        canvas.renderAll();
      });
  };

  /*
   * =========================
   * SET FONT SIZE
   * =========================
   */

  const setFontSize = (
    size: number
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    const safeSize = Math.max(
      8,
      Math.min(
        200,
        Math.round(size)
      )
    );

    saveCanvasState();

    activeObject.set({
      fontSize: safeSize,
    });

    activeObject.setCoords();

    canvas.renderAll();

    /*
     * Sabse important part:
     *
     * Fabric object update
     * +
     * React state update
     */

    setSelectedFontSize(
      safeSize
    );

    setSelectedObjectState(
      activeObject
    );
  };

  /*
   * =========================
   * INCREASE FONT
   * =========================
   */

  const increaseFontSize = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    const currentSize =
      activeObject.fontSize ?? 18;

    setFontSize(
      currentSize + 2
    );
  };

  /*
   * =========================
   * DECREASE FONT
   * =========================
   */

  const decreaseFontSize = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    const currentSize =
      activeObject.fontSize ?? 18;

    setFontSize(
      currentSize - 2
    );
  };

  /*
   * =========================
   * FONT FAMILY
   * =========================
   */

  const setFontFamily = (
    fontFamily: string
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    saveCanvasState();

    activeObject.set({
      fontFamily,
    });

    activeObject.setCoords();

    canvas.renderAll();

    setSelectedObject(
      activeObject
    );
  };

  /*
   * =========================
   * TEXT COLOR
   * =========================
   */

  const setTextColor = (
    color: string
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    saveCanvasState();

    activeObject.set({
      fill: color,
    });

    canvas.renderAll();

    setSelectedObject(
      activeObject
    );
  };

  /*
   * =========================
   * SHAPE COLOR
   * =========================
   */

  const setShapeColor = (
    color: string
  ) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (!activeObject) {
      return;
    }

    if (
      activeObject instanceof IText
    ) {
      return;
    }

    saveCanvasState();

    activeObject.set({
      fill: color,
    });

    canvas.renderAll();

    setSelectedObject(
      activeObject
    );
  };

  /*
   * =========================
   * BOLD
   * =========================
   */

  const toggleBold = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    saveCanvasState();

    activeObject.set({
      fontWeight:
        activeObject.fontWeight ===
        "bold"
          ? "normal"
          : "bold",
    });

    canvas.renderAll();

    setSelectedObject(
      activeObject
    );
  };

  /*
   * =========================
   * ITALIC
   * =========================
   */

  const toggleItalic = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const activeObject =
      canvas.getActiveObject();

    if (
      !(activeObject instanceof IText)
    ) {
      return;
    }

    saveCanvasState();

    activeObject.set({
      fontStyle:
        activeObject.fontStyle ===
        "italic"
          ? "normal"
          : "italic",
    });

    canvas.renderAll();

    setSelectedObject(
      activeObject
    );
  };

  /*
   * =========================
   * ALIGN
   * =========================
   */

  const alignObject = (
    position:
      | "left"
      | "center"
      | "right"
  ) => {
    const canvas = canvasRef.current;

    const activeObject =
      canvas?.getActiveObject();

    if (
      !canvas ||
      !activeObject
    ) {
      return;
    }

    saveCanvasState();

    const canvasWidth =
      canvas.getWidth();

    const padding = 20;

    const objectWidth =
      activeObject.getScaledWidth();

    const maxWidth =
      canvasWidth -
      padding * 2;

    if (
      position === "left" &&
      activeObject instanceof IText
    ) {
      if (
        objectWidth > maxWidth
      ) {
        const scale =
          maxWidth /
          activeObject.getScaledWidth();

        activeObject.scaleX =
          (activeObject.scaleX ?? 1) *
          scale;

        activeObject.scaleY =
          (activeObject.scaleY ?? 1) *
          scale;
      }

      activeObject.set({
        left: padding,
        originX: "left",
      });

      activeObject.setCoords();

      canvas.renderAll();

      setSelectedObject(
        activeObject
      );

      return;
    }

    const currentWidth =
      activeObject.getScaledWidth();

    let newLeft = padding;

    if (
      position === "center"
    ) {
      newLeft =
        (canvasWidth -
          currentWidth) /
        2;
    }

    if (
      position === "right"
    ) {
      newLeft =
        canvasWidth -
        currentWidth -
        padding;
    }

    const maxLeft =
      canvasWidth -
      currentWidth -
      padding;

    newLeft = Math.max(
      padding,
      Math.min(
        newLeft,
        maxLeft
      )
    );

    activeObject.set({
      left: newLeft,
    });

    activeObject.setCoords();

    canvas.renderAll();

    setSelectedObject(
      activeObject
    );
  };

  /*
   * =========================
   * UNDO
   * =========================
   */

  const undo = () => {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      historyRef.current.length === 0
    ) {
      return;
    }

    const currentState =
      JSON.stringify(
        canvas.toJSON()
      );

    futureRef.current.push(
      currentState
    );

    const previousState =
      historyRef.current.pop();

    if (!previousState) {
      return;
    }

    canvas
      .loadFromJSON(
        JSON.parse(previousState)
      )
      .then(() => {
        canvas.renderAll();

        setSelectedObject(null);

        updateHistoryButtons();
      });
  };

  /*
   * =========================
   * REDO
   * =========================
   */

  const redo = () => {
    const canvas = canvasRef.current;

    if (
      !canvas ||
      futureRef.current.length === 0
    ) {
      return;
    }

    const currentState =
      JSON.stringify(
        canvas.toJSON()
      );

    historyRef.current.push(
      currentState
    );

    const nextState =
      futureRef.current.pop();

    if (!nextState) {
      return;
    }

    canvas
      .loadFromJSON(
        JSON.parse(nextState)
      )
      .then(() => {
        canvas.renderAll();

        setSelectedObject(null);

        updateHistoryButtons();
      });
  };

  /*
   * =========================
   * CONVERT CANVAS DATA
   * =========================
   */

  const convertCanvasToElements =
    (): EditorElement[] => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return [];
      }

      return canvas
        .getObjects()
        .map((object) => {
          const meta =
            object as FabricObjectWithMeta;

          const id =
            meta.elementId ??
            createId();

          const type =
            meta.elementType;

          /*
           * TEXT
           */

          if (
            object instanceof IText
          ) {
            let textType:
              | "heading"
              | "subheading"
              | "text";

            if (
              type === "heading" ||
              type === "subheading" ||
              type === "text"
            ) {
              textType = type;
            } else {
              textType = "text";
            }

            return {
              id,

              type: textType,

              x:
                object.left ?? 0,

              y:
                object.top ?? 0,

              width:
                object.getScaledWidth(),

              height:
                object.getScaledHeight(),

              text:
                object.text ?? "",

              fontSize:
                object.fontSize ?? 18,

              fontFamily:
                object.fontFamily ??
                "Arial",

              color:
                typeof object.fill ===
                "string"
                  ? object.fill
                  : "#111827",

              fontWeight:
                object.fontWeight ===
                "bold"
                  ? "bold"
                  : "normal",

              fontStyle:
                object.fontStyle ===
                "italic"
                  ? "italic"
                  : "normal",
            };
          }

          /*
           * CIRCLE
           */

          if (
            object instanceof Circle
          ) {
            return {
              id,

              type: "circle",

              x:
                object.left ?? 0,

              y:
                object.top ?? 0,

              width:
                object.getScaledWidth(),

              height:
                object.getScaledHeight(),

              backgroundColor:
                typeof object.fill ===
                "string"
                  ? object.fill
                  : "#2563eb",
            };
          }

          /*
           * TRIANGLE
           */

          if (
            object instanceof Triangle
          ) {
            return {
              id,

              type: "triangle",

              x:
                object.left ?? 0,

              y:
                object.top ?? 0,

              width:
                object.getScaledWidth(),

              height:
                object.getScaledHeight(),

              backgroundColor:
                typeof object.fill ===
                "string"
                  ? object.fill
                  : "#2563eb",
            };
          }

          /*
           * RECTANGLE
           */

          if (
            object instanceof Rect
          ) {
            return {
              id,

              type: "rectangle",

              x:
                object.left ?? 0,

              y:
                object.top ?? 0,

              width:
                object.getScaledWidth(),

              height:
                object.getScaledHeight(),

              backgroundColor:
                typeof object.fill ===
                "string"
                  ? object.fill
                  : "#2563eb",
            };
          }

          return null;
        })
        .filter(
          (
            element
          ): element is EditorElement =>
            element !== null
        );
    };

  /*
   * =========================
   * SAVE DESIGN
   * =========================
   */

  const saveCurrentDesign = (
    name?: string
  ) => {
    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const canvasElements =
      convertCanvasToElements();

    saveDesign(
      name,
      canvasElements,
      backgroundColor
    );
  };

  return (
    <FabricContext.Provider
      value={{
        canvasRef,

        selectedObject:
          selectedObjectState,

        setSelectedObject,

        selectedFontSize,

        addHeading,
        addSubheading,
        addText,

        addRectangle,
        addCircle,
        addTriangle,

        deleteSelected,
        duplicateSelected,

        increaseFontSize,
        decreaseFontSize,

        setFontSize,

        setFontFamily,

        setTextColor,

        setShapeColor,

        toggleBold,
        toggleItalic,

        alignObject,

        undo,
        redo,

        canUndo,
        canRedo,

        saveCanvasState,

        saveCurrentDesign,

        convertCanvasToElements,
      }}
    >
      {children}
    </FabricContext.Provider>
  );
}

export function useFabric() {
  const context =
    useContext(FabricContext);

  if (!context) {
    throw new Error(
      "useFabric must be used inside FabricProvider"
    );
  }

  return context;
}