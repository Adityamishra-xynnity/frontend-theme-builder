import { useEffect, useRef, useState, useMemo } from "react";
import type { EditorElement } from "../../types/editor";
import { getShapeSvgSpec } from "../../utils/shapeGeometry";

interface CertificatePreviewProps {
  backgroundColor?: string;
  elements?: EditorElement[];
  className?: string;
  showWatermark?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
}

/**
 * High-fidelity 1:1 certificate preview matching the Fabric.js canvas coordinate space.
 * Uses a fixed 900x650 virtual canvas scaled by CSS transform, ensuring pixel-perfect layout,
 * font sizes, borders, and element positioning.
 */
export default function CertificatePreview({
  backgroundColor = "#ffffff",
  elements = [],
  className = "",
  canvasWidth = 900,
  canvasHeight = 650,
}: CertificatePreviewProps) {
  const safeCanvasWidth = Math.max(1, canvasWidth);
  const safeCanvasHeight = Math.max(1, canvasHeight);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        if (width > 0) {
          setScale(width / safeCanvasWidth);
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
  }, [safeCanvasWidth]);

  const safeElements = useMemo(() => {
    return Array.isArray(elements) ? elements : [];
  }, [elements]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none ${className}`}
      style={{
        backgroundColor,
        aspectRatio: `${safeCanvasWidth} / ${safeCanvasHeight}`,
      }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 origin-top-left"
        style={{
          width: safeCanvasWidth,
          height: safeCanvasHeight,
          transform: `scale(${scale})`,
          backgroundColor,
        }}
      >
        {safeElements.map((element, index) => {
          const {
            id: rawId,
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
            textAlign = "left",
            text = "",
            lineHeight = 1.16,
            charSpacing,
            lineDash,
            scaleX = 1,
            scaleY = 1,
            angle = 0,
            src,
            svgContent,
          } = element;
          const id = rawId || `preview-el-${index}`;

          const transforms: string[] = [];
          if (angle) transforms.push(`rotate(${angle}deg)`);
          if (scaleX !== 1 || scaleY !== 1) transforms.push(`scale(${scaleX}, ${scaleY})`);

          const baseStyle: React.CSSProperties = {
            position: "absolute",
            left: `${x}px`,
            top: `${y}px`,
            width: `${width}px`,
            height: `${height}px`,
            opacity,
            boxSizing: "border-box",
            transformOrigin: "top left",
            transform: transforms.length > 0 ? transforms.join(" ") : undefined,
          };

          // --- Images ---
          if (type === "image" && src) {
            return (
              <img
                key={id}
                src={src}
                alt=""
                style={{
                  ...baseStyle,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            );
          }

          // --- SVG Graphics / Animated Graphics ---
          if ((type === "graphic" || type === "animated-graphic") && svgContent) {
            return (
              <div
                key={id}
                style={baseStyle}
                className="[&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            );
          }

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

          // --- Special Shapes, Polygons, Stars, Bubbles, Flowcharts ---
          const shapeSpec = getShapeSvgSpec(type, width, height, element.shapeSides);
          if (shapeSpec) {
            const fill =
              type === "star-outline" || (shapeSpec.kind === "path" && shapeSpec.noFill)
                ? "none"
                : elBg || color || "#2563eb";
            const stroke = strokeColor || "none";

            if (shapeSpec.kind === "rect") {
              return (
                <div
                  key={id}
                  style={{
                    ...baseStyle,
                    backgroundColor: fill,
                    borderRadius: `${shapeSpec.rx}px`,
                    border: strokeWidth > 0 && stroke !== "none" ? `${strokeWidth}px solid ${stroke}` : "none",
                  }}
                />
              );
            }

            if (shapeSpec.kind === "circle") {
              return (
                <div
                  key={id}
                  style={{
                    ...baseStyle,
                    backgroundColor: fill,
                    borderRadius: "50%",
                    border: strokeWidth > 0 && stroke !== "none" ? `${strokeWidth}px solid ${stroke}` : "none",
                  }}
                />
              );
            }

            return (
              <div key={id} style={baseStyle}>
                <svg
                  width={width}
                  height={height}
                  viewBox={shapeSpec.kind === "path" && shapeSpec.viewBox ? shapeSpec.viewBox : `0 0 ${width} ${height}`}
                  preserveAspectRatio="none"
                  style={{ display: "block", overflow: "visible" }}
                >
                  {shapeSpec.kind === "polygon" ? (
                    <polygon
                      points={shapeSpec.points}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                    />
                  ) : (
                    <path
                      d={shapeSpec.d}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            );
          }

          // --- Lines & Arrows ---
          if (
            type === "line" ||
            type === "arrow" ||
            type === "double-arrow" ||
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
