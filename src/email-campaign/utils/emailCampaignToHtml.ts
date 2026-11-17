
import type { EmailSection, EmailNode } from "../context/EmailEditorContext";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const safeUrl = (url?: string): string => {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    if (["http:", "https:", "mailto:"].includes(parsed.protocol)) {
      return escapeHtml(url);
    }
  } catch {
    return "";
  }

  return "";
};

function renderNode(node: EmailNode): string {
  const content = escapeHtml(node.content);
  const fontSize = node.fontSize ?? 14;
  const width = Math.max(1, Math.round(node.width));
  const height = Math.max(1, Math.round(node.height));

  const baseStyle = `
    width:${width}px;
    height:${height}px;
    font-family:Arial,sans-serif;
    font-size:${fontSize}px;
    box-sizing:border-box;
    overflow-wrap:break-word;
  `;

  switch (node.type) {
    case "logo":
      return `<div style="${baseStyle}font-size:${fontSize}px;font-weight:bold;">${content}</div>`;

    case "heading":
      return `<div style="${baseStyle}font-weight:bold;">${content}</div>`;

    case "text":
      return `<div style="${baseStyle}white-space:pre-wrap;">${content}</div>`;

    case "button": {
      const url = safeUrl(node.url);
      const button = `
        <span style="display:inline-block;padding:12px 24px;background-color:#6D28D9;color:#ffffff;border-radius:6px;font-size:${fontSize}px;font-weight:bold;">
          ${content}
        </span>
      `;

      return url
        ? `<a href="${url}" style="text-decoration:none;">${button}</a>`
        : button;
    }

    case "link": {
      const url = safeUrl(node.url);

      return url
        ? `<a href="${url}" style="${baseStyle}color:#2563EB;text-decoration:underline;">${content}</a>`
        : `<div style="${baseStyle}">${content}</div>`;
    }

    case "image": {
      const url = safeUrl(node.url || node.content);

      return url
        ? `<img src="${url}" alt="" width="${width}" style="display:block;width:${width}px;max-width:100%;height:auto;border:0;" />`
        : "";
    }

    case "container":
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td height="${height}" style="height:${height}px;background-color:${escapeHtml(node.backgroundColor || "#F3F4F6")};">
              &nbsp;
            </td>
          </tr>
        </table>
      `;

    default:
      return "";
  }
}

function renderSection(section: EmailSection): string {
  const sectionWidth = Math.max(1, Math.round(section.width));
  const sectionHeight = Math.max(1, Math.round(section.height));

  const sortedNodes = [...section.nodes].sort(
    (a, b) => a.y - b.y || a.x - b.x
  );

  let previousBottom = 0;

  const rows = sortedNodes.map((node) => {
    const topGap = Math.max(0, Math.round(node.y - previousBottom));
    previousBottom = Math.max(previousBottom, node.y + node.height);

    const leftGap = Math.max(0, Math.round(node.x));
    const nodeWidth = Math.max(1, Math.round(node.width));

    const content = renderNode(node);

    if (!content) return "";

    return `
      <tr>
        <td height="${topGap}" style="height:${topGap}px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr>
        <td style="padding-left:${leftGap}px;">
          <table role="presentation" width="${nodeWidth}" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top">
                ${content}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }).join("");

  const bottomGap = Math.max(0, sectionHeight - previousBottom);

  return `
    <tr>
      <td>
        <table role="presentation" width="${sectionWidth}" cellpadding="0" cellspacing="0" border="0"
          style="width:${sectionWidth}px;background-color:${escapeHtml(section.backgroundColor)};">
          <tr>
            <td style="padding:${escapeHtml(section.padding)};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${rows}
                <tr>
                  <td height="${bottomGap}" style="height:${bottomGap}px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function emailCampaignToHtml(
  sections: EmailSection[],
  designName = "My Email Campaign"
): string {
  const safeName = escapeHtml(designName);

  const sectionHtml = sections.map(renderSection).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="width:100%;background-color:#f3f4f6;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:100%;max-width:600px;background-color:#ffffff;">
          ${sectionHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
