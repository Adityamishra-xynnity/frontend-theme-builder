import { useMemo } from "react";
import { elementDragProps } from "../../../utils/elementDrag";
import type { GraphicAsset } from "../../../types/graphics";

interface GraphicCardProps {
  graphic: GraphicAsset;
  onClick?: (graphic: GraphicAsset) => void | Promise<void>;
  compact?: boolean;
}

/**
 * Canva-style graphic tile: borderless, artwork-first, no caption.
 * - compact: fixed square used inside horizontal carousels
 * - default: fluid square used in 3-column grids
 */
export default function GraphicCard({
  graphic,
  onClick,
  compact = false,
}: GraphicCardProps) {
  const isAnimated = graphic.assetData?.type === "animated";
  const animType = isAnimated
    ? (graphic.assetData?.animationConfig?.type || "pulse")
    : null;

  const imageUrl = (graphic.assetData as any)?.imageUrl;

  // Safe data URI representation of the SVG string
  const svgDataUri = useMemo(() => {
    const rawSvg = graphic.assetData?.svgContent;
    if (!rawSvg || typeof rawSvg !== "string") return null;

    try {
      return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
    } catch {
      return null;
    }
  }, [graphic.assetData?.svgContent]);

  const displaySrc = imageUrl || svgDataUri;

  return (
    <button
      type="button"
      title={graphic.name}
      aria-label={`Select ${graphic.name}`}
      onClick={() => onClick?.(graphic)}
      {...elementDragProps(() => onClick?.(graphic))}
      className={`group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-200 ${compact ? "w-28 shrink-0 p-2" : "w-full p-2.5"
        }`}
    >
      {/* PREVIEW CONTAINER */}
      <div
        className={`relative flex w-full items-center justify-center rounded-xl bg-slate-50/70 transition-colors group-hover:bg-blue-50/40 ${compact ? "h-24" : "aspect-square"
          }`}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={graphic.name}
            loading="lazy"
            className={`pointer-events-none max-h-full max-w-full select-none object-contain p-2 transition-transform duration-300 ${animType ? `anim-preview-${animType}` : "group-hover:scale-105"
              }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Preview
          </div>
        )}
      </div>

      {/* ASSET TITLE */}
      <div className="mt-1.5 w-full text-center">
        <p className="truncate text-xs font-medium text-slate-700 transition-colors group-hover:text-blue-700">
          {graphic.name}
        </p>
      </div>
    </button>
  );
}
