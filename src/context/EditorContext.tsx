import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

import type { EditorElement } from "../types/editor";
import { createElement } from "../api/elementApi";

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

  addElement: (element: EditorElement) => void;

  selectElement: (id: string | null) => void;

  updateElement: (
    id: string,
    updates: Partial<EditorElement>
  ) => void;

  deleteElement: (id: string) => void;

  duplicateElement: (id: string) => void;

  loadTemplate: (template: {
    id: string;
    name: string;
    backgroundColor: string;
    elements: EditorElement[];
  }) => void;

  clearCanvas: () => void;

  setCanvasBackground: (color: string) => void;

  undo: () => void;

  redo: () => void;

  saveDesign: (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string
  ) => void;

  loadSavedDesign: (design: SavedDesign) => void;

  getSavedDesigns: () => SavedDesign[];

  deleteSavedDesign: (id: string) => void;

  syncElementsFromCanvas: (
    elements: EditorElement[]
  ) => void;
}

const EditorContext =
  createContext<EditorContextType | null>(null);

const STORAGE_KEY =
  "theme-builder-saved-designs";

const DEFAULT_BACKGROUND = "#ffffff";

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

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [
    backgroundColor,
    setBackgroundColorState,
  ] = useState(DEFAULT_BACKGROUND);

  const [
    currentDesignId,
    setCurrentDesignId,
  ] = useState<string | null>(null);

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

  const addElement = async (
  element: EditorElement
) => {
  addHistory();

  try {
    const savedElement = await createElement(element);

    const elementWithBackendId: EditorElement = {
      ...element,
      backendId: savedElement.id as unknown as number,
    };

    setElements((previous) => [
      ...previous,
      elementWithBackendId,
    ]);

    setSelectedId(element.id);
  } catch (error) {
    console.error("Failed to save element:", error);

    setElements((previous) => [
      ...previous,
      element,
    ]);

    setSelectedId(element.id);
  }
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
          id:
            element.id ||
            createId(),
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

  /*
   * Old ya corrupted localStorage data
   * ko safely read karta hai.
   */
  const getSavedDesigns =
    (): SavedDesign[] => {
      try {
        const raw =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (!raw) {
          return [];
        }

        const parsed =
          JSON.parse(raw);

        if (!Array.isArray(parsed)) {
          return [];
        }

        const validDesigns =
          parsed
            .filter(
              (design) =>
                design &&
                typeof design ===
                  "object"
            )
            .map((design) => {
              const safeName =
                typeof design.name ===
                "string"
                  ? design.name
                  : "My Certificate";

              const safeElements =
                Array.isArray(
                  design.elements
                )
                  ? design.elements
                  : [];

              return {
                id:
                  typeof design.id ===
                  "string"
                    ? design.id
                    : createId(),

                name: safeName,

                elements:
                  safeElements,

                backgroundColor:
                  typeof design.backgroundColor ===
                  "string"
                    ? design.backgroundColor
                    : DEFAULT_BACKGROUND,

                createdAt:
                  typeof design.createdAt ===
                  "string"
                    ? design.createdAt
                    : new Date().toISOString(),

                updatedAt:
                  typeof design.updatedAt ===
                  "string"
                    ? design.updatedAt
                    : new Date().toISOString(),
              };
            });

        /*
         * Corrupted names ko fix karke
         * localStorage mein dobara save karta hai.
         */
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(validDesigns)
        );

        return validDesigns;
      } catch (error) {
        console.error(
          "Failed to read saved designs:",
          error
        );

        return [];
      }
    };

  const saveDesign = (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string
  ) => {
    /*
     * Important:
     * Agar galti se array/object name ke
     * andar aa gaya ho to use ignore karo.
     */
    const safeName =
      typeof name === "string" &&
      name.trim().length > 0
        ? name
        : currentDesignName ||
          "My Certificate";

    const finalElements =
      Array.isArray(
        elementsOverride
      )
        ? elementsOverride
        : elements;

    const finalBackground =
      typeof backgroundOverride ===
      "string"
        ? backgroundOverride
        : backgroundColor;

    const designs =
      getSavedDesigns();

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

                  name: safeName,

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

          name: safeName,

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
      Array.isArray(design.elements)
        ? design.elements
        : []
    );

    setBackgroundColorState(
      design.backgroundColor ||
        DEFAULT_BACKGROUND
    );

    setCurrentDesignId(
      design.id
    );

    setCurrentDesignName(
      typeof design.name ===
        "string"
        ? design.name
        : "My Certificate"
    );

    setSelectedId(null);
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