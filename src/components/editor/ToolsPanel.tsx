
import { useState } from "react";
import {
  MousePointer2,
  Pencil,
  StickyNote,
  PenTool,
  Table2,
  ChevronDown,
  ChevronRight,
  Pen,
  Highlighter,
  Eraser,
  Settings2,
} from "lucide-react";

type DrawMode = "pen" | "marker" | "highlighter" | "eraser";

export default function ToolsPanel() {
  const [activeTool, setActiveTool] = useState("select");
  const [drawMode, setDrawMode] = useState<DrawMode>("pen");
  const [showDraw, setShowDraw] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [drawColor, setDrawColor] = useState("#222222");
  const [weight, setWeight] = useState(5);
  const [transparency, setTransparency] = useState(100);

  const rowClass = (selected: boolean) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
      selected
        ? "bg-violet-50 text-violet-800 font-semibold"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      {/* Panel heading */}
      <div className="border-b border-gray-100 px-5 py-5">
        <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
        <p className="mt-1 text-xs text-gray-500">
          Create something amazing
        </p>
      </div>

      <div className="space-y-5 p-3">
        {/* Select */}
        <button
          type="button"
          onClick={() => setActiveTool("select")}
          className={rowClass(activeTool === "select")}
        >
          <MousePointer2 size={20} strokeWidth={1.8} />
          <span className="flex-1">Select</span>
        </button>

        {/* Draw */}
        <section>
          <button
            type="button"
            onClick={() => {
              setActiveTool("draw");
              setShowDraw((value) => !value);
            }}
            className={rowClass(activeTool === "draw")}
          >
            <Pencil size={20} strokeWidth={1.8} />
            <span className="flex-1">Draw</span>
            {showDraw ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </button>

          {showDraw && (
            <div className="ml-3 mt-2 space-y-4 border-l border-gray-200 pl-3">
              <div className="space-y-1">
                {[
                  { id: "pen" as const, label: "Pen", Icon: Pen },
                  { id: "marker" as const, label: "Marker", Icon: Pencil },
                  {
                    id: "highlighter" as const,
                    label: "Highlighter",
                    Icon: Highlighter,
                  },
                  { id: "eraser" as const, label: "Eraser", Icon: Eraser },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDrawMode(id)}
                    className={rowClass(drawMode === id)}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {drawMode !== "eraser" && (
                <div>
                  <label
                    htmlFor="tool-color"
                    className="mb-2 block text-xs font-medium text-gray-600"
                  >
                    Color
                  </label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                    <input
                      id="tool-color"
                      type="color"
                      value={drawColor}
                      onChange={(event) => setDrawColor(event.target.value)}
                      className="h-8 w-10 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs uppercase text-gray-600">
                      {drawColor}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowSettings((value) => !value)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings2 size={17} />
                <span className="flex-1 text-left">Settings</span>
                {showSettings ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </button>

              {showSettings && (
                <div className="space-y-4 px-1 pb-2">
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <label htmlFor="tool-weight">Weight</label>
                      <span>{weight}px</span>
                    </div>
                    <input
                      id="tool-weight"
                      type="range"
                      min="1"
                      max="50"
                      value={weight}
                      onChange={(event) =>
                        setWeight(Number(event.target.value))
                      }
                      className="w-full accent-violet-600"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <label htmlFor="tool-transparency">
                        Transparency
                      </label>
                      <span>{transparency}%</span>
                    </div>
                    <input
                      id="tool-transparency"
                      type="range"
                      min="0"
                      max="100"
                      value={transparency}
                      onChange={(event) =>
                        setTransparency(Number(event.target.value))
                      }
                      className="w-full accent-violet-600"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="border-t border-gray-100 pt-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Other tools
          </p>

          <button
            type="button"
            onClick={() => setActiveTool("sticky")}
            className={rowClass(activeTool === "sticky")}
          >
            <StickyNote size={20} strokeWidth={1.8} />
            <span>Sticky Notes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("signature")}
            className={rowClass(activeTool === "signature")}
          >
            <PenTool size={20} strokeWidth={1.8} />
            <span>Signature</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTool("table")}
            className={rowClass(activeTool === "table")}
          >
            <Table2 size={20} strokeWidth={1.8} />
            <span>Table</span>
          </button>
        </div>
      </div>
    </aside>
  );
  }