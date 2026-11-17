import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Star,
  Cog,
  Flower2,
  Leaf,
  Waves,
  MessageCircle,
  GitBranch,
  Minus,
  Shapes,
  Sparkles,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";
import type { ShapeElementType } from "../../context/FabricContext";

interface ShapeItem {
  label: string;
  type: ShapeElementType;
}

interface ShapeCategory {
  title: string;
  icon: ReactNode;
  items: ShapeItem[];
}

interface ShapeApiAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: string;
  category: string;
  assetData: {
    type?: string;
    iconKey?: string;
    [key: string]: unknown;
  };
  sortOrder: number;
  isActive: boolean;
}

interface ShapePageResponse {
  content: ShapeApiAsset[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

type PanelView = "root" | "categories" | "items";

const API_URL = "http://localhost:8080/api/assets/shapes";
const PAGE_SIZE = 10;

const CATEGORY_ICONS: Record<string, ReactNode> = {
  "Basic Shapes": <Shapes size={17} />,
  Stars: <Star size={17} />,
  Cogs: <Cog size={17} />,
  "Square Stars": <Sparkles size={17} />,
  "Organic Shapes": <Waves size={17} />,
  Flowers: <Flower2 size={17} />,
  "Leaves & Petals": <Leaf size={17} />,
  Flowchart: <GitBranch size={17} />,
  "Speech Bubbles": <MessageCircle size={17} />,
  "Lines & Arrows": <Minus size={17} />,
};

const PREVIEW_COLOR = "#2563eb";
const PREVIEW_STROKE = "#1d4ed8";

function getRegularPolygonPoints(sides: number, radius = 75): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / sides;
    return `${radius + radius * Math.cos(angle)},${radius + radius * Math.sin(angle)}`;
  }).join(" ");
}

function getStarPoints(
  points: number,
  outerRadius: number,
  innerRadius: number,
): string {
  return Array.from({ length: points * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    return `${outerRadius + Math.cos(angle) * radius},${outerRadius + Math.sin(angle) * radius}`;
  }).join(" ");
}

function getCogPoints(teeth: number, radius: number): string {
  return Array.from({ length: teeth * 4 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / (teeth * 4);
    const currentRadius = index % 4 < 2 ? radius : radius * 0.78;
    return `${radius + Math.cos(angle) * currentRadius},${radius + Math.sin(angle) * currentRadius}`;
  }).join(" ");
}

function getFlowerPoints(petals: number, radius: number): string {
  const steps = petals * 24;

  return Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * Math.PI * 2;
    const currentRadius = radius * (0.68 + 0.32 * Math.cos(petals * angle));

    return `${radius + Math.cos(angle) * currentRadius},${radius + Math.sin(angle) * currentRadius}`;
  }).join(" ");
}

function getOrganicPoints(variant: number, radius: number): string {
  return Array.from({ length: 80 }, (_, index) => {
    const angle = (index / 80) * Math.PI * 2;
    const wave =
      Math.sin(angle * (variant + 2)) * 0.09 +
      Math.cos(angle * (variant + 3)) * 0.06;
    const currentRadius = radius * (0.83 + wave);

    return `${radius + Math.cos(angle) * currentRadius},${radius + Math.sin(angle) * currentRadius}`;
  }).join(" ");
}

