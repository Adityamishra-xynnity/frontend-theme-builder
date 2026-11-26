import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
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
import type { EmailNode, EmailSectionTemplate } from "../types/campaign";

interface EmailIconBlocksBrowserProps {
  onSelectBlock: (template: EmailSectionTemplate) => void;
}

interface BlockPresetStyle {
  key: string;
  label: string;
  columns: 3 | 4;
  withLabels: boolean;
  backgroundColor: string;
  textColor: string;
  pillBorder?: string;
  iconTint?: string;
  height: number;
}

const BLOCK_STYLES: BlockPresetStyle[] = [
  {
    key: "pill-outline",
    label: "Pill Outline Strip",
    columns: 4,
    withLabels: false,
    backgroundColor: "#FFFFFF",
    textColor: "#475569",
    pillBorder: "1.5px solid #CBD5E1",
    height: 84,
  },
  {
    key: "warm-sand",
    label: "Warm Sand Strip",
    columns: 4,
    withLabels: false,
    backgroundColor: "#EFE8DE",
    textColor: "#334155",
    height: 84,
  },
  {
    key: "clean-white",
    label: "Clean Icon Strip",
    columns: 4,
    withLabels: false,
    backgroundColor: "#FFFFFF",
    textColor: "#0F172A",
    height: 84,
  },
  {
    key: "vibrant-orange",
    label: "Orange Feature Bar",
    columns: 4,
    withLabels: true,
    backgroundColor: "#EA580C",
    textColor: "#FFFFFF",
    iconTint: "#FFFFFF",
    height: 112,
  },
  {
    key: "feature-white",
    label: "Feature Trust Strip",
    columns: 3,
    withLabels: true,
    backgroundColor: "#FFFFFF",
    textColor: "#14532D",
    height: 128,
  },
  {
    key: "emerald-trust",
    label: "Emerald Feature Bar",
    columns: 3,
    withLabels: true,
    backgroundColor: "#059669",
    textColor: "#FFFFFF",
    iconTint: "#FFFFFF",
    height: 128,
  },
  {
    key: "taupe-feature",
    label: "Taupe Feature Bar",
    columns: 3,
    withLabels: true,
    backgroundColor: "#9A9086",
    textColor: "#FFFFFF",
    iconTint: "#FFFFFF",
    height: 128,
  },
  {
    key: "slate-feature",
    label: "Slate Feature Bar",
    columns: 3,
    withLabels: true,
    backgroundColor: "#D1D5DB",
    textColor: "#1E293B",
    height: 128,
  },
];

function recolorSvgForSurface(svg: string, tint?: string): string {
  if (!tint) return svg;
  return svg
    .replace(/stroke="#[0-9a-fA-F]{3,8}"/g, `stroke="${tint}"`)
    .replace(/fill="#[0-9a-fA-F]{3,8}"/g, `fill="${tint}"`);
}

function buildIconBlockTemplate(
  icons: ThemeElementAsset[],
  style: BlockPresetStyle,
  blockIndex: number
): EmailSectionTemplate {
  const count = style.columns;
  const slice = icons.slice(0, count);
  const nodes: EmailNode[] = [];

  if (style.pillBorder) {
    nodes.push({
      id: crypto.randomUUID(),
      type: "container",
      content: "",
      x: 32,
      y: 16,
      width: 536,
      height: style.height - 32,
      backgroundColor: "transparent",
      borderColor: "#CBD5E1",
      borderWidth: 1.5,
      borderRadius: 999,
    });
  }

  const areaLeft = 48;
  const areaWidth = 504;
  const colWidth = Math.floor(areaWidth / count);
  const iconSize = style.withLabels ? 36 : 30;
  const iconY = style.withLabels ? 18 : Math.round((style.height - iconSize) / 2);

  slice.forEach((icon, idx) => {
    const colCenterX = areaLeft + idx * colWidth + Math.floor(colWidth / 2);
    const rawSvg = icon.assetData?.svgContent || "";
    const tintedSvg = recolorSvgForSurface(rawSvg, style.iconTint);
    const svgUri = tintedSvg
      ? `data:image/svg+xml;utf8,${encodeURIComponent(tintedSvg)}`
      : "";

    if (svgUri) {
      nodes.push({
        id: crypto.randomUUID(),
        type: "image",
        content: svgUri,
        x: Math.round(colCenterX - iconSize / 2),
        y: iconY,
        width: iconSize,
        height: iconSize,
      });
    }

    if (style.withLabels) {
      nodes.push({
        id: crypto.randomUUID(),
        type: "text",
        content: icon.name,
        x: areaLeft + idx * colWidth + 6,
        y: iconY + iconSize + 10,
        width: colWidth - 12,
        height: 32,
        fontSize: 12,
        fontFamily: "Arial",
        fontWeight: "bold",
        color: style.textColor,
        textAlign: "center",
      });
    }
  });

  const categoryLabel = slice[0]?.category || "Icon Blocks";
  return {
    id: `icon-block-${style.key}-${blockIndex}-${slice.map((i) => i.assetKey).join("-")}`,
    category: "icons",
    name: `${categoryLabel} — ${style.label}`,
    backgroundColor: style.backgroundColor,
    padding: "12px",
    height: style.height,
    nodes,
  };
}

