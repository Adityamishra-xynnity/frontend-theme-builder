import test from "node:test";
import assert from "node:assert/strict";
import { emailCampaignToHtmlWithReport } from "../src/email-campaign/utils/emailCampaignToHtml.ts";
import {
  EMAIL_CANVAS_WIDTH,
  EMAIL_EDITING_LIMITS,
  SUPPORTED_ELEMENT_PANEL_CATEGORIES,
  computeScaledSectionFromSnapshot,
  computeSymmetricHorizontalBounds,
  enforceSectionBounds,
  getNodeMinDimensions,
  getSectionMinDimensions,
  isColumnContainerNode,
  resolveEmailFontFamily,
  safeBgAttr,
  sanitizeNodeStylePatch,
} from "../src/email-campaign/utils/emailCompatibilityEngine.ts";
import type { EmailSection } from "../src/email-campaign/context/EmailEditorContext.tsx";

test("symmetric horizontal resize keeps section centered and enforces readable minWidth", () => {
  const startSection: EmailSection = {
    id: "sec-sym",
    name: "Symmetric Card",
    category: "custom",
    templateId: "custom-1",
    padding: "16px",
    x: 0,
    y: 100,
    width: 600,
    height: 160,
    backgroundColor: "#ffffff",
    nodes: [
      {
        id: "btn-1",
        type: "button",
        content: "Subscribe Now",
        x: 200,
        y: 50,
        width: 200,
        height: 44,
        fontSize: 15,
      },
    ],
  };

  // Dragging right edge inward to 400px should center at x = (600 - 400) / 2 = 100
  const resized = computeScaledSectionFromSnapshot(
    startSection,
    { x: 0, y: 100, width: 400, height: 160 },
    "right"
  );
  assert.equal(resized.width, 400);
  assert.equal(resized.x, 100);

  // Dragging below minWidth clamps to sectionMinW and keeps centered
  const { minWidth } = getSectionMinDimensions(startSection);
  const clamped = computeSymmetricHorizontalBounds(
    { x: 0, y: 100, width: 600, height: 160 },
    { x: 150, y: 100, width: 120, height: 160 },
    "left",
    minWidth
  );
  assert.equal(clamped.width, minWidth);
  assert.equal(clamped.x, Math.round((EMAIL_CANVAS_WIDTH - minWidth) / 2));
});

test("text and button minimum dimensions prevent label clipping", () => {
  const btnMin = getNodeMinDimensions("button", {
    content: "Get Started Today",
    fontSize: 16,
  });
  assert.ok(btnMin.minWidth >= 180, `Expected button minWidth >= 180, got ${btnMin.minWidth}`);
  assert.ok(btnMin.minHeight >= 36);

  const textMin = getNodeMinDimensions("text", {
    content: "Internationalization",
    fontSize: 16,
  });
  assert.ok(textMin.minWidth >= 150, `Expected word-safe minWidth >= 150, got ${textMin.minWidth}`);
  assert.ok(textMin.minHeight >= 22);
});

test("enforceSectionBounds prevents horizontal overflow and expands short section height for overflowing children", () => {
  const shortFooter: EmailSection = {
    id: "footer-overflow",
    name: "Dark Footer",
    category: "footer",
    templateId: "footer-1",
    padding: "16px",
    x: 20,
    y: 400,
    width: 650, // overflows 600px
    height: 40, // shorter than child at y=120 + height=24
    backgroundColor: "#111827",
    nodes: [
      {
        id: "f-logo",
        type: "logo",
        content: "Company",
        x: 24,
        y: 12,
        width: 140,
        height: 28,
      },
      {
        id: "f-addr",
        type: "text",
        content: "123 Anywhere St.",
        x: 24,
        y: 120,
        width: 700, // overflows section width
        height: 24,
      },
    ],
  };

  const normalized = enforceSectionBounds(shortFooter);
  assert.ok(normalized.width <= EMAIL_CANVAS_WIDTH);
  assert.ok(normalized.x + normalized.width <= EMAIL_CANVAS_WIDTH);
  assert.ok(normalized.height >= 148, `Expected expanded height >= 148, got ${normalized.height}`);
  assert.ok(normalized.nodes[1].x + normalized.nodes[1].width <= normalized.width);
});

test("compatibility helpers sanitize bgcolor and append email-safe font stacks", () => {
  assert.equal(safeBgAttr("transparent"), "");
  assert.equal(safeBgAttr("rgba(0,0,0,0.5)"), "");
  assert.equal(safeBgAttr("#111827"), ' bgcolor="#111827"');

  assert.equal(resolveEmailFontFamily("Inter"), "'Inter', Arial, Helvetica, sans-serif");
  assert.equal(resolveEmailFontFamily("Georgia"), "Georgia, 'Times New Roman', serif");
  assert.equal(resolveEmailFontFamily("Courier New"), "'Courier New', Courier, monospace");
});

