
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  FileText,
  Monitor,
  RectangleHorizontal,
  RectangleVertical,
} from "lucide-react";

import ElementsPanel from "./ElementsPanel";
import TextPanel from "./TextPanel";
import UploadsPanel from "./UploadsPanel";
import ToolsPanel from "./ToolsPanel";
import HTMLImportPanel from "./HTMLImportPanel";

import { templates } from "../../data/templates";
import type {
  PaperSize,
  PageOrientation,
} from "../../context/EditorContext";

interface EditorPanelProps {
  activePanel: string;
  paperSize: PaperSize;
  orientation: PageOrientation;
  onPaperSizeChange: (size: PaperSize) => void;
  onOrientationChange: (orientation: PageOrientation) => void;
}

const PREVIEW_WIDTH = 900;
const PREVIEW_HEIGHT = 650;
const PREVIEW_SCALE = 240 / PREVIEW_WIDTH;

const paperSizes: {
  id: PaperSize;
  label: string;
  description: string;
}[] = [
  { id: "A1", label: "A1", description: "Large poster" },
  { id: "A2", label: "A2", description: "Poster & display" },
  { id: "A3", label: "A3", description: "Large document" },
  { id: "A4", label: "A4", description: "Standard document" },
  { id: "A5", label: "A5", description: "Small document & flyer" },
];

