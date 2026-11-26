
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
  getDesignsPage,
  createDesign,
  updateDesign,
  deleteDesign,
  type Design,
  type DesignPageData,
  type DesignPreviewElement,
} from "../api/designApi";

export type PaperSize = "A1" | "A2" | "A3" | "A4" | "A5";
export type PageOrientation = "portrait" | "landscape";

export interface EditorPageAsset {
  id: number;
  assetKey: string;
  name: string;
  category: string;
  assetData: Record<string, unknown>;
}

export interface EditorPage {
  id: string;
  name: string;
  elements: EditorElement[];
  backgroundColor: string;
  pageSize: PaperSize;
  orientation: PageOrientation;
  borderAsset?: EditorPageAsset | null;
  animationAsset?: EditorPageAsset | null;
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
  pages?: EditorPage[];
  previewElements?: DesignPreviewElement[];
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
  borderAsset: EditorPageAsset | null;
  animationAsset: EditorPageAsset | null;
  setPageBorderAsset: (asset: EditorPageAsset | null) => void;
  setPageAnimationAsset: (asset: EditorPageAsset | null) => void;

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

  getSavedDesignsPage: (
    page: number,
    size?: number
  ) => Promise<{
    designs: SavedDesign[];
    totalPages: number;
    totalElements: number;
    currentPage: number;
    last: boolean;
  }>;

  deleteSavedDesign: (id: number) => Promise<void>;

  syncElementsFromCanvas: (
    elements: EditorElement[],
    sourcePageId?: string
  ) => void;

  updatePages: (
    updater: (pages: EditorPage[]) => EditorPage[]
  ) => void;

  registerCanvasSnapshotProvider: (
    provider: (() => EditorElement[]) | null
  ) => void;

  /** Tell the draft autosave what this editing session was opened from (e.g. "new", "design:12"). */
  setDraftSource: (source: string) => void;
  /** Restore the autosaved draft if it belongs to `source`. Returns true when restored. */
  restoreDraft: (source: string) => boolean;
}

const DRAFT_STORAGE_KEY = "theme-builder:editor-draft:v1";

