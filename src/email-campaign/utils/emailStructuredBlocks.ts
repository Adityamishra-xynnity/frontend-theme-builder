import type { ThemeElementAsset } from "../../types/themeElements";
import type { EmailNode, EmailSectionTemplate } from "../types/campaign";
import { measureWrappedTextHeight } from "./emailCompatibilityEngine";

export { measureWrappedTextHeight };

/**
 * Single source of truth converting a database BRICK or COLUMN asset into
 * a content-aware, editable EmailSectionTemplate (used by both previews and canvas insertion).
 */
export function buildEmailStructuredTemplate(
  asset: ThemeElementAsset
): EmailSectionTemplate {
  const rawChildren = Array.isArray(asset.assetData?.elements)
    ? asset.assetData.elements
    : [];
  const srcWidth = Number(asset.assetData?.width) || 520;
  const srcHeight = Number(asset.assetData?.height) || 180;
  const targetWidth = 552;
  const scale = srcWidth > 0 ? Math.min(1.12, targetWidth / srcWidth) : 1;
  const offsetX = Math.max(16, Math.round((600 - srcWidth * scale) / 2));
  const offsetY = 16;

  const nodes: EmailNode[] = rawChildren.map((child) => {
    const x = Math.round(offsetX + child.x * scale);
    const y = Math.round(offsetY + child.y * scale);

    if (child.kind === "rect") {
      return {
        id: crypto.randomUUID(),
        type: "container",
        content: "",
        x,
        y,
        width: Math.max(8, Math.round((child.width ?? 100) * scale)),
        height: Math.max(8, Math.round((child.height ?? 60) * scale)),
        backgroundColor: child.fill || "#FFFFFF",
        borderColor: child.stroke || undefined,
        borderWidth: child.strokeWidth ? Number(child.strokeWidth) : undefined,
        borderRadius: child.rx ? Math.round(child.rx * scale) : undefined,
      };
    }

    if (child.kind === "circle") {
      const diameter = Math.max(16, Math.round((child.radius ?? 24) * 2 * scale));
      return {
        id: crypto.randomUUID(),
        type: "container",
        content: "",
        x,
        y,
        width: diameter,
        height: diameter,
        backgroundColor: child.fill || "#EEF2FF",
        borderColor: child.stroke || undefined,
        borderWidth: child.strokeWidth ? Number(child.strokeWidth) : undefined,
        borderRadius: Math.round(diameter / 2),
      };
    }

    if (child.kind === "svg" && child.svgContent) {
      const sz = Math.max(18, Math.round((child.size ?? 36) * scale));
      return {
        id: crypto.randomUUID(),
        type: "image",
        content: `data:image/svg+xml;utf8,${encodeURIComponent(child.svgContent)}`,
        x,
        y,
        width: sz,
        height: sz,
      };
    }

    const fontSize = Math.max(11, Math.round((child.fontSize ?? 14) * scale));
    const width = Math.max(48, Math.round((child.width ?? 200) * scale));
    const fontWeight = child.fontWeight === "bold" ? "bold" : "normal";
    const fontFamily = child.fontFamily || "Inter, Arial, sans-serif";
    const lineHeight = fontSize >= 18 ? 1.25 : 1.38;
    const content = child.text || "";
    const height = measureWrappedTextHeight(
      content,
      width,
      fontSize,
      fontWeight,
      fontFamily,
      lineHeight
    );

    return {
      id: crypto.randomUUID(),
      type: fontSize >= 18 ? "heading" : "text",
      content,
      x,
      y,
      width,
      height,
      fontSize,
      fontFamily,
      fontWeight,
      lineHeight,
      color: child.fill || "#0F172A",
      textAlign:
        child.textAlign === "justify" ? "left" : child.textAlign || "left",
    };
  });

  // Expand enclosing container heights if wrapped text extends past original box bottom
  const containers = nodes.filter((n) => n.type === "container" && n.height > 20);
  const nonContainers = nodes.filter((n) => n.type !== "container");

  for (const container of containers) {
    let maxChildBottom = container.y + container.height;
    for (const child of nonContainers) {
      const cx = child.x + Math.min(child.width, 40) / 2;
      const cy = child.y + Math.min(child.height, 24) / 2;
      if (
        cx >= container.x - 4 &&
        cx <= container.x + container.width + 4 &&
        cy >= container.y - 4 &&
        cy <= container.y + container.height + 16
      ) {
        maxChildBottom = Math.max(maxChildBottom, child.y + child.height + 14);
      }
    }
    container.height = Math.max(container.height, maxChildBottom - container.y);
  }

  const maxBottom = nodes.reduce(
    (max, n) => Math.max(max, n.y + n.height),
    Math.round(srcHeight * scale) + offsetY
  );

  return {
    id: asset.assetKey,
    category: asset.assetType === "COLUMN" ? "columns" : "bricks",
    name: asset.name,
    backgroundColor: "transparent",
    padding: "16px",
    height: maxBottom + 16,
    nodes,
  };
}
