import { useEffect, useRef, useState, useMemo } from "react";
import type { EditorElement } from "../../types/editor";

interface CertificatePreviewProps {
  backgroundColor?: string;
  elements?: EditorElement[];
  className?: string;
  showWatermark?: boolean;
}

/**
 * Generate 5-point star SVG points for 900x650 viewport renderer
 */
function getStarPoints(w: number, h: number, points = 5, innerRatio = 0.42): string {
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) / 2;
  const innerR = outerR * innerRatio;
  const pts: string[] = [];

  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return pts.join(" ");
}

/**
 * High-fidelity 1:1 certificate preview matching the 900x650 Fabric.js canvas coordinate space.
 * Uses a fixed 900x650 virtual canvas scaled by CSS transform, ensuring pixel-perfect layout,
 * font sizes, borders, and element positioning.
 */
export default function CertificatePreview({
  backgroundColor = "#ffffff",
  elements = [],
  className = "",
}: CertificatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setScale(width / 900);
        }
      }
    };

    updateScale();

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const safeElements = useMemo(() => {
    return Array.isArray(elements) ? elements : [];
  }, [elements]);

  return (
    <div
      ref={containerRef}
      className={`relative aspect-[900/650] w-full overflow-hidden select-none ${className}`}
      style={{ backgroundColor }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{
          width: 900,
          height: 650,
          transform: `scale(${scale})`,
          backgroundColor,
        }}
      >
        {safeElements.map((element) => {
          const {
            id,
            type,
            x = 0,
            y = 0,
            width = 100,
            height = 50,
            color = "#000000",
            backgroundColor: elBg,
            strokeColor,
            strokeWidth = 0,
            opacity = 1,
            fontSize = 16,
            fontFamily = "Arial",
            fontWeight = "normal",
            fontStyle = "normal",
            textAlign = "center",
            text = "",
            lineHeight = 1.16,
            charSpacing,
            lineDash,
          } = element;

          const baseStyle: React.CSSProperties = {
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            opacity,
            boxSizing: "border-box",
          };

          // --- Rectangle / Square ---
          if (type === "rectangle" || type === "square") {
            const isTransparentBg =
              elBg === "transparent" || elBg === "rgba(0,0,0,0)";
            const hasStroke = strokeWidth > 0;
            const effectiveStroke = hasStroke
              ? strokeWidth
              : isTransparentBg && (color || strokeColor)
                ? 2
                : 0;
            const borderStyle =
              effectiveStroke > 0
                ? `${effectiveStroke}px solid ${strokeColor || color}`
                : "none";

            const fill = isTransparentBg
              ? "transparent"
              : elBg || (hasStroke ? "transparent" : color);

            return (
              <div
                key={id}
                style={{
                  ...baseStyle,
                  backgroundColor: fill,
                  border: borderStyle,
                }}
              />
            );
          }

          // --- Circle ---
          if (type === "circle") {
            const hasStroke = strokeWidth > 0;
            const borderStyle = hasStroke
              ? `${strokeWidth}px solid ${strokeColor || color}`
              : "none";

            return (
              <div
                key={id}
                style={{
                  ...baseStyle,
                  borderRadius: "50%",
                  backgroundColor: elBg || color,
                  border: borderStyle,
                }}
              />
            );
          }

          // --- Triangle ---
          if (type === "triangle") {
            const fill = elBg || color || "#000000";
            return (
              <div key={id} style={baseStyle}>
                <svg
                  width={width}
                  height={height}
                  viewBox={`0 0 ${width} ${height}`}
                  style={{ display: "block" }}
                >
                  <polygon
                    points={`${width / 2},0 ${width},${height} 0,${height}`}
                    fill={fill}
                    stroke={strokeColor || "none"}
                    strokeWidth={strokeWidth}
                  />
                </svg>
              </div>
            );
          }

          // --- Stars & Polygons ---
          if (type.startsWith("star") || type.startsWith("square-star")) {
            const starPoints = getStarPoints(width, height);
            const fill = elBg || color || "#d4af37";
            return (
              <div key={id} style={baseStyle}>
                <svg
                  width={width}
                  height={height}
                  viewBox={`0 0 ${width} ${height}`}
                  style={{ display: "block" }}
                >
                  <polygon
                    points={starPoints}
                    fill={fill}
                    stroke={strokeColor || "none"}
                    strokeWidth={strokeWidth}
                  />
                </svg>
              </div>
            );
          }

          // --- Lines ---
          if (
            type === "line" ||
            type === "dashed-line" ||
            type === "dotted-line"
          ) {
            const effectiveStrokeWidth = strokeWidth || Math.max(1, height);
            const effectiveColor = strokeColor || color || "#000000";
            const isDashed = type === "dashed-line" || Boolean(lineDash);
            const isDotted = type === "dotted-line";

            const dashArray = lineDash
              ? lineDash.join(" ")
              : isDashed
                ? "8 4"
                : isDotted
                  ? "2 4"
                  : "none";

            return (
              <div
                key={id}
                style={{
                  ...baseStyle,
                  height: `${Math.max(effectiveStrokeWidth, 2)}px`,
                }}
              >
                <svg
                  width={width}
                  height={Math.max(effectiveStrokeWidth, 2)}
                  style={{ display: "block", overflow: "visible" }}
                >
                  <line
                    x1={0}
                    y1={Math.max(effectiveStrokeWidth, 2) / 2}
                    x2={width}
                    y2={Math.max(effectiveStrokeWidth, 2) / 2}
                    stroke={effectiveColor}
                    strokeWidth={effectiveStrokeWidth}
                    strokeDasharray={dashArray}
                  />
                </svg>
              </div>
            );
          }

          // --- Text / Heading / Subheading ---
          const letterSpacingStyle = charSpacing
            ? `${charSpacing / 1000}em`
            : undefined;

          return (
            <div
              key={id}
              style={{
                ...baseStyle,
                fontSize: `${fontSize}px`,
                fontFamily: fontFamily || "Arial",
                fontWeight,
                fontStyle,
                color,
                textAlign,
                lineHeight: lineHeight ?? 1.16,
                letterSpacing: letterSpacingStyle,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflow: "visible",
              }}
            >
              {text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
