import { useMemo } from "react";
import type { EmojiAsset } from "../../../types/emoji";

interface EmojiCardProps {
  emoji: EmojiAsset;
  onClick?: (emoji: EmojiAsset) => void;
  compact?: boolean;
}

export default function EmojiCard({
  emoji,
  onClick,
  compact = false,
}: EmojiCardProps) {
  // Convert SVG content to a safe data URI for clean rendering inside <img>
  const svgDataUri = useMemo(() => {
    const rawSvg = emoji.assetData?.svgContent;
    if (!rawSvg || typeof rawSvg !== "string") return null;

    try {
      return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
    } catch {
      return null;
    }
  }, [emoji.assetData?.svgContent]);

  const unicodeFallback = emoji.assetData?.unicode || "😀";

  return (
    <button
      type="button"
      title={emoji.name}
      aria-label={`Insert emoji: ${emoji.name}`}
      onClick={() => onClick?.(emoji)}
      className={`group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
        compact ? "w-24 shrink-0 p-2" : "w-full p-2"
      }`}
    >
      {/* PREVIEW CONTAINER */}
      <div
        className={`relative flex w-full items-center justify-center rounded-xl bg-slate-50/70 p-2 transition-colors group-hover:bg-blue-50/40 ${
          compact ? "h-20" : "aspect-square"
        }`}
      >
        {svgDataUri ? (
          <img
            src={svgDataUri}
            alt={emoji.name}
            loading="lazy"
            className="pointer-events-none max-h-full max-w-full select-none object-contain transition-transform duration-200 group-hover:scale-110"
          />
        ) : (
          <span className="select-none text-3xl transition-transform duration-200 group-hover:scale-110">
            {unicodeFallback}
          </span>
        )}
      </div>

      {/* EMOJI NAME */}
      <div className="mt-1.5 w-full text-center">
        <p className="truncate text-[11px] font-medium text-slate-700 transition-colors group-hover:text-blue-700">
          {emoji.name}
        </p>
      </div>
    </button>
  );
}
