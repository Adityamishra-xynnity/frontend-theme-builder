import { useEffect, useMemo, useRef, useState } from "react";
import { elementDragProps } from "../../utils/elementDrag";
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
  Frame,
  Palette,
  Smile,
  Images,
  Medal,
  BookOpen,
  Trees,
  Building2,
  Gift,
  Wallpaper,
  Check,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useFabric, type ShapeElementType } from "../../context/useFabric";
import { useEditor, type EditorPageAsset } from "../../context/EditorContext";
import BordersPanel from "./BordersPanel";
import AnimationsPanel from "./AnimationsPanel";
import GraphicsBrowser from "./graphics/GraphicsBrowser";
import StaticGraphicsBrowser from "./graphics/StaticGraphicsBrowser";
import EmojiBrowser from "./emojis/EmojiBrowser";
import type { EmojiAsset } from "../../types/emoji";
import type { GraphicAsset } from "../../types/graphics";
import { assetLibraryService } from "../../services/assetLibraryService";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

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

export interface ShapePageResponse {
  content: ShapeApiAsset[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface EmojiApiAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: string;
  category: string;
  assetData: {
    emoji?: string;
    [key: string]: unknown;
  };
  sortOrder: number;
  isActive: boolean;
}

export interface EmojiPageResponse {
  content: EmojiApiAsset[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface PhotoApiAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: string;
  category: string;
  assetData: {
    imageUrl?: string;
    url?: string;
    src?: string;
    image?: string;
    thumbnailUrl?: string;
    [key: string]: unknown;
  };
  sortOrder: number;
  isActive: boolean;
}

export interface PhotoPageResponse {
  content: PhotoApiAsset[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

interface PhotoCategory {
  title: string;
  emoji: string;
  description: string;
}

interface SearchApiAsset {
  id: number;
  assetKey: string;
  name: string;
  assetType: string;
  category: string;
  assetData: {
    type?: string;
    iconKey?: string;
    svgContent?: string;
    emoji?: string;
    style?: Record<string, unknown>;
    config?: Record<string, unknown>;
    animationConfig?: {
      type?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  sortOrder?: number;
  isActive?: boolean;
}

const FLOWER_TYPE_MAP: Record<string, ShapeElementType> = {
  "flower-5-petal": "flower-5",
  "flower-8-petal": "flower-8",
  "flower-12-petal": "flower-12",
};

function previewSearchBorder(asset: SearchApiAsset): CSSProperties {
  const style = (asset.assetData?.style ?? {}) as Record<string, unknown>;
  const lineStyle = String(style.lineStyle ?? style.kind ?? "solid");
  const color = String(style.color ?? "#C9A227");
  const width = Number(style.width ?? 4);
  const radius = Number(style.radius ?? (style.corner === "rounded" ? 16 : 0));
  return {
    border: `${Math.max(1, Math.min(width, 7))}px ${lineStyle} ${color}`,
    borderRadius: `${Math.max(0, Math.min(radius, 24))}px`,
    outline: style.secondaryColor
      ? `1px solid ${String(style.secondaryColor)}`
      : undefined,
    outlineOffset: style.secondaryColor ? "4px" : undefined,
  };
}

function previewSearchAnimation(asset: SearchApiAsset): string {
  const config = asset.assetData?.config as Record<string, unknown> | undefined;
  const effect = String(config?.effect ?? asset.assetKey).toLowerCase();
  const supported: Record<string, string> = {
    "fade-in": "tb-fade-in 1.2s ease-in-out infinite alternate",
    float: "tb-float 2.4s ease-in-out infinite",
    pulse: "tb-pulse 1.4s ease-in-out infinite",
    "soft-glow": "tb-soft-glow 1.8s ease-in-out infinite alternate",
    shimmer: "tb-shimmer 2.2s linear infinite",
    "slide-up": "tb-slide-up 1s ease-out infinite alternate",
    "gentle-zoom": "tb-gentle-zoom 2.6s ease-in-out infinite alternate",
    sparkle: "tb-sparkle 1.8s ease-in-out infinite",
  };
  return supported[effect] ?? "tb-pulse 1.4s ease-in-out infinite";
}

type PanelView =
  | "root"
  | "categories"
  | "items"
  | "emoji-categories"
  | "emoji-items"
  | "emojis"
  | "photo-categories"
  | "photo-items"
  | "borders"
  | "animations"
  | "graphics"
  | "animated-designs";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const PAGE_SIZE = 10;

// --------------------------------------------------
// CATEGORY CONFIGURATION
// --------------------------------------------------

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

export const EMOJI_CATEGORIES = [
  { title: "Faces", emoji: "😀", description: "Smileys and expressions" },
  { title: "Celebration", emoji: "🎉", description: "Celebrate special moments" },
  { title: "Symbols", emoji: "❤️", description: "Useful symbols and icons" },
  { title: "Awards", emoji: "🏆", description: "Awards and achievements" },
  { title: "Education", emoji: "🎓", description: "Education and learning" },
  { title: "Nature", emoji: "🌿", description: "Nature and plants" },
  { title: "Animals", emoji: "🐾", description: "Animals and wildlife" },
  { title: "Business", emoji: "💼", description: "Business and work" },
];

const PHOTO_CATEGORIES: PhotoCategory[] = [
  {
    title: "Awards",
    emoji: "🏆",
    description: "Trophies, medals and achievements",
  },
  {
    title: "Education",
    emoji: "🎓",
    description: "Graduation and learning photos",
  },
  {
    title: "Nature",
    emoji: "🌿",
    description: "Nature, plants and landscapes",
  },
  {
    title: "Business",
    emoji: "💼",
    description: "Professional and business photos",
  },
  {
    title: "Celebration",
    emoji: "🎉",
    description: "Celebrations and special moments",
  },
  {
    title: "Backgrounds",
    emoji: "🖼️",
    description: "Decorative photo backgrounds",
  },
];

const PREVIEW_COLOR = "#2563eb";
const PREVIEW_STROKE = "#1d4ed8";

// --------------------------------------------------
// PHOTO URL HELPER
// --------------------------------------------------

function getPhotoUrl(asset: PhotoApiAsset): string {
  const data = asset.assetData || {};

  const possibleUrl =
    data.imageUrl ||
    data.url ||
    data.src ||
    data.image ||
    data.thumbnailUrl;

  return typeof possibleUrl === "string" ? possibleUrl.trim() : "";
}

// --------------------------------------------------
// SHAPE PREVIEW HELPERS
// --------------------------------------------------

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

// --------------------------------------------------
// SHAPE PREVIEW
// --------------------------------------------------

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

// --------------------------------------------------
// BUILD SHAPE CATEGORIES
// --------------------------------------------------

function buildCategories(assets: ShapeApiAsset[]): ShapeCategory[] {
  const categoryMap = new Map<string, ShapeItem[]>();

  [...assets]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((asset) => {
      const categoryName = asset.category?.trim();

      if (!categoryName) return;

      const apiType = asset.assetData?.type || asset.assetKey;
      const mappedType = FLOWER_TYPE_MAP[asset.assetKey] || apiType;

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

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function ElementsPanel() {
  const { addShape, addEmoji, addImage, addGraphic } = useFabric();
  const {
    borderAsset,
    setPageBorderAsset,
    animationAsset,
    setPageAnimationAsset,
  } = useEditor();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<PanelView>("root");

  // --------------------------------------------------
  // GLOBAL SEARCH STATE (cross-element search for root view)
  // --------------------------------------------------

  const [globalSearchResults, setGlobalSearchResults] = useState<SearchApiAsset[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchError, setGlobalSearchError] = useState("");
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (view !== "root" || !debouncedGlobalSearch) {
      setGlobalSearchResults([]);
      setGlobalSearchLoading(false);
      setGlobalSearchError("");
      return;
    }

    let active = true;
    const fetchSearch = async () => {
      setGlobalSearchLoading(true);
      setGlobalSearchError("");
      try {
        const res = await assetLibraryService.searchAssets(debouncedGlobalSearch, { size: 60 });
        if (!active) return;
        const items: SearchApiAsset[] = res.data.map((r) => ({
          id: r.id as any,
          assetKey: r.asset_key,
          name: r.name,
          assetType: r.type,
          category: r.category,
          assetData: r.json_data || {},
          sortOrder: r.sort_order,
          isActive: r.is_active,
        }));
        setGlobalSearchResults(items.filter((item) => item.isActive !== false));
      } catch (err) {
        if (active) {
          setGlobalSearchError(
            err instanceof Error ? err.message : "Search failed"
          );
        }
      } finally {
        if (active) {
          setGlobalSearchLoading(false);
        }
      }
    };

    void fetchSearch();
    return () => {
      active = false;
    };
  }, [debouncedGlobalSearch, view]);

  // --------------------------------------------------
  // SHAPES STATE
  // --------------------------------------------------

  const [assets, setAssets] = useState<ShapeApiAsset[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

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

  // --------------------------------------------------
  // EMOJI STATE
  // --------------------------------------------------

  const [emojiAssets, setEmojiAssets] = useState<EmojiApiAsset[]>([]);
  const [emojiLoading, setEmojiLoading] = useState(false);
  const [emojiLoadingMore, setEmojiLoadingMore] = useState(false);
  const [emojiError, setEmojiError] = useState("");
  const [emojiHasMore, setEmojiHasMore] = useState(false);

  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<
    string | null
  >(null);

  const emojiSentinelRef = useRef<HTMLDivElement>(null);
  const emojiPageRef = useRef(0);
  const emojiHasMoreRef = useRef(false);
  const emojiActiveCategoryRef = useRef<string | null>(null);
  const emojiInFlightRequestsRef = useRef(new Set<string>());

  const emojiCacheRef = useRef(
    new Map<
      string,
      { assets: EmojiApiAsset[]; page: number; hasMore: boolean }
    >(),
  );

  // --------------------------------------------------
  // PHOTO STATE
  // --------------------------------------------------

  const [photoAssets, setPhotoAssets] = useState<PhotoApiAsset[]>([]);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoLoadingMore, setPhotoLoadingMore] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoHasMore, setPhotoHasMore] = useState(false);

  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<
    string | null
  >(null);

  const photoSentinelRef = useRef<HTMLDivElement>(null);
  const photoPageRef = useRef(0);
  const photoHasMoreRef = useRef(false);
  const photoActiveCategoryRef = useRef<string | null>(null);
  const photoInFlightRequestsRef = useRef(new Set<string>());

  const photoCacheRef = useRef(
    new Map<
      string,
      { assets: PhotoApiAsset[]; page: number; hasMore: boolean }
    >(),
  );

  // --------------------------------------------------
  // SHAPE CATEGORIES
  // --------------------------------------------------

  const [shapeCategoryNames, setShapeCategoryNames] = useState<string[]>(() =>
    Object.keys(CATEGORY_ICONS),
  );
  const [photoCategoryNames, setPhotoCategoryNames] = useState<string[]>(() =>
    PHOTO_CATEGORIES.map((c) => c.title),
  );

  useEffect(() => {
    let active = true;
    if (view === "categories" || view === "items") {
      assetLibraryService
        .getCategoriesByType("SHAPE")
        .then((cats) => {
          if (active && cats.length > 0) setShapeCategoryNames(cats);
        })
        .catch(() => {});
    } else if (view === "photo-categories" || view === "photo-items") {
      assetLibraryService
        .getCategoriesByType("PHOTO")
        .then((cats) => {
          if (active && cats.length > 0) setPhotoCategoryNames(cats);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [view]);

  const categories = useMemo<ShapeCategory[]>(
    () =>
      shapeCategoryNames.map((title) => ({
        title,
        icon: CATEGORY_ICONS[title] ?? <Shapes size={17} />,
        items: [],
      })),
    [shapeCategoryNames],
  );

  const selectedCategoryData = useMemo(() => {
    if (!selectedCategory) return null;

    const category = categories.find(
      (item) => item.title === selectedCategory,
    );

    if (!category) return null;

    return {
      ...category,
      items:
        buildCategories(assets).find(
          (item) => item.title === selectedCategory,
        )?.items ?? [],
    };
  }, [assets, categories, selectedCategory]);

  // --------------------------------------------------
  // LOAD SHAPES
  // --------------------------------------------------

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
      const res = await assetLibraryService.getAssetsByType("SHAPE", {
        page: pageToLoad,
        size: PAGE_SIZE,
        category: category !== "All" ? category : undefined,
        search: search.trim() || undefined,
        orderBy: "sort_order",
        ascending: true,
      });

      const isLast = (pageToLoad + 1) * PAGE_SIZE >= res.total;
      const activeAssets: ShapeApiAsset[] = res.data
        .map((r) => ({
          id: r.id as any,
          assetKey: r.asset_key,
          name: r.name,
          assetType: r.type,
          category: r.category,
          assetData: r.json_data || {},
          sortOrder: r.sort_order,
          isActive: r.is_active,
        }))
        .filter((asset) => asset.isActive !== false);

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
        page: pageToLoad,
        hasMore: !isLast,
      });

      if (activeCategoryRef.current === category) {
        setAssets(nextAssets);
        pageRef.current = pageToLoad;
        hasMoreRef.current = !isLast;
        setHasMore(!isLast);
        setError("");

        if (replace && activeAssets.length === 0) {
          setError("No active shapes are available in this category.");
        }
      }
    } catch (err) {
      if (activeCategoryRef.current === category) {
        setError(
          err instanceof Error
            ? err.message
            : "We couldn’t load the shapes. Please try again in a moment.",
        );
      }
    } finally {
      inFlightRequestsRef.current.delete(requestKey);

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

  // --------------------------------------------------
  // LOAD EMOJIS
  // --------------------------------------------------

  const loadEmojis = async (
    category: string,
    pageToLoad: number,
    replace = false,
  ) => {
    const requestKey = `${category}:${pageToLoad}`;

    if (emojiInFlightRequestsRef.current.has(requestKey)) return;

    if (!replace) {
      if (emojiLoading || emojiLoadingMore || !emojiHasMoreRef.current) {
        return;
      }
    }

    emojiInFlightRequestsRef.current.add(requestKey);

    if (emojiActiveCategoryRef.current === category) {
      if (replace) {
        setEmojiLoading(true);
        setEmojiLoadingMore(false);
      } else {
        setEmojiLoadingMore(true);
      }

      setEmojiError("");
    }

    try {
      const res = await assetLibraryService.getAssetsByType("EMOJI", {
        page: pageToLoad,
        size: PAGE_SIZE,
        category: category !== "All" ? category : undefined,
        search: search.trim() || undefined,
        orderBy: "sort_order",
        ascending: true,
      });

      const isLast = (pageToLoad + 1) * PAGE_SIZE >= res.total;
      const activeAssets: EmojiApiAsset[] = res.data
        .map((r) => ({
          id: r.id as any,
          assetKey: r.asset_key,
          name: r.name,
          assetType: r.type,
          category: r.category,
          assetData: r.json_data || {},
          sortOrder: r.sort_order,
          isActive: r.is_active,
        }))
        .filter(
          (asset) =>
            asset.isActive !== false &&
            (Boolean(asset.assetData?.emoji) ||
             Boolean(asset.assetData?.unicode) ||
             Boolean(asset.assetData?.svgContent)),
        );

      const cached = emojiCacheRef.current.get(category);
      const base = replace ? [] : (cached?.assets ?? []);
      const existingIds = new Set(base.map((asset) => asset.id));

      const uniqueAssets = activeAssets.filter(
        (asset) => !existingIds.has(asset.id),
      );

      const nextAssets = [...base, ...uniqueAssets].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      emojiCacheRef.current.set(category, {
        assets: nextAssets,
        page: pageToLoad,
        hasMore: !isLast,
      });

      if (emojiActiveCategoryRef.current === category) {
        setEmojiAssets(nextAssets);
        emojiPageRef.current = pageToLoad;
        emojiHasMoreRef.current = !isLast;
        setEmojiHasMore(!isLast);
        setEmojiError("");

        if (replace && activeAssets.length === 0) {
          setEmojiError(
            "No emojis are currently available in this category.",
          );
        }
      }
    } catch (err) {
      if (emojiActiveCategoryRef.current === category) {
        setEmojiError(
          err instanceof Error
            ? err.message
            : "We encountered an issue while loading the emojis. Please try again.",
        );
      }
    } finally {
      emojiInFlightRequestsRef.current.delete(requestKey);

      if (emojiActiveCategoryRef.current === category) {
        setEmojiLoading(false);
        setEmojiLoadingMore(false);
      }
    }
  };

  const loadNextEmojiPage = () => {
    const category = emojiActiveCategoryRef.current;

    if (
      !category ||
      emojiLoading ||
      emojiLoadingMore ||
      !emojiHasMoreRef.current
    ) {
      return;
    }

    void loadEmojis(category, emojiPageRef.current + 1);
  };

  // --------------------------------------------------
  // LOAD PHOTOS
  // --------------------------------------------------

  const loadPhotos = async (
    category: string,
    pageToLoad: number,
    replace = false,
  ) => {
    const requestKey = `${category}:${pageToLoad}`;

    if (photoInFlightRequestsRef.current.has(requestKey)) return;

    if (!replace && !photoHasMoreRef.current) return;

    photoInFlightRequestsRef.current.add(requestKey);

    if (photoActiveCategoryRef.current === category) {
      if (replace) {
        setPhotoLoading(true);
        setPhotoLoadingMore(false);
      } else {
        setPhotoLoadingMore(true);
      }

      setPhotoError("");
    }

    try {
      const res = await assetLibraryService.getAssetsByType("PHOTO", {
        page: pageToLoad,
        size: PAGE_SIZE,
        category: category !== "All" ? category : undefined,
        search: search.trim() || undefined,
        orderBy: "sort_order",
        ascending: true,
      });

      const isLast = (pageToLoad + 1) * PAGE_SIZE >= res.total;
      const activeAssets: PhotoApiAsset[] = res.data
        .map((r) => ({
          id: r.id as any,
          assetKey: r.asset_key,
          name: r.name,
          assetType: r.type,
          category: r.category,
          assetData: r.json_data || {},
          sortOrder: r.sort_order,
          isActive: r.is_active,
        }))
        .filter(
          (asset) =>
            asset.isActive !== false &&
            getPhotoUrl(asset).length > 0,
        );

      const cached = photoCacheRef.current.get(category);
      const base = replace ? [] : (cached?.assets ?? []);

      const existingIds = new Set(base.map((asset) => asset.id));

      const uniqueAssets = activeAssets.filter(
        (asset) => !existingIds.has(asset.id),
      );

      const nextAssets = [...base, ...uniqueAssets].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );

      photoCacheRef.current.set(category, {
        assets: nextAssets,
        page: pageToLoad,
        hasMore: !isLast,
      });

      if (photoActiveCategoryRef.current === category) {
        setPhotoAssets(nextAssets);
        photoPageRef.current = pageToLoad;
        photoHasMoreRef.current = !isLast;
        setPhotoHasMore(!isLast);
        setPhotoError("");

        if (replace && activeAssets.length === 0) {
          setPhotoError(
            "No photos are currently available in this category.",
          );
        }
      }
    } catch (err) {
      if (photoActiveCategoryRef.current === category) {
        setPhotoError(
          err instanceof Error
            ? err.message
            : "We encountered an issue while loading the photos. Please try again.",
        );
      }
    } finally {
      photoInFlightRequestsRef.current.delete(requestKey);

      if (photoActiveCategoryRef.current === category) {
        setPhotoLoading(false);
        setPhotoLoadingMore(false);
      }
    }
  };

  const loadNextPhotoPage = () => {
    const category = photoActiveCategoryRef.current;

    if (
      !category ||
      photoLoading ||
      photoLoadingMore ||
      !photoHasMoreRef.current
    ) {
      return;
    }

    void loadPhotos(category, photoPageRef.current + 1);
  };

  // --------------------------------------------------
  // SHAPE INFINITE SCROLL
  // --------------------------------------------------

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = scrollContainerRef.current;

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

  // --------------------------------------------------
  // EMOJI INFINITE SCROLL
  // --------------------------------------------------

  useEffect(() => {
    const sentinel = emojiSentinelRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (
      view !== "emoji-items" ||
      !selectedEmojiCategory ||
      !sentinel ||
      !scrollContainer ||
      emojiLoading ||
      emojiLoadingMore ||
      emojiError ||
      !emojiHasMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextEmojiPage();
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
    emojiLoading,
    emojiLoadingMore,
    emojiHasMore,
    emojiError,
    emojiAssets.length,
    view,
    selectedEmojiCategory,
  ]);

  // --------------------------------------------------
  // PHOTO INFINITE SCROLL
  // --------------------------------------------------

  useEffect(() => {
    const sentinel = photoSentinelRef.current;
    const scrollContainer = scrollContainerRef.current;

    if (
      view !== "photo-items" ||
      !selectedPhotoCategory ||
      !sentinel ||
      !scrollContainer ||
      photoLoading ||
      photoLoadingMore ||
      photoError ||
      !photoHasMore
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadNextPhotoPage();
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
    photoLoading,
    photoLoadingMore,
    photoHasMore,
    photoError,
    photoAssets.length,
    view,
    selectedPhotoCategory,
  ]);

  // --------------------------------------------------
  // BACKEND-POWERED SEARCH EFFECTS FOR SHAPES & PHOTOS
  // --------------------------------------------------

  useEffect(() => {
    if (view === "items" && selectedCategory) {
      const timer = setTimeout(() => {
        void loadShapes(selectedCategory, 0, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, view, selectedCategory]);

  useEffect(() => {
    if (view === "photo-items" && selectedPhotoCategory) {
      const timer = setTimeout(() => {
        void loadPhotos(selectedPhotoCategory, 0, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [search, view, selectedPhotoCategory]);

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

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

  const dynamicPhotoCategories = useMemo<PhotoCategory[]>(
    () =>
      photoCategoryNames.map((title) => {
        const preset = PHOTO_CATEGORIES.find((p) => p.title === title);
        return (
          preset ?? {
            title,
            emoji: "📷",
            description: `${title} photos`,
          }
        );
      }),
    [photoCategoryNames],
  );

  const filteredPhotoCategories = dynamicPhotoCategories.filter((category) =>
    category.title.toLowerCase().includes(normalizedSearch),
  );

  const visiblePhotoAssets = photoAssets.filter((asset) =>
    asset.name.toLowerCase().includes(normalizedSearch),
  );

  // --------------------------------------------------
  // NAVIGATION HANDLERS
  // --------------------------------------------------

  const handleOpenShapes = () => {
    setView("categories");
    setSelectedCategory(null);
    setSearch("");
  };

  const handleOpenEmojis = () => {
    setView("emojis");
    setSelectedEmojiCategory(null);
    setSearch("");
    setEmojiError("");
  };

  const handleOpenPhotos = () => {
    setView("photo-categories");
    setSelectedPhotoCategory(null);
    setSearch("");
    setPhotoError("");
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

  const handleOpenPhotoCategory = (category: string) => {
    photoActiveCategoryRef.current = category;
    setSelectedPhotoCategory(category);
    setView("photo-items");
    setSearch("");
    setPhotoError("");

    const cached = photoCacheRef.current.get(category);

    if (cached) {
      setPhotoAssets(cached.assets);
      photoPageRef.current = cached.page;
      photoHasMoreRef.current = cached.hasMore;
      setPhotoHasMore(cached.hasMore);
      setPhotoLoading(false);
      setPhotoLoadingMore(false);
      return;
    }

    setPhotoAssets([]);
    photoPageRef.current = 0;
    photoHasMoreRef.current = false;
    setPhotoHasMore(false);
    setPhotoLoading(true);
    setPhotoLoadingMore(false);

    void loadPhotos(category, 0, true);
  };

  const handleBack = () => {
    if (view === "borders" || view === "animations") {
      setView("root");
      setSearch("");
    } else if (view === "items") {
      activeCategoryRef.current = null;
      setView("categories");
      setSelectedCategory(null);
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    } else if (view === "emoji-items") {
      emojiActiveCategoryRef.current = null;
      setView("emoji-categories");
      setSelectedEmojiCategory(null);
      setEmojiLoading(false);
      setEmojiLoadingMore(false);
      setEmojiError("");
    } else if (view === "photo-items") {
      photoActiveCategoryRef.current = null;
      setView("photo-categories");
      setSelectedPhotoCategory(null);
      setPhotoLoading(false);
      setPhotoLoadingMore(false);
      setPhotoError("");
    } else if (
      view === "categories" ||
      view === "emoji-categories" ||
      view === "photo-categories" ||
      view === "graphics" ||
      view === "animated-designs"
    ) {
      setView("root");
      setSearch("");
    }
  };

  // --------------------------------------------------
  // ADD ELEMENT HANDLERS
  // --------------------------------------------------

  const handleAddShape = (type: ShapeElementType) => {
    addShape(type);
  };

  const handleAddEmoji = (emoji: string | EmojiAsset) => {
    if (!emoji) return;

    addEmoji(emoji);
  };

  const handleAddPhoto = async (asset: PhotoApiAsset) => {
    const imageUrl = getPhotoUrl(asset);

    if (!imageUrl) {
      setPhotoError("We couldn’t retrieve a valid image URL for this photo.");
      return;
    }

    try {
      const response = await fetch(imageUrl);

      if (!response.ok) {
        throw new Error("We couldn’t download the photo. Please try again.");
      }

      const blob = await response.blob();

      if (!blob.type.startsWith("image/")) {
        throw new Error("The selected URL does not point to a valid image.");
      }

      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("We couldn’t convert the image. Please try again."));
          }
        };

        reader.onerror = () => {
          reject(new Error("We couldn’t read the image. Please try again."));
        };

        reader.readAsDataURL(blob);
      });

      addImage(dataUrl);
      setPhotoError("");
    } catch (err) {
      setPhotoError(
        err instanceof Error
          ? err.message
          : "We couldn’t add the photo to the canvas. Please try again.",
      );
    }
  };

  const handleSelectSearchResult = async (asset: SearchApiAsset) => {
    const type = (asset.assetType || "").toUpperCase();
    if (type === "BORDER") {
      setPageBorderAsset(asset as unknown as EditorPageAsset);
    } else if (type === "ANIMATION") {
      setPageAnimationAsset(asset as unknown as EditorPageAsset);
    } else if (type === "GRAPHIC") {
      await addGraphic(asset as unknown as GraphicAsset);
    } else if (type === "EMOJI") {
      handleAddEmoji(asset as unknown as EmojiAsset);
    } else if (type === "SHAPE") {
      const apiType = (
        asset.assetData?.type || asset.assetKey.replace(/^shape-/, "")
      ) as ShapeElementType;
      const mappedType = FLOWER_TYPE_MAP[asset.assetKey] || apiType;
      handleAddShape(mappedType);
    } else if (type === "PHOTO") {
      await handleAddPhoto(asset as unknown as PhotoApiAsset);
    }
  };

  const renderSearchResultCard = (asset: SearchApiAsset) => {
    const type = (asset.assetType || "").toUpperCase();
    const isSelectedBorder =
      type === "BORDER" && borderAsset?.assetKey === asset.assetKey;
    const isSelectedAnimation =
      type === "ANIMATION" && animationAsset?.assetKey === asset.assetKey;
    const isSelected = isSelectedBorder || isSelectedAnimation;

    const badgeConfig: Record<string, { label: string; badgeClass: string }> = {
      BORDER: { label: "Border", badgeClass: "bg-violet-100 text-violet-700" },
      ANIMATION: {
        label: "Animation",
        badgeClass: "bg-purple-100 text-purple-700",
      },
      GRAPHIC: {
        label: "Graphic",
        badgeClass: "bg-orange-100 text-orange-700",
      },
      EMOJI: { label: "Emoji", badgeClass: "bg-amber-100 text-amber-700" },
      SHAPE: { label: "Shape", badgeClass: "bg-blue-100 text-blue-700" },
      PHOTO: { label: "Photo", badgeClass: "bg-sky-100 text-sky-700" },
    };
    const badge = badgeConfig[type] || {
      label: type,
      badgeClass: "bg-slate-100 text-slate-700",
    };

    const rawSvg = asset.assetData?.svgContent;
    const svgDataUri =
      rawSvg && typeof rawSvg === "string"
        ? `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`
        : null;

    const isAnimatedGraphic = asset.assetData?.type === "animated";
    const animType = isAnimatedGraphic
      ? asset.assetData?.animationConfig?.type || "pulse"
      : null;

    const mappedShapeType = (
      FLOWER_TYPE_MAP[asset.assetKey] ||
      asset.assetData?.type ||
      asset.assetKey.replace(/^shape-/, "")
    ) as ShapeElementType;

    const photoUrl =
      type === "PHOTO" ? getPhotoUrl(asset as unknown as PhotoApiAsset) : "";

    return (
      <button
        key={`${asset.assetType}-${asset.id}-${asset.assetKey}`}
        type="button"
        title={`${asset.name} (${badge.label})`}
        aria-label={`Select ${asset.name}`}
        onClick={() => void handleSelectSearchResult(asset)}
        className={`group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border bg-white p-2.5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-200 ${isSelected
            ? "border-violet-500 ring-2 ring-violet-300 shadow-sm"
            : "border-slate-200/80"
          }`}
      >
        {/* PREVIEW CONTAINER */}
        <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-slate-50/70 p-2 transition-colors group-hover:bg-blue-50/40">
          {/* Top-Right Badge */}
          <span
            className={`absolute top-1.5 right-1.5 z-10 rounded-md px-1.5 py-0.5 text-[9px] font-bold tracking-wide shadow-xs ${badge.badgeClass}`}
          >
            {badge.label}
          </span>

          {/* Selected indicator */}
          {isSelected && (
            <span className="absolute top-1.5 left-1.5 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white shadow-xs">
              <Check size={11} strokeWidth={3} />
            </span>
          )}

          {/* Asset Preview */}
          {type === "BORDER" ? (
            <div className="flex h-full w-full items-center justify-center p-1">
              <div
                className="flex h-full w-full items-center justify-center bg-white shadow-xs"
                style={previewSearchBorder(asset)}
              >
                <span className="select-none text-[9px] font-semibold text-slate-400">
                  Border
                </span>
              </div>
            </div>
          ) : type === "ANIMATION" ? (
            <div className="flex h-full w-full items-center justify-center">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-sm"
                style={{ animation: previewSearchAnimation(asset) }}
              >
                <Sparkles size={22} />
              </div>
            </div>
          ) : type === "PHOTO" ? (
            photoUrl ? (
              <img
                src={photoUrl}
                alt={asset.name}
                loading="lazy"
                className="h-full w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.opacity = "0.25";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                Photo
              </div>
            )
          ) : type === "SHAPE" ? (
            <div className="flex h-full w-full items-center justify-center text-blue-600">
              <ShapePreview type={mappedShapeType} />
            </div>
          ) : svgDataUri ? (
            <img
              src={svgDataUri}
              alt={asset.name}
              loading="lazy"
              className={`pointer-events-none max-h-full max-w-full select-none object-contain p-1 transition-transform duration-300 ${animType ? `anim-preview-${animType}` : "group-hover:scale-105"
                }`}
            />
          ) : asset.assetData?.emoji ? (
            <span className="select-none text-4xl transition-transform duration-200 group-hover:scale-110">
              {String(asset.assetData.emoji)}
            </span>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              Preview
            </div>
          )}
        </div>

        {/* ASSET TITLE */}
        <div className="mt-1.5 w-full text-center">
          <p className="truncate text-xs font-semibold text-slate-800 transition-colors group-hover:text-blue-700">
            {asset.name}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {asset.category || badge.label}
          </p>
        </div>
      </button>
    );
  };

  // --------------------------------------------------
  // RETRY HANDLERS
  // --------------------------------------------------

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

  const handlePhotoRetry = () => {
    const category = photoActiveCategoryRef.current;

    if (!category || photoLoading) return;

    photoCacheRef.current.delete(category);
    setPhotoAssets([]);
    photoPageRef.current = 0;
    photoHasMoreRef.current = false;
    setPhotoHasMore(false);
    setPhotoError("");

    void loadPhotos(category, 0, true);
  };

  // --------------------------------------------------
  // SHAPE UI HELPERS
  // --------------------------------------------------

  const renderShapeGrid = (items: ShapeItem[]) => (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <button
          key={item.type}
          type="button"
          title={`Add ${item.label}`}
          onClick={() => handleAddShape(item.type)}
          {...elementDragProps(() => handleAddShape(item.type))}
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

  const renderCategoryList = (items: ShapeCategory[]) => {
    const colors = [
      {
        bg: "bg-blue-50",
        hover: "group-hover:bg-blue-100",
        ring: "group-focus-visible:ring-blue-200",
        icon: "text-blue-600",
        label: "group-hover:text-blue-700",
      },
      {
        bg: "bg-amber-50",
        hover: "group-hover:bg-amber-100",
        ring: "group-focus-visible:ring-amber-200",
        icon: "text-amber-600",
        label: "group-hover:text-amber-700",
      },
      {
        bg: "bg-pink-50",
        hover: "group-hover:bg-pink-100",
        ring: "group-focus-visible:ring-pink-200",
        icon: "text-pink-600",
        label: "group-hover:text-pink-700",
      },
      {
        bg: "bg-purple-50",
        hover: "group-hover:bg-purple-100",
        ring: "group-focus-visible:ring-purple-200",
        icon: "text-purple-600",
        label: "group-hover:text-purple-700",
      },
      {
        bg: "bg-green-50",
        hover: "group-hover:bg-green-100",
        ring: "group-focus-visible:ring-green-200",
        icon: "text-green-600",
        label: "group-hover:text-green-700",
      },
      {
        bg: "bg-sky-50",
        hover: "group-hover:bg-sky-100",
        ring: "group-focus-visible:ring-sky-200",
        icon: "text-sky-600",
        label: "group-hover:text-sky-700",
      },
      {
        bg: "bg-orange-50",
        hover: "group-hover:bg-orange-100",
        ring: "group-focus-visible:ring-orange-200",
        icon: "text-orange-600",
        label: "group-hover:text-orange-700",
      },
      {
        bg: "bg-indigo-50",
        hover: "group-hover:bg-indigo-100",
        ring: "group-focus-visible:ring-indigo-200",
        icon: "text-indigo-600",
        label: "group-hover:text-indigo-700",
      },
      {
        bg: "bg-rose-50",
        hover: "group-hover:bg-rose-100",
        ring: "group-focus-visible:ring-rose-200",
        icon: "text-rose-600",
        label: "group-hover:text-rose-700",
      },
      {
        bg: "bg-teal-50",
        hover: "group-hover:bg-teal-100",
        ring: "group-focus-visible:ring-teal-200",
        icon: "text-teal-600",
        label: "group-hover:text-teal-700",
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-2.5">
        {items.map((category, index) => {
          const color = colors[index % colors.length];

          return (
            <button
              key={category.title}
              type="button"
              onClick={() => handleOpenCategory(category)}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div
                className={`flex aspect-square w-full items-center justify-center rounded-xl p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 ${color.bg} ${color.hover} ${color.ring}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm ${color.icon}`}
                >
                  {category.icon}
                </span>
              </div>

              <span
                className={`text-center text-xs font-semibold text-slate-700 transition-colors ${color.label}`}
              >
                {category.title}
              </span>
            </button>
          );
        })}
      </div>
    );
  };


  // --------------------------------------------------
  // PHOTO UI HELPERS
  // --------------------------------------------------


  const renderPhotoCategoryList = () => {
    const colors = [
      {
        bg: "bg-amber-50",
        hover: "group-hover:bg-amber-100",
        ring: "group-focus-visible:ring-amber-200",
        icon: "text-amber-600",
        label: "group-hover:text-amber-700",
      },
      {
        bg: "bg-indigo-50",
        hover: "group-hover:bg-indigo-100",
        ring: "group-focus-visible:ring-indigo-200",
        icon: "text-indigo-600",
        label: "group-hover:text-indigo-700",
      },
      {
        bg: "bg-green-50",
        hover: "group-hover:bg-green-100",
        ring: "group-focus-visible:ring-green-200",
        icon: "text-green-600",
        label: "group-hover:text-green-700",
      },
      {
        bg: "bg-sky-50",
        hover: "group-hover:bg-sky-100",
        ring: "group-focus-visible:ring-sky-200",
        icon: "text-sky-600",
        label: "group-hover:text-sky-700",
      },
      {
        bg: "bg-orange-50",
        hover: "group-hover:bg-orange-100",
        ring: "group-focus-visible:ring-orange-200",
        icon: "text-orange-600",
        label: "group-hover:text-orange-700",
      },
      {
        bg: "bg-purple-50",
        hover: "group-hover:bg-purple-100",
        ring: "group-focus-visible:ring-purple-200",
        icon: "text-purple-600",
        label: "group-hover:text-purple-700",
      },
    ];

    return (
      <div className="grid grid-cols-3 gap-2.5">
        {filteredPhotoCategories.map((category, index) => {
          const color = colors[index % colors.length];

          return (
            <button
              key={category.title}
              type="button"
              onClick={() => handleOpenPhotoCategory(category.title)}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div
                className={`flex aspect-square w-full items-center justify-center rounded-xl p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 ${color.bg} ${color.hover} ${color.ring}`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-105">
                  {category.title === "Awards" && <Medal size={24} strokeWidth={2} className="text-amber-600" />}
                  {category.title === "Education" && <BookOpen size={24} strokeWidth={2} className="text-indigo-600" />}
                  {category.title === "Nature" && <Trees size={24} strokeWidth={2} className="text-green-600" />}
                  {category.title === "Business" && <Building2 size={24} strokeWidth={2} className="text-sky-600" />}
                  {category.title === "Celebration" && <Gift size={24} strokeWidth={2} className="text-orange-600" />}
                  {category.title === "Backgrounds" && <Wallpaper size={24} strokeWidth={2} className="text-purple-600" />}
                </span>
              </div>

              <span
                className={`text-center text-xs font-semibold text-slate-700 transition-colors ${color.label}`}
              >
                {category.title}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderPhotoGrid = () => (
    <div className="grid grid-cols-2 gap-2.5">
      {visiblePhotoAssets.map((asset) => {
        const imageUrl = getPhotoUrl(asset);

        return (
          <button
            key={asset.id}
            type="button"
            title={`Add ${asset.name}`}
            aria-label={`Add ${asset.name}`}
            onClick={() => void handleAddPhoto(asset)}
            {...elementDragProps(() => handleAddPhoto(asset))}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md active:scale-95"
          >
            <div className="aspect-[4/3] overflow-hidden bg-slate-100">
              <img
                src={imageUrl}
                alt={asset.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(event) => {
                  event.currentTarget.style.opacity = "0.25";
                }}
              />
            </div>

            <div className="p-2">
              <p className="truncate text-xs font-semibold text-slate-700 group-hover:text-blue-700">
                {asset.name}
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Click to add
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );

  // --------------------------------------------------
  // VIEW CONFIGURATION
  // --------------------------------------------------

  const isEmojiView =
    view === "emoji-categories" || view === "emoji-items";

  const isPhotoView =
    view === "photo-categories" || view === "photo-items";

  const pageTitle =
    view === "borders"
      ? "Borders"
      : view === "animations"
        ? "Animations"
        : view === "graphics"
          ? "Graphics"
          : view === "animated-designs"
            ? "Animated Designs"
            : view === "root"
              ? "Elements"
              : view === "categories"
                ? "Shapes"
                : view === "items"
                  ? selectedCategory ?? "Shapes"
                  : view === "emoji-categories"
                    ? "Emojis"
                    : view === "emoji-items"
                      ? selectedEmojiCategory ?? "Emojis"
                      : view === "photo-categories"
                        ? "Photos"
                        : selectedPhotoCategory ?? "Photos";


  const pageSubtitle =
    view === "borders"
      ? "Choose a border for this page."
      : view === "animations"
        ? "Choose an animation for your design."
        : view === "graphics"
          ? "Browse free editable vector illustrations."
          : view === "animated-designs"
            ? "Browse dynamic animated vector elements."
            : view === "root"
              ? "Browse elements for your design."
              : view === "categories"
                ? "Choose a shape category."
                : view === "items"
                  ? "Select a shape to add it to your canvas."
                  : view === "emoji-categories"
                    ? "Choose an emoji category."
                    : view === "emoji-items"
                      ? "Select an emoji to add it to your canvas."
                      : view === "photo-categories"
                        ? "Choose a photo category."
                        : "Select a photo to add it to your canvas.";
  // --------------------------------------------------
  // MAIN UI
  // --------------------------------------------------

  if (view === "graphics") {
    return (
      <StaticGraphicsBrowser
        onBack={() => {
          setView("root");
          setSearch("");
        }}
        onSelectGraphic={(graphic) => addGraphic(graphic)}
      />
    );
  }

  if (view === "animated-designs") {
    return (
      <GraphicsBrowser
        onBack={() => {
          setView("root");
          setSearch("");
        }}
        onSelectGraphic={(graphic) => addGraphic(graphic)}
      />
    );
  }

  if (view === "emojis" || view === "emoji-categories" || view === "emoji-items") {
    return (
      <EmojiBrowser
        onBack={() => {
          setView("root");
          setSearch("");
        }}
        onSelectEmoji={handleAddEmoji}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      {/* HEADER */}

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
              {pageTitle}
            </h2>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              {pageSubtitle}
            </p>
          </div>
        </div>

        {view !== "borders" && view !== "animations" && (
          <div className="relative mt-4">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                view === "photo-items"
                  ? "Search photos..."
                  : view === "photo-categories"
                    ? "Search photo categories..."
                    : "Search elements..."
              }
              aria-label="Search elements"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/80"
            />
          </div>
        )}
      </div>

      {/* CONTENT */}

      <div
        ref={scrollContainerRef}
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3"
      >
        {/* PHOTO CATEGORIES */}

        {view === "borders" ? (
          <BordersPanel />
        ) : view === "animations" ? (
          <AnimationsPanel />
        ) : view === "photo-categories" ? (
          filteredPhotoCategories.length > 0 ? (
            renderPhotoCategoryList()
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
              <Search size={28} className="mb-3 text-slate-300" />

              <p className="text-sm font-semibold text-slate-700">
                No photo categories found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try a different search term.
              </p>
            </div>
          )

          /* PHOTO ITEMS */

        ) : view === "photo-items" ? (
          photoLoading && photoAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center">
              <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

              <p className="text-sm font-semibold text-slate-700">
                Loading photos...
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Photos are being loaded from the database.
              </p>
            </div>
          ) : photoError && photoAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">
                We couldn’t load the photos. Please try again in a moment.
              </p>

              <p className="mt-2 break-words text-xs text-slate-500">
                {photoError}
              </p>

              <button
                type="button"
                onClick={handlePhotoRetry}
                className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                <span className="text-xl">
                  {
                    PHOTO_CATEGORIES.find(
                      (category) =>
                        category.title === selectedPhotoCategory,
                    )?.emoji
                  }
                </span>

                <span className="text-sm font-semibold text-slate-800">
                  {selectedPhotoCategory}
                </span>

                <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                  {visiblePhotoAssets.length} photos
                </span>
              </div>

              {visiblePhotoAssets.length > 0 ? (
                renderPhotoGrid()
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No photos found
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Try another search term.
                  </p>
                </div>
              )}

              {photoLoadingMore && (
                <div className="flex items-center justify-center gap-2 py-5 text-xs font-medium text-slate-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
                  Loading more photos...
                </div>
              )}

              {photoError && photoAssets.length > 0 && (
                <div className="my-3 rounded-xl border border-red-100 bg-white p-3 text-center">
                  <p className="text-xs text-red-600">{photoError}</p>

                  <button
                    type="button"
                    onClick={loadNextPhotoPage}
                    className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Try again
                  </button>
                </div>
              )}

              {photoHasMore && !photoLoading && !photoError && (
                <div
                  ref={photoSentinelRef}
                  className="h-8 w-full"
                  aria-hidden="true"
                />
              )}

              {!photoHasMore && photoAssets.length > 0 && (
                <p className="py-4 text-center text-[11px] text-slate-400">
                  You have reached the end of the photos.
                </p>
              )}
            </>
          )

          /* SHAPE LOADING */

        ) : loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="text-sm font-semibold text-slate-700">
              Loading shapes...
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Shapes are being loaded from the database.
            </p>
          </div>
        ) : error && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-4 py-12 text-center">
            <Shapes size={30} className="mb-3 text-red-300" />

            <p className="text-sm font-semibold text-slate-700">
              We couldn’t load the shapes. Please try again in a moment.
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

          /* SEARCH RESULTS */

        ) : normalizedSearch && view === "root" ? (
          <div>
            {/* SEARCH HEADER */}
            <div className="mb-3 flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Results for &ldquo;{search}&rdquo;
                </span>
                {!globalSearchLoading && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                    {globalSearchResults.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
              >
                Clear
              </button>
            </div>

            {/* LOADING STATE */}
            {globalSearchLoading ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
                <p className="text-sm font-semibold text-slate-700">
                  Searching elements...
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Finding matching graphics, borders, animations, and more
                </p>
              </div>
            ) : globalSearchError ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-white px-4 py-10 text-center shadow-sm">
                <p className="text-sm font-semibold text-slate-800">
                  Search error
                </p>
                <p className="mt-1 text-xs text-red-600">
                  {globalSearchError}
                </p>
                <button
                  type="button"
                  onClick={() => setDebouncedGlobalSearch(search.trim())}
                  className="mt-3 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : globalSearchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
                <Search size={28} className="mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">
                  No elements found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  We couldn&apos;t find anything matching &ldquo;{search}&rdquo;.
                </p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {globalSearchResults.map((asset) => renderSearchResultCard(asset))}
              </div>
            )}
          </div>
        ) : normalizedSearch ? (
          <div className="space-y-3">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => {
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
              })
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-12 text-center">
                <Search size={28} className="mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">
                  No shapes found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Try a different search term.
                </p>
              </div>
            )}
          </div>

          /* ROOT VIEW */


        ) : view === "root" ? (
          <div className="grid grid-cols-3 gap-3">
            {/* 1. GRAPHICS (STATIC VECTOR LIBRARY) */}
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setView("graphics");
              }}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-orange-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-orange-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm transition-transform group-hover:scale-110">
                  <Palette
                    size={24}
                    strokeWidth={2}
                    className="text-orange-700"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-orange-700">
                Graphics
              </span>
            </button>
            {/* 2. ANIMATED DESIGNS */}
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setView("animated-designs");
              }}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-violet-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-violet-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm transition-transform group-hover:scale-110">
                  <Sparkles
                    size={24}
                    strokeWidth={2}
                    className="text-violet-700"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-violet-700">
                Animated Designs
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenShapes}
              className="group flex flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-blue-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:bg-blue-100 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-blue-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm">
                  <Shapes
                    size={24}
                    strokeWidth={2}
                    className="text-blue-700 transition-transform group-hover:scale-110"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-blue-700">
                Shapes
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenEmojis}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-pink-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-pink-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm transition-transform group-hover:scale-110">
                  <Smile
                    size={24}
                    strokeWidth={2}
                    className="text-pink-700"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-pink-700">
                Emojis
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenPhotos}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-green-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-green-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm transition-transform group-hover:scale-110">
                  <Images
                    size={24}
                    strokeWidth={2}
                    className="text-green-700"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-green-700">
                Photos
              </span>
            </button>


            <button
              type="button"
              onClick={() => {
                setSearch("");
                setView("borders");
              }}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-amber-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-amber-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm transition-transform group-hover:scale-110">
                  <Frame
                    size={24}
                    strokeWidth={2}
                    className="text-amber-700"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-amber-700">
                Borders
              </span>
            </button>



            <button
              type="button"
              onClick={() => {
                setSearch("");
                setView("animations");
              }}
              className="group flex min-w-0 flex-col items-center gap-2 focus:outline-none"
            >
              <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-fuchsia-100 p-2 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-fuchsia-200">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/80 shadow-sm transition-transform group-hover:scale-110">
                  <Sparkles
                    size={24}
                    strokeWidth={2}
                    className="text-fuchsia-700"
                  />
                </span>
              </div>

              <span className="text-xs font-semibold text-slate-700 transition-colors group-hover:text-fuchsia-700">
                Animations
              </span>
            </button>

          </div>

          /* SHAPE CATEGORIES */

        ) : view === "categories" ? (
          renderCategoryList(categories)

          /* SHAPE ITEMS */

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

        {/* SHAPE PAGINATION */}

        {!isEmojiView && !isPhotoView && loadingMore && (
          <div className="flex items-center justify-center gap-2 py-5 text-xs font-medium text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
            Loading more shapes...
          </div>
        )}

        {!isEmojiView && !isPhotoView && error && assets.length > 0 && (
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

        {!isEmojiView && !isPhotoView && hasMore && !loading && !error && (
          <div
            ref={sentinelRef}
            className="h-8 w-full"
            aria-hidden="true"
          />
        )}

        {!isEmojiView &&
          !isPhotoView &&
          !hasMore &&
          assets.length > 0 && (
            <p className="py-4 text-center text-[11px] text-slate-400">
              You have reached the end of the shapes.
            </p>
          )}
      </div>

      {/* FOOTER */}

      <div className="border-t border-slate-200 bg-white px-4 py-3">
        <p className="text-[11px] leading-4 text-slate-400">
          {isPhotoView
            ? "Select a photo to add it to your canvas. You can then move, resize, rotate, and customize it."
            : isEmojiView
              ? "Select an emoji to add it to your canvas. You can then move, resize, rotate, and customize it."
              : "Select a shape to add it to your canvas. You can then move, resize, rotate, and customize it."}
        </p>
      </div>
    </div>
  );
}
