
import type { EditorElement, ElementType } from "../../types/editor";

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 650;
const CANVAS_PADDING = 30;
const ELEMENT_GAP = 20;

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

  if (tag === "h2" || tag === "h3") {
    return "subheading";
  }

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

function hasOwnText(element: HTMLElement): boolean {
  return Array.from(element.childNodes).some(
    (child) =>
      child.nodeType === Node.TEXT_NODE &&
      Boolean(child.textContent?.trim()),
  );
}

/**
 * Wrap long text into lines before sending it to Fabric.
 * This prevents long imported headings from being cut off.
 */
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
  const wrappedText = wrapText(text, fontSize, width);
  const lineCount = Math.max(1, wrappedText.split("\n").length);

  // Extra vertical room prevents Fabric's text descenders
  // and line-height from being clipped.
  return Math.ceil(lineCount * fontSize * 1.45 + 18);
}

export function htmlToElements(html: string): {
  elements: EditorElement[];
  backgroundColor: string;
} {
  const parser = new DOMParser();
  const parsedDocument = parser.parseFromString(html, "text/html");

  const elements: EditorElement[] = [];
  const body = parsedDocument.body;

  const bodyBackground =
    getColor(body, "background-color", "#FFFFFF") || "#FFFFFF";

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

    // Avoid duplicating text already represented by child elements.
    if (
      type !== "image" &&
      element.children.length > 0 &&
      !hasOwnText(element)
    ) {
      continue;
    }

    const image =
      type === "image" ? (element as HTMLImageElement) : null;

    const originalText = element.textContent?.trim() || "";

    if (type !== "image" && !originalText) continue;

    const style = window.getComputedStyle(element);
    const isHeading = type === "heading";
    const isSubheading = type === "subheading";

    const fontSize = Math.min(
      Math.max(
        getNumber(
          style.fontSize,
          isHeading ? 32 : isSubheading ? 24 : 16,
        ),
        8,
      ),
      72,
    );

    const width = Math.min(
      Math.max(
        getNumber(style.width, CONTENT_WIDTH),
        40,
      ),
      CONTENT_WIDTH,
    );

    const text =
      type === "image"
        ? ""
        : wrapText(originalText, fontSize, width);

    const estimatedTextHeight =
      type === "image"
        ? 150
        : getTextHeight(text, fontSize, width);

    const sourceHeight = getNumber(
      style.height,
      estimatedTextHeight,
    );

    // Never use a text box smaller than the estimated text content.
    const height =
      type === "image"
        ? Math.min(
            Math.max(sourceHeight, 30),
            CONTENT_HEIGHT,
          )
        : Math.min(
            Math.max(sourceHeight, estimatedTextHeight),
            CONTENT_HEIGHT,
          );

    /*
     * Do not clamp every overflowing element to the bottom edge.
     * That caused elements to overlap and appear cut off.
     */
    if (nextY + height > CANVAS_HEIGHT - CANVAS_PADDING) {
      // If the canvas is full, retain remaining content by placing
      // it at the next safe starting position instead of clipping it.
      nextY = CANVAS_PADDING;
    }

    const x = CANVAS_PADDING;
    const y = Math.max(
      CANVAS_PADDING,
      Math.min(nextY, CANVAS_HEIGHT - height - CANVAS_PADDING),
    );

    const fontWeight =
      style.fontWeight === "bold" ||
      Number(style.fontWeight) >= 600
        ? "bold"
        : "normal";

    const fontStyle =
      style.fontStyle === "italic" ? "italic" : "normal";

    const textAlign =
      style.textAlign === "center" ||
      style.textAlign === "right"
        ? style.textAlign
        : "left";

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
      opacity: Math.min(
        1,
        Math.max(0, getNumber(style.opacity, 1)),
      ),
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

        nextY = y + height + ELEMENT_GAP;
      } catch {
        continue;
      }

      continue;
    }

    const backgroundColor = getColor(
      element,
      "background-color",
      "transparent",
    );

    elements.push({
      ...common,
      type,
      text,
      backgroundColor,
    } as EditorElement);

    nextY = y + height + ELEMENT_GAP;
  }

  return {
    elements,
    backgroundColor: bodyBackground,
  };
}
