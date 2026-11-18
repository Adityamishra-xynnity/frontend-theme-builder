import type { PaperSize, PageOrientation } from "../context/EditorContext";

export interface PageDimensions {
  width: number;
  height: number;
}

export const PAPER_DIMENSIONS: Record<PaperSize, PageDimensions> = {
  A1: { width: 594, height: 841 },
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
};

export const CANVAS_SCALE = 900 / 297;

export function getCanvasDimensions(
  paperSize: PaperSize,
  orientation: PageOrientation,
): PageDimensions {
  const paper = PAPER_DIMENSIONS[paperSize];

  const width =
    orientation === "landscape" ? paper.height : paper.width;

  const height =
    orientation === "landscape" ? paper.width : paper.height;

  return {
    width: Math.round(width * CANVAS_SCALE),
    height: Math.round(height * CANVAS_SCALE),
  };
}
