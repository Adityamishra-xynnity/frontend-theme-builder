import type {
  EmailBounds,
  EmailNode,
  EmailNodeType,
  EmailSection,
} from "../context/EmailEditorContext";

export const EMAIL_CANVAS_WIDTH = 600;

export const EMAIL_EDITING_LIMITS = {
  minFontSize: 10,
  maxFontSize: 72,
  minLineHeight: 1.0,
  maxLineHeight: 2.5,
  minLetterSpacing: -1,
  maxLetterSpacing: 8,
  maxBorderWidth: 6,
  minBorderRadius: 0,
  maxBorderRadius: 9999,
} as const;

export const EMAIL_SAFE_FONT_OPTIONS: ReadonlyArray<{
  label: string;
  value: string;
}> = [
  { label: "System Sans", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

export const SUPPORTED_ELEMENT_PANEL_CATEGORIES = new Set<string>([
  "header",
  "footer",
  "buttons",
  "icons",
  "bricks",
  "columns",
  "highlights",
  "elements",
]);

export const SUPPORTED_EMAIL_NODE_TYPES = new Set<EmailNodeType>([
  "logo",
  "heading",
  "text",
  "button",
  "link",
  "image",
  "container",
]);

export type CompatibilityLevel =
  | "SUPPORTED"
  | "RESTRICTED"
  | "NOT_AVAILABLE";

export interface EmailCompatibilityWarning {
  sectionId: string;
  sectionName: string;
  message: string;
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function isHighlightSection(section: Pick<EmailSection, "category" | "templateId">): boolean {
  return (
    section.category === "highlight" ||
    Boolean(section.templateId?.includes("highlight")) ||
    ["callout", "bordered", "quote", "gradient"].includes(section.category)
  );
}

/**
 * Resolve single font names into email-safe fallback stacks for Gmail, Outlook, and Apple Mail.
 */
export function resolveEmailFontFamily(fontFamily?: string): string {
  const defaultStack =
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
  if (!fontFamily || !fontFamily.trim()) return defaultStack;
  const trimmed = fontFamily.trim().replace(/"/g, "'");
  if (trimmed.includes(",")) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower === "georgia") return "Georgia, 'Times New Roman', serif";
  if (lower === "times new roman") return "'Times New Roman', Georgia, serif";
  if (lower === "courier new" || lower === "courier") {
    return "'Courier New', Courier, monospace";
  }
  if (lower === "arial") return "Arial, Helvetica, sans-serif";
  if (lower === "helvetica") return "Helvetica, Arial, sans-serif";
  if (
    lower.includes("serif") ||
    ["merriweather", "playfair display", "lora"].some((f) => lower.includes(f))
  ) {
    return `'${trimmed}', Georgia, 'Times New Roman', serif`;
  }
  if (
    lower.includes("mono") ||
    ["consolas", "fira code", "jetbrains"].some((f) => lower.includes(f))
  ) {
    return `'${trimmed}', 'Courier New', Courier, monospace`;
  }
  return `'${trimmed}', Arial, Helvetica, sans-serif`;
}

/**
 * Omit legacy HTML `bgcolor` attribute when value is `transparent` or `rgb()/rgba()`.
 */
export function safeBgAttr(bg?: string): string {
  if (!bg) return "";
  const trimmed = bg.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === "transparent" ||
    trimmed.toLowerCase().startsWith("rgb")
  ) {
    return "";
  }
  const escaped = trimmed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return ` bgcolor="${escaped}"`;
}

let measureCtx: CanvasRenderingContext2D | null = null;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!measureCtx) {
    const canvas = document.createElement("canvas");
    measureCtx = canvas.getContext("2d");
  }
  return measureCtx;
}

/**
 * Content-aware height calculation for wrapped email text nodes.
 * Uses Canvas 2D text metrics when available, with a deterministic character-width fallback.
 */