function ShapePreview({ type }: { type: ShapeElementType }) {
  const svg = (children: ReactNode, viewBox = "0 0 150 150") => (
    <svg
      viewBox={viewBox}
      className="h-10 w-10 overflow-visible"
      aria-hidden="true"
    >
      {children}
    </svg>
  );

  const polygonStyle = {
    fill: PREVIEW_COLOR,
    stroke: PREVIEW_STROKE,
    strokeWidth: 2,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  if (type === "rectangle") {
    return svg(
      <rect x="0" y="25" width="180" height="100" fill={PREVIEW_COLOR} />,
      "0 0 180 150",
    );
  }

  if (type === "square") {
    return svg(
      <rect x="5" y="5" width="140" height="140" fill={PREVIEW_COLOR} />,
    );
  }

  if (type === "circle") {
    return svg(<circle cx="75" cy="75" r="70" fill={PREVIEW_COLOR} />);
  }

  if (type === "triangle") {
    return svg(
      <polygon points="0,120 75,0 150,120" fill={PREVIEW_COLOR} />,
      "0 0 150 120",
    );
  }

  if (
    ["polygon", "pentagon", "hexagon", "heptagon", "octagon"].includes(type)
  ) {
    const sides =
      type === "pentagon"
        ? 5
        : type === "heptagon"
          ? 7
          : type === "octagon"
            ? 8
            : 6;

    return svg(
      <polygon points={getRegularPolygonPoints(sides)} {...polygonStyle} />,
    );
  }

  if (
    type === "star" ||
    type === "star-outline" ||
    /^star-(4|6|8|12)$/.test(type)
  ) {
    const points =
      type === "star-4"
        ? 4
        : type === "star-6"
          ? 6
          : type === "star-8"
            ? 8
            : type === "star-12"
              ? 12
              : 5;

    return svg(
      <polygon
        points={getStarPoints(points, 75, 34)}
        {...polygonStyle}
        fill={type === "star-outline" ? "transparent" : PREVIEW_COLOR}
        strokeWidth="3"
      />,
    );
  }

  const squareStarMatch = /^square-star-(4|8|12|16|24|32)$/.exec(type);

  if (squareStarMatch) {
    const points = Number(squareStarMatch[1]);

    return svg(
      <polygon
        points={getStarPoints(points, 75, 41)}
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth="2"
        strokeLinejoin="round"
      />,
    );
  }

  const cogMatch = /^cog-(4|6|8|10|12|16|20|24)$/.exec(type);

  if (cogMatch) {
    return svg(
      <polygon
        points={getCogPoints(Number(cogMatch[1]), 75)}
        fill="#94a3b8"
        stroke="#475569"
        strokeWidth="3"
        strokeLinejoin="round"
      />,
    );
  }

  if (["flower", "flower-5", "flower-8", "flower-12"].includes(type)) {
    const petals =
      type === "flower-5"
        ? 5
        : type === "flower-8"
          ? 8
          : type === "flower-12"
            ? 12
            : 6;

    return svg(
      <polygon
        points={getFlowerPoints(petals, 75)}
        fill="#f9a8d4"
        stroke="#be185d"
        strokeWidth="2"
        strokeLinejoin="round"
      />,
    );
  }

  const organicVariants: Partial<Record<ShapeElementType, number>> = {
    "organic-blob": 1,
    "organic-blob-2": 2,
    "organic-blob-3": 3,
    "organic-cloud": 4,
    "organic-splash": 5,
    "organic-pebble": 6,
  };

  const organicVariant = organicVariants[type];

  if (organicVariant) {
    return svg(
      <polygon
        points={getOrganicPoints(organicVariant, 75)}
        fill="#c4b5fd"
        stroke="#7c3aed"
        strokeWidth="2"
        strokeLinejoin="round"
      />,
    );
  }

  if (type === "organic-wave") {
    return svg(
      <path
        d="M 0 35 Q 35 0 70 35 T 140 35 L 140 90 L 0 90 Z"
        fill="#a5f3fc"
        stroke="#0891b2"
        strokeWidth="3"
        strokeLinejoin="round"
      />,
      "0 0 140 90",
    );
  }

  if (type === "organic-wave-2") {
    return svg(
      <path
        d="M 0 45 C 25 0 50 90 75 45 S 125 0 150 45 L 150 90 L 0 90 Z"
        fill="#a5f3fc"
        stroke="#0891b2"
        strokeWidth="3"
        strokeLinejoin="round"
      />,
      "0 0 150 90",
    );
  }

  if (
    type === "leaf" ||
    type === "leaf-rounded" ||
    type === "leaf-pointed"
  ) {
    const path =
      type === "leaf-rounded"
        ? "M 0 50 Q 10 0 75 0 Q 75 50 0 50 Z"
        : "M 0 50 Q 15 0 75 0 Q 70 40 0 50 Z";

    return svg(
      <path
        d={path}
        fill="#86efac"
        stroke="#15803d"
        strokeWidth="2"
        strokeLinejoin="round"
      />,
      "0 0 75 55",
    );
  }

  if (type === "leaf-pair") {
    return svg(
      <path
        d="M 0 50 Q 15 0 75 0 Q 70 40 0 50 Z M 75 50 Q 90 0 150 0 Q 145 40 75 50 Z"
        fill="#86efac"
        stroke="#15803d"
        strokeWidth="2"
        strokeLinejoin="round"
      />,
      "0 0 150 55",
    );
  }

  if (
    type === "petal" ||
    type === "petal-rounded" ||
    type === "petal-pointed"
  ) {
    const petals =
      type === "petal-rounded" ? 6 : type === "petal-pointed" ? 4 : 5;

    return svg(
      <polygon
        points={getFlowerPoints(petals, 75)}
        fill="#f9a8d4"
        stroke="#be185d"
        strokeWidth="2"
        strokeLinejoin="round"
      />,
    );
  }

  if (type === "vine") {
    return svg(
      <path
        d="M 0 100 Q 40 80 30 50 Q 20 20 60 15 Q 100 10 95 45 Q 90 75 130 70 Q 165 65 150 30"
        fill="none"
        stroke="#15803d"
        strokeWidth="5"
        strokeLinecap="round"
      />,
      "0 0 165 110",
    );
  }

  if (type === "flow-process") {
    return svg(
      <rect x="0" y="0" width="180" height="90" {...polygonStyle} />,
      "0 0 180 90",
    );
  }

  if (type === "flow-decision") {
    return svg(
      <polygon points="90,0 180,55 90,110 0,55" {...polygonStyle} />,
      "0 0 180 110",
    );
  }

  if (type === "flow-terminator") {
    return svg(
      <rect
        x="0"
        y="0"
        width="180"
        height="85"
        rx="42"
        ry="42"
        {...polygonStyle}
      />,
      "0 0 180 85",
    );
  }

  if (type === "flow-io") {
    return svg(
      <polygon points="35,0 180,0 145,90 0,90" {...polygonStyle} />,
      "0 0 180 90",
    );
  }

  if (type === "flow-document") {
    return svg(
      <path
        d="M 0 0 L 180 0 L 180 75 Q 150 95 120 80 Q 90 65 60 80 Q 30 95 0 80 Z"
        {...polygonStyle}
      />,
      "0 0 180 95",
    );
  }

  if (type === "flow-connector") {
    return svg(
      <circle cx="32" cy="32" r="32" {...polygonStyle} />,
      "0 0 64 64",
    );
  }

  if (type === "flow-preparation") {
    return svg(
      <polygon
        points="45,0 135,0 180,45 135,90 45,90 0,45"
        {...polygonStyle}
      />,
      "0 0 180 90",
    );
  }

  if (type === "flow-manual-input") {
    return svg(
      <polygon points="0,25 180,0 180,90 0,90" {...polygonStyle} />,
      "0 0 180 90",
    );
  }

  if (type === "speech-bubble") {
    return svg(
      <path
        d="M 0 0 L 180 0 L 180 90 L 55 90 L 30 115 L 35 90 L 0 90 Z"
        {...polygonStyle}
      />,
      "0 0 180 115",
    );
  }

  if (type === "chat-bubble") {
    return svg(
      <path
        d="M 20 0 L 160 0 Q 180 0 180 20 L 180 70 Q 180 90 160 90 L 55 90 L 25 115 L 30 90 L 20 90 Q 0 90 0 70 L 0 20 Q 0 0 20 0 Z"
        {...polygonStyle}
      />,
      "0 0 180 115",
    );
  }

  if (type === "thought-bubble") {
    return svg(
      <path
        d="M 30 15 C 5 15 0 45 15 60 C 0 85 25 105 50 95 C 70 120 100 105 105 90 C 135 100 155 80 145 60 C 170 35 145 10 125 20 C 105 -5 70 0 60 15 C 50 10 40 10 30 15 Z"
        {...polygonStyle}
      />,
      "0 0 170 120",
    );
  }

  if (type === "rounded-bubble") {
    return svg(
      <rect
        x="0"
        y="0"
        width="180"
        height="95"
        rx="24"
        ry="24"
        {...polygonStyle}
      />,
      "0 0 180 95",
    );
  }

  if (
    type === "line" ||
    type === "dashed-line" ||
    type === "dotted-line"
  ) {
    return svg(
      <line
        x1="0"
        y1="20"
        x2="220"
        y2="20"
        stroke="#111827"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={
          type === "dashed-line"
            ? "18 10"
            : type === "dotted-line"
              ? "2 10"
              : undefined
        }
      />,
      "0 0 220 40",
    );
  }

  if (type === "arrow") {
    return svg(
      <path
        d="M 0 20 L 220 20 M 220 20 L 202 8 M 220 20 L 202 32"
        fill="none"
        stroke="#111827"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
      "0 0 220 40",
    );
  }

  if (type === "double-arrow") {
    return svg(
      <path
        d="M 0 20 L 220 20 M 0 20 L 18 8 M 0 20 L 18 32 M 220 20 L 202 8 M 220 20 L 202 32"
        fill="none"
        stroke="#111827"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
      "0 0 220 40",
    );
  }

  return svg(
    <polygon points="0,0 150,0 150,150 0,150" {...polygonStyle} />,
  );
}

function buildCategories(assets: ShapeApiAsset[]): ShapeCategory[] {
  const categoryMap = new Map<string, ShapeItem[]>();

  const flowerTypeMap: Record<string, ShapeElementType> = {
    "flower-5-petal": "flower-5",
    "flower-8-petal": "flower-8",
    "flower-12-petal": "flower-12",
  };

  [...assets]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((asset) => {
      const categoryName = asset.category?.trim();

      if (!categoryName) return;

      const apiType = asset.assetData?.type || asset.assetKey;
      const mappedType = flowerTypeMap[asset.assetKey] || apiType;

      const item: ShapeItem = {
        label: asset.name,
        type: mappedType as ShapeElementType,
      };

      const existingItems = categoryMap.get(categoryName) || [];

      if (!existingItems.some((existing) => existing.type === item.type)) {
        existingItems.push(item);
      }

      categoryMap.set(categoryName, existingItems);
    });

  return Array.from(categoryMap.entries()).map(([title, items]) => ({
    title,
    icon: CATEGORY_ICONS[title] || <Shapes size={17} />,
    items,
  }));
}

export default function ElementsPanel() {
  const { addShape } = useFabric();

  const [assets, setAssets] = useState<ShapeApiAsset[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [view, setView] = useState<PanelView>("root");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(false);
  const activeCategoryRef = useRef<string | null>(null);
  const inFlightRequestsRef = useRef(new Set<string>());
  const categoryCacheRef = useRef(
    new Map<
      string,
      { assets: ShapeApiAsset[]; page: number; hasMore: boolean }
    >(),
  );

  // Category names are shown without calling the API.
  // API is called only after the user opens a category.
  const categories = useMemo<ShapeCategory[]>(
    () =>
      Object.entries(CATEGORY_ICONS).map(([title, icon]) => ({
        title,
        icon,
        items: [],
      })),
    [],
  );

  const selectedCategoryData = useMemo(() => {
    if (!selectedCategory) return null;
    const category = categories.find((item) => item.title === selectedCategory);
    if (!category) return null;

    return {
      ...category,
      items:
        buildCategories(assets).find(
          (item) => item.title === selectedCategory,
        )?.items ?? [],
    };
  }, [assets, categories, selectedCategory]);

  const loadShapes = async (
    category: string,
    pageToLoad: number,
    replace = false,
  ) => {
    const requestKey = `${category}:${pageToLoad}`;

    if (inFlightRequestsRef.current.has(requestKey)) return;
    if (!replace && (loadingRef.current || !hasMoreRef.current)) return;

    inFlightRequestsRef.current.add(requestKey);

    if (replace) {
      if (activeCategoryRef.current === category) {
        loadingRef.current = true;
        setLoading(true);
        setLoadingMore(false);
        setError("");
      }
    } else {
      loadingRef.current = true;
      setLoadingMore(true);
      setError("");
    }

    try {
      const params = new URLSearchParams({
        page: String(pageToLoad),
        size: String(PAGE_SIZE),
        category,
      });

      const response = await fetch(`${API_URL}/page?${params.toString()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Shapes load nahi ho paye. Server response: ${response.status}`,
        );
      }

      const data: ShapePageResponse = await response.json();

      if (!data || !Array.isArray(data.content)) {
        throw new Error(
          "Backend se shapes ka valid paginated data nahi mila.",
        );
      }

      const activeAssets = data.content.filter(
        (asset) => asset.isActive !== false,
      );

      const cached = categoryCacheRef.current.get(category);
      const base = replace ? [] : (cached?.assets ?? []);
      const existingIds = new Set(base.map((asset) => asset.id));
      const uniqueAssets = activeAssets.filter(
        (asset) => !existingIds.has(asset.id),
      );

      const nextAssets = [...base, ...uniqueAssets].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      categoryCacheRef.current.set(category, {
        assets: nextAssets,
        page: data.number,
        hasMore: !data.last,
      });

      if (activeCategoryRef.current === category) {
        setAssets(nextAssets);
        pageRef.current = data.number;
        hasMoreRef.current = !data.last;
        setHasMore(!data.last);
        setError("");

        if (replace && activeAssets.length === 0) {
          setError("Is category mein koi active shape available nahi hai.");
        }
      }
    } catch (err) {
      if (activeCategoryRef.current === category) {
        setError(
          err instanceof Error
            ? err.message
            : "Shapes load karte waqt kuch error aa gaya.",
        );
      }
    } finally {
      inFlightRequestsRef.current.delete(requestKey);

      // Only the currently active category controls the visible loading state.
      if (activeCategoryRef.current === category) {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const loadNextPage = () => {
    const category = activeCategoryRef.current;

    if (!category || loadingRef.current || !hasMoreRef.current) return;

    void loadShapes(category, pageRef.current + 1);
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;

    // Infinite scroll is active only after a category has been selected.
    if (
      view !== "items" ||
      !selectedCategory ||
      !sentinel ||
      !scrollContainer ||
      loading ||
      loadingMore ||
      error ||
      !hasMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPage();
        }
      },
      {
        root: scrollContainer,
        rootMargin: "80px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loading,
    loadingMore,
    hasMore,
    error,
    assets.length,
    view,
    selectedCategory,
  ]);

  const normalizedSearch = search.trim().toLowerCase();

  const searchableCategories =
    view === "items" ? buildCategories(assets) : categories;

  const filteredCategories = searchableCategories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.label.toLowerCase().includes(normalizedSearch),
      ),
    }))
    .filter(
      (category) =>
        category.title.toLowerCase().includes(normalizedSearch) ||
        category.items.length > 0,
    );

  const visibleCategoryItems =
    selectedCategoryData?.items.filter((item) =>
      item.label.toLowerCase().includes(normalizedSearch),
    ) ?? [];

  const handleOpenShapes = () => {
    setView("categories");
    setSelectedCategory(null);
  };

  const handleOpenCategory = (category: ShapeCategory) => {
    const categoryName = category.title;

    activeCategoryRef.current = categoryName;
    setSelectedCategory(categoryName);
    setView("items");
    setSearch("");
    setError("");

    const cached = categoryCacheRef.current.get(categoryName);

    if (cached) {
      setAssets(cached.assets);
      pageRef.current = cached.page;
      hasMoreRef.current = cached.hasMore;
      setHasMore(cached.hasMore);
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
      return;
    }

    setAssets([]);
    pageRef.current = 0;
    hasMoreRef.current = false;
    setHasMore(false);
    loadingRef.current = false;
    setLoading(true);

    void loadShapes(categoryName, 0, true);
  };

  const handleBack = () => {
    if (view === "items") {
      activeCategoryRef.current = null;
      setView("categories");
      setSelectedCategory(null);
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    } else if (view === "categories") {
      setView("root");
      setSearch("");
    }
  };

  const handleAddShape = (type: ShapeElementType) => {
    addShape(type);
  };

  const handleRetry = () => {
    const category = activeCategoryRef.current;

    if (!category || loadingRef.current) return;

    categoryCacheRef.current.delete(category);
    setAssets([]);
    pageRef.current = 0;
    hasMoreRef.current = false;
    setHasMore(false);
    setError("");

    void loadShapes(category, 0, true);
  };

  const renderShapeGrid = (items: ShapeItem[]) => (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <button
          key={item.type}
          type="button"
          title={`Add ${item.label}`}
          onClick={() => handleAddShape(item.type)}
          className="group flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white px-1.5 py-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 active:scale-95"
        >
          <span className="flex h-12 w-full items-center justify-center rounded-lg text-slate-600 transition-colors duration-200 group-hover:text-blue-600">
            <ShapePreview type={item.type} />
          </span>

          <span className="w-full break-words text-[10px] font-medium leading-4 text-slate-600 transition-colors group-hover:text-blue-700">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  const renderCategoryList = (items: ShapeCategory[]) => (
    <div className="space-y-2.5">
      {items.map((category) => (
        <button
          key={category.title}
          type="button"
          onClick={() => handleOpenCategory(category)}
          className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 transition-colors group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-700">
            {category.icon}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-800 transition-colors group-hover:text-blue-800">
              {category.title}
            </span>

            <span className="mt-1 block text-xs text-slate-500">
              Browse category
            </span>
          </span>

          <ChevronRight
            size={17}
            className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/80 p-4">
        <div className="flex items-center gap-2.5">
          {view !== "root" && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95"
            >
              <ArrowLeft size={17} />
            </button>
          )}

          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              {view === "root"
                ? "Elements"
                : view === "categories"
                  ? "Shapes"
                  : selectedCategory ?? "Shapes"}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {view === "root"
                ? "Browse elements for your design."
                : view === "categories"
                  ? "Choose a shape category."
                  : "Select a shape to add it to your canvas."}
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search elements..."
            aria-label="Search elements"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/80"
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="text-sm font-semibold text-slate-700">
              Loading shapes...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Database se shapes load ho rahe hain.
            </p>
          </div>
        ) : error && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-4 py-12 text-center">
            <Shapes size={30} className="mb-3 text-red-300" />

            <p className="text-sm font-semibold text-slate-700">
              Shapes load nahi hue
            </p>

            <p className="mt-2 break-words text-xs text-slate-500">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : normalizedSearch ? (
          filteredCategories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
              <Search size={28} className="mb-3 text-slate-300" />

              <p className="text-sm font-semibold text-slate-700">
                No elements found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCategories.map((category) => {
                const matchingItems = category.items.filter((item) =>
                  item.label.toLowerCase().includes(normalizedSearch),
                );

                return (
                  <section
                    key={category.title}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenCategory(category)}
                      className="group flex w-full items-center gap-3 bg-gradient-to-r from-slate-50 to-white p-3.5 text-left transition-colors hover:from-blue-50 hover:to-indigo-50"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-600 shadow-sm transition-colors group-hover:border-blue-100 group-hover:text-blue-700">
                        {category.icon}
                      </span>

                      <span className="flex-1 text-sm font-semibold text-slate-800">
                        {category.title}
                      </span>

                      <ChevronRight
                        size={16}
                        className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
                      />
                    </button>

                    {matchingItems.length > 0 && (
                      <div className="p-2.5">
                        {renderShapeGrid(matchingItems)}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          )
        ) : view === "root" ? (
          <button
            type="button"
            onClick={handleOpenShapes}
            className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/70 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 shadow-sm transition-transform group-hover:scale-105">
              <Shapes size={22} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900">
                Shapes
              </span>

              <span className="mt-1 block text-xs text-slate-500">
                Explore all shape categories
              </span>
            </span>

            <ChevronRight
              size={18}
              className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600"
            />
          </button>
        ) : view === "categories" ? (
          renderCategoryList(categories)
        ) : selectedCategoryData ? (
          <div>
            <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <span className="text-blue-600">
                {selectedCategoryData.icon}
              </span>

              <span className="text-sm font-semibold text-slate-800">
                {selectedCategoryData.title}
              </span>

              <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                {visibleCategoryItems.length} loaded shapes
              </span>
            </div>

            {visibleCategoryItems.length > 0 ? (
              renderShapeGrid(visibleCategoryItems)
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
                No shapes found in this category.
              </p>
            )}
          </div>
        ) : (
          renderCategoryList(categories)
        )}

        {loadingMore && (
          <div className="flex items-center justify-center gap-2 py-5 text-xs font-medium text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
            Loading more shapes...
          </div>
        )}

        {error && assets.length > 0 && (
          <div className="my-3 rounded-xl border border-red-100 bg-white p-3 text-center">
            <p className="text-xs text-red-600">{error}</p>

            <button
              type="button"
              onClick={loadNextPage}
              className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        )}

        {hasMore && !loading && !error && (
          <div
            ref={sentinelRef}
            className="h-8 w-full"
            aria-hidden="true"
          />
        )}

        {!hasMore && assets.length > 0 && (
          <p className="py-4 text-center text-[11px] text-slate-400">
            You have reached the end of the shapes.
          </p>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] leading-4 text-slate-400">
          Select a shape to add it to your canvas. You can then move, resize,
          rotate, and customize it.
        </p>
      </div>
    </div>
  );
}