import type { EmailSection, EmailNode } from "../context/EmailEditorContext";
import { getNodeLinkUrl, sanitizeEmailUrl, isValidEmailUrl } from "./linkUtils";

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
  const rawLinkUrl = getNodeLinkUrl(node);
  const destinationUrl = sanitizeEmailUrl(rawLinkUrl);

  switch (node.type) {
    case "logo": {
      const logoHtml = `<span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${fontSize}px;font-weight:bold;letter-spacing:-0.2px;line-height:1.2;${color}">${content}</span>`;
      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="text-decoration:none;display:inline-block;${color}">${logoHtml}</a>`
        : logoHtml;
    }

    case "heading": {
      const headingHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${fontSize}px;font-weight:bold;line-height:1.25;white-space:pre-wrap;word-break:break-word;${color}">${content}</div>`;
      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="text-decoration:none;display:inline-block;${color}">${headingHtml}</a>`
        : headingHtml;
    }

    case "text": {
      const textHtml = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${fontSize}px;line-height:1.45;white-space:pre-wrap;word-break:break-word;${color}">${content}</div>`;
      return destinationUrl
        ? `<a href="${destinationUrl}" target="_blank" style="color:inherit;text-decoration:none;display:inline-block;${color}">${textHtml}</a>`
        : textHtml;
    }

    case "button": {
      const bg = escapeHtml(node.backgroundColor || "#6d28d9");
      const textColor = escapeHtml(node.color || "#ffffff");
      const radius = node.borderRadius ?? 6;
      const targetUrl = destinationUrl || "#";

      return `
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:4px 0;">
          <tr>
            <td align="center" bgcolor="${bg}" style="border-radius:${radius}px;background-color:${bg};">
              <a href="${targetUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${fontSize}px;font-weight:bold;color:${textColor};text-decoration:none;border-radius:${radius}px;background-color:${bg};">
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
        <a href="${targetUrl}" target="_blank" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:${fontSize}px;font-weight:600;color:${linkColor};text-decoration:underline;">
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

    default:
      return "";
  }
}

/**
 * Render vertically stacked nodes in a single column table.
 */
function renderStackedNodes(
  nodes: EmailNode[],
  horizontalAlign: "left" | "center" | "right" = "left"
): string {
  if (nodes.length === 0) return "";

  const sorted = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);

  return sorted
    .map((node, index) => {
      const topGap = index === 0 ? 0 : Math.max(4, Math.round(node.y - (sorted[index - 1].y + sorted[index - 1].height)));
      const rendered = renderNode(node);
      if (!rendered) return "";

      return `
        <tr>
          ${topGap > 0 ? `<td height="${topGap}" style="height:${topGap}px;font-size:0;line-height:0;">&nbsp;</td></tr><tr>` : ""}
          <td align="${horizontalAlign}" valign="top" style="vertical-align:top;">
            ${rendered}
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Render an inline horizontal group of elements side-by-side (e.g. social icons or logo + arrow).
 */
function renderInlineHorizontalGroup(
  nodes: EmailNode[],
  alignment: "left" | "right" = "right"
): string {
  if (nodes.length === 0) return "";
  if (nodes.length === 1) return renderNode(nodes[0]);

  const sorted = [...nodes].sort((a, b) => a.x - b.x);

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${alignment}">
      <tr>
        ${sorted
          .map((node, index) => `
            <td valign="middle" style="${index > 0 ? "padding-left:14px;" : ""}">
              ${renderNode(node)}
            </td>
          `)
          .join("")}
      </tr>
    </table>
  `;
}

/**
 * Analyzes and renders an EmailSection into client-compatible HTML email table structures.
 */
function renderSection(section: EmailSection): string {
  const sectionWidth = Math.max(1, Math.round(section.width || 600));
  const sectionHeight = Math.max(1, Math.round(section.height));
  const sectionBg = escapeHtml(section.backgroundColor || "#ffffff");
  const nodes = section.nodes || [];

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
            <table role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
              style="width:${sectionWidth}px;background-color:${sectionBg};">
              <tr>
                <td width="${leftFlank.width}" valign="middle" align="left" style="width:${leftFlank.width}px;padding-left:16px;">
                  ${renderNode(leftFlank)}
                </td>
                <td valign="middle" align="center" style="padding:16px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${renderStackedNodes(middle, "center")}
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

  // 2. Check for 2-Column Split Section (e.g. Header 10 Black Patron, Header 8 Periwinkle Team Update)
  let bestSplit: {
    splitX: number;
    leftGroup: EmailNode[];
    rightGroup: EmailNode[];
    gap: number;
  } | null = null;

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
          <table role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
            style="width:${sectionWidth}px;background-color:${sectionBg};">
            <tr>
              <td style="padding:20px ${rightPad}px 20px ${leftPad}px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="${col1Width}" valign="top" style="width:${col1Width}px;vertical-align:top;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${renderStackedNodes(bestSplit.leftGroup, "left")}
                      </table>
                    </td>
                    <td width="20" style="width:20px;font-size:0;line-height:0;">&nbsp;</td>
                    <td width="${col2Width}" valign="top" align="right" style="width:${col2Width}px;vertical-align:top;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${renderStackedNodes(bestSplit.rightGroup, "right")}
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

  // 3. Row-Clustered Layout (Default for all other sections)
  const sorted = [...nodes].sort((a, b) => a.y - b.y || a.x - b.x);
  const rows: EmailNode[][] = [];
  let currentRow: EmailNode[] = [];

  for (const node of sorted) {
    if (node.type === "container") {
      if (currentRow.length > 0) {
        rows.push(currentRow);
        currentRow = [];
      }
      rows.push([node]);
      continue;
    }

    if (currentRow.length === 0) {
      currentRow.push(node);
    } else {
      const rowMinY = Math.min(...currentRow.map((n) => n.y));
      const yDiff = Math.abs(node.y - rowMinY);

      if (yDiff <= 12) {
        currentRow.push(node);
      } else {
        rows.push(currentRow);
        currentRow = [node];
      }
    }
  }
  if (currentRow.length > 0) rows.push(currentRow);

  const renderedRows = rows
    .map((rowNodes) => {
      // Single Node in row
      if (rowNodes.length === 1) {
        const node = rowNodes[0];

        // Container (divider line)
        if (node.type === "container") {
          const leftPad = Math.max(16, Math.round(node.x));
          const rightPad = Math.max(16, Math.round(sectionWidth - (node.x + node.width)));
          return `
            <tr>
              <td style="padding:6px ${rightPad}px 6px ${leftPad}px;">
                ${renderNode(node)}
              </td>
            </tr>
          `;
        }

        // Centered node (e.g. sponsorship text or CTA button)
        const isCentered =
          Math.abs(node.x - (sectionWidth - node.width) / 2) <= 35 ||
          node.type === "button";

        if (isCentered) {
          return `
            <tr>
              <td align="center" style="padding:4px 24px;">
                ${renderNode(node)}
              </td>
            </tr>
          `;
        }

        // Left-aligned with offset
        const leftPad = Math.max(16, Math.round(node.x));
        return `
          <tr>
            <td align="left" style="padding:4px 24px 4px ${leftPad}px;">
              ${renderNode(node)}
            </td>
          </tr>
        `;
      }

      // Multi-node row: sort left to right
      const sortedRow = [...rowNodes].sort((a, b) => a.x - b.x);
      const leftGroup = sortedRow.filter((n) => n.x < 300);
      const rightGroup = sortedRow.filter((n) => n.x >= 300);

      // Left and Right distribution (e.g. Logo on left, Socials on right)
      if (leftGroup.length > 0 && rightGroup.length > 0) {
        const leftPad = Math.max(16, Math.min(...leftGroup.map((n) => n.x)));
        const rightPad = Math.max(
          16,
          sectionWidth - Math.max(...rightGroup.map((n) => n.x + n.width))
        );

        return `
          <tr>
            <td style="padding:8px ${rightPad}px 8px ${leftPad}px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left" valign="middle">
                    ${renderInlineHorizontalGroup(leftGroup, "left")}
                  </td>
                  <td align="right" valign="middle">
                    ${renderInlineHorizontalGroup(rightGroup, "right")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `;
      }

      // Adjacent horizontal items on the left (e.g. Globe + Website link)
      const leftPad = Math.max(16, Math.min(...sortedRow.map((n) => n.x)));
      return `
        <tr>
          <td style="padding:8px 24px 8px ${leftPad}px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="left">
              <tr>
                ${sortedRow
                  .map(
                    (node, idx) => `
                    <td valign="middle" style="${idx > 0 ? "padding-left:12px;" : ""}">
                      ${renderNode(node)}
                    </td>
                  `
                  )
                  .join("")}
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
        <table role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
          style="width:${sectionWidth}px;background-color:${sectionBg};">
          <tr>
            <td style="padding:16px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${renderedRows}
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
export async function emailCampaignToHtml(
  sections: EmailSection[],
  designName = "My Email Campaign"
): Promise<string> {
  const safeName = escapeHtml(designName);

  // Preprocess any remaining SVG graphics into high-resolution base64 PNGs
  const preparedSections = await prepareSectionsForEmail(sections);

  const sectionHtml = preparedSections.map(renderSection).join("");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
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
}
