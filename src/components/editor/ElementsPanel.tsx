
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Square,
  Circle,
  Triangle,
  Star,
  Cog,
  Flower2,
  Leaf,
  Waves,
  MessageCircle,
  GitBranch,
  Minus,
  Pentagon,
  Hexagon,
  Octagon,
  Shapes,
  Sparkles,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";
import type { ShapeElementType } from "../../context/FabricContext";

interface ShapeItem {
  label: string;
  type: ShapeElementType;
  icon?: ReactNode;
}

interface ShapeCategory {
  title: string;
  icon: ReactNode;
  items: ShapeItem[];
}

type PanelView = "root" | "categories" | "items";

const categories: ShapeCategory[] = [
  {
    title: "Basic Shapes",
    icon: <Shapes size={17} />,
    items: [
      { label: "Rectangle", type: "rectangle", icon: <Square /> },
      { label: "Square", type: "square", icon: <Square /> },
      { label: "Circle", type: "circle", icon: <Circle /> },
      { label: "Triangle", type: "triangle", icon: <Triangle /> },
      { label: "Polygon", type: "polygon", icon: <Pentagon /> },
      { label: "Pentagon", type: "pentagon", icon: <Pentagon /> },
      { label: "Hexagon", type: "hexagon", icon: <Hexagon /> },
      { label: "Heptagon", type: "heptagon", icon: <Hexagon /> },
      { label: "Octagon", type: "octagon", icon: <Octagon /> },
    ],
  },
  {
    title: "Stars",
    icon: <Star size={17} />,
    items: [
      { label: "Star", type: "star", icon: <Star /> },
      { label: "Star Outline", type: "star-outline", icon: <Star /> },
      { label: "4-Point Star", type: "star-4", icon: <Sparkles /> },
      { label: "6-Point Star", type: "star-6", icon: <Star /> },
      { label: "8-Point Star", type: "star-8", icon: <Sparkles /> },
      { label: "12-Point Star", type: "star-12", icon: <Star /> },
    ],
  },
  {
    title: "Cogs",
    icon: <Cog size={17} />,
    items: [
      { label: "4-Tooth Cog", type: "cog-4", icon: <Cog /> },
      { label: "6-Tooth Cog", type: "cog-6", icon: <Cog /> },
      { label: "8-Tooth Cog", type: "cog-8", icon: <Cog /> },
      { label: "10-Tooth Cog", type: "cog-10", icon: <Cog /> },
      { label: "12-Tooth Cog", type: "cog-12", icon: <Cog /> },
      { label: "16-Tooth Cog", type: "cog-16", icon: <Cog /> },
      { label: "20-Tooth Cog", type: "cog-20", icon: <Cog /> },
      { label: "24-Tooth Cog", type: "cog-24", icon: <Cog /> },
    ],
  },
  {
    title: "Square Stars",
    icon: <Sparkles size={17} />,
    items: [
      { label: "4-Point Square Star", type: "square-star-4", icon: <Sparkles /> },
      { label: "8-Point Square Star", type: "square-star-8", icon: <Star /> },
      { label: "12-Point Square Star", type: "square-star-12", icon: <Sparkles /> },
      { label: "16-Point Square Star", type: "square-star-16", icon: <Star /> },
      { label: "24-Point Square Star", type: "square-star-24", icon: <Sparkles /> },
      { label: "32-Point Square Star", type: "square-star-32", icon: <Star /> },
    ],
  },
  {
    title: "Organic Shapes",
    icon: <Waves size={17} />,
    items: [
      { label: "Organic Blob", type: "organic-blob", icon: <Circle /> },
      { label: "Organic Blob 2", type: "organic-blob-2", icon: <Circle /> },
      { label: "Organic Blob 3", type: "organic-blob-3", icon: <Circle /> },
      { label: "Organic Wave", type: "organic-wave", icon: <Waves /> },
      { label: "Organic Wave 2", type: "organic-wave-2", icon: <Waves /> },
      { label: "Cloud", type: "organic-cloud", icon: <Waves /> },
      { label: "Splash", type: "organic-splash", icon: <Sparkles /> },
      { label: "Pebble", type: "organic-pebble", icon: <Circle /> },
    ],
  },
  {
    title: "Flowers",
    icon: <Flower2 size={17} />,
    items: [
      { label: "Flower", type: "flower", icon: <Flower2 /> },
      { label: "5-Petal Flower", type: "flower-5", icon: <Flower2 /> },
      { label: "8-Petal Flower", type: "flower-8", icon: <Flower2 /> },
      { label: "12-Petal Flower", type: "flower-12", icon: <Flower2 /> },
    ],
  },
  {
    title: "Leaves & Petals",
    icon: <Leaf size={17} />,
    items: [
      { label: "Leaf", type: "leaf", icon: <Leaf /> },
      { label: "Rounded Leaf", type: "leaf-rounded", icon: <Leaf /> },
      { label: "Pointed Leaf", type: "leaf-pointed", icon: <Leaf /> },
      { label: "Leaf Pair", type: "leaf-pair", icon: <Leaf /> },
      { label: "Petal", type: "petal", icon: <Flower2 /> },
      { label: "Rounded Petal", type: "petal-rounded", icon: <Flower2 /> },
      { label: "Pointed Petal", type: "petal-pointed", icon: <Flower2 /> },
      { label: "Vine", type: "vine", icon: <Leaf /> },
    ],
  },
  {
    title: "Flowchart",
    icon: <GitBranch size={17} />,
    items: [
      { label: "Process", type: "flow-process", icon: <Square /> },
      { label: "Decision", type: "flow-decision", icon: <Triangle /> },
      { label: "Terminator", type: "flow-terminator", icon: <Circle /> },
      { label: "Input / Output", type: "flow-io", icon: <Shapes /> },
      { label: "Document", type: "flow-document", icon: <Square /> },
      { label: "Connector", type: "flow-connector", icon: <Circle /> },
      { label: "Preparation", type: "flow-preparation", icon: <Hexagon /> },
      { label: "Manual Input", type: "flow-manual-input", icon: <Triangle /> },
    ],
  },
  {
    title: "Speech Bubbles",
    icon: <MessageCircle size={17} />,
    items: [
      { label: "Speech Bubble", type: "speech-bubble", icon: <MessageCircle /> },
      { label: "Chat Bubble", type: "chat-bubble", icon: <MessageCircle /> },
      { label: "Thought Bubble", type: "thought-bubble", icon: <Circle /> },
      { label: "Rounded Bubble", type: "rounded-bubble", icon: <MessageCircle /> },
    ],
  },
  {
    title: "Lines & Arrows",
    icon: <Minus size={17} />,
    items: [
      { label: "Line", type: "line", icon: <Minus /> },
      { label: "Arrow", type: "arrow", icon: <GitBranch /> },
      { label: "Double Arrow", type: "double-arrow", icon: <GitBranch /> },
      { label: "Dashed Line", type: "dashed-line", icon: <Minus /> },
      { label: "Dotted Line", type: "dotted-line", icon: <Minus /> },
    ],
  },
];

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