test("sanitizeNodeStylePatch blocks unsupported gradients, opacity, and out-of-range typography while preserving justify and strikethrough", () => {
  const sanitized = sanitizeNodeStylePatch({
    backgroundColor: "#2563eb",
    gradient: "linear-gradient(90deg, #000, #fff)",
    opacity: 0.5,
    fontSize: 4,
    lineHeight: 4.0,
    letterSpacing: 20,
    borderWidth: 15,
    textAlign: "justify",
    textDecoration: "line-through",
  });

  assert.equal(sanitized.backgroundColor, "#2563eb");
  assert.equal(sanitized.gradient, undefined);
  assert.equal(sanitized.opacity, undefined);
  assert.equal(sanitized.fontSize, EMAIL_EDITING_LIMITS.minFontSize);
  assert.equal(sanitized.lineHeight, EMAIL_EDITING_LIMITS.maxLineHeight);
  assert.equal(sanitized.letterSpacing, EMAIL_EDITING_LIMITS.maxLetterSpacing);
  assert.equal(sanitized.borderWidth, EMAIL_EDITING_LIMITS.maxBorderWidth);
  assert.equal(sanitized.textAlign, "justify");
  assert.equal(sanitized.textDecoration, "line-through");

  assert.equal(SUPPORTED_ELEMENT_PANEL_CATEGORIES.has("videos"), false);
  assert.equal(SUPPORTED_ELEMENT_PANEL_CATEGORIES.has("charts"), false);
  assert.equal(SUPPORTED_ELEMENT_PANEL_CATEGORIES.has("buttons"), true);
  assert.equal(SUPPORTED_ELEMENT_PANEL_CATEGORIES.has("highlights"), true);
});

