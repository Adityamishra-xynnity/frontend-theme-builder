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
// import type { ElementType } from "../../types/editor";


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
const PREVIEW_FILL = "#dbeafe";
const PREVIEW_SIZE = 64;

function getRegularPolygonPoints(
  sides: number,
  radius = 23,
  center = 32,
): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / sides;

    return [
      center + Math.cos(angle) * radius,
      center + Math.sin(angle) * radius,
    ];
  })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function getStarPoints(
  points: number,
  outerRadius = 25,
  innerRadius = 11,
): string {
  return Array.from({ length: points * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;

    return [
      32 + Math.cos(angle) * radius,
      32 + Math.sin(angle) * radius,
    ];
  })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function getCogPoints(teeth: number): string {
  const radius = 25;
  const innerRadius = radius * 0.78;
  const steps = teeth * 4;

  return Array.from({ length: steps }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / steps;
    const radiusForPoint = index % 4 < 2 ? radius : innerRadius;

    return [
      32 + Math.cos(angle) * radiusForPoint,
      32 + Math.sin(angle) * radiusForPoint,
    ];
  })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function getFlowerPoints(petals: number): string {
  const steps = petals * 24;
  const radius = 25;

  return Array.from({ length: steps }, (_, index) => {
    const angle = (index * Math.PI * 2) / steps;
    const currentRadius =
      radius * (0.68 + 0.32 * Math.cos(petals * angle));

    return [
      32 + Math.cos(angle) * currentRadius,
      32 + Math.sin(angle) * currentRadius,
    ];
  })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function getOrganicPoints(variant: number): string {
  const steps = 80;
  const radius = 25;

  return Array.from({ length: steps }, (_, index) => {
    const angle = (index * Math.PI * 2) / steps;
    const currentRadius =
      radius *
      (0.83 +
        Math.sin(angle * (variant + 2)) * 0.09 +
        Math.cos(angle * (variant + 3)) * 0.06);

    return [
      32 + Math.cos(angle) * currentRadius,
      32 + Math.sin(angle) * currentRadius,
    ];
  })
    .map(([x, y]) => `${x},${y}`)
    .join(" ");
}

function ShapePreview({ type }: { type: ShapeElementType }) {
  const common = {
    fill: PREVIEW_FILL,
    stroke: PREVIEW_COLOR,
    strokeWidth: 1.8,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };

  const svg = (children: ReactNode) => (
    <svg
      viewBox={`0 0 ${PREVIEW_SIZE} ${PREVIEW_SIZE}`}
      className="h-10 w-10 overflow-visible"
      aria-hidden="true"
    >
      {children}
    </svg>
  );

  const regularPolygon = (sides: number) =>
    svg(<polygon points={getRegularPolygonPoints(sides)} {...common} />);

  if (type === "rectangle") {
    return svg(
      <rect x="8" y="13" width="48" height="38" rx="1" {...common} />,
    );
  }

  if (type === "square") {
    return svg(
      <rect x="11" y="11" width="42" height="42" rx="1" {...common} />,
    );
  }

  if (type === "circle") {
    return svg(<circle cx="32" cy="32" r="23" {...common} />);
  }

  if (type === "triangle") return regularPolygon(3);
  if (type === "polygon" || type === "pentagon") return regularPolygon(5);
  if (type === "hexagon") return regularPolygon(6);
  if (type === "heptagon") return regularPolygon(7);
  if (type === "octagon") return regularPolygon(8);

  if (type === "star" || type === "star-outline") {
    return svg(
      <polygon
        points={getStarPoints(5)}
        {...common}
        fill={type === "star-outline" ? "white" : PREVIEW_FILL}
      />,
    );
  }

  if (type === "star-4") {
    return svg(<polygon points={getStarPoints(4, 25, 7)} {...common} />);
  }

  if (type === "star-6") {
    return svg(<polygon points={getStarPoints(6, 25, 13)} {...common} />);
  }

  if (type === "star-8") {
    return svg(<polygon points={getStarPoints(8, 25, 15)} {...common} />);
  }

  if (type === "star-12") {
    return svg(<polygon points={getStarPoints(12, 25, 19)} {...common} />);
  }

  const cogMatch = /^cog-(\d+)$/.exec(String(type));

  if (cogMatch) {
    const teeth = Number(cogMatch[1]);

    return svg(
      <>
        <polygon points={getCogPoints(teeth)} {...common} />
        <circle
          cx="32"
          cy="32"
          r="7"
          fill="white"
          stroke={PREVIEW_COLOR}
          strokeWidth="1.8"
        />
      </>,
    );
  }

  const squareStarMatch = /^square-star-(\d+)$/.exec(String(type));

  if (squareStarMatch) {
    const points = Number(squareStarMatch[1]);

    return svg(
      <polygon
        points={getStarPoints(points, 25, points >= 24 ? 22 : 15)}
        {...common}
      />,
    );
  }

  if (
    type === "flower" ||
    type === "flower-5" ||
    type === "flower-8" ||
    type === "flower-12"
  ) {
    const petals =
      type === "flower-5"
        ? 5
        : type === "flower-8"
          ? 8
          : type === "flower-12"
            ? 12
            : 6;

    return svg(
      <>
        <polygon points={getFlowerPoints(petals)} {...common} />
        <circle
          cx="32"
          cy="32"
          r="4"
          fill="#f8fafc"
          stroke={PREVIEW_COLOR}
          strokeWidth="1.5"
        />
      </>,
    );
  }

  if (
    type === "organic-blob" ||
    type === "organic-blob-2" ||
    type === "organic-blob-3" ||
    type === "organic-cloud" ||
    type === "organic-splash" ||
    type === "organic-pebble"
  ) {
    const variantMap: Partial<Record<string, number>> = {
      "organic-blob": 1,
      "organic-blob-2": 2,
      "organic-blob-3": 3,
      "organic-cloud": 4,
      "organic-splash": 5,
      "organic-pebble": 6,
    };

    return svg(
      <polygon
        points={getOrganicPoints(variantMap[String(type)] ?? 1)}
        {...common}
      />,
    );
  }

  if (type === "organic-wave") {
    return svg(
      <path
        d="M 0 25 Q 15 0 30 25 T 60 25 L 60 52 L 0 52 Z"
        {...common}
      />,
    );
  }

  if (type === "organic-wave-2") {
    return svg(
      <path
        d="M 0 28 C 10 0 20 55 30 28 S 50 0 60 28 L 60 52 L 0 52 Z"
        {...common}
      />,
    );
  }

  if (
    type === "leaf" ||
    type === "leaf-rounded" ||
    type === "leaf-pointed"
  ) {
    const d =
      type === "leaf-rounded"
        ? "M 7 32 Q 12 7 57 7 Q 57 32 7 32 Z"
        : "M 7 32 Q 17 7 57 7 Q 52 27 7 32 Z";

    return svg(
      <>
        <path d={d} {...common} />
        <path
          d="M 9 31 Q 31 23 55 9"
          fill="none"
          stroke={PREVIEW_COLOR}
          strokeWidth="1.5"
        />
      </>,
    );
  }

  if (type === "leaf-pair") {
    return svg(
      <>
        <path d="M 5 40 Q 10 8 32 8 Q 34 30 5 40 Z" {...common} />
        <path d="M 32 48 Q 32 15 58 12 Q 60 35 32 48 Z" {...common} />
        <path
          d="M 5 40 Q 24 31 32 24"
          fill="none"
          stroke={PREVIEW_COLOR}
          strokeWidth="1.5"
        />
      </>,
    );
  }

  if (
    type === "petal" ||
    type === "petal-rounded" ||
    type === "petal-pointed"
  ) {
    const d =
      type === "petal-pointed"
        ? "M32 7 Q55 32 32 57 Q9 32 32 7 Z"
        : type === "petal-rounded"
          ? "M32 7 C51 7 53 37 32 57 C11 37 13 7 32 7 Z"
          : "M32 7 Q47 27 32 57 Q17 27 32 7 Z";

    return svg(<path d={d} {...common} />);
  }

  if (type === "vine") {
    return svg(
      <path
        d="M 5 54 Q 24 48 20 33 T 38 15 Q 51 11 48 24 T 59 38"
        fill="none"
        stroke={PREVIEW_COLOR}
        strokeWidth="2"
      />,
    );
  }

  if (type === "flow-process") {
    return svg(
      <rect x="8" y="17" width="48" height="30" rx="1" {...common} />,
    );
  }

  if (type === "flow-decision") {
    return svg(
      <polygon points="32,5 59,32 32,59 5,32" {...common} />,
    );
  }

  if (type === "flow-terminator") {
    return svg(
      <rect x="7" y="18" width="50" height="28" rx="14" {...common} />,
    );
  }

  if (type === "flow-io") {
    return svg(
      <polygon points="18,14 56,14 46,50 8,50" {...common} />,
    );
  }

  if (type === "flow-document") {
    return svg(
      <path
        d="M12 9 H52 V45 Q42 39 32 45 Q22 51 12 45 Z"
        {...common}
      />,
    );
  }

  if (type === "flow-connector") {
    return svg(<circle cx="32" cy="32" r="18" {...common} />);
  }

  if (type === "flow-preparation") {
    return svg(
      <polygon
        points="18,10 46,10 58,32 46,54 18,54 6,32"
        {...common}
      />,
    );
  }

  if (type === "flow-manual-input") {
    return svg(
      <polygon points="9,19 55,9 55,53 9,53" {...common} />,
    );
  }

  if (type === "speech-bubble") {
    return svg(
      <path
        d="M 5 9 L 59 9 L 59 43 L 30 43 L 18 56 L 20 43 L 5 43 Z"
        {...common}
      />,
    );
  }

  if (type === "chat-bubble") {
    return svg(
      <path
        d="M 15 8 H 49 Q 59 8 59 18 V 38 Q 59 47 49 47 H 28 L 15 57 L 18 47 Q 5 47 5 37 V 18 Q 5 8 15 8 Z"
        {...common}
      />,
    );
  }

  if (type === "thought-bubble") {
    return svg(
      <>
        <path
          d="M 20 17 C 7 17 5 32 13 38 C 5 49 18 57 29 51 C 39 60 51 51 50 42 C 61 34 53 20 44 22 C 36 11 26 12 20 17 Z"
          {...common}
        />
        <circle cx="15" cy="48" r="3" {...common} />
        <circle cx="9" cy="55" r="2" {...common} />
      </>,
    );
  }

  if (type === "rounded-bubble") {
    return svg(
      <rect x="6" y="9" width="52" height="37" rx="10" {...common} />,
    );
  }

  if (
    type === "line" ||
    type === "dashed-line" ||
    type === "dotted-line"
  ) {
    return svg(
      <line
        x1="7"
        y1="32"
        x2="57"
        y2="32"
        fill="none"
        stroke={PREVIEW_COLOR}
        strokeWidth="2.5"
        strokeDasharray={
          type === "dashed-line"
            ? "7 5"
            : type === "dotted-line"
              ? "1 6"
              : undefined
        }
      />,
    );
  }

  if (type === "arrow" || type === "double-arrow") {
    return svg(
      <>
        <line
          x1={type === "double-arrow" ? "10" : "8"}
          y1="32"
          x2="56"
          y2="32"
          stroke={PREVIEW_COLOR}
          strokeWidth="2.5"
        />
        <polyline
          points="45,21 56,32 45,43"
          fill="none"
          stroke={PREVIEW_COLOR}
          strokeWidth="2.5"
        />
        {type === "double-arrow" && (
          <polyline
            points="21,21 10,32 21,43"
            fill="none"
            stroke={PREVIEW_COLOR}
            strokeWidth="2.5"
          />
        )}
      </>,
    );
  }

  return svg(
    <polygon
      points="32,7 52,19 52,43 32,57 12,43 12,19"
      {...common}
    />,
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
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <button
          key={item.type}
          type="button"
          title={`Add ${item.label}`}
          onClick={() => handleAddShape(item.type)}
          className="group flex min-w-0 flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-1.5 py-3.5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-[0_8px_20px_rgba(37,99,235,0.09)] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 active:scale-[0.98]"
        >
          <span className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-50/80 text-slate-600 transition-colors duration-200 group-hover:bg-white group-hover:text-blue-600">
            <ShapePreview type={item.type} />
          </span>

          <span className="w-full break-words px-0.5 text-[10px] font-semibold leading-4 text-slate-600 transition-colors group-hover:text-blue-700">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );

  const renderCategoryList = (items: ShapeCategory[]) => (
    <div className="space-y-3">
      {items.map((category) => (
        <button
          key={category.title}
          type="button"
          onClick={() => handleOpenCategory(category)}
          className="group flex w-full items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/60 hover:shadow-[0_8px_20px_rgba(37,99,235,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 text-slate-600 transition-all duration-200 group-hover:border-blue-100 group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-700">
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800 selection:bg-blue-100">
      <div className="border-b border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/80 p-4">
        <div className="flex items-center gap-2.5">
          {view !== "root" && (
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 active:scale-95"
            >
              <ArrowLeft size={17} />
            </button>
          )}

          <div className="min-w-0">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
              Design workspace
            </p>

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
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100/80"
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

              <span className="ml-auto rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
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