interface EditorDraft {
  v: 1;
  source: string;
  designId: number | null;
  name: string;
  activePageId: string;
  pages: EditorPage[];
  savedAt: number;
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

function cloneElements(elements: EditorElement[]): EditorElement[] {
  return elements.map((element) => ({
    ...element,
    pathData: element.pathData?.map((command) => [...command]),
  }));
}

function normalizePages(
  design: Design | SavedDesign
): EditorPage[] {
  if (Array.isArray(design.pages) && design.pages.length > 0) {
    return design.pages.map((page, index) => ({
      id: page.id || createId(),
      name: page.name || `Page ${index + 1}`,
      elements: Array.isArray(page.elements)
        ? page.elements
        : [],
      backgroundColor:
        page.backgroundColor || DEFAULT_BACKGROUND,
      pageSize: isPaperSize(page.pageSize)
        ? page.pageSize
        : DEFAULT_PAGE_SIZE,
      orientation: isOrientation(page.orientation)
        ? page.orientation
        : DEFAULT_ORIENTATION,
      borderAsset: page.borderAsset ?? null,
      animationAsset: page.animationAsset ?? null,
    }));
  }

  // Backward compatibility: old saved single-page design.
  return [
    {
      id: createId(),
      name: "Page 1",
      elements: Array.isArray(design.elements)
        ? design.elements
        : [],
      backgroundColor:
        design.backgroundColor || DEFAULT_BACKGROUND,
      pageSize: isPaperSize(design.pageSize)
        ? design.pageSize
        : DEFAULT_PAGE_SIZE,
      orientation: isOrientation(design.orientation)
        ? design.orientation
        : DEFAULT_ORIENTATION,
      borderAsset: null,
      animationAsset: null,
    },
  ];
}

export function EditorProvider({
  children,
}: EditorProviderProps) {
  const [elements, setElements] =
    useState<EditorElement[]>([]);

  const latestElementsRef = useRef<EditorElement[]>([]);

  const canvasSnapshotProviderRef = useRef<
    (() => EditorElement[]) | null
  >(null);

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

  const currentDesignIdRef = useRef<number | null>(null);
  const currentDesignNameRef = useRef("");
  useEffect(() => {
    currentDesignIdRef.current = currentDesignId;
    currentDesignNameRef.current = currentDesignName;
  }, [currentDesignId, currentDesignName]);

  const [pageSize, setPageSize] =
    useState<PaperSize>(DEFAULT_PAGE_SIZE);

  const [orientation, setOrientation] =
    useState<PageOrientation>(DEFAULT_ORIENTATION);

  const [borderAsset, setBorderAssetState] =
    useState<EditorPageAsset | null>(null);
  const [animationAsset, setAnimationAssetState] =
    useState<EditorPageAsset | null>(null);

  const [initialPageId] = useState(() => createId());

  const [pages, setPages] = useState<EditorPage[]>([
    {
      id: initialPageId,
      name: "Page 1",
      elements: [],
      backgroundColor: DEFAULT_BACKGROUND,
      pageSize: DEFAULT_PAGE_SIZE,
      orientation: DEFAULT_ORIENTATION,
      borderAsset: null,
      animationAsset: null,
    },
  ]);

  const pagesRef = useRef(pages);

  useEffect(() => {
    pagesRef.current = pages;
  }, [pages]);

  const [activePageId, setActivePageId] =
    useState<string>(initialPageId);

  const activePageIdRef = useRef(activePageId);
  const previousActivePageIdRef = useRef(activePageId);

  useEffect(() => {
    if (previousActivePageIdRef.current !== activePageId) {
      previousActivePageIdRef.current = activePageId;
      return;
    }

    setPages((previous) => {
      const updated = previous.map((page) =>
        page.id === activePageId
          ? {
            ...page,
            elements,
            backgroundColor,
            pageSize,
            orientation,
            borderAsset,
            animationAsset,
          }
          : page
      );

      pagesRef.current = updated;
      return updated;
    });
  }, [
    activePageId,
    elements,
    backgroundColor,
    pageSize,
    orientation,
    borderAsset,
    animationAsset,
  ]);

  const [history, setHistory] = useState<EditorState[]>([]);
  const [future, setFuture] = useState<EditorState[]>([]);

  const addPage = useCallback(() => {
    const canvasSnapshot =
      canvasSnapshotProviderRef.current?.();

    const currentElements =
      canvasSnapshot ?? latestElementsRef.current;

    const currentPages = pagesRef.current;

    const newPage: EditorPage = {
      id: createId(),
      name: `Page ${currentPages.length + 1}`,
      elements: [],
      backgroundColor: DEFAULT_BACKGROUND,
      pageSize,
      orientation,
      borderAsset: null,
      animationAsset: null,
    };

    const nextPages = [
      ...currentPages.map((page) =>
        page.id === activePageIdRef.current
          ? {
            ...page,
            elements: currentElements,
            backgroundColor,
            pageSize,
            orientation,
            borderAsset,
            animationAsset,
          }
          : page
      ),
      newPage,
    ];

    pagesRef.current = nextPages;
    setPages(nextPages);

    latestElementsRef.current = [];
    activePageIdRef.current = newPage.id;

    setActivePageId(newPage.id);
    setElements([]);
    setBackgroundColorState(DEFAULT_BACKGROUND);
    setBorderAssetState(null);
    setAnimationAssetState(null);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);

    // IMPORTANT: Keep currentDesignId.
    // Adding a page to an existing design must not create a new design.
  }, [backgroundColor, pageSize, orientation, borderAsset, animationAsset]);

