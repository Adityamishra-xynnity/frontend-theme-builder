import { useRef, type ReactNode } from "react";
import { ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import type { GraphicAsset } from "../../../types/graphics";
import GraphicCard from "./GraphicCard";

interface CategoryRailProps {
  title: string;
  icon?: ReactNode;
  count?: number;
  graphics: GraphicAsset[];
  loading?: boolean;
  error?: string | null;
  onSeeAll?: () => void;
  onSelectGraphic?: (graphic: GraphicAsset) => void;
  onRetry?: () => void;
}

export default function CategoryRail({
  title,
  icon,
  count,
  graphics,
  loading = false,
  error = null,
  onSeeAll,
  onSelectGraphic,
  onRetry,
}: CategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-2">
      {/* RAIL HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              {icon}
            </span>
          )}
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {typeof count === "number" && count > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {count}
            </span>
          )}
        </div>

        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="group flex items-center gap-0.5 text-xs font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            <span>See All</span>
            <ChevronRight
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        )}
      </div>

      {/* RAIL CONTAINER WITH SCROLL CONTROLS */}
      <div className="group/rail relative">
        {/* LEFT SCROLL BUTTON */}
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          className="absolute -left-1.5 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 p-1.5 text-slate-600 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-blue-600 active:scale-95 group-hover/rail:flex"
        >
          <ChevronLeft size={16} />
        </button>

        {/* SCROLLABLE RAIL */}
        <div
          ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
        >
          {loading ? (
            // SKELETON LOADERS
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-32 w-28 shrink-0 animate-pulse flex-col items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-2"
              >
                <div className="h-24 w-full rounded-xl bg-slate-200/70" />
                <div className="mt-2 h-2.5 w-16 rounded bg-slate-200/70" />
              </div>
            ))
          ) : error ? (
            // ERROR STATE
            <div className="flex w-full items-center justify-between rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs text-red-600">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>Failed to load graphics</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-semibold text-blue-600 hover:text-blue-700"
                >
                  Retry
                </button>
              )}
            </div>
          ) : graphics.length > 0 ? (
            // REAL GRAPHIC CARDS
            graphics.map((graphic) => (
              <GraphicCard
                key={graphic.id || graphic.assetKey}
                graphic={graphic}
                compact
                onClick={onSelectGraphic}
              />
            ))
          ) : (
            <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
              No graphics available
            </div>
          )}
        </div>

        {/* RIGHT SCROLL BUTTON */}
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          className="absolute -right-1.5 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 p-1.5 text-slate-600 shadow-md backdrop-blur-xs transition-all hover:bg-white hover:text-blue-600 active:scale-95 group-hover/rail:flex"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}
