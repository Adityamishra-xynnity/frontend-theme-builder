
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
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

export type PaperSize = "A1" | "A2" | "A3" | "A4" | "A5";
export type PageOrientation = "portrait" | "landscape";

export interface EditorPage {
  id: string;
  name: string;
  elements: EditorElement[];
  backgroundColor: string;
  pageSize: PaperSize;
  orientation: PageOrientation;
}

export interface SavedDesign {
  id: number;
  name: string;
  elements: EditorElement[];
  backgroundColor: string;
  createdAt: string;
  updatedAt: string;
  pageSize?: PaperSize;
  orientation?: PageOrientation;
}

interface EditorContextType {
  elements: EditorElement[];
  selectedId: string | null;
  backgroundColor: string;
  currentDesignId: number | null;
  currentDesignName: string;
  canUndo: boolean;
  canRedo: boolean;
  pageSize: PaperSize;
  orientation: PageOrientation;
  pages: EditorPage[];
  activePageId: string;

  addPage: () => void;
  copyPage: () => void;
  deletePage: () => void;
  selectPage: (id: string) => void;

  setPageSettings: (
    pageSize: PaperSize,
    orientation: PageOrientation
  ) => void;

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
    backgroundOverride?: string,
    pageSizeOverride?: PaperSize,
    orientationOverride?: PageOrientation
  ) => Promise<void>;

  loadSavedDesign: (design: SavedDesign) => void;
  getSavedDesigns: () => Promise<SavedDesign[]>;
  deleteSavedDesign: (id: number) => Promise<void>;

  syncElementsFromCanvas: (
    elements: EditorElement[],
    sourcePageId?: string
  ) => void;
  registerCanvasSnapshotProvider: (provider: (() => EditorElement[]) | null) => void;
}

const EditorContext =
  createContext<EditorContextType | null>(null);

const DEFAULT_BACKGROUND = "#ffffff";
const DEFAULT_PAGE_SIZE: PaperSize = "A4";
const DEFAULT_ORIENTATION: PageOrientation = "landscape";

interface EditorState {
  elements: EditorElement[];
  backgroundColor: string;
}

interface EditorProviderProps {
  children: ReactNode;
}

const createId = () => crypto.randomUUID();

function isPaperSize(value: unknown): value is PaperSize {
  return (
    value === "A1" ||
    value === "A2" ||
    value === "A3" ||
    value === "A4" ||
    value === "A5"
  );
}

function isOrientation(
  value: unknown
): value is PageOrientation {
  return value === "portrait" || value === "landscape";
}