export function measureWrappedTextHeight(
  text: string,
  width: number,
  fontSize: number,
  fontWeight = "normal",
  fontFamily = "Inter, Arial, sans-serif",
  lineHeight = 1.35
): number {
  const safeWidth = Math.max(40, width - 6);
  const safeText = text || "";
  const paragraphs = safeText.split(/\r?\n/);
  const ctx = getMeasureContext();

  if (ctx) {
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  }

  let totalLines = 0;
  for (const para of paragraphs) {
    if (!para.trim()) {
      totalLines += 1;
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = "";
    let paraLines = 1;

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const measuredWidth = ctx
        ? ctx.measureText(candidate).width
        : candidate.length * fontSize * 0.56;

      if (measuredWidth > safeWidth && currentLine) {
        paraLines += 1;
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    }
    totalLines += paraLines;
  }

  const linePx = Math.ceil(fontSize * lineHeight);
  return Math.max(Math.ceil(fontSize * 1.5), totalLines * linePx + 6);
}

function parsePaddingBox(padding?: string): { padX: number; padY: number } {
  if (!padding || !padding.trim()) return { padX: 40, padY: 20 };
  const nums = padding
    .trim()
    .split(/\s+/)
    .map((p) => parseFloat(p))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 1) return { padX: nums[0] * 2, padY: nums[0] * 2 };
  if (nums.length >= 2) return { padX: nums[1] * 2, padY: nums[0] * 2 };
  return { padX: 40, padY: 20 };
}

function isBoldWeight(weight?: string): boolean {
  return weight === "bold" || weight === "600" || weight === "700" || weight === "800";
}

/**
 * Content-aware minimum dimensions so buttons, headings, text, icons, and cards
 * cannot be shrunk until their content disappears or clips.
 */
export function getNodeMinDimensions(
  type: EmailNodeType,
  node?: Pick<
    EmailNode,
    "content" | "fontSize" | "fontWeight" | "fontFamily" | "lineHeight" | "letterSpacing" | "padding" | "width"
  >,
  targetWidth?: number
): {
  minWidth: number;
  minHeight: number;
} {
  const fontSize = node?.fontSize ?? (type === "heading" ? 20 : 14);
  const content = (node?.content || "").trim();
  const boldFactor = isBoldWeight(node?.fontWeight) || type === "heading" || type === "logo" ? 0.65 : 0.58;
  const letterExtra = Math.max(0, node?.letterSpacing ?? 0);

  switch (type) {
    case "container":
      return { minWidth: 40, minHeight: 4 };
    case "image":
      return { minWidth: 20, minHeight: 20 };
    case "button": {
      const { padX, padY } = parsePaddingBox(node?.padding || "10px 20px");
      const charCount = Math.max(content.length, 4);
      const estimatedTextW = Math.round(
        charCount * (fontSize * boldFactor + letterExtra) + Math.max(24, padX)
      );
      return {
        minWidth: Math.min(560, Math.max(96, estimatedTextW)),
        minHeight: Math.max(36, Math.round(fontSize * (node?.lineHeight ?? 1.25) + Math.max(12, padY))),
      };
    }
    case "logo":
    case "link": {
      const charCount = Math.max(content.length, 4);
      const estimatedW = Math.round(charCount * (fontSize * boldFactor + letterExtra) + 14);
      return {
        minWidth: Math.min(520, Math.max(60, estimatedW)),
        minHeight: Math.max(22, Math.ceil(fontSize * (node?.lineHeight ?? 1.25) + 4)),
      };
    }
    default: {
      const longestWord = content
        .split(/\s+/)
        .reduce((max, w) => Math.max(max, w.length), 0);
      const estimatedWordW = Math.round(
        longestWord * (fontSize * boldFactor + letterExtra) + 16
      );
      const minWidth = Math.min(280, Math.max(60, estimatedWordW));
      const effectiveW = Math.max(minWidth, targetWidth ?? node?.width ?? minWidth);
      const lineHeight = node?.lineHeight ?? (type === "heading" ? 1.25 : 1.38);
      const wrappedH = content
        ? measureWrappedTextHeight(
            content,
            effectiveW,
            fontSize,
            node?.fontWeight || (type === "heading" ? "bold" : "normal"),
            node?.fontFamily || "Inter, Arial, sans-serif",
            lineHeight
          )
        : Math.ceil(fontSize * 1.45);
      return {
        minWidth,
        minHeight: Math.max(22, Math.ceil(fontSize * 1.45), wrappedH),
      };
    }
  }
}

export function isColumnContainerNode(
  section: Pick<EmailSection, "category">,
  node: Pick<EmailNode, "type" | "height">
): boolean {
  return (
    section.category === "columns" &&
    node.type === "container" &&
    node.height > 20
  );
}

interface ColumnBandInfo {
  cols: EmailNode[];
  childrenByCol: Map<string, EmailNode[]>;
  leftMargin: number;
  rightMargin: number;
  gaps: number[];
  proportions: number[];
  minParentWidth: number;
}

