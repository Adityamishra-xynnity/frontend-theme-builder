import { useState } from "react";
import {
  X,
  Monitor,
  Smartphone,
  Sparkles,
  ArrowLeft,
  Tag,
  ExternalLink,
} from "lucide-react";
import type {
  EmailTemplateResponse,
  EmailSection,
  EmailNode,
} from "../types/campaign";

interface EmailTemplatePreviewModalProps {
  template: EmailTemplateResponse;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: EmailTemplateResponse) => void;
}

export default function EmailTemplatePreviewModal({
  template,
  isOpen,
  onClose,
  onUseTemplate,
}: EmailTemplatePreviewModalProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  if (!isOpen || !template) return null;

  const sections: EmailSection[] = Array.isArray(template.sectionsData)
    ? template.sectionsData
    : [];

  // Calculate total canvas height
  const totalHeight = sections.reduce((acc, sec) => {
    const bottom = (sec.y || 0) + (sec.height || 200);
    return Math.max(acc, bottom);
  }, 600);

  const handleUse = () => {
    onUseTemplate(template);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-sm">
      {/* Top Navigation Bar */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-700/60 bg-slate-900 px-6 text-white shadow-lg">
        {/* Left: Back button & Template info */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title="Back to gallery"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="h-5 w-px bg-slate-700" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-white">
                {template.name}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2 py-0.5 text-[11px] font-medium capitalize text-violet-300">
                <Tag size={10} />
                {template.category}
              </span>
            </div>
            <p className="truncate text-xs text-slate-400">
              {template.description || "Canva-inspired customizable email layout"}
            </p>
          </div>
        </div>

        {/* Center: Desktop / Mobile Device Switcher */}
        <div className="flex items-center rounded-lg bg-slate-800 p-1 border border-slate-700">
          <button
            onClick={() => setViewMode("desktop")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "desktop"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Monitor size={14} />
            <span>Desktop (600px)</span>
          </button>

          <button
            onClick={() => setViewMode("mobile")}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              viewMode === "mobile"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone size={14} />
            <span>Mobile (375px)</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUse}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500"
          >
            <Sparkles size={14} />
            <span>Use this template</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="Close preview"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Preview Canvas Body */}
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-slate-950/70 p-6">
        {viewMode === "desktop" ? (
          /* Desktop View: 600px standard email card */
          <div className="h-fit w-[600px] shrink-0 rounded-lg bg-white shadow-2xl transition-all">
            <StructuredEmailPreview sections={sections} width={600} />
          </div>
        ) : (
          /* Mobile View: 375px phone frame with scaled email viewport */
          <div className="flex h-fit flex-col items-center">
            {/* Phone Bezel */}
            <div className="relative w-[395px] rounded-[38px] border-4 border-slate-700 bg-slate-900 p-2.5 shadow-2xl">
              {/* Notch / Speaker */}
              <div className="mx-auto mb-2 h-4 w-28 rounded-full bg-slate-800" />

              {/* Screen Area (375px wide) */}
              <div
                className="overflow-x-hidden overflow-y-auto rounded-[28px] bg-white"
                style={{ width: "375px", height: "680px" }}
              >
                {/* Scaled 600px design into 375px viewport (scale = 375 / 600 = 0.625) */}
                <div
                  style={{
                    width: "600px",
                    transform: "scale(0.625)",
                    transformOrigin: "top left",
                    height: `${totalHeight * 0.625}px`,
                  }}
                >
                  <StructuredEmailPreview sections={sections} width={600} />
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-slate-700" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom info banner */}
      <footer className="flex h-10 shrink-0 items-center justify-between border-t border-slate-800 bg-slate-900 px-6 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <ExternalLink size={12} />
          <span>Renders real structured template nodes and styling. Ready to edit after loading.</span>
        </span>
        <span>{sections.length} Sections • Category: {template.category}</span>
      </footer>
    </div>
  );
}

/**
 * Pixel-faithful structured email preview renderer:
 * Renders actual sections and nodes with coordinates, styles, typography, and colors.
 */
function StructuredEmailPreview({
  sections,
  width,
}: {
  sections: EmailSection[];
  width: number;
}) {
  if (!sections || sections.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center p-8 text-center text-slate-400">
        <p className="text-sm">No sections defined in this template.</p>
      </div>
    );
  }

  return (
    <div
      className="relative select-none"
      style={{ width: `${width}px`, minHeight: "600px", backgroundColor: "#ffffff" }}
    >
      {sections.map((section) => (
        <div
          key={section.id}
          style={{
            position: "relative",
            width: "100%",
            minHeight: `${section.height || 180}px`,
            backgroundColor: section.backgroundColor || "#ffffff",
            padding: section.padding || "24px",
            boxSizing: "border-box",
          }}
        >
          {section.nodes?.map((node) => (
            <PreviewNodeItem key={node.id} node={node} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Individual Node Renderer for Preview Modal
 */
function PreviewNodeItem({ node }: { node: EmailNode }) {
  const fontSize = node.fontSize || 14;

  switch (node.type) {
    case "logo":
      return (
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: "bold",
            color: node.color || "#1e293b",
            letterSpacing: "0.08em",
            marginBottom: "8px",
          }}
        >
          {node.content}
        </div>
      );

    case "heading":
      return (
        <div
          style={{
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            color: node.color || "#0f172a",
            lineHeight: 1.25,
            marginBottom: "8px",
          }}
        >
          {node.content}
        </div>
      );

    case "text":
      return (
        <div
          style={{
            fontSize: `${fontSize}px`,
            color: node.color || "#475569",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            marginBottom: "8px",
          }}
        >
          {node.content}
        </div>
      );

    case "button":
      return (
        <div style={{ margin: "14px 0" }}>
          <span
            style={{
              display: "inline-block",
              padding: "12px 28px",
              backgroundColor: node.backgroundColor || "#6d28d9",
              color: "#ffffff",
              borderRadius: "8px",
              fontSize: `${fontSize}px`,
              fontWeight: 600,
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              letterSpacing: "0.02em",
            }}
          >
            {node.content}
          </span>
        </div>
      );

    case "link":
      return (
        <div
          style={{
            fontSize: `${fontSize}px`,
            color: node.color || "#2563eb",
            textDecoration: "underline",
            margin: "6px 0",
          }}
        >
          {node.content}
        </div>
      );

    case "image":
      return (
        <div style={{ margin: "12px 0", width: "100%" }}>
          <img
            src={node.url || node.content}
            alt=""
            style={{
              width: "100%",
              maxWidth: "100%",
              height: "auto",
              display: "block",
              borderRadius: "6px",
            }}
          />
        </div>
      );

    case "container":
      return (
        <div
          style={{
            backgroundColor: node.backgroundColor || "#f1f5f9",
            minHeight: `${node.height || 60}px`,
            borderRadius: "6px",
            margin: "8px 0",
            padding: "12px",
          }}
        >
          {node.content}
        </div>
      );

    default:
      return (
        <div style={{ fontSize: `${fontSize}px`, margin: "4px 0" }}>
          {node.content}
        </div>
      );
  }
}