test("legacy gradient, opacity, and unsupported font normalize identically for canvas and HTML", async () => {
  const legacySection: EmailSection = {
    id: "legacy-1",
    name: "Legacy Gradient Card",
    category: "gradient",
    templateId: "highlight-legacy",
    padding: "0",
    x: 0,
    y: 0,
    width: 600,
    height: 100,
    backgroundColor: "#ffffff",
    nodes: [
      {
        id: "l-card",
        type: "container",
        content: "",
        x: 24,
        y: 10,
        width: 552,
        height: 80,
        gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
      },
      {
        id: "l-img",
        type: "image",
        content: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        x: 40,
        y: 26,
        width: 48,
        height: 48,
        opacity: 0.4,
      },
      {
        id: "l-txt",
        type: "text",
        content: "Legacy Justified Strikethrough",
        x: 104,
        y: 26,
        width: 440,
        height: 40,
        fontFamily: "Inter",
        textAlign: "justify",
        textDecoration: "line-through",
        color: "#ffffff",
      },
    ],
  };

  const normalized = enforceSectionBounds(legacySection);
  assert.equal(normalized.nodes[0].gradient, undefined);
  assert.equal(normalized.nodes[0].backgroundColor, "#ec4899");
  assert.equal(normalized.nodes[1].opacity, undefined);
  assert.equal(normalized.nodes[2].fontFamily, "'Inter', Arial, Helvetica, sans-serif");

  const { html } = await emailCampaignToHtmlWithReport([normalized], "Legacy Normalized");
  assert.doesNotMatch(html, /linear-gradient/i);
  assert.doesNotMatch(html, /opacity:/i);
  assert.match(html, /background-color:#ec4899/);
  assert.match(html, /text-align:justify/);
  assert.match(html, /text-decoration:line-through/);
});

test("exports Gmail & Outlook-compatible 600px HTML for bricks, columns, highlight blocks, buttons, and unknown fallbacks", async () => {
  const sections: EmailSection[] = [
    {
      id: "brick-narrow",
      name: "Narrow Brick",
      category: "bricks",
      templateId: "brick-1",
      padding: "0",
      x: 0,
      y: 0,
      width: 600,
      height: 160,
      backgroundColor: "#ffffff",
      nodes: [
        {
          id: "card-1",
          type: "container",
          content: "",
          x: 80,
          y: 10,
          width: 360,
          height: 140,
          backgroundColor: "#ffffff",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          borderRadius: 10,
        },
        {
          id: "accent-1",
          type: "container",
          content: "",
          x: 80,
          y: 10,
          width: 360,
          height: 6,
          backgroundColor: "#2563eb",
        },
        {
          id: "title-1",
          type: "heading",
          content: "Content Block Title",
          x: 104,
          y: 34,
          width: 310,
          height: 28,
          fontSize: 18,
          fontWeight: "bold",
          color: "#0f172a",
        },
      ],
    },
    {
      id: "cols-2",
      name: "Two Columns",
      category: "columns",
      templateId: "columns-2",
      padding: "0",
      x: 0,
      y: 176,
      width: 600,
      height: 120,
      backgroundColor: "#ffffff",
      nodes: [
        {
          id: "c1",
          type: "container",
          content: "",
          x: 24,
          y: 10,
          width: 264,
          height: 100,
          backgroundColor: "#f8fafc",
          borderRadius: 8,
        },
        {
          id: "c1-t",
          type: "text",
          content: "Column Left",
          x: 40,
          y: 36,
          width: 200,
          height: 24,
        },
        {
          id: "c2",
          type: "container",
          content: "",
          x: 312,
          y: 10,
          width: 264,
          height: 100,
          backgroundColor: "#f8fafc",
          borderRadius: 8,
        },
        {
          id: "c2-t",
          type: "text",
          content: "Column Right",
          x: 328,
          y: 36,
          width: 200,
          height: 24,
        },
      ],
    },
    {
      id: "hl-narrow",
      name: "Gradient Highlight",
      category: "gradient",
      templateId: "highlight-gradient-1",
      padding: "0",
      x: 10,
      y: 312,
      width: 220,
      height: 80,
      backgroundColor: "transparent",
      nodes: [
        {
          id: "hl-card",
          type: "container",
          content: "",
          x: 0,
          y: 0,
          width: 220,
          height: 80,
          backgroundColor: "#ec4899",
          gradient: "linear-gradient(135deg, #ec4899, #8b5cf6)",
          borderRadius: 12,
        },
        {
          id: "hl-t",
          type: "heading",
          content: "Add title",
          x: 16,
          y: 16,
          width: 180,
          height: 20,
          fontSize: 14,
          fontWeight: "bold",
          color: "#ffffff",
        },
        {
          id: "hl-b",
          type: "text",
          content: "Add body text",
          x: 16,
          y: 40,
          width: 180,
          height: 18,
          fontSize: 12,
          color: "#ffffff",
        },
      ],
    },
    {
      id: "cta-btn",
      name: "CTA Button",
      category: "button-element",
      templateId: "btn-1",
      padding: "0",
      x: 210,
      y: 410,
      width: 180,
      height: 44,
      backgroundColor: "transparent",
      nodes: [
        {
          id: "cta-1",
          type: "button",
          content: "Get Started",
          linkUrl: "https://example.com/start",
          x: 0,
          y: 0,
          width: 180,
          height: 44,
          fontSize: 15,
          fontFamily: "Inter",
          backgroundColor: "#6d28d9",
          color: "#ffffff",
          borderRadius: 8,
        },
      ],
    },
  ];

  const { html, warnings } = await emailCampaignToHtmlWithReport(sections, "Compatibility Suite");

  assert.equal(warnings.length, 0);
  assert.match(html, /max-width:600px/);
  assert.doesNotMatch(html, /bgcolor="transparent"/i);
  assert.match(html, /width="360"/);
  assert.match(html, /padding:8px 160px 8px 80px;/);
  assert.match(html, /border-collapse:separate !important;/);
  assert.match(html, /Column Left/);
  assert.match(html, /Column Right/);
  assert.match(html, /background-color:#ec4899/);
  assert.doesNotMatch(html, /linear-gradient/i);
  assert.doesNotMatch(html, /position:\s*absolute/i);
  assert.doesNotMatch(html, /display:\s*(flex|grid)/i);
  assert.match(html, /mso-padding-alt:/);
  assert.match(html, /'Inter', Arial, Helvetica, sans-serif/);
});

test("preserves exact horizontal alignment for centered, left, right, narrow resized, and multi-column sections", async () => {
  const startSection: EmailSection = {
    id: "resized-sec",
    name: "Resized Centered Section",
    category: "custom",
    templateId: "custom-1",
    padding: "0",
    x: 0,
    y: 0,
    width: 600,
    height: 100,
    backgroundColor: "#f8fafc",
    nodes: [
      {
        id: "nested-heading",
        type: "heading",
        content: "Centered After Resize",
        x: 150,
        y: 30,
        width: 300,
        height: 36,
        fontSize: 20,
        textAlign: "center",
      },
    ],
  };

  // Simulate horizontal resize from 600px -> 400px (centered at x = 100)
  const resizedSection = computeScaledSectionFromSnapshot(
    startSection,
    { x: 0, y: 0, width: 400, height: 100 },
    "right"
  );
  assert.equal(resizedSection.x, 100);
  assert.equal(resizedSection.width, 400);

  const centeredBtn: EmailSection = {
    id: "btn-center",
    name: "Centered Button",
    category: "button-element",
    templateId: "btn-c",
    padding: "0",
    x: 210,
    y: 120,
    width: 180,
    height: 44,
    backgroundColor: "transparent",
    nodes: [
      {
        id: "b-c",
        type: "button",
        content: "Centered",
        x: 0,
        y: 0,
        width: 180,
        height: 44,
      },
    ],
  };

  const leftAndRightSec: EmailSection = {
    id: "lr-sec",
    name: "Left and Right Alignment",
    category: "custom",
    templateId: "custom-lr",
    padding: "0",
    x: 0,
    y: 180,
    width: 600,
    height: 120,
    backgroundColor: "#ffffff",
    nodes: [
      {
        id: "left-txt",
        type: "text",
        content: "Left Aligned Text",
        x: 24,
        y: 12,
        width: 200,
        height: 24,
        textAlign: "left",
      },
      {
        id: "right-txt",
        type: "text",
        content: "Right Aligned Text",
        x: 376,
        y: 60,
        width: 200,
        height: 24,
        textAlign: "right",
      },
    ],
  };

  const { html } = await emailCampaignToHtmlWithReport(
    [resizedSection, centeredBtn, leftAndRightSec],
    "Horizontal Alignment Parity"
  );

  // Narrow centered section (x=100, width=400, rightPad=100) uses exact 100px left & right spacer cells
  assert.match(html, /<td width="100"[^>]*>&nbsp;<\/td>\s*<td width="400"/);
  assert.match(html, /<td width="400"[\s\S]*?<td width="100"[^>]*>&nbsp;<\/td>/);

  // Centered standalone button (x=210, width=180, rightPad=210)
  assert.match(html, /padding:0 210px 0 210px;/);

  // Left-aligned text (x=24, width=200, rightPad=376) and right-aligned text (x=376, width=200, rightPad=24)
  assert.match(html, /padding:0 376px 0 24px;/);
  assert.match(html, /padding:0 24px 0 376px;/);
});

test("Verified Security block cannot shrink below icon + text minWidth, and text wraps taller when narrowed", () => {
  const verifiedBlock: EmailSection = {
    id: "verified-sec",
    name: "Verified Security",
    category: "highlight",
    templateId: "highlight-verified",
    padding: "12px",
    x: 24,
    y: 0,
    width: 552,
    height: 72,
    backgroundColor: "#ffffff",
    nodes: [
      {
        id: "v-bg",
        type: "container",
        content: "",
        x: 0,
        y: 0,
        width: 552,
        height: 72,
        backgroundColor: "#ecfdf5",
        borderColor: "#a7f3d0",
        borderWidth: 1,
        borderRadius: 10,
      },
      {
        id: "v-icon",
        type: "image",
        content: "https://cdn.example.com/shield.png",
        x: 16,
        y: 20,
        width: 32,
        height: 32,
      },
      {
        id: "v-text",
        type: "heading",
        content: "Verified",
        x: 58,
        y: 24,
        width: 120,
        height: 24,
        fontSize: 16,
        fontWeight: "bold",
      },
    ],
  };

  const { minWidth } = getSectionMinDimensions(verifiedBlock);
  assert.ok(minWidth >= 140, `Verified block minWidth (${minWidth}) must protect icon + text`);

  // Attempt to shrink below minWidth stops at minWidth
  const shrunk = computeScaledSectionFromSnapshot(
    verifiedBlock,
    { x: 0, y: 0, width: 60, height: 72 },
    "right"
  );
  assert.equal(shrunk.width, minWidth);

  // Narrowing wrapped text increases its content-aware minHeight
  const multiLineNode = {
    content: "This security badge guarantees end to end encrypted delivery across inboxes.",
    fontSize: 14,
    fontWeight: "normal",
    lineHeight: 1.4,
  };
  const wideMin = getNodeMinDimensions("text", multiLineNode, 400);
  const narrowMin = getNodeMinDimensions("text", multiLineNode, 140);
  assert.ok(
    narrowMin.minHeight > wideMin.minHeight,
    `Narrower text (${narrowMin.minHeight}px) must wrap taller than wider text (${wideMin.minHeight}px)`
  );
});

test("parent-based 3-column and unequal 2-column layouts scale proportionally and export single table", async () => {
  const threeColSection: EmailSection = {
    id: "cols-3",
    name: "Three Equal Columns",
    category: "columns",
    templateId: "col-3-equal",
    padding: "16px",
    x: 0,
    y: 0,
    width: 600,
    height: 160,
    backgroundColor: "#ffffff",
    nodes: [
      { id: "c1", type: "container", content: "", x: 24, y: 16, width: 170, height: 120, backgroundColor: "#f8fafc" },
      { id: "c1-t", type: "text", content: "Alpha", x: 38, y: 36, width: 142, height: 24, fontSize: 14 },
      { id: "c2", type: "container", content: "", x: 210, y: 16, width: 170, height: 120, backgroundColor: "#f8fafc" },
      { id: "c2-t", type: "text", content: "Beta", x: 224, y: 36, width: 142, height: 24, fontSize: 14 },
      { id: "c3", type: "container", content: "", x: 396, y: 16, width: 170, height: 120, backgroundColor: "#f8fafc" },
      { id: "c3-t", type: "text", content: "Gamma", x: 410, y: 36, width: 142, height: 24, fontSize: 14 },
    ],
  };

  // All 3 column shells are owned by parent (no independent resize handles)
  assert.equal(isColumnContainerNode(threeColSection, threeColSection.nodes[0]), true);
  assert.equal(isColumnContainerNode(threeColSection, threeColSection.nodes[2]), true);
  assert.equal(isColumnContainerNode(threeColSection, threeColSection.nodes[4]), true);
  assert.equal(isColumnContainerNode(threeColSection, threeColSection.nodes[1]), false);

  // Shrinking parent width from 600 -> 450 keeps all 3 columns equal and centered
  const narrowed = computeScaledSectionFromSnapshot(
    threeColSection,
    { x: 0, y: 0, width: 450, height: 160 },
    "right"
  );
  assert.equal(narrowed.width, 450);
  assert.equal(narrowed.x, 75);
  const c1 = narrowed.nodes.find((n) => n.id === "c1")!;
  const c2 = narrowed.nodes.find((n) => n.id === "c2")!;
  const c3 = narrowed.nodes.find((n) => n.id === "c3")!;
  assert.ok(Math.abs(c1.width - c2.width) <= 2 && Math.abs(c2.width - c3.width) <= 2);

  // Attempting to shrink below combined 3-column content minWidth clamps at minWidth
  const { minWidth: colsMinW } = getSectionMinDimensions(threeColSection);
  const tooSmall = computeScaledSectionFromSnapshot(
    threeColSection,
    { x: 0, y: 0, width: 100, height: 160 },
    "left"
  );
  assert.equal(tooSmall.width, colsMinW);

  // HTML export produces one structured table row with 3 cells
  const { html } = await emailCampaignToHtmlWithReport([narrowed], "Three Columns");
  assert.match(html, /Alpha/);
  assert.match(html, /Beta/);
  assert.match(html, /Gamma/);
  assert.equal((html.match(/class="email-col-cell"/g) || []).length, 3);

  // Unequal 2-column (1/3 and 2/3) preserves proportions on parent resize
  const unequalTwoCol: EmailSection = {
    id: "cols-2-unequal",
    name: "Sidebar + Main",
    category: "columns",
    templateId: "col-2-unequal",
    padding: "16px",
    x: 0,
    y: 0,
    width: 600,
    height: 140,
    backgroundColor: "#ffffff",
    nodes: [
      { id: "u1", type: "container", content: "", x: 24, y: 16, width: 170, height: 100, backgroundColor: "#f1f5f9" },
      { id: "u1-t", type: "text", content: "Side", x: 38, y: 36, width: 142, height: 24, fontSize: 14 },
      { id: "u2", type: "container", content: "", x: 210, y: 16, width: 366, height: 100, backgroundColor: "#f8fafc" },
      { id: "u2-t", type: "text", content: "Main Content", x: 226, y: 36, width: 334, height: 24, fontSize: 14 },
    ],
  };

  const resizedUnequal = computeScaledSectionFromSnapshot(
    unequalTwoCol,
    { x: 0, y: 0, width: 480, height: 140 },
    "right"
  );
  const u1 = resizedUnequal.nodes.find((n) => n.id === "u1")!;
  const u2 = resizedUnequal.nodes.find((n) => n.id === "u2")!;
  assert.ok(u2.width > u1.width * 1.9, `Unequal 2-col ratio must be preserved (u1=${u1.width}, u2=${u2.width})`);
});
