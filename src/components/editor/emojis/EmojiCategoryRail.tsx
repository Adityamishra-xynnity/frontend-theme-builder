import { useRef, type ReactNode } from "react";
import { ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import type { EmojiAsset } from "../../../types/emoji";
import EmojiCard from "./EmojiCard";

interface EmojiCategoryRailProps {
  title: string;
  icon?: ReactNode;
  count?: number;
  emojis: EmojiAsset[];
  loading?: boolean;
  error?: string | null;
  onSeeAll?: () => void;
  onSelectEmoji?: (emoji: EmojiAsset) => void;
  onRetry?: () => void;
}

export default function EmojiCategoryRail({
  title,
  icon,
  count,
  emojis,
  loading = false,
  error = null,
  onSeeAll,
  onSelectEmoji,
  onRetry,
}: EmojiCategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
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
                className="flex h-28 w-24 shrink-0 animate-pulse flex-col items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-2"
              >
                <div className="h-20 w-full rounded-xl bg-slate-200/70" />
                <div className="mt-1.5 h-2 w-14 rounded bg-slate-200/70" />
              </div>
            ))
          ) : error ? (
            // INLINE RAIL ERROR
            <div className="flex h-28 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-600">
              <AlertCircle size={16} />
              <span>{error}</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="ml-2 font-semibold underline hover:text-rose-800"
                >
                  Retry
                </button>
              )}
            </div>
          ) : emojis.length === 0 ? (
            // EMPTY RAIL
            <div className="flex h-24 w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-400">
              No emojis in this section
            </div>
          ) : (
            // EMOJI CARDS
            emojis.map((emoji) => (
              <EmojiCard
                key={emoji.id || emoji.assetKey}
                emoji={emoji}
                compact
                onClick={onSelectEmoji}
              />
            ))
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
