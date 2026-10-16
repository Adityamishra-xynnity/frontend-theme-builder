import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { EditorElement } from "../types/editor";

import {
  getDesigns,
  createDesign,
  updateDesign,
  deleteDesign,
  type Design,
} from "../api/designApi";

export interface SavedDesign {
  id: number;
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
  currentDesignId: number | null;
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
  ) => Promise<void>;

  loadSavedDesign: (design: SavedDesign) => void;
  getSavedDesigns: () => Promise<SavedDesign[]>;
  deleteSavedDesign: (id: number) => Promise<void>;

  syncElementsFromCanvas: (
    elements: EditorElement[]
  ) => void;
}

const EditorContext =
  createContext<EditorContextType | null>(null);

const DEFAULT_BACKGROUND = "#ffffff";

interface EditorState {
  elements: EditorElement[];
  backgroundColor: string;
}

interface EditorProviderProps {
  children: ReactNode;
}

const createId = () => crypto.randomUUID();

export function EditorProvider({
  children,
}: EditorProviderProps) {
  const [elements, setElements] =
    useState<EditorElement[]>([]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [backgroundColor, setBackgroundColorState] =
    useState(DEFAULT_BACKGROUND);

  const [currentDesignId, setCurrentDesignId] =
    useState<number | null>(null);

  const [currentDesignName, setCurrentDesignName] =
    useState("");

  const [history, setHistory] =
    useState<EditorState[]>([]);

  const [future, setFuture] =
    useState<EditorState[]>([]);

  const createSnapshot = useCallback(
    (): EditorState => ({
      elements: [...elements],
      backgroundColor,
    }),
    [elements, backgroundColor]
  );

  const addHistory = useCallback(() => {
    setHistory((previous) => [
      ...previous,
      createSnapshot(),
    ]);

    setFuture([]);
  }, [createSnapshot]);

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
          ? { ...element, ...updates }
          : element
      )
    );
  };

  const deleteElement = (id: string) => {
    addHistory();

    setElements((previous) =>
      previous.filter(
        (element) => element.id !== id
      )
    );

    setSelectedId((previous) =>
      previous === id ? null : previous
    );
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(
      (item) => item.id === id
    );

    if (!element) {
      return;
    }

    addHistory();

    const duplicate: EditorElement = {
      ...element,
      id: createId(),
      backendId: undefined,
      x: element.x + 30,
      y: element.y + 30,
    };

    setElements((previous) => [
      ...previous,
      duplicate,
    ]);

    setSelectedId(duplicate.id);
  };

  const loadTemplate = useCallback(
    (template: {
      id: string;
      name: string;
      backgroundColor: string;
      elements: EditorElement[];
    }) => {
      setHistory([]);
      setFuture([]);

      setElements(
        template.elements.map((element) => ({
          ...element,
          id: element.id || createId(),
          backendId: undefined,
        }))
      );

      setBackgroundColorState(
        template.backgroundColor
      );

      setCurrentDesignId(null);
      setCurrentDesignName(template.name);
      setSelectedId(null);
    },
    []
  );

  const clearCanvas = useCallback(() => {
    setHistory([]);
    setFuture([]);
    setElements([]);
    setBackgroundColorState(DEFAULT_BACKGROUND);
    setCurrentDesignId(null);
    setCurrentDesignName("");
    setSelectedId(null);
  }, []);

  const setCanvasBackground = (color: string) => {
    addHistory();
    setBackgroundColorState(color);
  };

  const undo = () => {
    if (history.length === 0) {
      return;
    }

    const previous = history[history.length - 1];
    const current = createSnapshot();

    setFuture((items) => [current, ...items]);
    setHistory((items) => items.slice(0, -1));

    setElements(previous.elements);
    setBackgroundColorState(
      previous.backgroundColor
    );
    setSelectedId(null);
  };

  const redo = () => {
    if (future.length === 0) {
      return;
    }

    const next = future[0];
    const current = createSnapshot();

    setHistory((items) => [...items, current]);
    setFuture((items) => items.slice(1));

    setElements(next.elements);
    setBackgroundColorState(
      next.backgroundColor
    );
    setSelectedId(null);
  };

  const convertDesign = (
    design: Design
  ): SavedDesign => ({
    id: design.id,
    name: design.name || "My Certificate",
    elements: Array.isArray(design.elements)
      ? design.elements
      : [],
    backgroundColor:
      design.backgroundColor || DEFAULT_BACKGROUND,
    createdAt:
      design.createdAt || new Date().toISOString(),
    updatedAt:
      design.updatedAt || new Date().toISOString(),
  });

  const getSavedDesigns =
    async (): Promise<SavedDesign[]> => {
      try {
        const designs = await getDesigns();
        return designs.map(convertDesign);
      } catch (error) {
        console.error(
          "Failed to load designs:",
          error
        );
        return [];
      }
    };

  const saveDesign = async (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string
  ) => {
    const safeName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : currentDesignName || "My Certificate";

    const finalElements =
      Array.isArray(elementsOverride)
        ? elementsOverride
        : elements;

    const finalBackground =
      typeof backgroundOverride === "string"
        ? backgroundOverride
        : backgroundColor;

    const designData = {
      name: safeName,
      backgroundColor: finalBackground,
      elements: finalElements.map((element) => ({
        ...element,
        backendId: undefined,
      })),
    };

    try {
      let savedDesign: Design;

      if (currentDesignId !== null) {
        savedDesign = await updateDesign(
          currentDesignId,
          designData
        );
      } else {
        savedDesign = await createDesign(
          designData
        );
      }

      const converted = convertDesign(savedDesign);

      setCurrentDesignId(converted.id);
      setCurrentDesignName(converted.name);
      setElements(converted.elements);
      setBackgroundColorState(
        converted.backgroundColor
      );
    } catch (error) {
      console.error(
        "Failed to save design:",
        error
      );
      throw error;
    }
  };

  const loadSavedDesign = useCallback(
    (design: SavedDesign) => {
      setHistory([]);
      setFuture([]);

      setElements(
        Array.isArray(design.elements)
          ? design.elements
          : []
      );

      setBackgroundColorState(
        design.backgroundColor || DEFAULT_BACKGROUND
      );

      setCurrentDesignId(design.id);
      setCurrentDesignName(
        design.name || "My Certificate"
      );
      setSelectedId(null);
    },
    []
  );

  const deleteSavedDesign = async (
    id: number
  ) => {
    try {
      await deleteDesign(id);

      if (currentDesignId === id) {
        setCurrentDesignId(null);
        setCurrentDesignName("");
      }
    } catch (error) {
      console.error(
        "Failed to delete design:",
        error
      );
      throw error;
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
        canUndo: history.length > 0,
        canRedo: future.length > 0,

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
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error(
      "useEditor must be used inside EditorProvider"
    );
  }

  return context;
}