function getColumnBandsInfo(section: EmailSection): ColumnBandInfo[] {
  const nodes = section.nodes || [];
  const containers = nodes
    .filter((n) => n.type === "container" && n.height > 20)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  if (containers.length === 0) return [];

  const nonContainers = nodes.filter((n) => n.type !== "container");
  const bands: EmailNode[][] = [];

  for (const col of containers) {
    const target = bands.find((b) =>
      b.some((other) => Math.abs(other.y - col.y) <= 24)
    );
    if (target) target.push(col);
    else bands.push([col]);
  }

  const assignedIds = new Set<string>();

  return bands.map((band) => {
    band.sort((a, b) => a.x - b.x);
    const childrenByCol = new Map<string, EmailNode[]>();
    for (const col of band) {
      const children = nonContainers.filter((child) => {
        if (assignedIds.has(child.id)) return false;
        const cx = child.x + Math.min(child.width, 40) / 2;
        const cy = child.y + Math.min(child.height, 24) / 2;
        const inside =
          cx >= col.x - 6 &&
          cx <= col.x + col.width + 6 &&
          cy >= col.y - 6 &&
          cy <= col.y + col.height + 24;
        if (inside) {
          assignedIds.add(child.id);
          return true;
        }
        return false;
      });
      childrenByCol.set(col.id, children);
    }

    const leftMargin = Math.max(0, Math.round(band[0].x));
    const last = band[band.length - 1];
    const rightMargin = Math.max(
      0,
      Math.round((section.width || EMAIL_CANVAS_WIDTH) - (last.x + last.width))
    );
    const gaps: number[] = [];
    for (let i = 1; i < band.length; i++) {
      gaps.push(Math.max(8, Math.round(band[i].x - (band[i - 1].x + band[i - 1].width))));
    }

    const totalColW = band.reduce((s, c) => s + Math.max(1, c.width), 0);
    const rawProps = band.map((c) => Math.max(1, c.width) / totalColW);
    const isEqual = rawProps.every((p) => Math.abs(p - 1 / band.length) <= 0.04);
    const proportions = isEqual
      ? band.map(() => 1 / band.length)
      : rawProps;

    const colMinWidths = band.map((col) => {
      const children = childrenByCol.get(col.id) || [];
      if (children.length === 0) return 80;
      const childMin = children.reduce((max, ch) => {
        const { minWidth } = getNodeMinDimensions(ch.type, ch);
        return Math.max(max, minWidth + 24);
      }, 80);
      return childMin;
    });

    const totalGapW = gaps.reduce((s, g) => s + g, 0);
    const requiredColsW = isEqual
      ? Math.max(...colMinWidths) * band.length
      : Math.max(...colMinWidths.map((mw, idx) => mw / proportions[idx]));

    const minParentWidth = Math.min(
      EMAIL_CANVAS_WIDTH,
      Math.ceil(leftMargin + rightMargin + totalGapW + requiredColsW)
    );

    return {
      cols: band,
      childrenByCol,
      leftMargin,
      rightMargin,
      gaps,
      proportions,
      minParentWidth,
    };
  });
}

