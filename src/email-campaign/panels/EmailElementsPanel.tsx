
import {
  LayoutTemplate,
  PanelBottom,
  MousePointerClick,
  Smile,
  Blocks,
  Columns2,
  Highlighter,
  Shapes,
  Image,
  Video,
  Film,
  ChartNoAxesCombined,
  FileSpreadsheet,
  Table2,
  ArrowLeft,
  Plus,
  Code2
} from "lucide-react";

import { useState } from "react";
import { useEmailEditor } from "../context/EmailEditorContext";
import type { EmailSectionTemplate } from "../types/campaign";
import { headerTemplates } from "../elements/headerTemplates";
import { footerTemplates } from "../elements/footerTemplates";
import { buttonTemplates } from "../elements/buttonTemplates";
import { elementTemplates } from "../elements/elementTemplates";

const categories = [
  { id: "header", label: "Header", icon: LayoutTemplate, color: "bg-violet-100 text-violet-700" },
  { id: "footer", label: "Footer", icon: PanelBottom, color: "bg-blue-100 text-blue-700" },
  { id: "buttons", label: "Buttons", icon: MousePointerClick, color: "bg-pink-100 text-pink-700" },
  { id: "icons", label: "Icons", icon: Smile, color: "bg-amber-100 text-amber-700" },
  { id: "bricks", label: "Bricks", icon: Blocks, color: "bg-indigo-100 text-indigo-700" },
  { id: "columns", label: "Columns", icon: Columns2, color: "bg-cyan-100 text-cyan-700" },
  { id: "highlights", label: "Highlight blocks", icon: Highlighter, color: "bg-yellow-100 text-yellow-700" },
  { id: "graphics", label: "Graphics", icon: Shapes, color: "bg-orange-100 text-orange-700" },
  { id: "photos", label: "Photos", icon: Image, color: "bg-green-100 text-green-700" },
  { id: "videos", label: "Videos", icon: Video, color: "bg-red-100 text-red-700" },
  { id: "animation", label: "Animation", icon: Film, color: "bg-fuchsia-100 text-fuchsia-700" },
  { id: "charts", label: "Charts", icon: ChartNoAxesCombined, color: "bg-teal-100 text-teal-700" },
  { id: "sheets", label: "Sheets", icon: FileSpreadsheet, color: "bg-emerald-100 text-emerald-700" },
  { id: "tables", label: "Tables", icon: Table2, color: "bg-sky-100 text-sky-700" },
  {
    id: "elements", label: "Elements", icon: Code2, color: "bg-purple-100 text-purple-700",
  }
];

