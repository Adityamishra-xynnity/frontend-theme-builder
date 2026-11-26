import type { EditorElement } from "../types/editor";

// svgContent of detailed illustrations can be >1 MB; hashing it is far cheaper than
// stringifying it into the signature. One-entry memo keeps repeat calls O(1).
let lastSvgForSig = "";
let lastSvgSig = "";

function svgSignature(svg: string | undefined): string {
  if (!svg) return "";
  if (svg === lastSvgForSig) return lastSvgSig;
  let h = 0x811c9dc5;
  for (let i = 0; i < svg.length; i++) {
    h ^= svg.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  lastSvgForSig = svg;
  lastSvgSig = `${svg.length}:${h >>> 0}`;
  return lastSvgSig;
}

export function getElementSignature(elements: EditorElement[]): string {
  return JSON.stringify(
    elements.map((element) => ({
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      scaleX: element.scaleX ?? 1,
      scaleY: element.scaleY ?? 1,
      angle: element.angle ?? 0,
      opacity: element.opacity ?? 1,
      text: element.text ?? "",
      fontSize: element.fontSize ?? 32,
      fontFamily: element.fontFamily ?? "Arial",
      color: element.color ?? "#000000",
      backgroundColor: element.backgroundColor ?? "",
      fontWeight: element.fontWeight ?? "normal",
      fontStyle: element.fontStyle ?? "normal",
      textAlign: element.textAlign ?? "left",
      lineHeight: element.lineHeight ?? 1.16,
      charSpacing: element.charSpacing ?? 0,
      textBend: element.textBend ?? 0,
      strokeColor: element.strokeColor ?? "",
      strokeWidth: element.strokeWidth ?? 0,
      lineDash: element.lineDash ?? [],
      shapeSides: element.shapeSides ?? 0,
      src: element.src ?? "",
      pathData: element.pathData ?? [],
      tableData: element.tableData ?? null,
      graphicKey: element.graphicKey ?? "",
      svgContent: svgSignature(element.svgContent),
      colorPalette: element.colorPalette ?? [],
    })),
  );
}