export function getSectionMinDimensions(section: EmailSection): {
  minWidth: number;
  minHeight: number;
} {
  if (section.category === "columns") {
    const colBands = getColumnBandsInfo(section);
    if (colBands.length > 0) {
      const minWidth = Math.min(
        EMAIL_CANVAS_WIDTH,
        Math.max(240, ...colBands.map((b) => b.minParentWidth))
      );
      const maxNodeBottom = (section.nodes || []).reduce((max, n) => {
        const { minHeight } = getNodeMinDimensions(n.type, n);
        return Math.max(max, Math.ceil(n.y + Math.max(n.height, minHeight)));
      }, 0);
      return {
        minWidth,
        minHeight: Math.max(40, maxNodeBottom + 8),
      };
    }
  }

  // Group non-container children into horizontal bands to prevent overlapping/clipping
  // when a card, verified block, highlight block, header, or footer is shrunk horizontally.
  const nonContainers = (section.nodes || []).filter((n) => n.type !== "container");
  const bands: EmailNode[][] = [];
  for (const node of [...nonContainers].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const target = bands.find((b) => {
      const bTop = Math.min(...b.map((x) => x.y));
      const bBot = Math.max(...b.map((x) => x.y + x.height));
      const yOverlap = node.y < bBot - 4 && node.y + node.height > bTop + 4;
      if (!yOverlap) return false;
      const xOverlap = b.some(
        (other) => node.x < other.x + other.width - 2 && node.x + node.width > other.x + 2
      );
      return !xOverlap;
    });
    if (target) target.push(node);
    else bands.push([node]);
  }

  const bandMinWidths = bands.map((band) => {
    const sorted = [...band].sort((a, b) => a.x - b.x);
    let sum = 32; // outer horizontal padding
    for (let i = 0; i < sorted.length; i++) {
      const { minWidth } = getNodeMinDimensions(sorted[i].type, sorted[i]);
      sum += minWidth;
      if (i > 0) {
        const gap = Math.max(8, Math.round(sorted[i].x - (sorted[i - 1].x + sorted[i - 1].width)));
        sum += Math.min(gap, 24);
      }
    }
    return sum;
  });

  const baseMinW = isHighlightSection(section) ? 140 : 200;
  const minWidth = Math.min(EMAIL_CANVAS_WIDTH, Math.max(baseMinW, ...bandMinWidths));

  const maxNodeBottom = (section.nodes || []).reduce((max, n) => {
    const { minHeight } = getNodeMinDimensions(n.type, n);
    return Math.max(max, Math.ceil(n.y + Math.max(n.height, minHeight)));
  }, 0);
  const minHeight = Math.max(40, maxNodeBottom + 4);

  return { minWidth, minHeight };
}

/**
 * Canva-style symmetric horizontal resize around the 600px canvas center.
 */
export function computeSymmetricHorizontalBounds(
  startBounds: EmailBounds,
  nextBounds: EmailBounds,
  direction: string,
  minWidth: number,
  canvasWidth = EMAIL_CANVAS_WIDTH
): EmailBounds {
  if (direction !== "left" && direction !== "right") {
    return nextBounds;
  }
  const clampedWidth = clamp(Math.round(nextBounds.width), minWidth, canvasWidth);
  const centeredX = Math.round((canvasWidth - clampedWidth) / 2);
  return {
    ...nextBounds,
    x: centeredX,
    y: startBounds.y,
    width: clampedWidth,
    height: startBounds.height,
  };
}

/**
 * Clamp a child node safely within its parent section width and minimum readable dimensions.
 */
export function enforceNodeBounds(
  node: EmailNode,
  sectionWidth: number
): EmailNode {
  const { minWidth } = getNodeMinDimensions(node.type, node);
  const safeSectionW = Math.max(minWidth, Math.min(EMAIL_CANVAS_WIDTH, sectionWidth));
  const width = clamp(Math.round(node.width), minWidth, safeSectionW);
  const x = clamp(Math.round(node.x), 0, Math.max(0, safeSectionW - width));
  const y = Math.max(0, Math.round(node.y));
  const { minHeight } = getNodeMinDimensions(node.type, node, width);
  const height = Math.max(minHeight, Math.round(node.height));
  return {
    ...node,
    x,
    y,
    width,
    height,
  };
}

/**
 * Normalize a node (including legacy saved campaign nodes) so unsupported visual
 * properties (gradients, opacity < 1, unsupported font stacks, out-of-range metrics)
 * render identically on the editor canvas and in exported HTML without losing content.
 */
