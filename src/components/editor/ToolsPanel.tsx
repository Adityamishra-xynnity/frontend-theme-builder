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
  Minus,
  Plus,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";

type DrawMode = "pen" | "marker" | "highlighter" | "eraser";

export default function ToolsPanel() {
  const {
    setToolMode,
    setDrawingSettings,
    addStickyNote,
    addSignature,
    addTable,
  } = useFabric();

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
        ? "bg-violet-50 font-semibold text-violet-800"
        : "text-gray-700 hover:bg-gray-100"
    }`;

  function activateSelect() {
    setActiveTool("select");
    setToolMode("select");
  }

  function activateDrawingTool(mode: DrawMode) {
    setDrawMode(mode);
    setActiveTool("draw");

    setToolMode(mode);
    setDrawingSettings({
      color: drawColor,
      width: weight,
      opacity: transparency / 100,
    });
  }

  function updateColor(color: string) {
    setDrawColor(color);

    setDrawingSettings({
      color,
      width: weight,
      opacity: transparency / 100,
    });
  }

  function updateWeight(value: number) {
    const nextWeight = Math.max(1, Math.min(50, value));

    setWeight(nextWeight);

    setDrawingSettings({
      color: drawColor,
      width: nextWeight,
      opacity: transparency / 100,
    });
  }

  function updateTransparency(value: number) {
    setTransparency(value);

    setDrawingSettings({
      color: drawColor,
      width: weight,
      opacity: value / 100,
    });
  }

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <h2 className="text-lg font-semibold text-gray-900">
          Tools
        </h2>

        <p className="mt-1 text-xs text-gray-500">
          Create something amazing
        </p>
      </div>

      <div className="space-y-5 p-3">
        <button
          type="button"
          onClick={activateSelect}
          className={rowClass(activeTool === "select")}
        >
          <MousePointer2 size={20} strokeWidth={1.8} />
          <span className="flex-1">Select</span>
        </button>

        <section>
          <button
            type="button"
            onClick={() => {
              setShowDraw((value) => !value);

              if (activeTool !== "draw") {
                activateDrawingTool(drawMode);
              }
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
                  {
                    id: "marker" as const,
                    label: "Marker",
                    Icon: Pencil,
                  },
                  {
                    id: "highlighter" as const,
                    label: "Highlighter",
                    Icon: Highlighter,
                  },
                  {
                    id: "eraser" as const,
                    label: "Eraser",
                    Icon: Eraser,
                  },
                ].map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => activateDrawingTool(id)}
                    className={rowClass(
                      activeTool === "draw" && drawMode === id
                    )}
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
                      onChange={(event) =>
                        updateColor(event.target.value)
                      }
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
                onClick={() =>
                  setShowSettings((value) => !value)
                }
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings2 size={17} />

                <span className="flex-1 text-left">
                  Settings
                </span>

                {showSettings ? (
                  <ChevronDown size={15} />
                ) : (
                  <ChevronRight size={15} />
                )}
              </button>

              {showSettings && (
                <div className="space-y-4 px-1 pb-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <label htmlFor="tool-weight">
                        {drawMode === "eraser" ? "Eraser Size" : "Weight"}
                      </label>

                      <span className="font-semibold text-violet-700">
                        {weight}px
                      </span>
                    </div>

                    {drawMode === "eraser" && (
                      <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <span className="text-xs font-medium text-gray-600">
                          Adjust eraser size
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateWeight(weight - 1)}
                            disabled={weight <= 1}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Decrease eraser size"
                            aria-label="Decrease eraser size"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="min-w-8 text-center text-sm font-semibold text-gray-800">
                            {weight}
                          </span>

                          <button
                            type="button"
                            onClick={() => updateWeight(weight + 1)}
                            disabled={weight >= 50}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Increase eraser size"
                            aria-label="Increase eraser size"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      id="tool-weight"
                      type="range"
                      min="1"
                      max="50"
                      value={weight}
                      onChange={(event) =>
                        updateWeight(Number(event.target.value))
                      }
                      className="w-full accent-violet-600"
                    />

                    <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                      <span>1 px</span>
                      <span>50 px</span>
                    </div>
                  </div>

                  {drawMode !== "eraser" && (
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
                          updateTransparency(
                            Number(event.target.value)
                          )
                        }
                        className="w-full accent-violet-600"
                      />
                    </div>
                  )}
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
            onClick={() => {
              addStickyNote();
              setActiveTool("sticky");
            }}
            className={rowClass(activeTool === "sticky")}
          >
            <StickyNote size={20} strokeWidth={1.8} />
            <span>Sticky Notes</span>
          </button>

          <button
            type="button"
            onClick={() => {
              addSignature();
              setActiveTool("signature");
            }}
            className={rowClass(activeTool === "signature")}
          >
            <PenTool size={20} strokeWidth={1.8} />
            <span>Signature</span>
          </button>

          <button
            type="button"
            onClick={() => {
              addTable();
              setActiveTool("table");
            }}
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