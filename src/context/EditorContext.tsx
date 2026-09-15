import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { EditorElement } from "../types/editor";

export interface SavedDesign {
  id: string;
  name: string;
  elements: EditorElement[];
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
}

interface EditorContextType {
  elements: EditorElement[];

  selectedId: string | null;

  backgroundColor: string;

  currentDesignId: string | null;

  currentDesignName: string;

  canUndo: boolean;

  canRedo: boolean;

  addElement: (
    element: EditorElement
  ) => void;

  selectElement: (
    id: string | null
  ) => void;

  updateElement: (
    id: string,
    updates: Partial<EditorElement>
  ) => void;

  deleteElement: (
    id: string
  ) => void;

  duplicateElement: (
    id: string
  ) => void;

  loadTemplate: (
    template: {
      id: string;
      name: string;
      backgroundColor: string;
      elements: EditorElement[];
    }
  ) => void;

  clearCanvas: () => void;

  setCanvasBackground: (
    color: string
  ) => void;

  undo: () => void;

  redo: () => void;

  saveDesign: (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string
  ) => void;

  loadSavedDesign: (
    design: SavedDesign
  ) => void;

  getSavedDesigns: () => SavedDesign[];

  deleteSavedDesign: (
    id: string
  ) => void;

  syncElementsFromCanvas: (
    elements: EditorElement[]
  ) => void;
}

const EditorContext =
  createContext<
    EditorContextType | null
  >(null);

const STORAGE_KEY =
  "theme-builder-saved-designs";

const DEFAULT_BACKGROUND =
  "#ffffff";

interface EditorState {
  elements: EditorElement[];
  backgroundColor: string;
}

interface EditorProviderProps {
  children: ReactNode;
}

