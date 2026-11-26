import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  getThemeElementCategories,
  getThemeElementPage,
} from "../../api/themeElementsApi";
import type {
  ThemeElementAsset,
  ThemeElementCategory,
} from "../../types/themeElements";
import type { EmailSectionTemplate } from "../types/campaign";
import { buildEmailStructuredTemplate } from "../utils/emailStructuredBlocks";

interface EmailStructuredBlocksBrowserProps {
  kind: "bricks" | "columns";
  onSelectBlock: (template: EmailSectionTemplate) => void;
}

function StructuredTemplateMiniaturePreview({
  template,
}: {
  template: EmailSectionTemplate;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.45);
  const height = template.height || 180;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      if (el.clientWidth > 0) {
        setScale(el.clientWidth / 600);
      }
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg bg-white shadow-2xs select-none"
      style={{
        height: `${Math.max(48, Math.round(height * scale))}px`,
      }}
    >
      <div
        style={{
          width: "600px",
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          backgroundColor: "#FFFFFF",
        }}
      >
        {template.nodes.map((node, index) => {
          const left = node.x ?? 16;
          const top = node.y ?? 16;
          const width = node.width ?? 200;
          const nodeHeight = node.height ?? 40;

          if (node.type === "container") {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${nodeHeight}px`,
                  background:
                    node.gradient || node.backgroundColor || "#FFFFFF",
                  border:
                    node.borderWidth && node.borderColor
                      ? `${node.borderWidth}px solid ${node.borderColor}`
                      : undefined,
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : node.borderRadius || undefined,
                }}
              />
            );
          }

          if (node.type === "image") {
            const src = node.content || node.url || "";
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${nodeHeight}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : null}
              </div>
            );
          }

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${nodeHeight}px`,
                fontSize: `${node.fontSize || 14}px`,
                fontFamily: node.fontFamily || "Inter, Arial, sans-serif",
                fontWeight:
                  node.type === "heading" || node.fontWeight === "bold"
                    ? "bold"
                    : "normal",
                color: node.color || "#0F172A",
                textAlign: node.textAlign || "left",
                lineHeight: node.lineHeight ?? 1.35,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflow: "hidden",
              }}
            >
              {node.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function EmailStructuredBlocksBrowser({
  kind,
  onSelectBlock,
}: EmailStructuredBlocksBrowserProps) {
  const [categories, setCategories] = useState<ThemeElementCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [assets, setAssets] = useState<ThemeElementAsset[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = kind === "columns" ? "columns" : "bricks";

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setSelectedCategory("all");
    setSearch("");
    setDebouncedSearch("");
    setAssets([]);
    setCategories([]);
    setPage(0);
    setHasMore(false);
    setError(null);
  }, [kind]);

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

  const fetchItems = useCallback(
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
            size: 20,
          },
          signal
        );

        if (signal?.aborted) return;

        setAssets((prev) => (append ? [...prev, ...res.content] : res.content));
        setPage(res.number);
        setHasMore(!res.last);
      } catch (err) {
        if ((err as Error).name === "AbortError" || signal?.aborted) return;
        setError(
          err instanceof Error ? err.message : `Unable to load ${label}.`
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [kind, selectedCategory, debouncedSearch, label]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchItems(0, false, controller.signal);
    return () => controller.abort();
  }, [fetchItems]);

  const renderedItems = useMemo(
    () =>
      assets.map((asset) => ({
        asset,
        template: buildEmailStructuredTemplate(asset),
      })),
    [assets]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white text-slate-800">
      {/* Compact Search + Category Filter */}
      <div className="shrink-0 bg-white px-3.5 pt-2 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label}`}
              aria-label={`Search ${label}`}
              className="h-8 w-full rounded-lg border border-transparent bg-[#F4F5F7] pl-8 pr-7 text-[12px] text-slate-800 placeholder:text-slate-400 transition focus:border-slate-300 focus:bg-white focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-700"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="relative shrink-0">
              <SlidersHorizontal
                size={12}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label={`Filter ${label} by category`}
                className="h-8 max-w-[104px] cursor-pointer appearance-none rounded-lg border border-slate-200/90 bg-white pl-6 pr-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 focus:border-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Preview Cards */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3.5 py-2">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[104px] w-full animate-pulse rounded-xl bg-[#F4F5F7]"
              />
            ))}
          </div>
        ) : error && renderedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
            <AlertCircle size={22} className="text-red-500" />
            <p className="text-xs font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchItems(0, false)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        ) : renderedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <p className="text-xs font-semibold text-slate-700">
              No {label} found
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
                className="mt-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-xs ring-1 ring-slate-200 transition hover:bg-slate-50"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {renderedItems.map(({ asset, template }) => (
              <button
                key={asset.assetKey}
                type="button"
                title={`${asset.name} • ${asset.category}`}
                aria-label={`Insert ${asset.name}`}
                onClick={() => onSelectBlock(buildEmailStructuredTemplate(asset))}
                className="group relative w-full rounded-xl border border-transparent bg-[#F4F5F7] p-2.5 text-left transition-colors duration-150 hover:border-slate-300/80 hover:bg-[#ECEEF1] active:scale-[0.995]"
              >
                <StructuredTemplateMiniaturePreview template={template} />
                <div className="mt-1.5 flex items-center justify-between gap-2 px-0.5">
                  <span className="truncate text-[11px] font-medium text-slate-700">
                    {asset.name}
                  </span>
                  <span className="shrink-0 text-[10px] text-slate-400">
                    {asset.category}
                  </span>
                </div>
                <span className="pointer-events-none absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-md bg-white/95 text-slate-700 opacity-0 shadow-xs transition-opacity duration-150 group-hover:opacity-100">
                  <Plus size={13} strokeWidth={2.2} />
                </span>
              </button>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-4 flex justify-center pb-2">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => fetchItems(page + 1, true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={12} className="animate-spin" />}
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
