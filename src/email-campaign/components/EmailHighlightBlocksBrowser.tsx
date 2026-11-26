import { useCallback, useEffect, useRef, useState } from "react";
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
  fetchEmailCampaignHighlightCategories,
  fetchEmailCampaignHighlightsPaginated,
} from "../services/emailCampaignApi";
import type {
  EmailCampaignHighlightTemplateResponse,
  EmailSectionTemplate,
} from "../types/campaign";

interface EmailHighlightBlocksBrowserProps {
  onSelectBlock: (template: EmailSectionTemplate) => void;
}

function HighlightCardMiniaturePreview({
  template,
}: {
  template: EmailSectionTemplate;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.24);
  const cardNode = template.nodes.find((n) => n.type === "container");
  const cardWidth = cardNode?.width ?? 552;
  const cardHeight = cardNode?.height ?? 72;
  const originX = cardNode?.x ?? 24;
  const originY = cardNode?.y ?? 8;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      if (el.clientWidth > 0) {
        setScale(el.clientWidth / cardWidth);
      }
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [cardWidth]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      style={{
        height: `${Math.max(36, Math.round(cardHeight * scale))}px`,
      }}
    >
      <div
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
        }}
      >
        {template.nodes.map((node, index) => {
          const left = (node.x ?? 0) - originX;
          const top = (node.y ?? 0) - originY;
          const width = node.width ?? 40;
          const height = node.height ?? 24;

          if (node.type === "container") {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                  background:
                    node.gradient || node.backgroundColor || "#FFFFFF",
                  border:
                    node.borderWidth && node.borderColor
                      ? `${node.borderWidth}px solid ${node.borderColor}`
                      : undefined,
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : node.borderRadius || "10px",
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
                  height: `${height}px`,
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
                height: `${height}px`,
                fontSize: `${Math.max(22, (node.fontSize || 14) * 1.65)}px`,
                fontFamily: node.fontFamily || "Arial",
                fontWeight:
                  node.type === "heading" || node.fontWeight === "bold"
                    ? "bold"
                    : "normal",
                color: node.color || "#0F172A",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
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

export default function EmailHighlightBlocksBrowser({
  onSelectBlock,
}: EmailHighlightBlocksBrowserProps) {
  const [items, setItems] = useState<EmailCampaignHighlightTemplateResponse[]>(
    []
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchEmailCampaignHighlightCategories(controller.signal)
      .then((cats) => {
        if (!controller.signal.aborted) {
          setCategories(cats);
        }
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to load highlight categories:", err);
        }
      });
    return () => controller.abort();
  }, []);

  const loadHighlights = useCallback(
    async (targetPage: number, append: boolean, signal?: AbortSignal) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await fetchEmailCampaignHighlightsPaginated(
          targetPage,
          20,
          selectedCategory,
          debouncedSearch,
          signal
        );

        if (signal?.aborted) return;

        setItems((prev) => (append ? [...prev, ...res.content] : res.content));
        setPage(res.number);
        setHasMore(!res.last);
      } catch (err) {
        if ((err as Error).name === "AbortError" || signal?.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load highlight blocks."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [selectedCategory, debouncedSearch]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadHighlights(0, false, controller.signal);
    return () => controller.abort();
  }, [loadHighlights]);

  const handleInsert = (record: EmailCampaignHighlightTemplateResponse) => {
    const template: EmailSectionTemplate = {
      ...(record.templateData || {}),
      id: record.templateKey || String(record.id),
      category: "highlight",
      name: record.name,
      backgroundColor: record.templateData?.backgroundColor || "transparent",
      padding: record.templateData?.padding || "8px 24px",
      height: record.templateData?.height || 88,
      nodes: (record.templateData?.nodes || []).map((n) => ({ ...n })),
    };
    onSelectBlock(template);
  };

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
              placeholder="Search highlight blocks"
              aria-label="Search highlight blocks"
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
                aria-label="Filter Highlight Blocks by category"
                className="h-8 max-w-[104px] cursor-pointer appearance-none rounded-lg border border-slate-200/90 bg-white pl-6 pr-2 text-[11px] font-medium capitalize text-slate-700 transition hover:bg-slate-50 focus:border-slate-300 focus:outline-none"
              >
                <option value="all">All</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Canva-style 2-column grid of Highlight Blocks */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3.5 py-2">
        {loading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[64px] animate-pulse rounded-xl bg-[#F4F5F7]"
              />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
            <AlertCircle size={22} className="text-red-500" />
            <p className="text-xs font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => loadHighlights(0, false)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <p className="text-xs font-semibold text-slate-700">
              No highlight blocks found
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
          <div className="grid grid-cols-2 gap-2.5">
            {items.map((item) => (
              <button
                key={item.templateKey}
                type="button"
                title={item.name}
                aria-label={`Insert ${item.name}`}
                onClick={() => handleInsert(item)}
                className="group relative flex items-center justify-center rounded-xl border border-transparent bg-[#F4F5F7] p-2 text-left transition-colors duration-150 hover:border-slate-300/80 hover:bg-[#ECEEF1] active:scale-[0.98]"
              >
                <HighlightCardMiniaturePreview template={item.templateData} />
                <span className="pointer-events-none absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-white/95 text-slate-700 opacity-0 shadow-xs transition-opacity duration-150 group-hover:opacity-100">
                  <Plus size={12} strokeWidth={2.2} />
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
              onClick={() => loadHighlights(page + 1, true)}
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
