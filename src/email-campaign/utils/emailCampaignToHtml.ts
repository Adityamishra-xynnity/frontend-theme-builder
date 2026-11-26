import type { EmailSection, EmailNode } from "../context/EmailEditorContext";
import { getNodeLinkUrl, sanitizeEmailUrl, isValidEmailUrl } from "./linkUtils";
import {
  EMAIL_CANVAS_WIDTH,
  auditSectionCompatibility,
  isHighlightSection,
  resolveEmailFontFamily,
  safeBgAttr,
} from "./emailCompatibilityEngine";

const escapeHtml = (value: string): string =>
  (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeUrl = (url?: string): string => {
  if (!url) return "";

  if (url.startsWith("data:image/") || url.startsWith("cid:")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (["http:", "https:", "mailto:", "tel:"].includes(parsed.protocol)) {
      return escapeHtml(url);
    }
  } catch {
    return "";
  }

  return "";
};

/**
 * In-browser canvas rasterizer that converts SVG data URIs to clean base64 PNG data URIs.
 * Major email clients (Gmail, Outlook, Yahoo) strictly drop SVG images, but render inline PNGs flawlessly.
 */
export async function convertSvgDataUriToPng(
  svgDataUri: string,
  targetWidth = 48,
  targetHeight = 48
): Promise<string> {
  if (typeof window === "undefined" || !svgDataUri.startsWith("data:image/svg+xml")) {
    return svgDataUri;
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const scale = 2; // High-density retina rasterization
          canvas.width = Math.max(1, Math.round(targetWidth * scale));
          canvas.height = Math.max(1, Math.round(targetHeight * scale));

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/png"));
          } else {
            resolve(svgDataUri);
          }
        } catch {
          resolve(svgDataUri);
        }
      };
      img.onerror = () => resolve(svgDataUri);
      img.src = svgDataUri;
    } catch {
      resolve(svgDataUri);
    }
  });
}

/**
 * Prepares sections before HTML email conversion:
 * Asynchronously converts any raw SVG data URIs into base64 PNG data URIs.
 */
export async function prepareSectionsForEmail(
  sections: EmailSection[]
): Promise<EmailSection[]> {
  const prepared: EmailSection[] = [];

  for (const section of sections) {
    const preparedNodes: EmailNode[] = [];

    for (const node of section.nodes) {
      if (node.type === "image") {
        let content = node.content;
        let url = node.url;

        if (content && content.startsWith("data:image/svg+xml")) {
          content = await convertSvgDataUriToPng(content, node.width, node.height);
        }

        if (url && url.startsWith("data:image/svg+xml")) {
          url = await convertSvgDataUriToPng(url, node.width, node.height);
        }

        preparedNodes.push({
          ...node,
          content,
          url,
        });
      } else {
        preparedNodes.push(node);
      }
    }

    prepared.push({
      ...section,
      nodes: preparedNodes,
    });
  }

  return prepared;
}

/**
 * Render individual editable email node into email-safe HTML markup.
 */
