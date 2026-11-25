import { useRef, type ReactNode } from "react";
import { ChevronRight, AlertCircle } from "lucide-react";
import type { GraphicAsset } from "../../../types/graphics";
import GraphicCard from "./GraphicCard";

interface CategoryRailProps {
  title: string;
  /** Kept for API compatibility; Canva rows show no icon next to the title. */
  icon?: ReactNode;
  /** Kept for API compatibility; Canva rows show no item count. */
  count?: number;
  graphics: GraphicAsset[];
  loading?: boolean;
  error?: string | null;
  onSeeAll?: () => void;
  onSelectGraphic?: (graphic: GraphicAsset) => void | Promise<void>;
  onRetry?: () => void;
}

/**
 * Canva-style row: bold title + "See all" on one line, then a horizontally
 * scrolling strip of tiles with a round chevron button pinned to the right edge.
 */
export default function CategoryRail({
  title,
  graphics,
  loading = false,
  error = null,
  onSeeAll,
  onSelectGraphic,
  onRetry,
}: CategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollNext = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <section>
      {/* ROW HEADER */}
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[15px] font-bold leading-5 text-[#0e1318]">
          {title}
        </h3>

        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-[13px] font-semibold text-[#0e1318] hover:underline"
          >
            See all
          </button>
        )}
      </div>

      {/* TILE STRIP */}
      <div className="group/rail relative">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-[88px] w-[88px] shrink-0 animate-pulse rounded-lg bg-[#f1f3f4]"
              />
            ))
          ) : error ? (
            <div className="flex w-full items-center justify-between rounded-lg bg-red-50 p-3 text-xs text-red-600">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} />
                <span>Failed to load graphics</span>
              </div>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="font-semibold text-[#0e1318] hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          ) : graphics.length > 0 ? (
            graphics.map((graphic) => (
              <GraphicCard
                key={graphic.id || graphic.assetKey}
                graphic={graphic}
                compact
                onClick={onSelectGraphic}
              />
            ))
          ) : (
            <div className="flex h-[88px] w-full items-center justify-center rounded-lg bg-[#f1f3f4] text-xs text-slate-400">
              No graphics available
            </div>
          )}
        </div>

        {/* Right-edge fade + round chevron, like Canva's carousels */}
        {!loading && !error && graphics.length > 3 && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent" />
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Scroll right"
              className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0e1318] shadow-[0_1px_4px_rgba(0,0,0,0.25)] transition-transform hover:scale-105"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