function IconBlockMiniaturePreview({
  template,
}: {
  template: EmailSectionTemplate;
}) {
  const height = template.height || 100;
  const scale = 0.49;

  return (
    <div
      className="relative w-full overflow-hidden rounded-lg shadow-2xs select-none"
      style={{
        height: `${Math.round(height * scale)}px`,
        backgroundColor: template.backgroundColor || "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "600px",
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          backgroundColor: template.backgroundColor || "#FFFFFF",
        }}
      >
        {template.nodes.map((node, index) => {
          const left = node.x ?? 24;
          const top = node.y ?? 16;
          const width = node.width ?? 40;
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
                  backgroundColor: node.backgroundColor || "transparent",
                  border: node.borderColor
                    ? `${node.borderWidth ?? 1.5}px solid ${node.borderColor}`
                    : undefined,
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : undefined,
                }}
              />
            );
          }

          if (node.type === "image") {
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
                {node.content ? (
                  <img
                    src={node.content}
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
                fontSize: `${node.fontSize || 12}px`,
                fontFamily: node.fontFamily || "Arial",
                fontWeight: node.fontWeight || "bold",
                color: node.color || "#0F172A",
                textAlign: node.textAlign || "center",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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

export default function EmailIconBlocksBrowser({
  onSelectBlock,
}: EmailIconBlocksBrowserProps) {
  const [categories, setCategories] = useState<ThemeElementCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [icons, setIcons] = useState<ThemeElementAsset[]>([]);
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
    getThemeElementCategories("icons", controller.signal)
      .then((cats) => {
        if (!controller.signal.aborted) {
          setCategories(cats);
        }
      })
      .catch((err) => {
        if ((err as Error).name !== "AbortError") {
          console.error("Failed to load icon categories:", err);
        }
      });
    return () => controller.abort();
  }, []);

  const fetchIcons = useCallback(
    async (targetPage: number, append: boolean, signal?: AbortSignal) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const res = await getThemeElementPage(
          "icons",
          {
            category: selectedCategory !== "all" ? selectedCategory : undefined,
            search: debouncedSearch || undefined,
            page: targetPage,
            size: 32,
          },
          signal
        );

        if (signal?.aborted) return;

        setIcons((prev) => (append ? [...prev, ...res.content] : res.content));
        setPage(res.number);
        setHasMore(!res.last);
      } catch (err) {
        if ((err as Error).name === "AbortError" || signal?.aborted) return;
        setError(
          err instanceof Error ? err.message : "Unable to load icon blocks."
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
    fetchIcons(0, false, controller.signal);
    return () => controller.abort();
  }, [fetchIcons]);

  // Compose Canva-style Icon Blocks dynamically from database icons
  const iconBlocks = useMemo(() => {
    if (icons.length === 0) return [];
    const blocks: EmailSectionTemplate[] = [];
    let cursor = 0;
    let styleIdx = 0;

    while (cursor < icons.length) {
      const style = BLOCK_STYLES[styleIdx % BLOCK_STYLES.length];
      const chunk = icons.slice(cursor, cursor + style.columns);
      // Pad with earlier icons only if the trailing chunk has fewer than 3 icons
      // so every block looks balanced while still using real database icons.
      const filledChunk =
        chunk.length < style.columns && icons.length >= style.columns
          ? [
              ...chunk,
              ...icons.slice(0, style.columns - chunk.length),
            ]
          : chunk;

      if (filledChunk.length > 0) {
        blocks.push(buildIconBlockTemplate(filledChunk, style, styleIdx));
      }
      cursor += style.columns;
      styleIdx++;
    }
    return blocks;
  }, [icons]);

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
              placeholder="Search icon blocks"
              aria-label="Search icon blocks"
              className="h-8 w-full rounded-lg border border-transparent bg-[#F4F5F7] pl-8 pr-7 text-[12px] text-slate-800 placeholder:text-slate-400 transition focus:border-violet-400 focus:bg-white focus:outline-none"
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
                aria-label="Filter Icon Blocks by category"
                className="h-8 max-w-[104px] cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white pl-6 pr-2 text-[11px] font-medium text-slate-700 transition hover:bg-slate-50 focus:border-violet-400 focus:outline-none"
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

      {/* Canva-style 1-column stack of #F4F5F7 Icon Block cards */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-white px-3.5 py-2.5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[78px] w-full animate-pulse rounded-xl bg-[#F4F5F7]"
              />
            ))}
          </div>
        ) : error && iconBlocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/40 p-6 text-center">
            <AlertCircle size={22} className="text-red-500" />
            <p className="text-xs font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchIcons(0, false)}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          </div>
        ) : iconBlocks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
            <p className="text-xs font-semibold text-slate-700">
              No icon blocks found
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
        ) : (
          <div className="flex flex-col gap-3">
            {iconBlocks.map((block) => (
              <button
                key={block.id}
                type="button"
                title={block.name}
                aria-label={`Insert ${block.name}`}
                onClick={() => onSelectBlock(block)}
                className="group w-full rounded-xl bg-[#F4F5F7] p-3 text-left transition-all duration-150 hover:bg-slate-200/70 hover:ring-2 hover:ring-violet-400/70 active:scale-[0.99]"
              >
                <IconBlockMiniaturePreview template={block} />
              </button>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="mt-4 flex justify-center pb-2">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => fetchIcons(page + 1, true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loadingMore && <Loader2 size={12} className="animate-spin" />}
              {loadingMore ? "Loading..." : "Load more icon blocks"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
