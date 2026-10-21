
import type { EditorElement, ElementType } from "../../types/editor";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 650;

function getNumber(value: string | null, fallback: number): number {
  if (!value) return fallback;

  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return fallback;

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : fallback;
}

function getColor(
  element: HTMLElement,
  property: string,
  fallback: string,
): string {
  const inlineStyle = element.style.getPropertyValue(property);
  return inlineStyle.trim() || fallback;
}

function getElementType(tagName: string): ElementType | null {
  const tag = tagName.toLowerCase();

  if (tag === "h1") return "heading";
  if (tag === "h2" || tag === "h3") return "subheading";

  if (
    tag === "h4" ||
    tag === "h5" ||
    tag === "h6" ||
    tag === "p" ||
    tag === "span" ||
    tag === "div" ||
    tag === "button"
  ) {
    return "text";
  }

  if (tag === "img") return "image";

  return null;
}

export function htmlToElements(html: string): {
  elements: EditorElement[];
  backgroundColor: string;
} {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  const elements: EditorElement[] = [];

  const body = document.body;
  const bodyBackground =
    body.style.backgroundColor ||
    document.documentElement.style.backgroundColor ||
    "#FFFFFF";

  const nodes = Array.from(
    body.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div, button, img",
    ),
  );

  let nextY = 30;

  for (const node of nodes) {
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const type = getElementType(tag);

    if (!type) continue;

    // Avoid creating duplicate text objects for parent containers.
    if (
      type === "text" &&
      element.children.length > 0 &&
      !Array.from(element.childNodes).some(
        (child) =>
          child.nodeType === Node.TEXT_NODE &&
          child.textContent?.trim(),
      )
    ) {
      continue;
    }

    const style = element.style;
    const text = element.textContent?.trim() || "";

    const width = Math.min(
      Math.max(getNumber(style.width, 400), 40),
      CANVAS_WIDTH,
    );

    const height = Math.min(
      Math.max(
        getNumber(style.height, type === "image" ? 150 : 50),
        20,
      ),
      CANVAS_HEIGHT,
    );

    const x = Math.min(
      Math.max(getNumber(style.left, 30), 0),
      CANVAS_WIDTH - width,
    );

    const y = Math.min(
      Math.max(getNumber(style.top, nextY), 0),
      CANVAS_HEIGHT - height,
    );

    const fontSize = getNumber(
      style.fontSize,
      type === "heading" ? 32 : type === "subheading" ? 24 : 16,
    );

    const fontWeight = style.fontWeight === "bold" ||
      Number(style.fontWeight) >= 600
      ? "bold"
      : "normal";

    const fontStyle = style.fontStyle === "italic" ? "italic" : "normal";

    const color = getColor(element, "color", "#222222");

    const common = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      width,
      height,
      fontSize,
      fontFamily: style.fontFamily || "Arial",
      color,
      fontWeight,
      fontStyle,
      textAlign:
        style.textAlign === "center" ||
        style.textAlign === "right"
          ? style.textAlign
          : "left",
      opacity: getNumber(style.opacity, 1),
    } satisfies Partial<EditorElement>;

    if (type === "image") {
      const image = element as HTMLImageElement;
      const src = image.getAttribute("src");

      if (!src) continue;

      try {
        const url = new URL(src, window.location.href);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
          continue;
        }

        elements.push({
          ...common,
          type: "image",
          src: url.href,
        });

        nextY = y + height + 20;
      } catch {
        continue;
      }

      continue;
    }

    if (!text) continue;

    const backgroundColor =
      getColor(element, "background-color", "transparent");

    elements.push({
      ...common,
      type,
      text,
      backgroundColor,
    });

    nextY = y + height + 20;
  }

  return {
    elements,
    backgroundColor: bodyBackground,
  };
}
