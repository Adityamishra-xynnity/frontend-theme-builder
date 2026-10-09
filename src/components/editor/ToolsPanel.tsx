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

import { useState } from "react";

export default function ToolsPanel() {
const [showTools, setShowTools] = useState(true);
const [activeTool, setActiveTool] = useState("select");
const [showDraw, setShowDraw] = useState(false);
const [showDrawSettings, setShowDrawSettings] = useState(false);

const [drawMode, setDrawMode] = useState("pen");
const [drawColor, setDrawColor] = useState("#222222");
const [drawWeight, setDrawWeight] = useState(5);
const [drawTransparency, setDrawTransparency] = useState(100);

return ( <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-full overflow-y-auto">

```
  {/* TOOLS HEADER */}
  <div className="px-5 py-5 border-b border-gray-100">
    <h2 className="text-sm font-bold text-gray-900">
      Tools
    </h2>
    <p className="text-xs text-gray-500 mt-1">
      Create and edit your design
    </p>
  </div>

  {/* MAIN TOOLS */}
  <div className="px-4 pt-5">

    <button
      type="button"
      onClick={() => setShowTools(!showTools)}
      className="w-full flex items-center justify-between px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100"
    >
      <span className="text-sm font-semibold text-gray-800">
        All tools
      </span>
      {showTools ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
    </button>

    {showTools && (
      <div className="space-y-2 mt-3">

        {/* SELECT */}
        <button
          type="button"
          onClick={() => setActiveTool("select")}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
            activeTool === "select"
              ? "bg-gray-100 border-gray-300"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <MousePointer2 size={19} />
          <span className="text-sm font-medium">Select</span>
        </button>

        {/* DRAW */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setActiveTool("draw");
              setShowDraw(!showDraw);
            }}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
          >
            <span className="flex items-center gap-3">
              <Pencil size={19} />
              <span className="text-sm font-medium">Draw</span>
            </span>
            {showDraw ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>

          {showDraw && (
            <div className="px-3 pb-4 space-y-4">

              {/* DRAW MODES */}
              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  onClick={() => setDrawMode("pen")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                    drawMode === "pen" ? "bg-gray-100 border-gray-400" : "border-gray-200"
                  }`}
                >
                  <Pen size={20} />
                  <span className="text-xs">Pen</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawMode("marker")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                    drawMode === "marker" ? "bg-gray-100 border-gray-400" : "border-gray-200"
                  }`}
                >
                  <Pencil size={20} />
                  <span className="text-xs">Marker</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawMode("highlighter")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                    drawMode === "highlighter" ? "bg-gray-100 border-gray-400" : "border-gray-200"
                  }`}
                >
                  <Highlighter size={20} />
                  <span className="text-xs">Highlighter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDrawMode("eraser")}
                  className={`p-3 rounded-lg border flex flex-col items-center gap-2 ${
                    drawMode === "eraser" ? "bg-gray-100 border-gray-400" : "border-gray-200"
                  }`}
                >
                  <Eraser size={20} />
                  <span className="text-xs">Eraser</span>
                </button>

              </div>

              {/* DRAW COLOR */}
              {drawMode !== "eraser" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(event) => setDrawColor(event.target.value)}
                    className="w-full h-10 cursor-pointer rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {/* DRAW SETTINGS */}
              <button
                type="button"
                onClick={() => setShowDrawSettings(!showDrawSettings)}
                className="w-full flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Settings2 size={17} />
                  Settings
                </span>
                {showDrawSettings ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>

              {showDrawSettings && (
                <div className="space-y-4">

                  {/* WEIGHT */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700">
                        Weight
                      </label>
                      <span className="text-xs text-gray-500">
                        {drawWeight}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={drawWeight}
                      onChange={(event) => setDrawWeight(Number(event.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* TRANSPARENCY */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-xs font-medium text-gray-700">
                        Transparency
                      </label>
                      <span className="text-xs text-gray-500">
                        {drawTransparency}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={drawTransparency}
                      onChange={(event) => setDrawTransparency(Number(event.target.value))}
                      className="w-full"
                    />
                  </div>

                </div>
              )}

            </div>
          )}
        </div>

        {/* STICKY NOTES */}
        <button
          type="button"
          onClick={() => setActiveTool("sticky-notes")}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
            activeTool === "sticky-notes"
              ? "bg-gray-100 border-gray-300"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <StickyNote size={19} />
          <span className="text-sm font-medium">Sticky Notes</span>
        </button>

        {/* SIGNATURE */}
        <button
          type="button"
          onClick={() => setActiveTool("signature")}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
            activeTool === "signature"
              ? "bg-gray-100 border-gray-300"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <PenTool size={19} />
          <span className="text-sm font-medium">Signature</span>
        </button>

        {/* TABLE */}
        <button
          type="button"
          onClick={() => setActiveTool("table")}
          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left ${
            activeTool === "table"
              ? "bg-gray-100 border-gray-300"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <Table2 size={19} />
          <span className="text-sm font-medium">Table</span>
        </button>

      </div>
    )}

  </div>

</aside>
);
}
