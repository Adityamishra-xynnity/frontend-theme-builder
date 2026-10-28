
import type { EditorElement, ElementType } from "../../types/editor";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 650;
const CANVAS_PADDING = 40;
const ELEMENT_GAP = 24;

const CONTENT_WIDTH = CANVAS_WIDTH - CANVAS_PADDING * 2;
const CONTENT_HEIGHT = CANVAS_HEIGHT - CANVAS_PADDING * 2;

function getNumber(
  value: string | null | undefined,
  fallback: number,
): number {
  if (!value || value === "auto" || value === "none") {
    return fallback;
  }

  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return fallback;

  const number = Number(match[0]);
  return Number.isFinite(number) ? number : fallback;
}

function getColor(
  element: HTMLElement,
  property: string,
  fallback: string,
): string {
  const inlineValue = element.style
    .getPropertyValue(property)
    .trim();

  if (inlineValue) return inlineValue;

  const computedValue = window
    .getComputedStyle(element)
    .getPropertyValue(property)
    .trim();

  if (
    computedValue &&
    computedValue !== "rgba(0, 0, 0, 0)" &&
    computedValue !== "transparent"
  ) {
    return computedValue;
  }

  return fallback;
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

function getDefaultFontSize(tag: string): number {
  switch (tag.toLowerCase()) {
    case "h1":
      return 36;
    case "h2":
      return 30;
    case "h3":
      return 24;
    case "h4":
      return 20;
    case "h5":
      return 18;
    case "h6":
      return 16;
    default:
      return 16;
  }
}

function getImportedFontSize(
  element: HTMLElement,
  tag: string,
  computedFontSize: string,
): number {
  const defaultSize = getDefaultFontSize(tag);
  const inlineSize = element.style
    .getPropertyValue("font-size")
    .trim();

  const size = inlineSize
    ? getNumber(inlineSize, defaultSize)
    : /^h[1-6]$/.test(tag.toLowerCase())
      ? defaultSize
      : getNumber(computedFontSize, defaultSize);

  return Math.min(64, Math.max(10, size));
}

function wrapText(
  text: string,
  fontSize: number,
  width: number,
): string {
  const maxCharacters = Math.max(
    1,
    Math.floor(width / (fontSize * 0.58)),
  );

  return text
    .split(/\r?\n/)
    .flatMap((paragraph) => {
      const words = paragraph.split(/\s+/).filter(Boolean);

      if (words.length === 0) return [""];

      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        if (word.length > maxCharacters) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = "";
          }

          for (
            let index = 0;
            index < word.length;
            index += maxCharacters
          ) {
            lines.push(word.slice(index, index + maxCharacters));
          }

          continue;
        }

        const candidate = currentLine
          ? `${currentLine} ${word}`
          : word;

        if (candidate.length > maxCharacters && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = candidate;
        }
      }

      if (currentLine) lines.push(currentLine);

      return lines;
    })
    .join("\n");
}

function getTextHeight(
  text: string,
  fontSize: number,
  width: number,
): number {
  const wrapped = wrapText(text, fontSize, width);
  const lineCount = Math.max(1, wrapped.split("\n").length);

  return Math.ceil(lineCount * fontSize * 1.5 + 12);
}

export function htmlToElements(html: string): {
  elements: EditorElement[];
  backgroundColor: string;
} {
  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");
  const body = document.body;

  const elements: EditorElement[] = [];

  const backgroundColor = getColor(
    body,
    "background-color",
    "#FFFFFF",
  );

  const nodes = Array.from(
    body.querySelectorAll(
      "h1, h2, h3, h4, h5, h6, p, span, div, button, img",
    ),
  );

  let nextY = CANVAS_PADDING;

  for (const node of nodes) {
    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();
    const type = getElementType(tag);

    if (!type) continue;

    // Parent containers ko skip karo agar unka text
    // child elements se already import ho raha ho.
    if (
      type !== "image" &&
      element.children.length > 0 &&
      !Array.from(element.childNodes).some(
        (child) =>
          child.nodeType === Node.TEXT_NODE &&
          Boolean(child.textContent?.trim()),
      )
    ) {
      continue;
    }

    const image =
      type === "image" ? (element as HTMLImageElement) : null;

    const originalText = element.textContent?.trim() || "";

    if (type !== "image" && !originalText) continue;

    const style = window.getComputedStyle(element);

    const fontSize =
      type === "image"
        ? 16
        : getImportedFontSize(element, tag, style.fontSize);

    // Imported content ko canvas ki safe width mein rakho.
    const requestedWidth = getNumber(
      style.width,
      CONTENT_WIDTH,
    );

    const width = Math.min(
      CONTENT_WIDTH,
      Math.max(120, requestedWidth),
    );

    const text =
      type === "image"
        ? ""
        : wrapText(originalText, fontSize, width);

    const estimatedHeight =
      type === "image"
        ? 180
        : getTextHeight(text, fontSize, width);

    const requestedHeight = getNumber(
      style.height,
      estimatedHeight,
    );

    const height =
      type === "image"
        ? Math.min(
            CONTENT_HEIGHT,
            Math.max(60, requestedHeight),
          )
        : Math.min(
            CONTENT_HEIGHT,
            Math.max(estimatedHeight, requestedHeight),
          );

    // Agar agla item neeche fit na ho to safe position se
    // shuru karo; kisi item ko canvas ke bahar mat bhejo.
    if (nextY + height > CANVAS_HEIGHT - CANVAS_PADDING) {
      nextY = CANVAS_PADDING;
    }

    const x = CANVAS_PADDING;
    const y = Math.max(
      CANVAS_PADDING,
      Math.min(nextY, CANVAS_HEIGHT - height - CANVAS_PADDING),
    );

    const inlineWeight = element.style
      .getPropertyValue("font-weight")
      .trim();

    const computedWeight = style.fontWeight;

    const isBold =
      /^h[1-6]$/.test(tag) ||
      inlineWeight === "bold" ||
      Number(inlineWeight) >= 600 ||
      computedWeight === "bold" ||
      Number(computedWeight) >= 600;

    const fontWeight = isBold ? "bold" : "normal";

    const fontStyle =
      element.style.fontStyle === "italic" ||
      style.fontStyle === "italic"
        ? "italic"
        : "normal";

    const alignment =
      element.style.getPropertyValue("text-align").trim() ||
      style.textAlign;

    const textAlign =
      alignment === "center" || alignment === "right"
        ? alignment
        : "left";

    const opacityValue = getNumber(style.opacity, 1);

    const common = {
      id: crypto.randomUUID(),
      type,
      x,
      y,
      width,
      height,
      fontSize,
      fontFamily: style.fontFamily || "Arial",
      color: getColor(element, "color", "#222222"),
      fontWeight,
      fontStyle,
      textAlign,
      opacity: Math.min(1, Math.max(0, opacityValue)),
    } satisfies Partial<EditorElement>;

    if (type === "image" && image) {
      const src = image.getAttribute("src");

      if (!src) continue;

      try {
        const url = new URL(src, window.location.href);

        if (
          url.protocol !== "http:" &&
          url.protocol !== "https:"
        ) {
          continue;
        }

        elements.push({
          ...common,
          type: "image",
          src: url.href,
        } as EditorElement);
      } catch {
        continue;
      }

      nextY = y + height + ELEMENT_GAP;
      continue;
    }

    const elementBackground = getColor(
      element,
      "background-color",
      "transparent",
    );

    elements.push({
      ...common,
      type,
      text,
      backgroundColor: elementBackground,
    } as EditorElement);

    nextY = y + height + ELEMENT_GAP;
  }

  return {
    elements,
    backgroundColor,
  };
}