export function EditorProvider({
  children,
}: EditorProviderProps) {
  const [elements, setElements] =
    useState<EditorElement[]>([]);

  // Synchronous snapshot used by page actions so they never copy stale state.
  const latestElementsRef = useRef<EditorElement[]>([]);
  const canvasSnapshotProviderRef = useRef<(() => EditorElement[]) | null>(null);

  const registerCanvasSnapshotProvider = useCallback(
    (provider: (() => EditorElement[]) | null) => {
      canvasSnapshotProviderRef.current = provider;
    },
    []
  );

  useEffect(() => {
    latestElementsRef.current = elements;
  }, [elements]);

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [backgroundColor, setBackgroundColorState] =
    useState(DEFAULT_BACKGROUND);

  const [currentDesignId, setCurrentDesignId] =
    useState<number | null>(null);

  const [currentDesignName, setCurrentDesignName] =
    useState("");

  const [pageSize, setPageSize] =
    useState<PaperSize>(DEFAULT_PAGE_SIZE);

  const [orientation, setOrientation] =
    useState<PageOrientation>(DEFAULT_ORIENTATION);

  const [initialPageId] = useState(() => createId());

  const [pages, setPages] = useState<EditorPage[]>([
    {
      id: initialPageId,
      name: "Page 1",
      elements: [],
      backgroundColor: DEFAULT_BACKGROUND,
      pageSize: DEFAULT_PAGE_SIZE,
      orientation: DEFAULT_ORIENTATION,
    },
  ]);

  const [activePageId, setActivePageId] =
    useState<string>(initialPageId);

  // Prevent the previous page's state from overwriting
  // the newly selected page during a page switch.
  const previousActivePageIdRef = useRef(activePageId);

  useEffect(() => {
    if (previousActivePageIdRef.current !== activePageId) {
      previousActivePageIdRef.current = activePageId;
      return;
    }

    setPages((previous) =>
      previous.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              elements,
              backgroundColor,
              pageSize,
              orientation,
            }
          : page
      )
    );
  }, [
    activePageId,
    elements,
    backgroundColor,
    pageSize,
    orientation,
  ]);

  const [history, setHistory] = useState<EditorState[]>([]);
  const [future, setFuture] = useState<EditorState[]>([]);

  const addPage = useCallback(() => {
    const newPage: EditorPage = {
      id: createId(),
      name: `Page ${pages.length + 1}`,
      elements: [],
      backgroundColor: DEFAULT_BACKGROUND,
      pageSize,
      orientation,
    };

    setPages((previous) => [
      ...previous.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              elements,
              backgroundColor,
              pageSize,
              orientation,
            }
          : page
      ),
      newPage,
    ]);

    latestElementsRef.current = [];
    setActivePageId(newPage.id);
    latestElementsRef.current = [];
    setElements([]);
    setBackgroundColorState(DEFAULT_BACKGROUND);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);
    setCurrentDesignId(null);
    setCurrentDesignName("");
  }, [
    pages.length,
    activePageId,
    elements,
    backgroundColor,
    pageSize,
    orientation,
  ]);

  const copyPage = useCallback(() => {
    // Ask Fabric for a synchronous snapshot at the exact moment Copy Page is
    // clicked. This includes text currently being edited and the latest object
    // transforms, instead of relying only on potentially stale React state.
    const canvasSnapshot = canvasSnapshotProviderRef.current?.();
    const sourceElements = canvasSnapshot ?? latestElementsRef.current;
    const elementsToCopy = sourceElements.length ? sourceElements : elements;

    // Clone each element and nested path data so both pages are identical but
    // independently editable.
    const copiedElements = elementsToCopy.map((element) => ({
      ...element,
      id: createId(),
      backendId: undefined,
      pathData: element.pathData?.map((command) => [...command]),
    }));

    const copied: EditorPage = {
      id: createId(),
      name: `Page ${pages.length + 1}`,
      elements: copiedElements,
      backgroundColor,
      pageSize,
      orientation,
    };

    setPages((previous) => [
      ...previous.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              elements: elementsToCopy,
              backgroundColor,
              pageSize,
              orientation,
            }
          : page
      ),
      copied,
    ]);

    latestElementsRef.current = copied.elements;
    setActivePageId(copied.id);
    setElements(copied.elements);
    setBackgroundColorState(copied.backgroundColor);
    setPageSize(copied.pageSize);
    setOrientation(copied.orientation);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);
    setCurrentDesignId(null);
    setCurrentDesignName("");
  }, [
    pages.length,
    activePageId,
    elements,
    backgroundColor,
    pageSize,
    orientation,
    elements,
  ]);

  const deletePage = useCallback(() => {
    if (pages.length <= 1) return;

    const index = pages.findIndex(
      (page) => page.id === activePageId
    );

    if (index < 0) return;

    const remaining = pages.filter(
      (page) => page.id !== activePageId
    );

    const nextPage =
      remaining[Math.max(0, index - 1)] ?? remaining[0];

    setPages(remaining);
    latestElementsRef.current = nextPage.elements;
    setActivePageId(nextPage.id);
    setElements(nextPage.elements);
    setBackgroundColorState(nextPage.backgroundColor);
    setPageSize(nextPage.pageSize);
    setOrientation(nextPage.orientation);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);
    setCurrentDesignId(null);
    setCurrentDesignName("");
  }, [pages, activePageId]);

  const selectPage = useCallback(
    (id: string) => {
      if (id === activePageId) return;

      const target = pages.find((page) => page.id === id);
      if (!target) return;

      setPages((previous) =>
        previous.map((page) =>
          page.id === activePageId
            ? {
                ...page,
                elements,
                backgroundColor,
                pageSize,
                orientation,
              }
            : page
        )
      );

      latestElementsRef.current = target.elements;
      setActivePageId(target.id);
      setElements(target.elements);
      setBackgroundColorState(target.backgroundColor);
      setPageSize(target.pageSize);
      setOrientation(target.orientation);
      setSelectedId(null);
      setHistory([]);
      setFuture([]);
      setCurrentDesignId(null);
      setCurrentDesignName("");
    },
    [
      activePageId,
      pages,
      elements,
      backgroundColor,
      pageSize,
      orientation,
    ]
  );

  const setPageSettings = useCallback(
    (
      nextPageSize: PaperSize,
      nextOrientation: PageOrientation
    ) => {
      setPageSize(nextPageSize);
      setOrientation(nextOrientation);
    },
    []
  );

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

  const addElement = (element: EditorElement) => {
    addHistory();

    latestElementsRef.current = [...latestElementsRef.current, element];
    setElements((previous) => [
      ...previous,
      element,
    ]);

    setSelectedId(element.id);
  };

  const selectElement = (id: string | null) => {
    setSelectedId(id);
  };

  const updateElement = (
    id: string,
    updates: Partial<EditorElement>
  ) => {
    addHistory();

    const updatedElements = latestElementsRef.current.map((element) =>
      element.id === id ? { ...element, ...updates } : element
    );
    latestElementsRef.current = updatedElements;
    setElements(updatedElements);
  };

  const deleteElement = (id: string) => {
    addHistory();

    const updatedElements = latestElementsRef.current.filter((element) => element.id !== id);
    latestElementsRef.current = updatedElements;
    setElements(updatedElements);

    setSelectedId((previous) =>
      previous === id ? null : previous
    );
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(
      (item) => item.id === id
    );

    if (!element) return;

    addHistory();

    const duplicate: EditorElement = {
      ...element,
      id: createId(),
      backendId: undefined,
      x: element.x + 30,
      y: element.y + 30,
    };

    latestElementsRef.current = [...latestElementsRef.current, duplicate];
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

      const templateElements = template.elements.map(
        (element) => ({
          ...element,
          id: element.id || createId(),
          backendId: undefined,
        })
      );

      latestElementsRef.current = templateElements;
      setElements(templateElements);
      setBackgroundColorState(template.backgroundColor);
      setCurrentDesignId(null);
      setCurrentDesignName(template.name);
      setSelectedId(null);
      setPageSize(DEFAULT_PAGE_SIZE);
      setOrientation(DEFAULT_ORIENTATION);

      const pageId = createId();

      setPages([
        {
          id: pageId,
          name: "Page 1",
          elements: templateElements,
          backgroundColor: template.backgroundColor,
          pageSize: DEFAULT_PAGE_SIZE,
          orientation: DEFAULT_ORIENTATION,
        },
      ]);

      setActivePageId(pageId);
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
    setPageSize(DEFAULT_PAGE_SIZE);
    setOrientation(DEFAULT_ORIENTATION);

    const pageId = createId();

    setPages([
      {
        id: pageId,
        name: "Page 1",
        elements: [],
        backgroundColor: DEFAULT_BACKGROUND,
        pageSize: DEFAULT_PAGE_SIZE,
        orientation: DEFAULT_ORIENTATION,
      },
    ]);

    setActivePageId(pageId);
  }, []);

  const setCanvasBackground = (color: string) => {
    addHistory();
    setBackgroundColorState(color);
  };

  const undo = () => {
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const current = createSnapshot();

    setFuture((items) => [current, ...items]);
    setHistory((items) => items.slice(0, -1));
    latestElementsRef.current = previous.elements;
    setElements(previous.elements);
    setBackgroundColorState(previous.backgroundColor);
    setSelectedId(null);
  };

  const redo = () => {
    if (future.length === 0) return;

    const next = future[0];
    const current = createSnapshot();

    setHistory((items) => [...items, current]);
    setFuture((items) => items.slice(1));
    latestElementsRef.current = next.elements;
    setElements(next.elements);
    setBackgroundColorState(next.backgroundColor);
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
    pageSize: isPaperSize(design.pageSize)
      ? design.pageSize
      : DEFAULT_PAGE_SIZE,
    orientation: isOrientation(design.orientation)
      ? design.orientation
      : DEFAULT_ORIENTATION,
  });

  const getSavedDesigns =
    async (): Promise<SavedDesign[]> => {
      try {
        const designs = await getDesigns();
        return designs.map(convertDesign);
      } catch (error) {
        console.error("Failed to load designs:", error);
        return [];
      }
    };

  const saveDesign = async (
    name?: string,
    elementsOverride?: EditorElement[],
    backgroundOverride?: string,
    pageSizeOverride?: PaperSize,
    orientationOverride?: PageOrientation
  ) => {
    const safeName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : currentDesignName || "My Certificate";

    const finalElements = Array.isArray(elementsOverride)
      ? elementsOverride
      : elements;

    const finalBackground =
      typeof backgroundOverride === "string"
        ? backgroundOverride
        : backgroundColor;

    const finalPageSize = pageSizeOverride ?? pageSize;
    const finalOrientation = orientationOverride ?? orientation;

    const designData = {
      name: safeName,
      backgroundColor: finalBackground,
      elements: finalElements.map((element) => ({
        ...element,
        backendId: undefined,
      })),
      pageSize: finalPageSize,
      orientation: finalOrientation,
    };

    try {
      let savedDesign: Design;

      if (currentDesignId !== null) {
        savedDesign = await updateDesign(
          currentDesignId,
          designData
        );
      } else {
        savedDesign = await createDesign(designData);
      }

      const converted = convertDesign(savedDesign);

      setCurrentDesignId(converted.id);
      setCurrentDesignName(converted.name);
      latestElementsRef.current = converted.elements;
      setElements(converted.elements);
      setBackgroundColorState(converted.backgroundColor);
      setPageSize(converted.pageSize ?? DEFAULT_PAGE_SIZE);
      setOrientation(converted.orientation ?? DEFAULT_ORIENTATION);
    } catch (error) {
      console.error("Failed to save design:", error);
      throw error;
    }
  };

  const loadSavedDesign = useCallback(
    (design: SavedDesign) => {
      setHistory([]);
      setFuture([]);

      const designElements = Array.isArray(design.elements)
        ? design.elements
        : [];

      const designBackground =
        design.backgroundColor || DEFAULT_BACKGROUND;

      const designPageSize = isPaperSize(design.pageSize)
        ? design.pageSize
        : DEFAULT_PAGE_SIZE;

      const designOrientation = isOrientation(design.orientation)
        ? design.orientation
        : DEFAULT_ORIENTATION;

      latestElementsRef.current = designElements;
      setElements(designElements);
      setBackgroundColorState(designBackground);
      setCurrentDesignId(design.id);
      setCurrentDesignName(design.name || "My Certificate");
      setSelectedId(null);
      setPageSize(designPageSize);
      setOrientation(designOrientation);

      const pageId = createId();

      setPages([
        {
          id: pageId,
          name: "Page 1",
          elements: designElements,
          backgroundColor: designBackground,
          pageSize: designPageSize,
          orientation: designOrientation,
        },
      ]);

      setActivePageId(pageId);
    },
    []
  );

  const deleteSavedDesign = async (id: number) => {
    try {
      await deleteDesign(id);

      if (currentDesignId === id) {
        setCurrentDesignId(null);
        setCurrentDesignName("");
      }
    } catch (error) {
      console.error("Failed to delete design:", error);
      throw error;
    }
  };

  const syncElementsFromCanvas = (
    canvasElements: EditorElement[],
    sourcePageId?: string
  ) => {
    // Ignore late events from a canvas belonging to another page.
    if (sourcePageId && sourcePageId !== activePageId) {
      return;
    }

    latestElementsRef.current = canvasElements;
    setElements(canvasElements);

    // Keep the canvas update attached to the page that emitted it.
    // Delayed events from a previous page must never update the newly active page.
    const syncedPageId = sourcePageId ?? activePageId;
    setPages((previous) =>
      previous.map((page) =>
        page.id === syncedPageId
          ? {
              ...page,
              elements: canvasElements,
              backgroundColor,
              pageSize,
              orientation,
            }
          : page
      )
    );
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
        pageSize,
        orientation,
        pages,
        activePageId,

        addPage,
        copyPage,
        deletePage,
        selectPage,
        setPageSettings,

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
        registerCanvasSnapshotProvider,
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
