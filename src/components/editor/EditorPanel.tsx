
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

  if (activePanel === "templates") {
    return (
      <aside className="w-72 shrink-0 h-full overflow-y-auto bg-[#f8fafc] border-r border-gray-200">
        {/* Panel Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Templates
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            Choose a design for your certificate
          </p>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              All templates
            </span>

            <span className="text-xs font-semibold text-gray-700 bg-gray-100 rounded-full px-2.5 py-1">
              {templates.length} designs
            </span>
          </div>
        </div>

        {/* Template Cards */}
        <div className="p-3 flex flex-col gap-4">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => handleTemplateClick(template.id)}
              className="group w-full text-left bg-white rounded-xl border border-gray-200 p-2 hover:border-blue-500 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={`Edit ${template.name}`}
            >
              {/* Certificate Preview */}
              <div
                className="relative w-full overflow-hidden rounded-md bg-gray-100"
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
                  {/* Actual certificate background */}
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
                          element.fontWeight === "bold"
                            ? 700
                            : 400;
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
              <div className="px-1 pt-3 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {template.name}
                  </h3>

                  <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full shrink-0">
                    Certificate
                  </span>
                </div>

                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {template.description}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2.5">
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-800">
                    Edit template
                  </span>

                  <span className="text-sm text-blue-600 group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </button>
          ))}

          {templates.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                No templates available
              </p>

              <p className="text-xs text-gray-500 mt-1">
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
      <aside className="w-72 shrink-0 h-full overflow-y-auto bg-white border-r border-gray-200">
        <ElementsPanel />
      </aside>
    );
  }

  if (activePanel === "text") {
    return (
      <aside className="w-72 shrink-0 h-full overflow-y-auto bg-white border-r border-gray-200">
        <TextPanel />
      </aside>
    );
  }

  if (activePanel === "uploads") {
    return (
      <aside className="w-72 shrink-0 h-full overflow-y-auto bg-white border-r border-gray-200">
        <UploadsPanel />
      </aside>
    );
  }

  if (activePanel === "tools") {
    return (
      <aside className="w-72 shrink-0 h-full overflow-y-auto bg-white border-r border-gray-200">
        <ToolsPanel />
      </aside>
    );
  }

  return null;
}