function renderNode(node: EmailNode): string {
  const content = escapeHtml(node.content);
  const fontSize = node.fontSize ?? 14;
  const width = Math.max(1, Math.round(node.width));
  const height = Math.max(1, Math.round(node.height));
  const color = node.color ? `color:${escapeHtml(node.color)};` : "";
  const textAlign = node.textAlign ? `text-align:${escapeHtml(node.textAlign)};` : "";
  const fontFamily = resolveEmailFontFamily(node.fontFamily);
  const fontStyle = node.fontStyle ? `font-style:${escapeHtml(node.fontStyle)};` : "";
  const textDecoration = node.textDecoration
    ? `text-decoration:${escapeHtml(node.textDecoration)};`
    : "";
  const letterSpacing =
    node.letterSpacing !== undefined
      ? `letter-spacing:${Number(node.letterSpacing)}px;`
      : "";
  const rawLinkUrl = getNodeLinkUrl(node);
  const destinationUrl = sanitizeEmailUrl(rawLinkUrl);

  switch (node.type) {
    case "logo": {
      const weight = escapeHtml(node.fontWeight || "bold");
      const lineH = node.lineHeight ?? 1.2;
      const logoHtml = `<span style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:${weight};${fontStyle}${textDecoration}${letterSpacing}line-height:${lineH};${textAlign}${color}">${content}</span>`;
      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="text-decoration:none;display:inline-block;${color}">${logoHtml}</a>`
        : logoHtml;
    }

    case "heading": {
      const weight = escapeHtml(node.fontWeight || "bold");
      const lineH = node.lineHeight ?? 1.25;
      const headingHtml = `<div style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:${weight};${fontStyle}${textDecoration}${letterSpacing}line-height:${lineH};white-space:pre-wrap;word-break:break-word;width:${width}px;max-width:100%;${textAlign}${color}">${content}</div>`;
      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="text-decoration:none;display:inline-block;${color}">${headingHtml}</a>`
        : headingHtml;
    }

    case "text": {
      const weight = escapeHtml(node.fontWeight || "normal");
      const lineH = node.lineHeight ?? 1.45;
      const textHtml = `<div style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:${weight};${fontStyle}${textDecoration}${letterSpacing}line-height:${lineH};white-space:pre-wrap;word-break:break-word;width:${width}px;max-width:100%;${textAlign}${color}">${content}</div>`;
      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="color:inherit;text-decoration:none;display:inline-block;${color}">${textHtml}</a>`
        : textHtml;
    }

    case "button": {
      const bg = escapeHtml(node.backgroundColor || "#6d28d9");
      const bgStyle = `background-color:${bg};`;
      const textColor = escapeHtml(node.color || "#ffffff");
      const radius =
        typeof node.borderRadius === "number"
          ? `${node.borderRadius}px`
          : escapeHtml(String(node.borderRadius ?? "6px"));
      const borderCss =
        node.borderWidth && node.borderColor
          ? `border:${node.borderWidth}px solid ${escapeHtml(node.borderColor)};`
          : "";
      const fontWeight = escapeHtml(node.fontWeight || "bold");
      const paddingCss = escapeHtml(node.padding || "12px 28px");
      const targetUrl = destinationUrl || "#";

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="${width}" style="width:${width}px;max-width:100%;border-collapse:separate !important;">
          <tr>
            <td align="center"${safeBgAttr(node.backgroundColor || "#6d28d9")} height="${height}" style="height:${height}px;border-radius:${radius};${bgStyle}${borderCss}">
              <a href="${targetUrl}" target="_blank" style="display:block;padding:${paddingCss};mso-padding-alt:${paddingCss};font-family:${fontFamily};font-size:${fontSize}px;font-weight:${fontWeight};color:${textColor};text-decoration:none;border-radius:${radius};line-height:1.25;">
                ${content}
              </a>
            </td>
          </tr>
        </table>
      `;
    }

    case "link": {
      const linkColor = escapeHtml(node.color || "#2563eb");
      const targetUrl = destinationUrl || "#";

      return `
        <a href="${targetUrl}" target="_blank" style="font-family:${fontFamily};font-size:${fontSize}px;font-weight:600;color:${linkColor};text-decoration:underline;">
          ${content}
        </a>
      `;
    }

    case "image": {
      // Prioritize image data source (base64 PNG) over destination hyperlink URL
      const rawImageSource =
        node.content &&
          (node.content.startsWith("data:image/") ||
            node.content.startsWith("http://") ||
            node.content.startsWith("https://"))
          ? node.content
          : node.url &&
            (node.url.startsWith("data:image/") ||
              node.url.startsWith("http://") ||
              node.url.startsWith("https://")) &&
            !isValidEmailUrl(node.linkUrl)
            ? node.url
            : node.content;

      const imageUrl = safeUrl(rawImageSource);
      if (!imageUrl) return "";

      const borderRadius = node.borderRadius
        ? `border-radius:${escapeHtml(String(node.borderRadius))}px;`
        : "";
      const fitMode = width <= 64 ? "contain" : "cover";

      const imgHtml = `
        <img src="${imageUrl}" alt="" width="${width}" height="${height}"
          style="display:block;width:${width}px;height:${height}px;max-width:100%;border:0;outline:none;text-decoration:none;object-fit:${fitMode};${borderRadius}" />
      `;

      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="display:inline-block;text-decoration:none;border:0;">${imgHtml}</a>`
        : imgHtml;
    }

    case "container": {
      const bg = escapeHtml(node.backgroundColor || "rgba(255, 255, 255, 0.4)");
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0;">
          <tr>
            <td height="${height}" style="height:${height}px;background-color:${bg};font-size:0;line-height:0;mso-line-height-rule:exactly;">
              &nbsp;
            </td>
          </tr>
        </table>
      `;
    }

    default: {
      const fallbackText = node.content ? escapeHtml(node.content) : "";
      return fallbackText
        ? `<div style="font-family:${fontFamily};font-size:${fontSize}px;${color}">${fallbackText}</div>`
        : "";
    }
  }
}

export interface EmailRenderWarning {
  sectionId: string;
  sectionName: string;
  message: string;
}

export interface EmailRenderResult {
  html: string;
  warnings: EmailRenderWarning[];
}

export interface SectionRendererAdapter {
  id: string;
  matches: (section: EmailSection) => boolean;
  render: (section: EmailSection, warnings: EmailRenderWarning[]) => string;
}

const CUSTOM_SECTION_RENDERERS: SectionRendererAdapter[] = [];

/**
 * Register a custom email section renderer adapter for future element types
 * without modifying the core export pipeline.
 */
export function registerSectionRenderer(adapter: SectionRendererAdapter): void {
  const idx = CUSTOM_SECTION_RENDERERS.findIndex((r) => r.id === adapter.id);
  if (idx >= 0) {
    CUSTOM_SECTION_RENDERERS[idx] = adapter;
  } else {
    CUSTOM_SECTION_RENDERERS.unshift(adapter);
  }
}

/**
 * Render an email-client-safe vertical spacer row.
 * Inherits parent background color unless an explicit bgColor is supplied.
 */
function renderSpacerRow(heightPx: number, bgColor?: string): string {
  const h = Math.round(heightPx);
  if (h <= 0) return "";
  const bgAttr = bgColor ? ` bgcolor="${escapeHtml(bgColor)}"` : "";
  const bgStyle = bgColor ? `background-color:${escapeHtml(bgColor)};` : "";
  return `
    <tr>
      <td height="${h}"${bgAttr} style="height:${h}px;line-height:${h}px;font-size:1px;mso-line-height-rule:exactly;${bgStyle}">&nbsp;</td>
    </tr>
  `;
}

