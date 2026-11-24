import type { EmailNode } from "../types/campaign";

/**
 * Validates and sanitizes destination URLs for Email Campaign elements.
 * Supports http:, https:, mailto:, and tel: protocols.
 * Rejects unsafe schemes such as javascript:, data:, vbscript:.
 */

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

/**
 * Checks if a string is a safe, valid hyperlink destination.
 */
export function isValidEmailUrl(input?: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Reject script injections and unsafe protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return false;
  }

  // Handle mailto: and tel:
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+/i.test(trimmed)) {
    return true;
  }
  if (/^tel:[+0-9\s().-]+$/i.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(normalizeLinkUrl(trimmed));
    return ALLOWED_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Automatically normalizes human-entered URLs (e.g. "instagram.com" -> "https://instagram.com").
 */
export function normalizeLinkUrl(input?: string): string {
  if (!input) return "";
  let trimmed = input.trim();
  if (!trimmed) return "";

  // If already has safe protocol, return as is
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }

  // Prepend https:// for standard web addresses
  return `https://${trimmed}`;
}

/**
 * Retrieves the effective hyperlink URL from an EmailNode.
 * Checks linkUrl first, then falls back to url if not an image data source.
 */
export function getNodeLinkUrl(node?: EmailNode | null): string {
  if (!node) return "";

  // Check explicit linkUrl first
  if (node.linkUrl && node.linkUrl.trim()) {
    return node.linkUrl.trim();
  }

  // Check legacy or existing url attribute
  if (node.url && typeof node.url === "string") {
    const trimmed = node.url.trim();

    // If node is an image, only treat url as a link if it's NOT the image content itself
    if (node.type === "image") {
      if (
        trimmed &&
        !trimmed.startsWith("data:image/") &&
        trimmed !== (node.content || "").trim() &&
        (trimmed.startsWith("http://") ||
          trimmed.startsWith("https://") ||
          trimmed.startsWith("mailto:") ||
          trimmed.startsWith("tel:"))
      ) {
        return trimmed;
      }
      return "";
    }

    return trimmed;
  }

  return "";
}

/**
 * Sanitizes URL for HTML output, ensuring safe protocol and HTML escaping.
 */
export function sanitizeEmailUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!isValidEmailUrl(trimmed)) return "";

  const normalized = normalizeLinkUrl(trimmed);

  return normalized
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Formats a URL for compact display in UI popovers and toolbars.
 */
export function formatDisplayUrl(url?: string, maxLength = 32): string {
  if (!url) return "";
  try {
    const cleaned = url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    if (cleaned.length <= maxLength) return cleaned;
    return `${cleaned.substring(0, maxLength - 3)}...`;
  } catch {
    return url.length <= maxLength ? url : `${url.substring(0, maxLength - 3)}...`;
  }
}
