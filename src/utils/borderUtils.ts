import {
  Rect,
  FabricImage,
  loadSVGFromString,
  util,
  type FabricObject,
} from "fabric";
import type { EditorPageAsset } from "../context/EditorContext";

export type PageBorderConfig = Record<string, unknown>;

export function getPageBorderConfig(
  asset: EditorPageAsset | null | undefined,
): PageBorderConfig {
  const assetData = asset?.assetData as Record<string, unknown> | undefined;
  return (assetData?.style ?? (asset as any)?.style ?? assetData ?? {}) as PageBorderConfig;
}

/**
 * Creates Fabric.js objects representing the page border.
 * Faithfully reproduces the CSS border rendering from the editor:
 * - Outer border with exact width, inset, line style (solid, double, dashed, dotted), color, and corner radius.
 * - Optional secondary inner border with exact secondaryWidth, secondaryColor, and gap.
 * - Support for SVG content and image-based borders.
 */
export async function createBorderFabricObjects(
  borderAsset: EditorPageAsset | null | undefined,
  canvasWidth: number,
  canvasHeight: number,
): Promise<FabricObject[]> {
  if (!borderAsset || !canvasWidth || !canvasHeight) {
    return [];
  }

  const assetData = (borderAsset.assetData ?? {}) as Record<string, unknown>;

  // 1. SVG-based border
  const svgContent =
    typeof assetData.svgContent === "string" ? assetData.svgContent : null;
  if (svgContent && svgContent.trim().startsWith("<svg")) {
    try {
      const { objects, options } = await loadSVGFromString(svgContent);
      const validObjects = objects.filter((o): o is FabricObject => o !== null);
      if (validObjects.length > 0) {
        const group = util.groupSVGElements(validObjects, options);
        const groupWidth = group.width || 1;
        const groupHeight = group.height || 1;
        group.set({
          left: 0,
          top: 0,
          scaleX: canvasWidth / groupWidth,
          scaleY: canvasHeight / groupHeight,
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          lockRotation: true,
          lockScalingX: true,
          lockScalingY: true,
          originX: "left",
          originY: "top",
          objectCaching: false,
        });
        return [group];
      }
    } catch (e) {
      console.warn("Failed to parse SVG border:", e);
    }
  }

  // 2. Image-based border
  const imageUrl =
    (typeof assetData.url === "string" && assetData.url) ||
    (typeof assetData.imageUrl === "string" && assetData.imageUrl) ||
    (typeof assetData.src === "string" && assetData.src) ||
    null;
  if (imageUrl) {
    try {
      const image = await FabricImage.fromURL(imageUrl, {
        crossOrigin: "anonymous",
      });
      const imgWidth = image.width || 1;
      const imgHeight = image.height || 1;
      image.set({
        left: 0,
        top: 0,
        scaleX: canvasWidth / imgWidth,
        scaleY: canvasHeight / imgHeight,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        originX: "left",
        originY: "top",
        objectCaching: false,
      });
      return [image];
    } catch (e) {
      console.warn("Failed to load image border:", e);
    }
  }

  // 3. CSS-style border (Standard for Theme Builder borders)
  const borderConfig = getPageBorderConfig(borderAsset);
  const borderInset = Math.max(0, Number(borderConfig.inset ?? 18));
  const borderWidth = Math.max(1, Number(borderConfig.width ?? 4));
  const borderColor = String(borderConfig.color ?? "#C9A227");
  const borderLineStyle = String(
    borderConfig.lineStyle ?? borderConfig.kind ?? "solid",
  ).toLowerCase();
  const borderRadius = Math.max(
    0,
    Number(borderConfig.radius ?? (borderConfig.corner === "rounded" ? 16 : 0)),
  );

  const secondaryBorderColor = borderConfig.secondaryColor
    ? String(borderConfig.secondaryColor)
    : "";
  const secondaryBorderWidth = Math.max(
    1,
    Number(borderConfig.secondaryWidth ?? 1),
  );
  const secondaryBorderGap = Math.max(1, Number(borderConfig.gap ?? 7));

  const result: FabricObject[] = [];

  const commonProps = {
    fill: "transparent",
    selectable: false,
    evented: false,
    hasControls: false,
    hasBorders: false,
    lockMovementX: true,
    lockMovementY: true,
    lockRotation: true,
    lockScalingX: true,
    lockScalingY: true,
    strokeUniform: true,
    originX: "left" as const,
    originY: "top" as const,
    objectCaching: false,
  };

  if (borderLineStyle === "double") {
    // In CSS, a double border is two parallel solid lines separated by a gap.
    // Total thickness equals borderWidth.
    const outerStrokeWidth = Math.max(1, Math.round(borderWidth / 3));
    const innerStrokeWidth = Math.max(1, Math.round(borderWidth / 3));

    // Outer line of double border
    const outerRect = new Rect({
      ...commonProps,
      left: borderInset + outerStrokeWidth / 2,
      top: borderInset + outerStrokeWidth / 2,
      width: Math.max(1, canvasWidth - 2 * borderInset - outerStrokeWidth),
      height: Math.max(1, canvasHeight - 2 * borderInset - outerStrokeWidth),
      stroke: borderColor,
      strokeWidth: outerStrokeWidth,
      rx: borderRadius,
      ry: borderRadius,
    });
    result.push(outerRect);

    // Inner line of double border
    const innerInset = borderInset + borderWidth - innerStrokeWidth;
    const innerRect = new Rect({
      ...commonProps,
      left: innerInset + innerStrokeWidth / 2,
      top: innerInset + innerStrokeWidth / 2,
      width: Math.max(1, canvasWidth - 2 * innerInset - innerStrokeWidth),
      height: Math.max(1, canvasHeight - 2 * innerInset - innerStrokeWidth),
      stroke: borderColor,
      strokeWidth: innerStrokeWidth,
      rx: Math.max(0, borderRadius - (borderWidth - innerStrokeWidth)),
      ry: Math.max(0, borderRadius - (borderWidth - innerStrokeWidth)),
    });
    result.push(innerRect);
  } else if (borderLineStyle === "dashed") {
    const dashLength = Math.max(6, borderWidth * 3);
    const spaceLength = Math.max(4, borderWidth * 2);

    const dashedRect = new Rect({
      ...commonProps,
      left: borderInset + borderWidth / 2,
      top: borderInset + borderWidth / 2,
      width: Math.max(1, canvasWidth - 2 * borderInset - borderWidth),
      height: Math.max(1, canvasHeight - 2 * borderInset - borderWidth),
      stroke: borderColor,
      strokeWidth: borderWidth,
      strokeDashArray: [dashLength, spaceLength],
      strokeLineCap: "butt",
      rx: borderRadius,
      ry: borderRadius,
    });
    result.push(dashedRect);
  } else if (borderLineStyle === "dotted") {
    const dotLength = Math.max(2, borderWidth);
    const spaceLength = Math.max(3, borderWidth * 1.5);

    const dottedRect = new Rect({
      ...commonProps,
      left: borderInset + borderWidth / 2,
      top: borderInset + borderWidth / 2,
      width: Math.max(1, canvasWidth - 2 * borderInset - borderWidth),
      height: Math.max(1, canvasHeight - 2 * borderInset - borderWidth),
      stroke: borderColor,
      strokeWidth: borderWidth,
      strokeDashArray: [dotLength, spaceLength],
      strokeLineCap: "round",
      rx: borderRadius,
      ry: borderRadius,
    });
    result.push(dottedRect);
  } else {
    // Solid border (default)
    const solidRect = new Rect({
      ...commonProps,
      left: borderInset + borderWidth / 2,
      top: borderInset + borderWidth / 2,
      width: Math.max(1, canvasWidth - 2 * borderInset - borderWidth),
      height: Math.max(1, canvasHeight - 2 * borderInset - borderWidth),
      stroke: borderColor,
      strokeWidth: borderWidth,
      rx: borderRadius,
      ry: borderRadius,
    });
    result.push(solidRect);
  }

  // Secondary inner border (e.g. gold accent inside classic/double/royal borders)
  if (secondaryBorderColor) {
    const secInset = borderInset + borderWidth + secondaryBorderGap;
    const secRadius = Math.max(0, borderRadius - secondaryBorderGap);

    const secondaryRect = new Rect({
      ...commonProps,
      left: secInset + secondaryBorderWidth / 2,
      top: secInset + secondaryBorderWidth / 2,
      width: Math.max(1, canvasWidth - 2 * secInset - secondaryBorderWidth),
      height: Math.max(1, canvasHeight - 2 * secInset - secondaryBorderWidth),
      stroke: secondaryBorderColor,
      strokeWidth: secondaryBorderWidth,
      rx: secRadius,
      ry: secRadius,
    });
    result.push(secondaryRect);
  }

  return result;
}
