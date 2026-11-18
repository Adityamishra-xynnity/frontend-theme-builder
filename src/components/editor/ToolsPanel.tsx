import { useEffect, useState } from "react";
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
  Plus,
  Trash2,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";

type DrawMode = "pen" | "marker" | "highlighter" | "eraser";

const SIGNATURE_FONTS = [
  "Great Vibes", "Allura", "Alex Brush", "Dancing Script",
  "Sacramento", "Parisienne", "Pinyon Script", "Tangerine",
  "Italianno", "Caveat", "Pacifico", "Satisfy", "Yellowtail",
  "Marck Script", "Cedarville Cursive", "Petit Formal Script",
  "Bad Script", "Bilbo", "Bonheur Royale", "Calligraffitti",
  "Charm", "Clicker Script", "Courgette", "Damion",
  "Euphoria Script", "Felipa", "Fleur De Leah", "Homemade Apple",
  "Jim Nightshade", "La Belle Aurore", "Monsieur La Doulaise",
  "Mr De Haviland", "Mrs Saint Delafield", "Nothing You Could Do",
  "Norican", "Qwigley", "Rochester", "Rouge Script",
  "Style Script", "WindSong", "Mea Culpa", "Birthstone",
  "Birthstone Bounce", "Updock", "MonteCarlo", "Ballet",
  "Mrs Sheppards", "The Nautigal", "Waterfall", "Zeyada",
];

