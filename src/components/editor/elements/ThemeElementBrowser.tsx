import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  getThemeElementCategories,
  getThemeElementPage,
} from "../../../api/themeElementsApi";
import type {
  StructuredChildElement,
  ThemeElementAsset,
  ThemeElementCategory,
  ThemeElementKind,
} from "../../../types/themeElements";

interface ThemeElementBrowserProps {
  kind: ThemeElementKind;
  onBack: () => void;
  onSelectElement: (asset: ThemeElementAsset) => void | Promise<void>;
  embedded?: boolean;
}

const KIND_META: Record<
  ThemeElementKind,
  {
    title: string;
    searchPlaceholder: string;
    pageSize: number;
  }
> = {
  icons: {
    title: "Icons",
    searchPlaceholder: "Search icons",
    pageSize: 32,
  },
  bricks: {
    title: "Bricks",
    searchPlaceholder: "Search bricks",
    pageSize: 24,
  },
  columns: {
    title: "Columns",
    searchPlaceholder: "Search columns",
    pageSize: 24,
  },
};

export function StructuredLayoutPreview({
  asset,
  compact = false,
}: {
  asset: ThemeElementAsset;
  compact?: boolean;
}) {
  const width = Number(asset.assetData?.width) || 400;
  const height = Number(asset.assetData?.height) || 180;
  const children: StructuredChildElement[] = Array.isArray(
    asset.assetData?.elements
  )
    ? asset.assetData.elements
    : [];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {children.map((child, idx) => {
        if (child.kind === "rect") {
          return (
            <rect
              key={idx}
              x={child.x}
              y={child.y}
              width={child.width ?? 100}
              height={child.height ?? 60}
              rx={child.rx ?? 0}
              ry={child.rx ?? 0}
              fill={child.fill ?? "#FFFFFF"}
              stroke={child.stroke ?? (compact ? "#475569" : "#CBD5E1")}
              strokeWidth={compact ? Math.max(4, (child.strokeWidth ?? 1.5) * 2.5) : (child.strokeWidth ?? 1)}
            />
          );
        }
        if (child.kind === "circle") {
          const r = child.radius ?? 24;
          return (
            <circle
              key={idx}
              cx={child.x + r}
              cy={child.y + r}
              r={r}
              fill={child.fill ?? "#EEF2FF"}
              stroke={child.stroke}
              strokeWidth={child.strokeWidth ?? 0}
            />
          );
        }
        if (child.kind === "text") {
          const fontSize = Math.max(12, child.fontSize ?? 14);
          if (compact) {
            const barWidth = Math.min(child.width ?? 120, Math.max(48, (child.width ?? 120) * 0.72));
            const barHeight = Math.max(6, Math.round(fontSize * 0.55));
            return (
              <rect
                key={idx}
                x={child.x}
                y={child.y + 2}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={child.fill ?? "#64748B"}
                opacity={child.fontWeight === "bold" ? 0.55 : 0.25}
              />
            );
          }
          const anchor =
            child.textAlign === "center"
              ? "middle"
              : child.textAlign === "right"
                ? "end"
                : "start";
          const textX =
            child.textAlign === "center"
              ? child.x + (child.width ?? 100) / 2
              : child.textAlign === "right"
                ? child.x + (child.width ?? 100)
                : child.x;
          const rawText = child.text ?? "";
          const displayText =
            rawText.length > 30 ? `${rawText.slice(0, 28)}...` : rawText;

          return (
            <text
              key={idx}
              x={textX}
              y={child.y + fontSize}
              fill={child.fill ?? "#0F172A"}
              fontSize={fontSize}
              fontWeight={child.fontWeight === "bold" ? 700 : 400}
              fontFamily={child.fontFamily ?? "Inter, sans-serif"}
              textAnchor={anchor}
            >
              {displayText}
            </text>
          );
        }
        if (child.kind === "svg") {
          const sz = child.size ?? 36;
          return (
            <rect
              key={idx}
              x={child.x}
              y={child.y}
              width={sz}
              height={sz}
              rx={6}
              fill="rgba(99, 102, 241, 0.16)"
              stroke="#6366F1"
              strokeWidth={1.5}
            />
          );
        }
        return null;
      })}
    </svg>
  );
}

