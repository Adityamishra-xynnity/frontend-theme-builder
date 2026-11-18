
import type { FabricObject, Canvas } from "fabric";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export function designToHtml(
  canvas: Canvas,
  designName = "My Design"
): string {
  const width = canvas.getWidth();
  const height = canvas.getHeight();
  const background = canvas.backgroundColor || "#ffffff";

  const elements = canvas.getObjects()
    .filter((obj) => obj.visible !== false)
    .map((obj: FabricObject) => {
      const left = obj.left ?? 0;
      const top = obj.top ?? 0;
      const width = (obj.width ?? 0) * (obj.scaleX ?? 1);
      const height = (obj.height ?? 0) * (obj.scaleY ?? 1);

      const commonStyle = [
        "position:absolute",
        `left:${left}px`,
        `top:${top}px`,
        `width:${width}px`,
        `height:${height}px`,
        `opacity:${obj.opacity ?? 1}`,
        `transform:rotate(${obj.angle ?? 0}deg)`,
        "transform-origin:top left",
        "box-sizing:border-box",
      ].join(";");

      if (obj.type === "textbox" || obj.type === "i-text" || obj.type === "text") {
        const textObject = obj as FabricObject & {
          text?: string;
          fontSize?: number;
          fontFamily?: string;
          fontWeight?: string | number;
          fontStyle?: string;
          textAlign?: string;
          fill?: string;
          underline?: boolean;
          linethrough?: boolean;
        };

        const text = escapeHtml(textObject.text ?? "");
        const color =
          typeof textObject.fill === "string"
            ? textObject.fill
            : "#000000";

        return `<div style="${commonStyle};font-family:${escapeHtml(textObject.fontFamily ?? "Arial")};font-size:${textObject.fontSize ?? 16}px;font-weight:${textObject.fontWeight ?? "normal"};font-style:${textObject.fontStyle ?? "normal"};text-align:${textObject.textAlign ?? "left"};color:${color};white-space:pre-wrap;overflow-wrap:break-word;">${text}</div>`;
      }

      if (obj.type === "rect") {
        const shape = obj as FabricObject & {
          fill?: string;
          rx?: number;
          ry?: number;
          stroke?: string;
          strokeWidth?: number;
        };

        return `<div style="${commonStyle};background-color:${typeof shape.fill === "string" ? shape.fill : "transparent"};border-radius:${shape.rx ?? 0}px;border:${shape.stroke ? `${shape.strokeWidth ?? 1}px solid ${shape.stroke}` : "none"};box-sizing:border-box;"></div>`;
      }

      if (obj.type === "image") {
        const image = obj as FabricObject & {
          getSrc?: () => string;
        };

        const source = image.getSrc?.() ?? "";

        if (!source) return "";

        return `<img src="${escapeHtml(source)}" alt="" style="${commonStyle};object-fit:contain;" />`;
      }

      return "";
    })
    .filter(Boolean)
    .join("\n");

  const safeName = escapeHtml(designName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${safeName}</title>
</head>
<body style="margin:0;padding:20px;background-color:#f1f5f9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center">
<div style="position:relative;width:${width}px;height:${height}px;background-color:${background};overflow:hidden;">
${elements}
</div>
</td>
</tr>
</table>
</body>
</html>`;
}