/**
 * Render vertically stacked nodes in a single column table,
 * preserving top offset, inter-node vertical gaps, and optional bottom space.
 */
function renderStackedNodes(
  nodes: EmailNode[],
  horizontalAlign: "left" | "center" | "right" = "left",
  sectionHeight?: number,
  bgColor?: string
): string {
  if (nodes.length === 0) {
    return sectionHeight ? renderSpacerRow(sectionHeight, bgColor) : "";
  }

  const sorted = [...nodes]
    .map((node, index) => ({ node, index }))
    .sort((a, b) => a.node.y - b.node.y || a.node.x - b.node.x || a.index - b.index)
    .map((entry) => entry.node);

  let innerY = 0;
  const rowsHtml = sorted
    .map((node) => {
      const rendered = renderNode(node);
      if (!rendered) return "";

      const gap = Math.round(node.y - innerY);
      const spacer = gap > 0 ? renderSpacerRow(gap, bgColor) : "";
      innerY = Math.max(innerY, Math.round(node.y + node.height));

      return `
        ${spacer}
        <tr>
          <td align="${horizontalAlign}" valign="top" style="vertical-align:top;">
            ${rendered}
          </td>
        </tr>
      `;
    })
    .join("");

  const bottomGap =
    sectionHeight !== undefined ? Math.round(sectionHeight - innerY) : 0;
  const bottomSpacer = bottomGap > 0 ? renderSpacerRow(bottomGap, bgColor) : "";

  return `${rowsHtml}${bottomSpacer}`;
}