function ColumnRailSection({
  title,
  items,
  insertingKey,
  onSeeAll,
  onSelect,
}: {
  title: string;
  items: ThemeElementAsset[];
  insertingKey: string | null;
  onSeeAll: () => void;
  onSelect: (asset: ThemeElementAsset) => void;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const scrollRight = () => {
    railRef.current?.scrollBy({ left: 180, behavior: "smooth" });
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-[13px] font-semibold text-slate-800">{title}</h3>
        <button
          type="button"
          onClick={onSeeAll}
          className="text-[11px] font-medium text-slate-500 transition hover:text-slate-900"
        >
          See all
        </button>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          className="flex gap-2 overflow-x-auto pb-1 pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((item) => {
            const isInserting = insertingKey === item.assetKey;
            return (
              <button
                key={item.assetKey}
                type="button"
                title={item.name}
                aria-label={`Insert ${item.name}`}
                disabled={isInserting}
                onClick={() => onSelect(item)}
                className="group relative flex h-[74px] w-[106px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-[#F4F5F7] p-2 transition-all duration-150 hover:border-violet-400 hover:bg-white hover:shadow-sm active:scale-[0.98] disabled:opacity-60"
              >
                <StructuredLayoutPreview asset={item} compact />
                {isInserting && (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/75">
                    <Loader2 size={16} className="animate-spin text-violet-600" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {items.length > 2 && (
          <button
            type="button"
            onClick={scrollRight}
            aria-label={`Scroll ${title} right`}
            className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:bg-white hover:text-slate-900"
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </section>
  );
}

export default function ThemeElementBrowser({
  kind,
  onBack,
  onSelectElement,
  embedded = false,
}: ThemeElementBrowserProps) {
  const meta = KIND_META[kind];

  const [categories, setCategories] = useState<ThemeElementCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [items, setItems] = useState<ThemeElementAsset[]>([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insertingKey, setInsertingKey] = useState<string | null>(null);
  const [lastSelectedKey, setLastSelectedKey] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset state immediately when switching kind
  useEffect(() => {
    setSelectedCategory("all");
    setSearch("");
    setDebouncedSearch("");
    setItems([]);
    setCategories([]);
    setPage(0);
    setTotalElements(0);
    setHasMore(false);
    setError(null);
    setLastSelectedKey(null);
  }, [kind]);

  // Load categories
  useEffect(() => {
    const controller = new AbortController();
    getThemeElementCategories(kind, controller.signal)
      .then((cats) => {
        if (!controller.signal.aborted) {
          setCategories(cats);
        }
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          console.error(`Failed to load ${kind} categories:`, err);
        }
      });
    return () => controller.abort();
  }, [kind]);

  // Load paginated items
  const fetchPage = useCallback(
    async (targetPage: number, append: boolean, signal?: AbortSignal) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await getThemeElementPage(
          kind,
          {
            category: selectedCategory !== "all" ? selectedCategory : undefined,
            search: debouncedSearch || undefined,
            page: targetPage,
            size: meta.pageSize,
          },
          signal
        );

        if (signal?.aborted) return;

        setItems((prev) => (append ? [...prev, ...res.content] : res.content));
        setPage(res.number);
        setTotalElements(res.totalElements);
        setHasMore(!res.last);
      } catch (err) {
        if ((err as Error).name === "AbortError" || signal?.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : `Unable to load ${meta.title.toLowerCase()}.`
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [kind, selectedCategory, debouncedSearch, meta.pageSize, meta.title]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPage(0, false, controller.signal);
    return () => controller.abort();
  }, [fetchPage]);

  const handleInsert = async (asset: ThemeElementAsset) => {
    try {
      setInsertingKey(asset.assetKey);
      setLastSelectedKey(asset.assetKey);
      await onSelectElement(asset);
    } finally {
      setInsertingKey(null);
    }
  };

  // Group columns by subcategory for the Canva-style horizontal rail overview
  const groupedColumns = useMemo(() => {
    if (kind !== "columns") return [];
    const map = new Map<string, { id: string; name: string; items: ThemeElementAsset[] }>();
    for (const item of items) {
      const name = item.category || "Columns";
      const id = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const existing = map.get(id);
      if (existing) {
        existing.items.push(item);
      } else {
        map.set(id, { id, name, items: [item] });
      }
    }
    return Array.from(map.values());
  }, [kind, items]);

  const showGroupedColumnRails =
    kind === "columns" &&
    selectedCategory === "all" &&
    !debouncedSearch &&
    groupedColumns.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      {/* Canva-style Header */}
      <div className={`shrink-0 bg-white ${embedded ? "px-3.5 pt-2.5 pb-2" : "px-4 pt-3.5 pb-2.5"} border-b border-slate-100`}>
        {!embedded && (
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Elements"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">
              {meta.title}
            </h2>
            {totalElements > 0 && (
              <span className="ml-auto text-[11px] font-medium text-slate-400">
                {totalElements}
              </span>
            )}
          </div>
        )}

        {/* Canva-style Search Field */}
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={meta.searchPlaceholder}
            aria-label={meta.searchPlaceholder}
            className="h-9 w-full rounded-xl border border-slate-200/90 bg-slate-100/80 pl-9 pr-8 text-[13px] text-slate-800 placeholder:text-slate-400 transition focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Subcategory Pills */}
        {categories.length > 0 && (
          <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
                selectedCategory === "all"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
              }`}
            >
              All
            </button>
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3.5 py-3">
        {loading ? (
          kind === "icons" ? (
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-square animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-24 animate-pulse rounded-xl bg-slate-100"
                />
              ))}
            </div>
          )
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
            <AlertCircle size={22} className="text-red-500" />
            <p className="text-xs font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchPage(0, false)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <p className="text-xs font-semibold text-slate-700">
              No {meta.title.toLowerCase()} found
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Try a different keyword or clear your filters.
            </p>
            {(search || selectedCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-xs ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : kind === "icons" ? (
          <div className="grid grid-cols-4 gap-2">
            {items.map((item) => {
              const isInserting = insertingKey === item.assetKey;
              const isSelected = lastSelectedKey === item.assetKey;
              return (
                <button
                  key={item.assetKey}
                  type="button"
                  title={`${item.name} • ${item.category}`}
                  aria-label={`Insert ${item.name} icon`}
                  disabled={isInserting}
                  onClick={() => handleInsert(item)}
                  className={`group relative flex aspect-square items-center justify-center rounded-xl bg-[#F4F5F7] p-3 transition-all duration-150 hover:bg-slate-200/70 hover:ring-2 hover:ring-violet-400/70 active:scale-95 disabled:opacity-60 ${
                    isSelected ? "ring-2 ring-violet-500 bg-violet-50/50" : ""
                  }`}
                >
                  {item.assetData?.svgContent ? (
                    <div
                      className="flex h-8 w-8 items-center justify-center transition-transform duration-150 group-hover:scale-110 [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{
                        __html: item.assetData.svgContent,
                      }}
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">Icon</span>
                  )}
                  {isInserting && (
                    <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/75">
                      <Loader2 size={15} className="animate-spin text-violet-600" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : showGroupedColumnRails ? (
          <div className="space-y-4">
            {groupedColumns.map((group) => (
              <ColumnRailSection
                key={group.id}
                title={group.name}
                items={group.items}
                insertingKey={insertingKey}
                onSeeAll={() => setSelectedCategory(group.id)}
                onSelect={handleInsert}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((item) => {
              const isInserting = insertingKey === item.assetKey;
              const isSelected = lastSelectedKey === item.assetKey;
              return (
                <button
                  key={item.assetKey}
                  type="button"
                  title={`${item.name} • ${item.category}`}
                  aria-label={`Insert ${item.name}`}
                  disabled={isInserting}
                  onClick={() => handleInsert(item)}
                  className={`group relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200/70 bg-[#F4F5F7] p-2 transition-all duration-150 hover:border-violet-400 hover:bg-white hover:shadow-sm active:scale-[0.98] disabled:opacity-60 ${
                    isSelected ? "ring-2 ring-violet-500 bg-white" : ""
                  }`}
                >
                  <StructuredLayoutPreview asset={item} compact />
                  {isInserting && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/75">
                      <Loader2 size={16} className="animate-spin text-violet-600" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-4 flex justify-center pb-2">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => fetchPage(page + 1, true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={12} className="animate-spin" />}
              {loadingMore ? "Loading..." : `Load more (${totalElements - items.length} left)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