export default function ToolsPanel() {
  const {
    selectedObject,
    setToolMode,
    setDrawingSettings,
    addStickyNote,
    addSignature,
    addTable,
    activeTableCell,
    setTableCellText,
    setTableCellBackground,
    setTableRowBackground,
    setTableColumnBackground,
    setTableBorder,
    addTableRow,
    deleteTableRow,
    addTableColumn,
    deleteTableColumn,
  } = useFabric();

  const [activeTool, setActiveTool] = useState("select");
  const [drawMode, setDrawMode] = useState<DrawMode>("pen");
  const [showDraw, setShowDraw] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [drawColor, setDrawColor] = useState("#222222");
  const [weight, setWeight] = useState(5);
  const [transparency, setTransparency] = useState(100);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedColumn, setSelectedColumn] = useState(0);
  const [cellText, setCellText] = useState("");
  const [showSignatureCreator, setShowSignatureCreator] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [signatureFont, setSignatureFont] = useState("Great Vibes");
  const [signatureFontSearch, setSignatureFontSearch] = useState("");
  const [signatureColor, setSignatureColor] = useState("#111827");

  const tableData = selectedObject?.elementType === "table" ? selectedObject.tableData : null;
  const isTableSelected = Boolean(tableData);

  useEffect(() => {
    if (!tableData) {
      setSelectedRow(0);
      setSelectedColumn(0);
      setCellText("");
      return;
    }
    const row = activeTableCell
      ? Math.min(activeTableCell.row, Math.max(0, tableData.rows - 1))
      : Math.min(selectedRow, Math.max(0, tableData.rows - 1));
    const column = activeTableCell
      ? Math.min(activeTableCell.column, Math.max(0, tableData.columns - 1))
      : Math.min(selectedColumn, Math.max(0, tableData.columns - 1));
    setSelectedRow(row);
    setSelectedColumn(column);
    setCellText(tableData.cells?.[row]?.[column]?.text ?? "");
  }, [selectedObject, activeTableCell]);

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
    setDrawingSettings({ color: drawColor, width: weight, opacity: transparency / 100 });
  }

  function updateColor(color: string) {
    setDrawColor(color);
    setDrawingSettings({ color, width: weight, opacity: transparency / 100 });
  }

  function updateWeight(value: number) {
    setWeight(value);
    setDrawingSettings({ color: drawColor, width: value, opacity: transparency / 100 });
  }

  function updateTransparency(value: number) {
    setTransparency(value);
    setDrawingSettings({ color: drawColor, width: weight, opacity: value / 100 });
  }

  function updateCellText() {
    setTableCellText(selectedRow, selectedColumn, cellText);
  }

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-5 py-5">
        <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
        <p className="mt-1 text-xs text-gray-500">Create something amazing</p>
      </div>

      <div className="space-y-5 p-3">
        <button type="button" onClick={activateSelect} className={rowClass(activeTool === "select")}>
          <MousePointer2 size={20} strokeWidth={1.8} />
          <span className="flex-1">Select</span>
        </button>

        <section>
          <button
            type="button"
            onClick={() => {
              setShowDraw((value) => !value);
              if (activeTool !== "draw") activateDrawingTool(drawMode);
            }}
            className={rowClass(activeTool === "draw")}
          >
            <Pencil size={20} strokeWidth={1.8} />
            <span className="flex-1">Draw</span>
            {showDraw ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {showDraw && (
            <div className="ml-3 mt-2 space-y-4 border-l border-gray-200 pl-3">
              <div className="space-y-1">
                {[
                  { id: "pen" as const, label: "Pen", Icon: Pen },
                  { id: "marker" as const, label: "Marker", Icon: Pencil },
                  { id: "highlighter" as const, label: "Highlighter", Icon: Highlighter },
                  { id: "eraser" as const, label: "Eraser", Icon: Eraser },
                ].map(({ id, label, Icon }) => (
                  <button key={id} type="button" onClick={() => activateDrawingTool(id)} className={rowClass(activeTool === "draw" && drawMode === id)}>
                    <Icon size={18} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {drawMode !== "eraser" && (
                <div>
                  <label htmlFor="tool-color" className="mb-2 block text-xs font-medium text-gray-600">Color</label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
                    <input id="tool-color" type="color" value={drawColor} onChange={(event) => updateColor(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent" />
                    <span className="text-xs uppercase text-gray-600">{drawColor}</span>
                  </div>
                </div>
              )}

              <button type="button" onClick={() => setShowSettings((value) => !value)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <Settings2 size={17} />
                <span className="flex-1 text-left">Settings</span>
                {showSettings ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>

              {showSettings && (
                <div className="space-y-4 px-1 pb-2">
                  <div>
                    <div className="mb-2 flex justify-between text-xs"><label htmlFor="tool-weight">Weight</label><span>{weight}px</span></div>
                    <input id="tool-weight" type="range" min="1" max="50" value={weight} onChange={(event) => updateWeight(Number(event.target.value))} className="w-full accent-violet-600" />
                  </div>
                  <div>
                    <div className="mb-2 flex justify-between text-xs"><label htmlFor="tool-transparency">Transparency</label><span>{transparency}%</span></div>
                    <input id="tool-transparency" type="range" min="0" max="100" value={transparency} onChange={(event) => updateTransparency(Number(event.target.value))} className="w-full accent-violet-600" />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <div className="border-t border-gray-100 pt-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Other tools</p>
          <button type="button" onClick={() => { addStickyNote(); setActiveTool("sticky"); }} className={rowClass(activeTool === "sticky")}>
            <StickyNote size={20} strokeWidth={1.8} /><span>Sticky Notes</span>
          </button>
          <button type="button" onClick={() => { setShowSignatureCreator((value) => !value); setActiveTool("signature"); }} className={rowClass(activeTool === "signature")}>
            <PenTool size={20} strokeWidth={1.8} /><span>Signature</span>
            {showSignatureCreator ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <button type="button" onClick={() => { addTable(); setActiveTool("table"); }} className={rowClass(activeTool === "table")}>
            <Table2 size={20} strokeWidth={1.8} /><span>Table</span>
          </button>
        </div>

        {showSignatureCreator && (
          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Signature Creator</h3>
              <button type="button" onClick={() => setShowSignatureCreator(false)} aria-label="Close signature creator" className="text-gray-500 hover:text-gray-900">✕</button>
            </div>
            <div>
              <label htmlFor="signature-text" className="mb-1 block text-xs font-medium text-gray-600">Signature text</label>
              <input id="signature-text" type="text" value={signatureText} onChange={(event) => setSignatureText(event.target.value)} placeholder="Enter your name" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500" />
            </div>
            <div>
              <label htmlFor="signature-font-search" className="mb-2 block text-xs font-medium text-gray-600">Handwriting fonts</label>
              <div className="mb-2 flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-violet-500">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <input id="signature-font-search" type="search" value={signatureFontSearch} onChange={(event) => setSignatureFontSearch(event.target.value)} placeholder="Search handwriting fonts..." className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-gray-400" />
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                {SIGNATURE_FONTS.filter((font) => font.toLowerCase().includes(signatureFontSearch.trim().toLowerCase())).map((font) => (
                  <button key={font} type="button" onClick={() => setSignatureFont(font)} className={`w-full rounded-lg border p-3 text-left transition ${signatureFont === font ? "border-violet-500 bg-violet-50" : "border-gray-200 hover:border-gray-400"}`}>
                    <span className="block text-xs text-gray-500">{font}</span>
                    <span className="block truncate text-2xl text-gray-900" style={{ fontFamily: `"${font}", cursive` }}>{signatureText || "Your Signature"}</span>
                  </button>
                ))}
                {SIGNATURE_FONTS.filter((font) => font.toLowerCase().includes(signatureFontSearch.trim().toLowerCase())).length === 0 && (
                  <p className="px-3 py-5 text-center text-xs text-gray-500">No matching fonts found.</p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="signature-color" className="mb-2 block text-xs font-medium text-gray-600">Signature color</label>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-2">
                <input id="signature-color" type="color" value={signatureColor} onChange={(event) => setSignatureColor(event.target.value)} className="h-9 w-12 cursor-pointer" />
                <span className="text-xs uppercase text-gray-600">{signatureColor}</span>
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-2 text-xs font-medium text-gray-500">Preview</p>
              <p className="break-words text-center text-3xl" style={{ fontFamily: `"${signatureFont}", cursive`, color: signatureColor }}>{signatureText || "Your Signature"}</p>
            </div>
            <button type="button" disabled={!signatureText.trim()} onClick={async () => {
              try { await document.fonts.load(`36px "${signatureFont}"`); } catch { /* use browser fallback if font loading fails */ }
              addSignature(signatureText.trim(), signatureFont, signatureColor);
              setShowSignatureCreator(false);
              setActiveTool("select");
            }} className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">Add Signature</button>
          </section>
        )}

        {isTableSelected && (
          <section className="space-y-4 border-t border-gray-200 pt-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Table settings</h3>
              <p className="mt-1 text-xs text-gray-500">Double-click any table cell on the canvas to select it, then edit its text or color here.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={addTableRow} className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-2 text-xs hover:bg-gray-50"><Plus size={14} /> Add row</button>
              <button type="button" onClick={() => deleteTableRow(selectedRow)} className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-2 text-xs hover:bg-gray-50"><Trash2 size={14} /> Delete row</button>
              <button type="button" onClick={addTableColumn} className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-2 text-xs hover:bg-gray-50"><Plus size={14} /> Add column</button>
              <button type="button" onClick={() => deleteTableColumn(selectedColumn)} className="flex items-center justify-center gap-1 rounded-lg border border-gray-200 px-2 py-2 text-xs hover:bg-gray-50"><Trash2 size={14} /> Delete column</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="table-row" className="mb-1 block text-xs font-medium text-gray-600">Row</label>
                <select id="table-row" value={selectedRow} onChange={(event) => { const value = Number(event.target.value); setSelectedRow(value); setCellText(tableData.cells?.[value]?.[selectedColumn]?.text ?? ""); }} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  {Array.from({ length: tableData.rows }, (_, index) => <option key={index} value={index}>Row {index + 1}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="table-column" className="mb-1 block text-xs font-medium text-gray-600">Column</label>
                <select id="table-column" value={selectedColumn} onChange={(event) => { const value = Number(event.target.value); setSelectedColumn(value); setCellText(tableData.cells?.[selectedRow]?.[value]?.text ?? ""); }} className="w-full rounded-lg border border-gray-200 px-2 py-2 text-sm">
                  {Array.from({ length: tableData.columns }, (_, index) => <option key={index} value={index}>Column {index + 1}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="table-cell-text" className="mb-1 block text-xs font-medium text-gray-600">Cell text (selected cell)</label>
              <textarea id="table-cell-text" rows={2} value={cellText} onChange={(event) => setCellText(event.target.value)} className="w-full resize-y rounded-lg border border-gray-200 p-2 text-sm" />
              <button type="button" onClick={updateCellText} className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">Apply cell text</button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Cell background</p>
              <input aria-label="Cell background color" type="color" value={tableData.cells?.[selectedRow]?.[selectedColumn]?.backgroundColor ?? "#ffffff"} onChange={(event) => setTableCellBackground(selectedRow, selectedColumn, event.target.value)} className="h-9 w-full cursor-pointer rounded border border-gray-200" />
              <p className="text-xs font-semibold text-gray-700">Whole row background</p>
              <input aria-label="Row background color" type="color" value={tableData.cells?.[selectedRow]?.[0]?.backgroundColor ?? "#ffffff"} onChange={(event) => setTableRowBackground(selectedRow, event.target.value)} className="h-9 w-full cursor-pointer rounded border border-gray-200" />
              <p className="text-xs font-semibold text-gray-700">Whole column background</p>
              <input aria-label="Column background color" type="color" value={tableData.cells?.[0]?.[selectedColumn]?.backgroundColor ?? "#ffffff"} onChange={(event) => setTableColumnBackground(selectedColumn, event.target.value)} className="h-9 w-full cursor-pointer rounded border border-gray-200" />
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-700">Table border</p>
              <label htmlFor="table-border-color" className="block text-xs text-gray-600">Border color</label>
              <input id="table-border-color" type="color" value={tableData.borderColor ?? "#cbd5e1"} onChange={(event) => setTableBorder(event.target.value, tableData.borderWidth)} className="h-9 w-full cursor-pointer rounded border border-gray-200" />
              <div className="flex items-center justify-between text-xs text-gray-600"><label htmlFor="table-border-width">Thickness</label><span>{tableData.borderWidth}px</span></div>
              <input id="table-border-width" type="range" min="0" max="10" step="0.5" value={tableData.borderWidth ?? 1} onChange={(event) => setTableBorder(tableData.borderColor, Number(event.target.value))} className="w-full accent-blue-600" />
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