function renderCoordinateRows(
  nodes: EmailNode[],
  containerWidth: number,
  originX = 0,
  originY = 0,
  bgColor?: string
): string {
  if (nodes.length === 0) return "";

  // Sort top-to-bottom, then left-to-right
  const sorted = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);

  // Group into horizontal bands: nodes whose vertical intervals overlap
  // AND do not overlap horizontally share a table row with per-cell top padding.
  const bands: EmailNode[][] = [];
  for (const node of sorted) {
    const targetBand = bands.find((band) => {
      const bandTop = Math.min(...band.map((n) => n.y));
      const bandBottom = Math.max(...band.map((n) => n.y + n.height));
      const verticalOverlap =
        Math.abs(node.y - bandTop) <= 12 ||
        (node.y < bandBottom - 4 && node.y + node.height > bandTop + 4);
      if (!verticalOverlap) return false;
      const horizOverlap = band.some(
        (other) =>
          node.x < other.x + other.width - 2 &&
          node.x + node.width > other.x + 2
      );
      return !horizOverlap;
    });

    if (targetBand) {
      targetBand.push(node);
    } else {
      bands.push([node]);
    }
  }

  let cursorY = originY;
  return bands
    .map((band) => {
      const bandTop = Math.min(...band.map((n) => n.y));
      const bandBottom = Math.max(...band.map((n) => n.y + n.height));
      const gapY = Math.round(bandTop - cursorY);
      const spacer = gapY > 0 ? renderSpacerRow(gapY, bgColor) : "";
      cursorY = Math.max(cursorY, Math.round(bandBottom));

      if (band.length === 1) {
        const node = band[0];
        const relX = Math.max(0, Math.round(node.x - originX));
        const nodeW = Math.max(
          1,
          Math.min(containerWidth - relX, Math.round(node.width))
        );
        const rightPad = Math.max(0, containerWidth - (relX + nodeW));
        const cellAlign =
          node.textAlign === "justify"
            ? "left"
            : node.textAlign || "left";
        const padStyle = `padding:0 ${rightPad}px 0 ${relX}px;`;

        return `
          ${spacer}
          <tr>
            <td align="${cellAlign}" valign="top" style="${padStyle}vertical-align:top;">
              ${renderNode(node)}
            </td>
          </tr>
        `;
      }

      const sortedBand = [...band].sort((a, b) => a.x - b.x);
      let cursorX = originX;
      const cellsHtml: string[] = [];

      for (const node of sortedBand) {
        const nodeX = Math.max(cursorX, Math.round(node.x));
        const maxAvail = Math.max(1, originX + containerWidth - nodeX);
        const nodeW = Math.max(1, Math.min(maxAvail, Math.round(node.width)));
        const gapX = nodeX - cursorX;
        if (gapX > 0) {
          cellsHtml.push(
            `<td width="${gapX}" style="width:${gapX}px;font-size:0;line-height:0;">&nbsp;</td>`
          );
        }
        const topOffset = Math.max(0, Math.round(node.y - bandTop));
        const cellAlign =
          node.textAlign === "justify" ? "left" : node.textAlign || "left";
        cellsHtml.push(
          `<td width="${nodeW}" align="${cellAlign}" valign="top" style="width:${nodeW}px;vertical-align:top;${topOffset > 0 ? `padding-top:${topOffset}px;` : ""}">${renderNode(node)}</td>`
        );
        cursorX = nodeX + nodeW;
      }

      const endX = originX + containerWidth;
      if (cursorX < endX) {
        const trailing = endX - cursorX;
        cellsHtml.push(
          `<td width="${trailing}" style="width:${trailing}px;font-size:0;line-height:0;">&nbsp;</td>`
        );
      }

      return `
        ${spacer}
        <tr>
          <td style="padding:0;">
            <table role="presentation" width="${containerWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${containerWidth}px;table-layout:fixed;">
              <tr>
                ${cellsHtml.join("")}
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");
}

function isPointInsideContainer(node: EmailNode, container: EmailNode): boolean {
  const cx = node.x + Math.min(node.width, 40) / 2;
  const cy = node.y + Math.min(node.height, 24) / 2;
  return (
    cx >= container.x - 4 &&
    cx <= container.x + container.width + 4 &&
    cy >= container.y - 4 &&
    cy <= container.y + container.height + 4
  );
}

function renderIconBlockSection(section: EmailSection): string {
  const sectionWidth = Math.max(1, Math.round(section.width || 600));
  const sectionBg = escapeHtml(section.backgroundColor || "#ffffff");
  const nodes = section.nodes || [];
  const pillNode = nodes.find(
    (n) => n.type === "container" && (n.borderColor || n.borderRadius)
  );
  const images = nodes
    .filter((n) => n.type === "image")
    .sort((a, b) => a.x - b.x);
  const texts = nodes.filter((n) => n.type !== "image" && n.type !== "container");

  if (images.length === 0) {
    return "";
  }

  const colCount = images.length;
  const colPct = Math.floor(100 / colCount);
  const colsHtml = images
    .map((imgNode) => {
      // Find matching label: either inline right of icon or centered below icon
      const inlineLabel = texts.find(
        (t) =>
          Math.abs(t.y - imgNode.y) <= 12 &&
          t.x >= imgNode.x &&
          t.x <= imgNode.x + 120
      );
      const belowLabel = texts.find(
        (t) =>
          t.y > imgNode.y &&
          Math.abs(t.x + t.width / 2 - (imgNode.x + imgNode.width / 2)) <= 65
      );
      const label = inlineLabel || belowLabel;
      const imgHtml = renderNode(imgNode);

      if (inlineLabel) {
        return `
          <td width="${colPct}%" align="center" valign="middle" style="width:${colPct}%;padding:6px 4px;vertical-align:middle;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td valign="middle" style="padding-right:6px;">${imgHtml}</td>
                <td valign="middle">${renderNode(inlineLabel)}</td>
              </tr>
            </table>
          </td>
        `;
      }

      return `
        <td width="${colPct}%" align="center" valign="top" style="width:${colPct}%;padding:6px 6px;vertical-align:top;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="padding-bottom:${label ? "8px" : "0"};">
                ${imgHtml}
              </td>
            </tr>
            ${label
          ? `<tr><td align="center">${renderNode(label)}</td></tr>`
          : ""
        }
          </table>
        </td>
      `;
    })
    .join("");

  const pillStyle = pillNode
    ? `border:${pillNode.borderWidth ?? 1.25}px solid ${escapeHtml(pillNode.borderColor || "#CBD5E1")};border-radius:999px;padding:8px 14px;`
    : "padding:14px 20px;";

  return `
    <tr>
      <td>
        <table class="email-section-table" role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0" bgcolor="${sectionBg}" style="width:${sectionWidth}px;background-color:${sectionBg};">
          <tr>
            <td style="padding:${pillNode ? "16px 32px" : "6px 12px"};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;${pillStyle}border-collapse:separate;">
                <tr>
                  ${colsHtml}
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderStructuredCardsSection(section: EmailSection): string {
  const sectionWidth = Math.max(1, Math.round(section.width || 600));
  const sectionBg = escapeHtml(
    section.backgroundColor === "transparent"
      ? "#ffffff"
      : section.backgroundColor || "#ffffff"
  );
  const nodes = section.nodes || [];
  const containers = nodes.filter((n) => n.type === "container");
  const nonContainers = nodes.filter((n) => n.type !== "container");

  // Main card containers (height > 20) vs thin top accent bars (height <= 12)
  const cardContainers = containers
    .filter((c) => c.height > 20)
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const accentBars = containers.filter((c) => c.height <= 20);

  if (cardContainers.length === 0) {
    return "";
  }

  const assignedChildIds = new Set<string>();
  const cardItems = cardContainers.map((card) => {
    const children = nonContainers
      .filter((child) => {
        if (assignedChildIds.has(child.id)) return false;
        if (isPointInsideContainer(child, card)) {
          assignedChildIds.add(child.id);
          return true;
        }
        return false;
      })
      .sort((a, b) => a.y - b.y || a.x - b.x);

    const accent = accentBars.find(
      (bar) =>
        Math.abs(bar.x - card.x) <= 8 &&
        Math.abs(bar.y - card.y) <= 8 &&
        bar.width >= card.width * 0.7
    );

    return { card, children, accent };
  });

  // Cluster cards into horizontal row bands
  const bands: Array<typeof cardItems> = [];
  for (const item of cardItems) {
    const existingBand = bands.find((band) =>
      band.some((other) => Math.abs(other.card.y - item.card.y) <= 24)
    );
    if (existingBand) {
      existingBand.push(item);
    } else {
      bands.push([item]);
    }
  }

  const bandsHtml = bands
    .map((band) => {
      band.sort((a, b) => a.card.x - b.card.x);
      const totalCardWidth = band.reduce((sum, b) => sum + b.card.width, 0) || 1;
      const isSingleNarrowCard =
        band.length === 1 && band[0].card.width < sectionWidth - 60;

      const cellsHtml = band
        .map(({ card, children, accent }, idx) => {
          const cardW = Math.max(60, Math.round(card.width));
          const pct = Math.max(15, Math.round((card.width / totalCardWidth) * 100));
          const cardBg = escapeHtml(card.backgroundColor || "#FFFFFF");
          const bgStyle = `background-color:${cardBg};`;
          const borderCss =
            card.borderWidth && card.borderColor
              ? `border:${card.borderWidth}px solid ${escapeHtml(card.borderColor)};`
              : "border:1px solid #E2E8F0;";
          const radius =
            typeof card.borderRadius === "number"
              ? `${card.borderRadius}px`
              : escapeHtml(String(card.borderRadius ?? "10px"));

          const innerPadX = 14;
          const innerPadY = 12;
          const innerWidth = Math.max(60, Math.round(card.width - innerPadX * 2));
          const innerContent = renderCoordinateRows(
            children,
            innerWidth,
            card.x + innerPadX,
            card.y + innerPadY,
            cardBg
          );

          const accentRow = accent
            ? `<tr><td height="${Math.max(4, Math.round(accent.height))}"${safeBgAttr(accent.backgroundColor || "#2563EB")} style="height:${Math.max(4, Math.round(accent.height))}px;background-color:${escapeHtml(accent.backgroundColor || "#2563EB")};font-size:0;line-height:0;">&nbsp;</td></tr>`
            : "";

          const prevCard = idx > 0 ? band[idx - 1].card : null;
          const cardGap = prevCard
            ? Math.max(8, Math.round(card.x - (prevCard.x + prevCard.width)))
            : 0;

          const cellWidthAttr = isSingleNarrowCard ? `${cardW}` : `${pct}%`;
          const cellWidthCss = isSingleNarrowCard ? `${cardW}px` : `${pct}%`;

          return `
                <td class="email-col-cell" width="${cellWidthAttr}" valign="top" style="width:${cellWidthCss};max-width:100%;vertical-align:top;${cardGap > 0 ? `padding-left:${cardGap}px;` : ""}">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${safeBgAttr(card.backgroundColor || "#FFFFFF")} style="width:100%;${bgStyle}${borderCss}border-radius:${radius};overflow:hidden;border-collapse:separate !important;">
                    ${accentRow}
                    <tr>
                      <td style="padding:${innerPadY}px ${innerPadX}px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                          ${innerContent || `<tr><td style="height:40px;">&nbsp;</td></tr>`}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              `;
        })
        .join("");

      if (isSingleNarrowCard) {
        const singleCard = band[0].card;
        const leftPad = Math.max(0, Math.round(singleCard.x));
        const rightPad = Math.max(0, Math.round(sectionWidth - singleCard.x - singleCard.width));
        return `
              <tr>
                <td style="padding:8px ${rightPad}px 8px ${leftPad}px;">
                  <table role="presentation" width="${Math.round(singleCard.width)}" cellpadding="0" cellspacing="0" border="0" style="width:${Math.round(singleCard.width)}px;max-width:100%;">
                    <tr>
                      ${cellsHtml}
                    </tr>
                  </table>
                </td>
              </tr>
            `;
      }

      return `
            <tr>
              <td style="padding:8px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    ${cellsHtml}
                  </tr>
                </table>
              </td>
            </tr>
          `;
    })
    .join("");

  return `
    <tr>
      <td>
        <table class="email-section-table" role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0" bgcolor="${sectionBg}" style="width:${sectionWidth}px;background-color:${sectionBg};">
          ${bandsHtml}
        </table>
      </td>
    </tr>
  `;
}

/**
 * Analyzes and renders an EmailSection into client-compatible HTML email table structures
 * using the centralized Section Renderer Registry.
 */
function renderSection(
  section: EmailSection,
  warnings: EmailRenderWarning[] = []
): string {
  // Check custom registered renderers first for future extensibility
  for (const custom of CUSTOM_SECTION_RENDERERS) {
    if (custom.matches(section)) {
      return custom.render(section, warnings);
    }
  }

  warnings.push(...auditSectionCompatibility(section));

  const sectionWidth = Math.max(1, Math.min(EMAIL_CANVAS_WIDTH, Math.round(section.width || EMAIL_CANVAS_WIDTH)));
  const sectionHeight = Math.max(1, Math.round(section.height));
  const sectionBg = escapeHtml(section.backgroundColor || "#ffffff");
  const nodes = section.nodes || [];

  if (section.category === "icons") {
    const iconBlockHtml = renderIconBlockSection(section);
    if (iconBlockHtml) return iconBlockHtml;
  }

  const isHighlight = isHighlightSection(section);

  if (
    section.category === "bricks" ||
    section.category === "columns" ||
    (!isHighlight &&
      nodes.some((n) => n.type === "container" && n.height > 20) &&
      nodes.some((n) => n.type !== "container"))
  ) {
    const structuredHtml = renderStructuredCardsSection(section);
    if (structuredHtml) return structuredHtml;
  }

  // Standalone transparent button element (preserves exact canvas x without a visible container)
  if (
    section.backgroundColor === "transparent" &&
    nodes.length === 1 &&
    nodes[0].type === "button"
  ) {
    const leftPad = Math.max(0, Math.round(section.x));
    const rightPad = Math.max(0, EMAIL_CANVAS_WIDTH - leftPad - sectionWidth);
    return `
      <tr>
        <td align="left" style="padding:0 ${rightPad}px 0 ${leftPad}px;">
          ${renderNode(nodes[0])}
        </td>
      </tr>
    `;
  }

  if (nodes.length === 0) {
    return `
      <tr>
        <td height="${sectionHeight}" style="height:${sectionHeight}px;background-color:${sectionBg};font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    `;
  }

  // 1. Check for 3-Column Flanked Layout (e.g. Header 7 Purple Wave)
  const leftFlank = nodes.find(
    (n) => n.x <= 40 && n.width <= 100 && n.type === "image"
  );
  const rightFlank = nodes.find(
    (n) => n.x + n.width >= sectionWidth - 30 && n.width <= 100 && n.type === "image"
  );

  if (leftFlank && rightFlank) {
    const middle = nodes.filter((n) => n !== leftFlank && n !== rightFlank);
    const middleBounded = middle.every(
      (n) =>
        n.x >= leftFlank.x + leftFlank.width - 20 &&
        n.x + n.width <= rightFlank.x + 20
    );

    if (middleBounded) {
      return `
        <tr>
          <td>
            <table class="email-section-table" role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
              style="width:${sectionWidth}px;background-color:${sectionBg};">
              <tr>
                <td width="${leftFlank.width}" valign="middle" align="left" style="width:${leftFlank.width}px;padding-left:16px;">
                  ${renderNode(leftFlank)}
                </td>
                <td valign="top" align="center" style="padding:0 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${renderStackedNodes(middle, "center", sectionHeight, sectionBg)}
                  </table>
                </td>
                <td width="${rightFlank.width}" valign="middle" align="right" style="width:${rightFlank.width}px;padding-right:16px;">
                  ${renderNode(rightFlank)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }
  }

  // 2. Check for 2-Column Split Section (Header / Footer only — general sections use 2D coordinate grid)
  const isHeaderOrFooter =
    section.category === "header" || section.category === "footer";
  let bestSplit: {
    splitX: number;
    leftGroup: EmailNode[];
    rightGroup: EmailNode[];
    gap: number;
  } | null = null;

  if (isHeaderOrFooter) {
    for (let splitX = 140; splitX <= 450; splitX += 10) {
      const leftGroup = nodes.filter((n) => n.x + n.width <= splitX + 15);
      const rightGroup = nodes.filter((n) => n.x >= splitX - 15);

      if (
        leftGroup.length + rightGroup.length === nodes.length &&
        leftGroup.length > 0 &&
        rightGroup.length > 0
      ) {
        const leftYLevels = new Set(leftGroup.map((n) => Math.round(n.y / 25))).size;
        const rightYLevels = new Set(rightGroup.map((n) => Math.round(n.y / 25))).size;
        const isMultiVerticalLevel =
          (leftYLevels >= 2 || rightYLevels >= 2) &&
          (leftGroup.some((l) => l.height > 60) ||
            rightGroup.some((r) => r.height > 60) ||
            (leftYLevels >= 2 && rightYLevels >= 2));

        if (isMultiVerticalLevel) {
          const maxLeftX = Math.max(...leftGroup.map((n) => n.x + n.width));
          const minRightX = Math.min(...rightGroup.map((n) => n.x));
          const gap = minRightX - maxLeftX;

          if (!bestSplit || gap > bestSplit.gap) {
            bestSplit = { splitX, leftGroup, rightGroup, gap };
          }
        }
      }
    }
  }

  if (bestSplit) {
    const leftPad = Math.max(16, Math.min(...bestSplit.leftGroup.map((n) => n.x)));
    const rightPad = Math.max(
      16,
      sectionWidth - Math.max(...bestSplit.rightGroup.map((n) => n.x + n.width))
    );
    const col1Width = bestSplit.splitX - leftPad;
    const col2Width = sectionWidth - bestSplit.splitX - rightPad;

    return `
      <tr>
        <td>
          <table class="email-section-table" role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
            style="width:${sectionWidth}px;background-color:${sectionBg};">
            <tr>
              <td style="padding:0 ${rightPad}px 0 ${leftPad}px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="${col1Width}" valign="top" style="width:${col1Width}px;vertical-align:top;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${renderStackedNodes(bestSplit.leftGroup, "left", sectionHeight, sectionBg)}
                      </table>
                    </td>
                    <td width="20" style="width:20px;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="${col2Width}" valign="top" align="right" style="width:${col2Width}px;vertical-align:top;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${renderStackedNodes(bestSplit.rightGroup, "right", sectionHeight, sectionBg)}
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  // 2b. Highlight / Callout Card Layout (Table-based card for Gmail/Outlook parity)
  const isHighlightLike = isHighlightSection(section);
  const cardBgNode = nodes
    .filter((n) => n.type === "container" && n.height >= 24 && n.width >= 60)
    .sort((a, b) => b.width * b.height - a.width * a.height)[0];
  if (isHighlightLike && cardBgNode) {
    const contentNodes = nodes.filter((n) => n.id !== cardBgNode.id);
    const iconNode = contentNodes.find((n) => n.type === "image");
    const textNodes = contentNodes
      .filter((n) => n.type !== "image")
      .sort((a, b) => a.y - b.y);

    const cardBg = escapeHtml(cardBgNode.backgroundColor || "#FFFFFF");
    const cardBgStyle = `background-color:${cardBg};`;
    const cardBorder =
      cardBgNode.borderWidth && cardBgNode.borderColor
        ? `border:${cardBgNode.borderWidth}px solid ${escapeHtml(cardBgNode.borderColor)};`
        : "";
    const cardRadius =
      typeof cardBgNode.borderRadius === "number"
        ? `${cardBgNode.borderRadius}px`
        : escapeHtml(String(cardBgNode.borderRadius ?? "10px"));

    const iconSrc = safeUrl(iconNode?.content || iconNode?.url);
    const iconW = Math.round(iconNode?.width ?? 32);
    const iconH = Math.round(iconNode?.height ?? 32);

    const textHtml = textNodes
      .map((t, idx) => {
        const fontSize = t.fontSize || (t.type === "heading" ? 15 : 13);
        const fontFamily = resolveEmailFontFamily(t.fontFamily);
        const color = escapeHtml(t.color || "#0F172A");
        const fontWeight =
          t.type === "heading" || t.fontWeight === "bold" ? "bold" : "normal";
        const fontStyle = t.fontStyle ? `font-style:${escapeHtml(t.fontStyle)};` : "";
        const textDecoration = t.textDecoration
          ? `text-decoration:${escapeHtml(t.textDecoration)};`
          : "";
        const textAlign = t.textAlign ? `text-align:${escapeHtml(t.textAlign)};` : "";
        const letterSpacing =
          t.letterSpacing !== undefined
            ? `letter-spacing:${Number(t.letterSpacing)}px;`
            : "";
        const marginBottom = idx < textNodes.length - 1 ? "4px" : "0";
        return `<div style="margin:0 0 ${marginBottom} 0;font-family:${fontFamily};font-size:${fontSize}px;font-weight:${fontWeight};${fontStyle}${textDecoration}${textAlign}${letterSpacing}line-height:1.35;color:${color};">${escapeHtml(t.content || "")}</div>`;
      })
      .join("");

    const outerPad = sectionWidth < 580 ? "0" : "8px 24px";

    return `
      <tr>
        <td>
          <table class="email-section-table" role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0" style="width:${sectionWidth}px;">
            <tr>
              <td style="padding:${outerPad};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${safeBgAttr(cardBgNode.backgroundColor || "#FFFFFF")} style="width:100%;${cardBgStyle}${cardBorder}border-radius:${cardRadius};border-collapse:separate !important;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          ${iconSrc
        ? `<td width="${iconW + 14}" valign="middle" style="width:${iconW + 14}px;vertical-align:middle;padding-right:14px;">
                                   <img src="${iconSrc}" alt="" width="${iconW}" height="${iconH}" style="display:block;width:${iconW}px;height:${iconH}px;border:0;outline:none;" />
                                 </td>`
        : ""
      }
                          <td valign="middle" style="vertical-align:middle;">
                            ${textHtml}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  // 3. 2D Coordinate-Mapped Table Layout (Preserves independent x/y geometry for all general sections)
  const renderedRows = renderCoordinateRows(nodes, sectionWidth, 0, 0, sectionBg);
  const maxNodeBottom = nodes.reduce(
    (max, n) => Math.max(max, Math.round(n.y + n.height)),
    0
  );
  const bottomGap = Math.round(sectionHeight - maxNodeBottom);
  const bottomSpacer = bottomGap > 0 ? renderSpacerRow(bottomGap, sectionBg) : "";

  return `
    <tr>
      <td>
        <table class="email-section-table" role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
          style="width:${sectionWidth}px;background-color:${sectionBg};table-layout:fixed;">
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">
                ${renderedRows}
                ${bottomSpacer}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

/**
 * Converts email canvas sections into a responsive, bulletproof 600px HTML email.
 * Supports hyperlinks, buttons, images, typography, and inline CID compatibility.
 */
export async function emailCampaignToHtmlWithReport(
  sections: EmailSection[],
  designName = "My Email Campaign"
): Promise<EmailRenderResult> {
  const safeName = escapeHtml(designName);
  const warnings: EmailRenderWarning[] = [];

  // Preprocess any remaining SVG graphics into high-resolution base64 PNGs
  const preparedSections = await prepareSectionsForEmail(sections);

  const orderedSections = preparedSections
    .map((section, index) => ({ section, index }))
    .sort((a, b) => a.section.y - b.section.y || a.section.x - b.section.x || a.index - b.index)
    .map((entry) => entry.section);

  const sectionBands: EmailSection[][] = [];
  for (const section of orderedSections) {
    const sWidth = Math.max(1, Math.min(EMAIL_CANVAS_WIDTH, Math.round(section.width || EMAIL_CANVAS_WIDTH)));
    const sHeight = Math.max(1, Math.round(section.height));
    const targetBand = sectionBands.find((band) => {
      const bandTop = Math.min(...band.map((s) => s.y));
      const bandBottom = Math.max(...band.map((s) => s.y + s.height));
      const verticalOverlap =
        Math.abs(section.y - bandTop) <= 12 ||
        (section.y < bandBottom - 4 && section.y + sHeight > bandTop + 4);
      if (!verticalOverlap) return false;
      const horizOverlap = band.some((other) => {
        const otherW = Math.max(1, Math.min(EMAIL_CANVAS_WIDTH, Math.round(other.width || EMAIL_CANVAS_WIDTH)));
        return (
          section.x < other.x + otherW - 2 &&
          section.x + sWidth > other.x + 2
        );
      });
      return !horizOverlap;
    });
    if (targetBand) {
      targetBand.push(section);
    } else {
      sectionBands.push([section]);
    }
  }

  let cursorY = 0;
  const sectionHtml = sectionBands
    .map((band) => {
      const bandTop = Math.min(...band.map((s) => s.y));
      const bandBottom = Math.max(...band.map((s) => s.y + s.height));
      const gap = Math.round(bandTop - cursorY);
      const spacer = gap > 0 ? renderSpacerRow(gap) : "";
      cursorY = Math.max(cursorY, Math.round(bandBottom));

      if (band.length === 1) {
        const single = band[0];
        const singleW = Math.max(1, Math.min(EMAIL_CANVAS_WIDTH, Math.round(single.width || EMAIL_CANVAS_WIDTH)));
        const isStandaloneButton =
          single.backgroundColor === "transparent" &&
          single.nodes?.length === 1 &&
          single.nodes[0].type === "button";

        if (singleW >= EMAIL_CANVAS_WIDTH || isStandaloneButton) {
          return `${spacer}${renderSection(single, warnings)}`;
        }

        const leftPad = Math.max(0, Math.round(single.x));
        const rightPad = Math.max(0, EMAIL_CANVAS_WIDTH - leftPad - singleW);
        return `${spacer}
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="${EMAIL_CANVAS_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:${EMAIL_CANVAS_WIDTH}px;max-width:100%;table-layout:fixed;">
                <tr>
                  ${leftPad > 0 ? `<td width="${leftPad}" style="width:${leftPad}px;font-size:0;line-height:0;">&nbsp;</td>` : ""}
                  <td width="${singleW}" valign="top" style="width:${singleW}px;vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                      ${renderSection(single, warnings)}
                    </table>
                  </td>
                  ${rightPad > 0 ? `<td width="${rightPad}" style="width:${rightPad}px;font-size:0;line-height:0;">&nbsp;</td>` : ""}
                </tr>
              </table>
            </td>
          </tr>
        `;
      }

      const sortedBand = [...band].sort((a, b) => a.x - b.x);
      let cursorX = 0;
      const cells: string[] = [];

      for (const sec of sortedBand) {
        const secW = Math.max(1, Math.min(EMAIL_CANVAS_WIDTH, Math.round(sec.width || EMAIL_CANVAS_WIDTH)));
        const gapX = Math.round(sec.x - cursorX);
        if (gapX > 0) {
          cells.push(
            `<td width="${gapX}" style="width:${gapX}px;font-size:0;line-height:0;">&nbsp;</td>`
          );
        }
        const padTop = Math.max(0, Math.round(sec.y - bandTop));
        const isStandaloneBtn =
          sec.backgroundColor === "transparent" &&
          sec.nodes?.length === 1 &&
          sec.nodes[0].type === "button";

        const innerHtml = isStandaloneBtn
          ? renderNode(sec.nodes[0])
          : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">${renderSection(sec, warnings)}</table>`;

        cells.push(
          `<td width="${secW}" valign="top" style="width:${secW}px;vertical-align:top;${padTop > 0 ? `padding-top:${padTop}px;` : ""}">
            ${innerHtml}
          </td>`
        );
        cursorX = Math.max(cursorX, Math.round(sec.x + secW));
      }

      const trailX = Math.round(EMAIL_CANVAS_WIDTH - cursorX);
      if (trailX > 0) {
        cells.push(
          `<td width="${trailX}" style="width:${trailX}px;font-size:0;line-height:0;">&nbsp;</td>`
        );
      }

      return `${spacer}
        <tr>
          <td style="padding:0;">
            <table class="email-section-table" role="presentation" width="${EMAIL_CANVAS_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="width:${EMAIL_CANVAS_WIDTH}px;max-width:100%;table-layout:fixed;">
              <tr>
                ${cells.join("")}
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${safeName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f3f4f6; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-section-table { width: 100% !important; max-width: 100% !important; }
      .email-col-cell { display: block !important; width: 100% !important; padding-left: 0 !important; padding-bottom: 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;-webkit-font-smoothing:antialiased;">
  <!-- Center wrapper table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f3f4f6;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%"
          style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          ${sectionHtml}
        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, warnings };
}

export async function emailCampaignToHtml(
  sections: EmailSection[],
  designName = "My Email Campaign"
): Promise<string> {
  const { html } = await emailCampaignToHtmlWithReport(sections, designName);
  return html;
}