export default function ElementsPanel() {
  const { addShape } = useFabric();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<PanelView>("root");
  const [selectedCategory, setSelectedCategory] =
    useState<ShapeCategory | null>(null);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredCategories = categories
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

  const handleOpenShapes = () => {
    setView("categories");
    setSelectedCategory(null);
  };

  const handleOpenCategory = (category: ShapeCategory) => {
    setSelectedCategory(category);
    setView("items");
  };

  const handleBack = () => {
    if (view === "items") {
      setView("categories");
      setSelectedCategory(null);
    } else if (view === "categories") {
      setView("root");
      setSearch("");
    }
  };

  const handleAddShape = (type: ShapeElementType) => {
    addShape(type);
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
              {category.items.length} shapes
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
                  : selectedCategory?.title ?? "Shapes"}
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

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/40 p-3">
        {normalizedSearch ? (
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
        ) : selectedCategory ? (
          <div>
            <div className="mb-3 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <span className="text-blue-600">{selectedCategory.icon}</span>

              <span className="text-sm font-semibold text-slate-800">
                {selectedCategory.title}
              </span>

              <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">
                {selectedCategory.items.length} shapes
              </span>
            </div>

            {renderShapeGrid(selectedCategory.items)}
          </div>
        ) : (
          renderCategoryList(categories)
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