export default function EmailElementsPanel() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { addSection } = useEmailEditor();

  const selectedCategoryLabel = categories.find(
    (category) => category.id === selectedCategory
  )?.label;

  return (
    <div className="flex h-full min-h-[500px] flex-col bg-white">
      {!selectedCategory ? (
        <>
          <div className="p-5">
            <h2 className="text-xl font-bold text-gray-800">Elements</h2>
            <p className="mt-1 text-sm text-gray-500">
              Find ready-made designs for your email.
            </p>

            <input
              type="text"
              placeholder="Search elements..."
              className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 overflow-y-auto px-5 pb-5">
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className="group flex flex-col gap-2 text-left"
                >
                  <div
                    className={`flex aspect-square items-center justify-center rounded-2xl transition group-hover:-translate-y-1 group-hover:shadow-md ${category.color}`}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 shadow-sm group-hover:scale-110">
                      <Icon size={30} strokeWidth={1.7} />
                    </div>
                  </div>

                  <span className="text-center text-xs font-semibold text-gray-700 group-hover:text-violet-700">
                    {category.label}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className="border-b border-gray-100 p-4">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-violet-700"
            >
              <ArrowLeft size={16} />
              All elements
            </button>

            <h2 className="text-lg font-bold text-gray-800">
              {selectedCategoryLabel}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Choose a design to add it to your email.
            </p>
          </div>


          {selectedCategory === "header" ? (
            <div className="flex-1 space-y-3.5 overflow-y-auto p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>{headerTemplates.length} Header layouts</span>
                <span>Click to insert</span>
              </div>
              {headerTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addSection(template)}
                  className="group w-full overflow-hidden rounded-2xl border border-gray-200/90 text-left transition-all hover:border-violet-400 hover:shadow-lg active:scale-[0.99] bg-white"
                >
                  <HeaderMiniaturePreview template={template} />

                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {template.name}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 transition-opacity">
                      <Plus size={13} strokeWidth={2.5} />
                      Insert
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedCategory === "footer" ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {footerTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addSection(template)}
                  className="group w-full overflow-hidden rounded-xl border border-gray-200 text-left transition hover:border-violet-400 hover:shadow-md"
                >
                  <div
                    className="min-h-[145px] space-y-3 p-5 text-center"
                    style={{ backgroundColor: template.backgroundColor }}
                  >
                    {template.nodes.map((node, index) => (
                      <div key={index}>
                        {node.type === "logo" && (
                          <p className="text-sm font-bold tracking-widest text-gray-800">
                            {node.content}
                          </p>
                        )}
                        {node.type === "heading" && (
                          <p className="text-lg font-bold text-gray-900">
                            {node.content}
                          </p>
                        )}
                        {node.type === "text" && (
                          <p className="text-xs text-gray-600">
                            {node.content}
                          </p>
                        )}
                        {node.type === "link" && (
                          <p className="text-xs font-medium text-violet-700">
                            {node.content}
                          </p>
                        )}
                        {node.type === "button" && (
                          <span className="inline-block rounded-md bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
                            {node.content}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between bg-white px-3 py-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {template.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-violet-700">
                      <Plus size={14} />
                      Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedCategory === "buttons" ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {buttonTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addSection(template)}
                  className="group w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-violet-400 hover:shadow-md"
                >
                  <div
                    className="flex min-h-[100px] items-center justify-center rounded-lg"
                    style={{ backgroundColor: template.backgroundColor }}
                  >
                    {template.nodes.map((node, index) => (
                      <span
                        key={index}
                        className="inline-block rounded-md bg-violet-600 px-6 py-3 text-sm font-semibold text-white"
                      >
                        {node.content}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <span className="text-sm font-semibold text-gray-700">
                      {template.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-violet-700">
                      <Plus size={14} /> Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedCategory === "elements" ? (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {elementTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => addSection(template)}
                  className="group w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-purple-400 hover:shadow-md"
                >
                  <div className="mb-3 flex min-h-[100px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-100">
                    <span className="text-sm text-gray-500">
                      &lt;div&gt;
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">
                      {template.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-purple-700">
                      <Plus size={14} /> Add
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-gray-500">
              More {selectedCategoryLabel?.toLowerCase()} designs are coming next.
            </div>
          )}

        </>
      )}
    </div>
  );
}

/**
 * Pixel-accurate miniature preview of header templates for the Elements panel.
 * Uses exact proportional scaling (scale = 328px / 600px ≈ 0.5467)
 * so the thumbnail card matches the Canva design and the inserted canvas layout.
 */
function HeaderMiniaturePreview({
  template,
}: {
  template: EmailSectionTemplate;
}) {
  const height = template.height || 100;
  const scale = 0.5467;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        height: `${Math.round(height * scale)}px`,
        backgroundColor: template.backgroundColor,
      }}
    >
      <div
        style={{
          width: "600px",
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          backgroundColor: template.backgroundColor,
        }}
      >
        {template.nodes.map((node, index) => {
          const fontSize = node.fontSize || 14;
          const left = node.x ?? 24;
          const top = node.y ?? 24;
          const width = node.width ?? 552;
          const nodeHeight = node.height ?? 40;

          if (node.type === "image") {
            const src = node.content || node.url || "";
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${nodeHeight}px`,
                  overflow: "hidden",
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : node.borderRadius || undefined,
                }}
              >
                {src ? (
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: width <= 64 ? "contain" : "cover",
                      borderRadius:
                        typeof node.borderRadius === "number"
                          ? `${node.borderRadius}px`
                          : node.borderRadius || undefined,
                    }}
                  />
                ) : null}
              </div>
            );
          }

          if (node.type === "container") {
            return (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${width}px`,
                  height: `${nodeHeight}px`,
                  backgroundColor:
                    node.backgroundColor || "rgba(255, 255, 255, 0.4)",
                  borderRadius:
                    typeof node.borderRadius === "number"
                      ? `${node.borderRadius}px`
                      : node.borderRadius || undefined,
                }}
              />
            );
          }

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${nodeHeight}px`,
                fontSize: `${fontSize}px`,
                color: node.color || "#ffffff",
                fontWeight:
                  node.type === "heading" || node.type === "logo"
                    ? "bold"
                    : "normal",
                lineHeight: 1.25,
                whiteSpace: "pre-wrap",
                textDecoration: node.type === "link" ? "underline" : "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              {node.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