export default function EditorPanel({
  activePanel,
  paperSize,
  orientation,
  onPaperSizeChange,
  onOrientationChange,
}: EditorPanelProps) {
  const navigate = useNavigate();

  const handleTemplateClick = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const panelClass =
    "h-full w-full min-w-0 overflow-y-auto bg-white";

  if (activePanel === "page-size") {
    return (
      <aside className={panelClass}>
        <div className="border-b border-slate-200 px-4 py-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <FileText size={19} />
            </span>

            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Page Size
              </h2>
              <p className="text-xs text-slate-500">
                Customize your canvas
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-4">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">
                Paper format
              </h3>
              <span className="text-xs text-slate-400">
                ISO A-series
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {paperSizes.map((paper) => {
                const selected = paperSize === paper.id;

                return (
                  <button
                    key={paper.id}
                    type="button"
                    onClick={() => onPaperSizeChange(paper.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                      selected
                        ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        selected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <FileText size={20} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {paper.label}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {paper.description}
                      </span>
                    </span>

                    {selected && (
                      <Check
                        size={18}
                        className="shrink-0 text-violet-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-800">
              Orientation
            </h3>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onOrientationChange("portrait")}
                aria-pressed={orientation === "portrait"}
                className={`flex min-w-0 flex-1 flex-col items-center gap-3 rounded-xl border p-3 transition ${
                  orientation === "portrait"
                    ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <RectangleVertical
                  size={38}
                  strokeWidth={1.6}
                  className={
                    orientation === "portrait"
                      ? "text-violet-600"
                      : "text-slate-500"
                  }
                />

                <span className="text-sm font-semibold text-slate-800">
                  Portrait
                </span>

                {orientation === "portrait" && (
                  <Check size={16} className="text-violet-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => onOrientationChange("landscape")}
                aria-pressed={orientation === "landscape"}
                className={`flex min-w-0 flex-1 flex-col items-center gap-3 rounded-xl border p-3 transition ${
                  orientation === "landscape"
                    ? "border-violet-500 bg-violet-50 ring-1 ring-violet-200"
                    : "border-slate-200 hover:border-violet-300"
                }`}
              >
                <RectangleHorizontal
                  size={38}
                  strokeWidth={1.6}
                  className={
                    orientation === "landscape"
                      ? "text-violet-600"
                      : "text-slate-500"
                  }
                />

                <span className="text-sm font-semibold text-slate-800">
                  Landscape
                </span>

                {orientation === "landscape" && (
                  <Check size={16} className="text-violet-600" />
                )}
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Monitor size={16} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">
                Current page
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                <div
                  className="bg-violet-50"
                  style={{
                    width:
                      orientation === "landscape" ? "44px" : "27px",
                    height:
                      orientation === "landscape" ? "27px" : "44px",
                    border: "1px solid #a78bfa",
                  }}
                />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-900">
                  {paperSize} ·{" "}
                  {orientation === "portrait"
                    ? "Portrait"
                    : "Landscape"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Canvas proportions update with your selection.
                </p>
              </div>
            </div>
          </section>

          <p className="text-xs leading-relaxed text-slate-400">
            Choose a paper size and orientation to adjust your design
            workspace.
          </p>
        </div>
      </aside>
    );
  }

  if (activePanel === "templates") {
    return (
      <aside className={panelClass}>
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Templates
            </h2>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {templates.length}
            </span>
          </div>

          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Choose a design for your certificate.
          </p>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">
              All templates
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Certificate designs
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template.id)}
              className="group w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              title={`Edit ${template.name}`}
            >
              <div
                className="relative w-full overflow-hidden rounded-lg bg-slate-100 ring-1 ring-black/5"
                style={{
                  aspectRatio: `${PREVIEW_WIDTH} / ${PREVIEW_HEIGHT}`,
                }}
              >
                <div
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    width: `${PREVIEW_WIDTH}px`,
                    height: `${PREVIEW_HEIGHT}px`,
                    transform: `scale(${PREVIEW_SCALE})`,
                  }}
                >
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                      backgroundColor: template.backgroundColor,
                    }}
                  >
                    {template.elements.map((element) => {
                      const isShape =
                        element.type === "rectangle" ||
                        element.type === "circle" ||
                        element.type === "triangle";

                      const isText =
                        element.type === "heading" ||
                        element.type === "subheading" ||
                        element.type === "text";

                      if (!isShape && !isText) {
                        return null;
                      }

                      const style: CSSProperties = {
                        position: "absolute",
                        left: element.x,
                        top: element.y,
                        width: element.width,
                        height: element.height,
                        boxSizing: "border-box",
                      };

                      if (isShape) {
                        if (element.type === "circle") {
                          style.borderRadius = "50%";
                        }

                        if (element.type === "triangle") {
                          style.backgroundColor =
                            element.backgroundColor ||
                            element.color ||
                            "#000000";

                          style.clipPath =
                            "polygon(50% 0%, 100% 100%, 0% 100%)";
                        } else if (
                          element.backgroundColor &&
                          element.backgroundColor !== "transparent"
                        ) {
                          style.backgroundColor =
                            element.backgroundColor;
                        } else if (element.color) {
                          style.border = `2px solid ${element.color}`;
                        }
                      }

                      if (isText) {
                        style.display = "flex";
                        style.alignItems = "center";
                        style.justifyContent = "center";
                        style.textAlign = "center";
                        style.fontFamily =
                          element.fontFamily || "Arial, sans-serif";
                        style.fontSize = element.fontSize || 16;
                        style.fontWeight =
                          element.fontWeight === "bold" ? 700 : 400;
                        style.color = element.color || "#222222";
                        style.lineHeight = 1.15;
                        style.whiteSpace = "normal";
                        style.overflow = "hidden";
                        style.overflowWrap = "break-word";
                        style.wordBreak = "normal";
                        style.padding = 0;
                      }

                      return (
                        <div key={element.id} style={style}>
                          {isText ? element.text : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="px-1 pb-1 pt-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-snug text-slate-800 transition-colors group-hover:text-blue-700">
                    {template.name}
                  </h3>

                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                    Certificate
                  </span>
                </div>

                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                  {template.description}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs font-semibold text-blue-600 transition-colors group-hover:text-blue-800">
                    Edit template
                  </span>

                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-sm text-blue-600 transition-all group-hover:translate-x-0.5 group-hover:bg-blue-100">
                    →
                  </span>
                </div>
              </div>
            </button>
          ))}

          {templates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                No templates available
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Add a template to see it here.
              </p>
            </div>
          )}
        </div>
      </aside>
    );
  }

  if (activePanel === "elements") {
    return (
      <aside className={panelClass}>
        <ElementsPanel />
      </aside>
    );
  }

  if (activePanel === "text") {
    return (
      <aside className={panelClass}>
        <TextPanel />
      </aside>
    );
  }

  if (activePanel === "uploads") {
    return (
      <aside className={panelClass}>
        <UploadsPanel />
      </aside>
    );
  }

  if (activePanel === "tools") {
    return (
      <aside className={panelClass}>
        <ToolsPanel />
      </aside>
    );
  }

  if (activePanel === "html-import") {
    return (
      <aside className={panelClass}>
        <HTMLImportPanel />
      </aside>
    );
  }

  return null;
}