export function normalizeEmailNode(node: EmailNode): EmailNode {
  const next: EmailNode = { ...node };

  if (next.gradient) {
    if (!next.backgroundColor) {
      const hexMatch = next.gradient.match(/#[0-9a-fA-F]{3,8}/);
      if (hexMatch) {
        next.backgroundColor = hexMatch[0];
      }
    }
    next.gradient = undefined;
  }

  if (next.opacity !== undefined) {
    next.opacity = undefined;
  }

  if (next.fontFamily) {
    next.fontFamily = resolveEmailFontFamily(next.fontFamily);
  }

  if (next.fontSize !== undefined) {
    next.fontSize = clamp(
      Math.round(next.fontSize),
      EMAIL_EDITING_LIMITS.minFontSize,
      EMAIL_EDITING_LIMITS.maxFontSize
    );
  }

  if (next.lineHeight !== undefined) {
    next.lineHeight = clamp(
      round2(next.lineHeight),
      EMAIL_EDITING_LIMITS.minLineHeight,
      EMAIL_EDITING_LIMITS.maxLineHeight
    );
  }

  if (next.letterSpacing !== undefined) {
    next.letterSpacing = clamp(
      round1(next.letterSpacing),
      EMAIL_EDITING_LIMITS.minLetterSpacing,
      EMAIL_EDITING_LIMITS.maxLetterSpacing
    );
  }

  if (next.borderWidth !== undefined) {
    next.borderWidth = clamp(
      round1(next.borderWidth),
      0,
      EMAIL_EDITING_LIMITS.maxBorderWidth
    );
  }

  return next;
}

/**
 * Normalize a section so it never overflows 600px horizontally or clips child content vertically,
 * and normalizes all child nodes for strict canvas-to-email parity.
 */
export function enforceSectionBounds(section: EmailSection): EmailSection {
  const isStandaloneButton =
    section.backgroundColor === "transparent" &&
    section.nodes.length === 1 &&
    section.nodes[0].type === "button";

  if (isStandaloneButton) {
    const btn = normalizeEmailNode(section.nodes[0]);
    const { minWidth, minHeight } = getNodeMinDimensions("button", btn);
    const width = clamp(Math.round(section.width || btn.width), minWidth, EMAIL_CANVAS_WIDTH);
    const height = Math.max(minHeight, Math.round(section.height || btn.height));
    const x = clamp(Math.round(section.x), 0, Math.max(0, EMAIL_CANVAS_WIDTH - width));
    const y = Math.max(0, Math.round(section.y));
    return {
      ...section,
      x,
      y,
      width,
      height,
      nodes: [
        {
          ...btn,
          x: 0,
          y: 0,
          width,
          height,
        },
      ],
    };
  }

  const { minWidth } = getSectionMinDimensions(section);
  const width = clamp(Math.round(section.width || EMAIL_CANVAS_WIDTH), minWidth, EMAIL_CANVAS_WIDTH);
  const x = clamp(Math.round(section.x), 0, Math.max(0, EMAIL_CANVAS_WIDTH - width));
  const y = Math.max(0, Math.round(section.y));
  const normalizedNodes = (section.nodes || []).map((n) =>
    enforceNodeBounds(normalizeEmailNode(n), width)
  );

  // Equalize column container heights in each row to the tallest column's content
  if (section.category === "columns") {
    const colBands = getColumnBandsInfo({ ...section, width, nodes: normalizedNodes });
    const heightUpdates = new Map<string, number>();
    for (const band of colBands) {
      let tallest = 40;
      for (const col of band.cols) {
        const children = band.childrenByCol.get(col.id) || [];
        let maxBot = col.y + Math.max(40, col.height);
        for (const ch of children) {
          maxBot = Math.max(maxBot, ch.y + ch.height + 14);
        }
        tallest = Math.max(tallest, maxBot - col.y);
      }
      for (const col of band.cols) {
        heightUpdates.set(col.id, tallest);
      }
    }
    for (let i = 0; i < normalizedNodes.length; i++) {
      const h = heightUpdates.get(normalizedNodes[i].id);
      if (h !== undefined) {
        normalizedNodes[i] = { ...normalizedNodes[i], height: h };
      }
    }
  }

  const maxNodeBottom = normalizedNodes.reduce(
    (max, n) => Math.max(max, Math.ceil(n.y + n.height)),
    0
  );
  const height = Math.max(40, Math.round(section.height || 200), maxNodeBottom + 4);

  return {
    ...section,
    x,
    y,
    width,
    height,
    nodes: normalizedNodes,
  };
}

/**
 * Recalculate a parent ColumnLayout section so all columns scale proportionally
 * (preserving equal widths or intentional unequal proportions, gaps, and tallest-column height).
 */
export function recalculateColumnLayoutSection(
  startSection: EmailSection,
  nextBounds: EmailBounds,
  direction: string
): EmailSection {
  const colBands = getColumnBandsInfo(startSection);
  if (colBands.length === 0) {
    return enforceSectionBounds({ ...startSection, ...nextBounds });
  }

  const { minWidth: sectionMinW } = getSectionMinDimensions(startSection);
  const isHorizontalEdge = direction === "left" || direction === "right";
  const resolvedBounds = isHorizontalEdge
    ? computeSymmetricHorizontalBounds(
        {
          x: startSection.x,
          y: startSection.y,
          width: startSection.width,
          height: startSection.height,
        },
        nextBounds,
        direction,
        sectionMinW
      )
    : {
        ...nextBounds,
        width: clamp(Math.round(nextBounds.width), sectionMinW, EMAIL_CANVAS_WIDTH),
      };

  const nodeMap = new Map<string, EmailNode>();
  for (const n of startSection.nodes) {
    nodeMap.set(n.id, { ...n });
  }

  for (const band of colBands) {
    const totalGap = band.gaps.reduce((s, g) => s + g, 0);
    const availableColsW = Math.max(
      band.cols.length * 60,
      resolvedBounds.width - band.leftMargin - band.rightMargin - totalGap
    );

    let cursorX = band.leftMargin;
    const isEqual = band.proportions.every((p) => Math.abs(p - 1 / band.cols.length) <= 0.01);
    const equalColW = Math.floor(availableColsW / band.cols.length);

    let tallestColHeight = 0;

    band.cols.forEach((origCol, idx) => {
      const newColW = isEqual
        ? idx === band.cols.length - 1
          ? Math.max(60, availableColsW - equalColW * (band.cols.length - 1))
          : equalColW
        : Math.max(60, Math.round(availableColsW * band.proportions[idx]));

      const colX = cursorX;
      cursorX += newColW + (band.gaps[idx] ?? 0);

      const children = band.childrenByCol.get(origCol.id) || [];
      let maxChildBottom = origCol.y + Math.max(40, Math.round(origCol.height));

      for (const origChild of children) {
        const relX = origChild.x - origCol.x;
        const padX = Math.max(12, Math.round(relX));
        const maxChildW = Math.max(40, newColW - padX * 2);
        const { minWidth: chMinW } = getNodeMinDimensions(origChild.type, origChild);
        const childRatio = origChild.width / Math.max(1, origCol.width);
        const newChildW = clamp(
          Math.round(newColW * childRatio),
          Math.min(chMinW, maxChildW),
          maxChildW
        );
        const newChildX = Math.round(colX + padX);
        const { minHeight: chMinH } = getNodeMinDimensions(
          origChild.type,
          origChild,
          newChildW
        );
        const newChildH =
          origChild.type === "text" || origChild.type === "heading"
            ? chMinH
            : Math.max(chMinH, Math.round(origChild.height));

        nodeMap.set(origChild.id, {
          ...origChild,
          x: newChildX,
          width: newChildW,
          height: newChildH,
        });
        maxChildBottom = Math.max(maxChildBottom, origChild.y + newChildH + 14);
      }

      tallestColHeight = Math.max(tallestColHeight, maxChildBottom - origCol.y);
      nodeMap.set(origCol.id, {
        ...origCol,
        x: colX,
        width: newColW,
        height: tallestColHeight,
      });
    });

    // Equalize all column container heights in the row to tallest column
    for (const origCol of band.cols) {
      const updated = nodeMap.get(origCol.id);
      if (updated) {
        nodeMap.set(origCol.id, { ...updated, height: tallestColHeight });
      }
    }
  }

  return enforceSectionBounds({
    ...startSection,
    ...resolvedBounds,
    nodes: startSection.nodes.map((n) => nodeMap.get(n.id) || n),
  });
}

/**
 * Compute a scaled section and its child nodes from a drag-start snapshot.
 * Enforces symmetric horizontal centering, wrapped text heights, and parent-based column scaling.
 */
export function computeScaledSectionFromSnapshot(
  startSection: EmailSection,
  nextBounds: EmailBounds,
  direction: string
): EmailSection {
  if (startSection.category === "columns") {
    return recalculateColumnLayoutSection(startSection, nextBounds, direction);
  }

  const safeStartW = Math.max(1, startSection.width);
  const safeStartH = Math.max(1, startSection.height);
  const scaleX = nextBounds.width / safeStartW;
  const scaleY = nextBounds.height / safeStartH;

  const isVerticalEdge = direction === "top" || direction === "bottom";
  const isHorizontalEdge = direction === "left" || direction === "right";

  if (isVerticalEdge) {
    return enforceSectionBounds({
      ...startSection,
      ...nextBounds,
      nodes: startSection.nodes.map((node) => ({ ...node })),
    });
  }

  if (isHorizontalEdge) {
    const { minWidth: sectionMinW } = getSectionMinDimensions(startSection);
    const symmetricBounds = computeSymmetricHorizontalBounds(
      {
        x: startSection.x,
        y: startSection.y,
        width: startSection.width,
        height: startSection.height,
      },
      nextBounds,
      direction,
      sectionMinW
    );
    const symScaleX = symmetricBounds.width / safeStartW;

    return enforceSectionBounds({
      ...startSection,
      ...symmetricBounds,
      nodes: startSection.nodes.map((node) => {
        const { minWidth } = getNodeMinDimensions(node.type, node);
        const scaledX = round2(node.x * symScaleX);
        const scaledWidth = Math.max(
          minWidth,
          Math.min(symmetricBounds.width - scaledX, round2(node.width * symScaleX))
        );
        const { minHeight } = getNodeMinDimensions(node.type, node, scaledWidth);
        return {
          ...node,
          x: scaledX,
          width: scaledWidth,
          height:
            node.type === "text" || node.type === "heading"
              ? minHeight
              : Math.max(minHeight, node.height),
        };
      }),
    });
  }

  const fontScale = Math.min(scaleX, scaleY);

  return enforceSectionBounds({
    ...startSection,
    ...nextBounds,
    nodes: startSection.nodes.map((node) => {
      const { minWidth } = getNodeMinDimensions(node.type, node);
      const baseFont = node.fontSize ?? (node.type === "heading" ? 24 : 14);
      const scaledFont = clamp(
        round1(baseFont * fontScale),
        EMAIL_EDITING_LIMITS.minFontSize,
        EMAIL_EDITING_LIMITS.maxFontSize
      );
      const scaledW = Math.max(minWidth, round2(node.width * scaleX));
      const { minHeight } = getNodeMinDimensions(
        node.type,
        { ...node, fontSize: node.fontSize !== undefined ? scaledFont : node.fontSize },
        scaledW
      );

      return {
        ...node,
        x: round2(node.x * scaleX),
        y: round2(node.y * scaleY),
        width: scaledW,
        height: Math.max(minHeight, round2(node.height * scaleY)),
        fontSize: node.fontSize !== undefined ? scaledFont : node.fontSize,
      };
    }),
  });
}

/**
 * Sanitize a node style patch so unsupported email features (gradients, opacity < 1,
 * text-align justify, out-of-range typography/borders) cannot be introduced via editing.
 */
export function sanitizeNodeStylePatch(
  patch: Partial<EmailNode>
): Partial<EmailNode> {
  const sanitized: Partial<EmailNode> = { ...patch };

  // Unsupported in Outlook Desktop / inconsistent across clients: block new gradients & opacity
  if ("gradient" in sanitized) {
    sanitized.gradient = undefined;
  }
  if ("opacity" in sanitized) {
    sanitized.opacity = undefined;
  }

  if (sanitized.fontSize !== undefined) {
    sanitized.fontSize = clamp(
      Math.round(sanitized.fontSize),
      EMAIL_EDITING_LIMITS.minFontSize,
      EMAIL_EDITING_LIMITS.maxFontSize
    );
  }
  if (sanitized.lineHeight !== undefined) {
    sanitized.lineHeight = clamp(
      round2(sanitized.lineHeight),
      EMAIL_EDITING_LIMITS.minLineHeight,
      EMAIL_EDITING_LIMITS.maxLineHeight
    );
  }
  if (sanitized.letterSpacing !== undefined) {
    sanitized.letterSpacing = clamp(
      round1(sanitized.letterSpacing),
      EMAIL_EDITING_LIMITS.minLetterSpacing,
      EMAIL_EDITING_LIMITS.maxLetterSpacing
    );
  }
  if (sanitized.borderWidth !== undefined) {
    sanitized.borderWidth = clamp(
      round1(sanitized.borderWidth),
      0,
      EMAIL_EDITING_LIMITS.maxBorderWidth
    );
  }

  return sanitized;
}

/**
 * Audit a section for email-client compatibility fallbacks or unsupported node types.
 */
export function auditSectionCompatibility(
  section: EmailSection
): EmailCompatibilityWarning[] {
  const warnings: EmailCompatibilityWarning[] = [];
  for (const n of section.nodes || []) {
    if (!SUPPORTED_EMAIL_NODE_TYPES.has(n.type)) {
      warnings.push({
        sectionId: section.id,
        sectionName: section.name,
        message: `Element "${n.type}" used generic text fallback in email export.`,
      });
    }
  }
  return warnings;
}