  const copyPage = useCallback(() => {
    const canvasSnapshot =
      canvasSnapshotProviderRef.current?.();

    const sourceElements =
      canvasSnapshot ?? latestElementsRef.current;

    const copiedElements = cloneElements(sourceElements).map(
      (element) => ({
        ...element,
        id: createId(),
        backendId: undefined,
      })
    );

    const currentPages = pagesRef.current;

    const copied: EditorPage = {
      id: createId(),
      name: `Page ${currentPages.length + 1}`,
      elements: copiedElements,
      backgroundColor,
      pageSize,
      orientation,
      borderAsset,
      animationAsset,
    };

    const nextPages = [
      ...currentPages.map((page) =>
        page.id === activePageIdRef.current
          ? {
            ...page,
            elements: sourceElements,
            backgroundColor,
            pageSize,
            orientation,
            borderAsset,
            animationAsset,
          }
          : page
      ),
      copied,
    ];

    pagesRef.current = nextPages;
    setPages(nextPages);

    latestElementsRef.current = copied.elements;
    activePageIdRef.current = copied.id;

    setActivePageId(copied.id);
    setElements(copied.elements);
    setBackgroundColorState(copied.backgroundColor);
    setPageSize(copied.pageSize);
    setOrientation(copied.orientation);
    setBorderAssetState(copied.borderAsset ?? null);
    setAnimationAssetState(copied.animationAsset ?? null);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);

    // Keep the existing design ID.
  }, [backgroundColor, pageSize, orientation, borderAsset, animationAsset]);

  const deletePage = useCallback(() => {
    const currentPages = pagesRef.current;

    if (currentPages.length <= 1) return;

    const index = currentPages.findIndex(
      (page) => page.id === activePageIdRef.current
    );

    if (index < 0) return;

    const remaining = currentPages.filter(
      (page) => page.id !== activePageIdRef.current
    );

    const nextPage =
      remaining[Math.max(0, index - 1)] ?? remaining[0];

    pagesRef.current = remaining;
    setPages(remaining);

    latestElementsRef.current = nextPage.elements;
    activePageIdRef.current = nextPage.id;

    setActivePageId(nextPage.id);
    setElements(nextPage.elements);
    setBackgroundColorState(nextPage.backgroundColor);
    setPageSize(nextPage.pageSize);
    setOrientation(nextPage.orientation);
    setBorderAssetState(nextPage.borderAsset ?? null);
    setAnimationAssetState(nextPage.animationAsset ?? null);
    setSelectedId(null);
    setHistory([]);
    setFuture([]);

    // Keep the existing design ID.
  }, []);

  const selectPage = useCallback(
    (id: string) => {
      const currentActivePageId = activePageIdRef.current;

      if (id === currentActivePageId) return;

      const target = pagesRef.current.find(
        (page) => page.id === id
      );

      if (!target) return;

      const canvasSnapshot =
        canvasSnapshotProviderRef.current?.();

      const currentElements =
        canvasSnapshot ?? latestElementsRef.current;

      const nextPages = pagesRef.current.map((page) =>
        page.id === currentActivePageId
          ? {
            ...page,
            elements: currentElements,
            backgroundColor,
            pageSize,
            orientation,
            borderAsset,
            animationAsset,
          }
          : page
      );

      pagesRef.current = nextPages;
      setPages(nextPages);

      latestElementsRef.current = target.elements;
      activePageIdRef.current = target.id;

      setActivePageId(target.id);
      setElements(target.elements);
      setBackgroundColorState(target.backgroundColor);
      setPageSize(target.pageSize);
      setOrientation(target.orientation);
      setBorderAssetState(target.borderAsset ?? null);
      setAnimationAssetState(target.animationAsset ?? null);
      setSelectedId(null);
      setHistory([]);
      setFuture([]);

      // Do not reset currentDesignId here.
    },
    [backgroundColor, pageSize, orientation, borderAsset, animationAsset]
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

  const setPageBorderAsset = useCallback((asset: EditorPageAsset | null) => {
    setBorderAssetState(asset);
    const nextPages = pagesRef.current.map((page) =>
      page.id === activePageIdRef.current ? { ...page, borderAsset: asset } : page
    );
    pagesRef.current = nextPages;
    setPages(nextPages);
  }, []);

  const setPageAnimationAsset = useCallback((asset: EditorPageAsset | null) => {
    setAnimationAssetState(asset);
    const nextPages = pagesRef.current.map((page) =>
      page.id === activePageIdRef.current ? { ...page, animationAsset: asset } : page
    );
    pagesRef.current = nextPages;
    setPages(nextPages);
  }, []);

  const updatePages = useCallback(
    (updater: (pages: EditorPage[]) => EditorPage[]) => {
      const nextPages = updater(pagesRef.current);
      pagesRef.current = nextPages;
      setPages(nextPages);
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

    latestElementsRef.current = [
      ...latestElementsRef.current,
      element,
    ];

    setElements((previous) => [...previous, element]);
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

    const updatedElements = latestElementsRef.current.map(
      (element) =>
        element.id === id
          ? { ...element, ...updates }
          : element
    );

    latestElementsRef.current = updatedElements;
    setElements(updatedElements);
  };

  const deleteElement = (id: string) => {
    addHistory();

    const updatedElements =
      latestElementsRef.current.filter(
        (element) => element.id !== id
      );

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

    latestElementsRef.current = [
      ...latestElementsRef.current,
      duplicate,
    ];

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
      setBorderAssetState(null);
      setAnimationAssetState(null);

      const pageId = createId();

      const nextPages: EditorPage[] = [
        {
          id: pageId,
          name: "Page 1",
          elements: templateElements,
          backgroundColor: template.backgroundColor,
          pageSize: DEFAULT_PAGE_SIZE,
          orientation: DEFAULT_ORIENTATION,
          borderAsset: null,
          animationAsset: null,
        },
      ];

      pagesRef.current = nextPages;
      setPages(nextPages);

      activePageIdRef.current = pageId;
      setActivePageId(pageId);
    },
    []
  );

  const clearCanvas = useCallback(() => {
    setHistory([]);
    setFuture([]);
    setElements([]);
    latestElementsRef.current = [];
    setBackgroundColorState(DEFAULT_BACKGROUND);
    setCurrentDesignId(null);
    setCurrentDesignName("");
    setSelectedId(null);
    setPageSize(DEFAULT_PAGE_SIZE);
    setOrientation(DEFAULT_ORIENTATION);
    setBorderAssetState(null);
    setAnimationAssetState(null);

    const pageId = createId();

    const nextPages: EditorPage[] = [
      {
        id: pageId,
        name: "Page 1",
        elements: [],
        backgroundColor: DEFAULT_BACKGROUND,
        pageSize: DEFAULT_PAGE_SIZE,
        orientation: DEFAULT_ORIENTATION,
        borderAsset: null,
        animationAsset: null,
      },
    ];

    pagesRef.current = nextPages;
    setPages(nextPages);

    activePageIdRef.current = pageId;
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

  const convertDesign = useCallback((
    design: Design
  ): SavedDesign => {
    const hasFullData =
      (Array.isArray(design.pages) && design.pages.length > 0) ||
      (Array.isArray(design.elements) && design.elements.length > 0);
    const normalizedPages = hasFullData ? normalizePages(design) : undefined;

    return {
      id: design.id,
      name: design.name || "My Certificate",

      // Legacy top-level fields retained.
      elements: Array.isArray(design.elements)
        ? design.elements
        : normalizedPages?.[0]?.elements ?? [],

      backgroundColor:
        design.backgroundColor ||
        normalizedPages?.[0]?.backgroundColor ||
        "#ffffff",

      createdAt:
        design.createdAt || new Date().toISOString(),

      updatedAt:
        design.updatedAt || new Date().toISOString(),

      pageSize: isPaperSize(design.pageSize)
        ? design.pageSize
        : normalizedPages?.[0]?.pageSize ?? "A4",

      orientation: isOrientation(design.orientation)
        ? design.orientation
        : normalizedPages?.[0]?.orientation ?? "landscape",

      pages: normalizedPages,
      previewElements: design.previewElements,
    };
  }, []);

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

  const getSavedDesignsPage = useCallback(async (
    page: number,
    size = 20
  ) => {
    const result = await getDesignsPage(page, size);

    return {
      designs: result.content.map(convertDesign),
      totalPages: result.totalPages,
      totalElements: result.totalElements,
      currentPage: result.number,
      last: result.last,
    };
  }, [convertDesign]);

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
      : canvasSnapshotProviderRef.current?.() ??
      latestElementsRef.current;

    const finalBackground =
      typeof backgroundOverride === "string"
        ? backgroundOverride
        : backgroundColor;

    const finalPageSize = pageSizeOverride ?? pageSize;
    const finalOrientation =
      orientationOverride ?? orientation;

    // Capture the current active page's latest Fabric snapshot.
    const currentPages = pagesRef.current.map((page) =>
      page.id === activePageIdRef.current
        ? {
          ...page,
          elements: finalElements,
          backgroundColor: finalBackground,
          pageSize: finalPageSize,
          orientation: finalOrientation,
          borderAsset,
          animationAsset,
        }
        : page
    );

    const savedPages: DesignPageData[] =
      currentPages.map((page) => ({
        ...page,
        elements: page.elements.map((element) => ({
          ...element,
          backendId: undefined,
        })),
      }));

    const activePage =
      savedPages.find(
        (page) => page.id === activePageIdRef.current
      ) ?? savedPages[0];

    // Top-level fields remain for old frontend/backend compatibility.
    const designData = {
      name: safeName,
      backgroundColor:
        activePage?.backgroundColor ?? finalBackground,
      elements: activePage?.elements ?? finalElements,
      pageSize: activePage?.pageSize ?? finalPageSize,
      orientation:
        activePage?.orientation ?? finalOrientation,
      pages: savedPages,
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

      const restoredPages = converted.pages ?? [];
      const restoredActivePage =
        restoredPages.find(
          (page) => page.id === activePageIdRef.current
        ) ?? restoredPages[0];

      pagesRef.current = restoredPages;
      setPages(restoredPages);

      setCurrentDesignId(converted.id);
      setCurrentDesignName(converted.name);

      if (restoredActivePage) {
        latestElementsRef.current =
          restoredActivePage.elements;

        setElements(restoredActivePage.elements);
        setBackgroundColorState(
          restoredActivePage.backgroundColor
        );
        setPageSize(restoredActivePage.pageSize);
        setOrientation(restoredActivePage.orientation);
        setBorderAssetState(restoredActivePage.borderAsset ?? null);
        setAnimationAssetState(restoredActivePage.animationAsset ?? null);
      }
    } catch (error) {
      console.error("Failed to save design:", error);
      throw error;
    }
  };

  const loadSavedDesign = useCallback(
    (design: SavedDesign) => {
      setHistory([]);
      setFuture([]);

      const restoredPages = normalizePages(design);
      const firstPage = restoredPages[0];

      pagesRef.current = restoredPages;
      setPages(restoredPages);

      latestElementsRef.current = firstPage.elements;
      setElements(firstPage.elements);
      setBackgroundColorState(firstPage.backgroundColor);

      setCurrentDesignId(design.id);
      setCurrentDesignName(
        design.name || "My Certificate"
      );

      setSelectedId(null);
      setPageSize(firstPage.pageSize);
      setOrientation(firstPage.orientation);
      setBorderAssetState(firstPage.borderAsset ?? null);
      setAnimationAssetState(firstPage.animationAsset ?? null);

      activePageIdRef.current = firstPage.id;
      setActivePageId(firstPage.id);
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
    if (
      sourcePageId &&
      sourcePageId !== activePageIdRef.current
    ) {
      return;
    }

    latestElementsRef.current = canvasElements;
    setElements(canvasElements);

    const syncedPageId =
      sourcePageId ?? activePageIdRef.current;

    const nextPages = pagesRef.current.map((page) =>
      page.id === syncedPageId
        ? {
          ...page,
          elements: canvasElements,
          backgroundColor,
          pageSize,
          orientation,
          borderAsset: page.borderAsset ?? null,
          animationAsset: page.animationAsset ?? null,
        }
        : page
    );

    pagesRef.current = nextPages;
    setPages(nextPages);
  };

  // ---------------------------------------------------------------------
  // Draft autosave: keeps the in-progress design across page refreshes.
  // ---------------------------------------------------------------------
  const draftSourceRef = useRef("new");

  const setDraftSource = useCallback((source: string) => {
    draftSourceRef.current = source;
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        // Prefer the live Fabric snapshot for the active page.
        const liveElements = canvasSnapshotProviderRef.current?.();
        const pagesToSave = pagesRef.current.map((page) =>
          page.id === activePageIdRef.current && Array.isArray(liveElements)
            ? { ...page, elements: liveElements }
            : page
        );

        const hasContent = pagesToSave.some((page) => page.elements.length > 0);
        if (!hasContent) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          return;
        }

        const draft: EditorDraft = {
          v: 1,
          source: draftSourceRef.current,
          designId: currentDesignId,
          name: currentDesignName,
          activePageId: activePageIdRef.current,
          pages: pagesToSave,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (error) {
        // Quota exceeded / storage unavailable: autosave is best-effort.
        console.warn("Draft autosave skipped:", error);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [
    pages,
    elements,
    backgroundColor,
    pageSize,
    orientation,
    currentDesignId,
    currentDesignName,
    activePageId,
  ]);

  // Also flush right before the tab closes/refreshes so the last edit is never lost.
  useEffect(() => {
    const flush = () => {
      try {
        const liveElements = canvasSnapshotProviderRef.current?.();
        const pagesToSave = pagesRef.current.map((page) =>
          page.id === activePageIdRef.current && Array.isArray(liveElements)
            ? { ...page, elements: liveElements }
            : page
        );
        if (!pagesToSave.some((page) => page.elements.length > 0)) return;
        const draft: EditorDraft = {
          v: 1,
          source: draftSourceRef.current,
          designId: currentDesignIdRef.current,
          name: currentDesignNameRef.current,
          activePageId: activePageIdRef.current,
          pages: pagesToSave,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch {
        /* best effort */
      }
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const restoreDraft = useCallback(
    (source: string): boolean => {
      try {
        const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (!raw) return false;
        const draft = JSON.parse(raw) as EditorDraft;
        if (
          !draft ||
          draft.v !== 1 ||
          draft.source !== source ||
          !Array.isArray(draft.pages) ||
          draft.pages.length === 0
        ) {
          return false;
        }

        const first = draft.pages[0];
        loadSavedDesign({
          id: draft.designId ?? 0,
          name: draft.name,
          elements: first.elements,
          backgroundColor: first.backgroundColor,
          pageSize: first.pageSize,
          orientation: first.orientation,
          pages: draft.pages,
          createdAt: "",
          updatedAt: "",
        });
        // loadSavedDesign marks the design as saved; a draft without a backend id is not.
        if (draft.designId == null) {
          setCurrentDesignId(null);
        }
        if (!draft.name) {
          setCurrentDesignName("");
        }
        draftSourceRef.current = source;
        return true;
      } catch (error) {
        console.warn("Failed to restore draft:", error);
        return false;
      }
    },
    [loadSavedDesign]
  );

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
        borderAsset,
        animationAsset,
        setPageBorderAsset,
        setPageAnimationAsset,

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
        getSavedDesignsPage,
        deleteSavedDesign,

        syncElementsFromCanvas,
        updatePages,
        registerCanvasSnapshotProvider,
        setDraftSource,
        restoreDraft,
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