export function EditorProvider({
  children,
}: EditorProviderProps) {
  const [elements, setElements] =
    useState<EditorElement[]>([]);

  const [
    selectedId,
    setSelectedId,
  ] = useState<string | null>(null);

  const [
    backgroundColor,
    setBackgroundColorState,
  ] = useState(
    DEFAULT_BACKGROUND
  );

  const [
    currentDesignId,
    setCurrentDesignId,
  ] = useState<string | null>(
    null
  );

  const [
    currentDesignName,
    setCurrentDesignName,
  ] = useState("");

  const [history, setHistory] =
    useState<EditorState[]>([]);

  const [future, setFuture] =
    useState<EditorState[]>([]);

  const createId = () =>
    crypto.randomUUID();

  const createSnapshot =
    (): EditorState => ({
      elements: [...elements],
      backgroundColor,
    });

  const addHistory = () => {
    setHistory((previous) => [
      ...previous,
      createSnapshot(),
    ]);

    setFuture([]);
  };

  const addElement = (
    element: EditorElement
  ) => {
    addHistory();

    setElements((previous) => [
      ...previous,
      element,
    ]);

    setSelectedId(element.id);
  };

  const selectElement = (
    id: string | null
  ) => {
    setSelectedId(id);
  };

  const updateElement = (
    id: string,
    updates: Partial<EditorElement>
  ) => {
    addHistory();

    setElements((previous) =>
      previous.map((element) =>
        element.id === id
          ? {
              ...element,
              ...updates,
            }
          : element
      )
    );
  };

  const deleteElement = (
    id: string
  ) => {
    addHistory();

    setElements((previous) =>
      previous.filter(
        (element) =>
          element.id !== id
      )
    );

    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const duplicateElement = (
    id: string
  ) => {
    const element =
      elements.find(
        (item) => item.id === id
      );

    if (!element) {
      return;
    }

    addHistory();

    const duplicate: EditorElement = {
      ...element,

      id: createId(),

      x: element.x + 30,

      y: element.y + 30,
    };

    setElements((previous) => [
      ...previous,
      duplicate,
    ]);

    setSelectedId(
      duplicate.id
    );
  };

  const loadTemplate = (
    template: {
      id: string;
      name: string;
      backgroundColor: string;
      elements: EditorElement[];
    }
  ) => {
    setHistory([]);

    setFuture([]);

    setElements(
      template.elements.map(
        (element) => ({
          ...element,
          id: element.id || createId(),
        })
      )
    );

    setBackgroundColorState(
      template.backgroundColor
    );

    setCurrentDesignId(null);

    setCurrentDesignName(
      template.name
    );

    setSelectedId(null);
  };

  const clearCanvas = () => {
    setHistory([]);

    setFuture([]);

    setElements([]);

    setBackgroundColorState(
      DEFAULT_BACKGROUND
    );

    setCurrentDesignId(null);

    setCurrentDesignName("");

    setSelectedId(null);
  };

  const setCanvasBackground = (
    color: string
  ) => {
    setBackgroundColorState(color);
  };

  const undo = () => {
    if (history.length === 0) {
      return;
    }

    const previous =
      history[
        history.length - 1
      ];

    const current =
      createSnapshot();

    setFuture((items) => [
      current,
      ...items,
    ]);

    setHistory((items) =>
      items.slice(0, -1)
    );

    setElements(
      previous.elements
    );

    setBackgroundColorState(
      previous.backgroundColor
    );
  };

  const redo = () => {
    if (future.length === 0) {
      return;
    }

    const next = future[0];

    const current =
      createSnapshot();

    setHistory((items) => [
      ...items,
      current,
    ]);

    setFuture((items) =>
      items.slice(1)
    );

    setElements(next.elements);

    setBackgroundColorState(
      next.backgroundColor
    );
  };

  const saveDesign = (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string
  ) => {
    const finalElements =
      elementsOverride ?? elements;

    const finalBackground =
      backgroundOverride ??
      backgroundColor;

    const designs: SavedDesign[] =
      JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        ) || "[]"
      );

    const now =
      new Date().toISOString();

    if (currentDesignId) {
      const updated =
        designs.map(
          (design) =>
            design.id ===
            currentDesignId
              ? {
                  ...design,

                  name:
                    name ||
                    currentDesignName ||
                    design.name,

                  elements:
                    finalElements,

                  backgroundColor:
                    finalBackground,

                  updatedAt: now,
                }
              : design
        );

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );
    } else {
      const newDesign: SavedDesign =
        {
          id: createId(),

          name:
            name ||
            "My Certificate",

          elements:
            finalElements,

          backgroundColor:
            finalBackground,

          createdAt: now,

          updatedAt: now,
        };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          ...designs,
          newDesign,
        ])
      );

      setCurrentDesignId(
        newDesign.id
      );

      setCurrentDesignName(
        newDesign.name
      );
    }

    setElements(finalElements);

    setBackgroundColorState(
      finalBackground
    );
  };

  const loadSavedDesign = (
    design: SavedDesign
  ) => {
    setHistory([]);

    setFuture([]);

    setElements(
      design.elements
    );

    setBackgroundColorState(
      design.backgroundColor
    );

    setCurrentDesignId(
      design.id
    );

    setCurrentDesignName(
      design.name
    );

    setSelectedId(null);
  };

  const getSavedDesigns =
    (): SavedDesign[] => {
      return JSON.parse(
        localStorage.getItem(
          STORAGE_KEY
        ) || "[]"
      );
    };

  const deleteSavedDesign = (
    id: string
  ) => {
    const designs =
      getSavedDesigns();

    const updated =
      designs.filter(
        (design) =>
          design.id !== id
      );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated)
    );

    if (currentDesignId === id) {
      setCurrentDesignId(null);

      setCurrentDesignName("");
    }
  };

  /*
   * Fabric canvas se latest elements
   * React state mein sync karta hai.
   *
   * Is function mein history add nahi
   * ki jaati, kyunki Fabric already
   * apni editing history manage karta hai.
   */
  const syncElementsFromCanvas = (
    canvasElements: EditorElement[]
  ) => {
    setElements(canvasElements);
  };

  return (
    <EditorContext.Provider
      value={{
        elements,

        selectedId,

        backgroundColor,

        currentDesignId,

        currentDesignName,

        canUndo:
          history.length > 0,

        canRedo:
          future.length > 0,

        addElement,

        selectElement,

        updateElement,

        deleteElement,

        duplicateElement,

        loadTemplate,

        clearCanvas,

        setCanvasBackground,

        undo,

        redo,

        saveDesign,

        loadSavedDesign,

        getSavedDesigns,

        deleteSavedDesign,

        syncElementsFromCanvas,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context =
    useContext(EditorContext);

  if (!context) {
    throw new Error(
      "useEditor must be used inside EditorProvider"
    );
  }

  return context;
}