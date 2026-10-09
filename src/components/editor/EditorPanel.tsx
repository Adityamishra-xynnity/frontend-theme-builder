
import type { CSSProperties } from "react";
import { useNavigate } from "react-router-dom";

import ElementsPanel from "./ElementsPanel";
import TextPanel from "./TextPanel";
import UploadsPanel from "./UploadsPanel";
import ToolsPanel from "./ToolsPanel";

import { templates } from "../../data/templates";

interface EditorPanelProps {
  activePanel: string;
}

const PREVIEW_WIDTH = 900;
const PREVIEW_HEIGHT = 650;
const PREVIEW_SCALE = 240 / PREVIEW_WIDTH;

export default function EditorPanel({
  activePanel,
}: EditorPanelProps) {
  const navigate = useNavigate();

  const handleTemplateClick = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const panelClass =
    "h-full w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white";

  if (activePanel === "templates") {
    return (
      <aside
        className={`${panelClass} bg-slate-50/80`}
      >
        {/* Panel Header */}
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

        {/* Template Cards */}
        <div className="flex flex-col gap-4 p-3">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template.id)}
              className="group w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              title={`Edit ${template.name}`}
            >
              {/* Certificate Preview */}
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
                        <div
                          key={element.id}
                          style={style}
                        >
                          {isText ? element.text : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Details */}
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

  return null;
}

