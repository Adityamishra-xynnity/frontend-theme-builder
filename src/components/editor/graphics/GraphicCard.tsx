import { useMemo } from "react";
import { elementDragProps } from "../../../utils/elementDrag";
import type { GraphicAsset } from "../../../types/graphics";
import { Sparkles } from "lucide-react";

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
  const isAnimated =
    graphic.assetData?.type === "animated" ||
    Boolean(graphic.assetData?.animationConfig);

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

  return (
    <button
      type="button"
      title={`${graphic.name}${isAnimated ? " (Animated)" : ""}`}
      aria-label={`Add ${graphic.name}`}
      onClick={() => onClick?.(graphic)}
      {...elementDragProps(() => onClick?.(graphic))}
      className={`group relative flex items-center justify-center overflow-hidden rounded-lg bg-[#f1f3f4] transition-colors duration-150 hover:bg-[#e8eaed] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b3dff] ${
        compact ? "h-[88px] w-[88px] shrink-0" : "aspect-square w-full"
      }`}
    >
      {svgDataUri ? (
        <img
          src={svgDataUri}
          alt={graphic.name}
          loading="lazy"
          draggable={false}
          className="pointer-events-none max-h-full max-w-full select-none object-contain p-2 transition-transform duration-200 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-[#e8eaed]" />
      )}

      {/* Subtle animated marker (Canva-like pill, bottom-left) */}
      {isAnimated && (
        <span className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white">
          <Sparkles size={10} />
        </span>
      )}
    </button>
  );
}
