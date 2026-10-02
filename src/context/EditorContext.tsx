import {
  createContext,
  useContext,
  useState,
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
  ] = useState<number | null>(null);

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

  /*
   * Add element only to React state.
   *
   * We do NOT immediately create it in the
   * backend.
   *
   * The complete design will be saved when
   * the user clicks Save.
   */
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

      /*
       * Very important:
       *
       * The duplicate is a NEW frontend element.
       *
       * It must not reuse the backend ID of
       * the original element.
       */
      backendId: undefined,

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

          /*
           * Template elements are not
           * backend elements yet.
           */
          backendId:
            undefined,
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
   * Convert backend Design into the
   * frontend SavedDesign format.
   */
  const convertDesign = (
    design: Design
  ): SavedDesign => {
    return {
      id: design.id,

      name:
        design.name ||
        "My Certificate",

      elements:
        Array.isArray(design.elements)
          ? design.elements
          : [],

      backgroundColor:
        design.backgroundColor ||
        DEFAULT_BACKGROUND,

      createdAt:
        design.createdAt ||
        new Date().toISOString(),

      updatedAt:
        design.updatedAt ||
        new Date().toISOString(),
    };
  };

  /*
   * Get designs from BACKEND.
   *
   * No localStorage.
   */
  const getSavedDesigns =
    async (): Promise<SavedDesign[]> => {
      try {
        const designs =
          await getDesigns();

        return designs.map(
          convertDesign
        );
      } catch (error) {
        console.error(
          "Failed to load designs:",
          error
        );

        return [];
      }
    };

  /*
   * Save the complete design to backend.
   *
   * If currentDesignId exists:
   *     PUT -> update existing design
   *
   * Otherwise:
   *     POST -> create new design
   */
  const saveDesign = async (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string
  ) => {
    const safeName =
      typeof name === "string" &&
      name.trim().length > 0
        ? name.trim()
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

    /*
     * Backend DesignElement uses a Long ID.
     *
     * Our frontend uses a string ID.
     *
     * Therefore we must NOT send the
     * frontend string ID as the database ID.
     *
     * backendId is used only when it exists.
     */
    const backendElements =
  finalElements.map(
    (element) => ({
      ...element,
      backendId: undefined,
    })
  );

    const designData = {
      name: safeName,

      backgroundColor:
        finalBackground,

      elements:
        backendElements,
    };

    try {
      let savedDesign: Design;

      if (currentDesignId !== null) {
        savedDesign =
          await updateDesign(
            currentDesignId,
            designData
          );
      } else {
        savedDesign =
          await createDesign(
            designData
          );
      }

      const converted =
        convertDesign(
          savedDesign
        );

      setCurrentDesignId(
        converted.id
      );

      setCurrentDesignName(
        converted.name
      );

      setElements(
        converted.elements
      );

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

  /*
   * Delete design from BACKEND.
   *
   * No localStorage.
   */
  const deleteSavedDesign =
    async (id: number) => {
      try {
        await deleteDesign(id);

        if (
          currentDesignId === id
        ) {
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