
import { useEffect, useRef, useState } from "react";
import {
  Undo2,
  Redo2,
  Layers,
  ArrowUpToLine,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  Copy,
  Trash2,
  Type,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  X,
  Download,
  ImageDown,
  FileDown,
  ChevronDown,
  Palette,
  BetweenVerticalStart,
  LetterText,
  List,
  ListOrdered,
  IndentDecrease,
  IndentIncrease,
  RotateCcw,
  RotateCw,
  Minus,
  Plus,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";
import { useEditor } from "../../context/EditorContext";

type EditableText = {
  text?: string;
  underline?: boolean;
  linethrough?: boolean;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  set?: (properties: Record<string, unknown>) => void;
  canvas?: { requestRenderAll: () => void };
  dirty?: boolean;
};

export default function Toolbar() {
  const {
    selectedObject,
    selectedFontSize,
    deleteSelected,
    duplicateSelected,
    undo,
    redo,
    increaseFontSize,
    decreaseFontSize,
    setFontSize,
    setTextColor,
    setShapeColor,
    setFontFamily,
    toggleBold,
    toggleItalic,
    setLineSpacing,
    setLetterSpacing,
    alignObject,
    rotateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    canUndo,
    canRedo,
    saveCurrentDesign,
    downloadPNG,
    downloadPDF,
  } = useFabric();

  const {
    backgroundColor,
    setCanvasBackground,
    currentDesignName,
  } = useEditor();

  const object = selectedObject as EditableText | null;

  const [fontSize, setFontSizeState] = useState(selectedFontSize ?? 18);
  const [lineSpacing, setLineSpacingState] = useState(1.16);
  const [letterSpacing, setLetterSpacingState] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designName, setDesignName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [rotation, setRotation] = useState(0);

  const downloadRef = useRef<HTMLDivElement>(null);

  const isText =
    selectedObject?.type === "i-text" ||
    selectedObject?.type === "textbox";

  const isShape = [
    "rect",
    "circle",
    "triangle",
    "polygon",
    "path",
    "line",
  ].includes(selectedObject?.type ?? "");

  const isImage = selectedObject?.type === "image";

  const selectedFill =
    typeof selectedObject?.fill === "string"
      ? selectedObject.fill
      : "#222222";

  useEffect(() => {
    if (selectedFontSize != null) {
      setFontSizeState(selectedFontSize);
    }
  }, [selectedFontSize]);

  useEffect(() => {
    if (!selectedObject) return;

    setLineSpacingState(
      typeof selectedObject.lineHeight === "number"
        ? selectedObject.lineHeight
        : 1.16
    );

    setLetterSpacingState(
      typeof selectedObject.charSpacing === "number"
        ? selectedObject.charSpacing
        : 0
    );

    setRotation(selectedObject.angle ?? 0);
  }, [selectedObject]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        downloadRef.current &&
        !downloadRef.current.contains(event.target as Node)
      ) {
        setShowDownloadMenu(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function preserveSelection(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
  }

  function updateSelectedText(nextText: string) {
    if (!isText || !object?.set) return;

    object.set({ text: nextText });
    object.dirty = true;
    object.canvas?.requestRenderAll();
  }

  function applyList(type: "bullet" | "number") {
    if (!isText || typeof object?.text !== "string") return;

    const lines = object.text.split("\n");

    const updatedLines = lines.map((line, index) => {
      const cleanLine = line.replace(
        /^\s*(?:[•▪◦]\s*|\d+[.)]\s*)/,
        ""
      );

      if (type === "bullet") {
        return cleanLine.trim() ? `• ${cleanLine}` : "";
      }

      return cleanLine.trim()
        ? `${index + 1}. ${cleanLine}`
        : "";
    });

    updateSelectedText(updatedLines.join("\n"));
  }

  function changeIndent(direction: "increase" | "decrease") {
    if (!isText || typeof object?.text !== "string") return;

    const lines = object.text.split("\n");

    const updatedLines = lines.map((line) => {
      if (direction === "increase") {
        return line.trim() ? `    ${line}` : line;
      }

      return line.replace(/^ {1,4}/, "");
    });

    updateSelectedText(updatedLines.join("\n"));
  }

  function toggleTextDecoration(
    property: "underline" | "linethrough"
  ) {
    if (!isText || !object?.set) return;

    object.set({ [property]: !object[property] });
    object.dirty = true;
    object.canvas?.requestRenderAll();
  }

  function handleFontSizeChange(value: string) {
    const next = Number(value);
    setFontSizeState(next);

    if (Number.isFinite(next) && next >= 8 && next <= 200) {
      setFontSize(next);
    }
  }

  function handleLineSpacingChange(value: string) {
    const next = Number(value);
    setLineSpacingState(next);
    setLineSpacing(next);
  }

  function handleLetterSpacingChange(value: string) {
    const next = Number(value);
    setLetterSpacingState(next);

    if (Number.isFinite(next) && next >= 0 && next <= 100) {
      setLetterSpacing(next);
    }
  }

  function openSaveModal() {
    setDesignName(
      currentDesignName && currentDesignName !== "My Certificate"
        ? currentDesignName
        : ""
    );
    setSaveError("");
    setShowSaveModal(true);
  }

  function closeSaveModal() {
    setShowSaveModal(false);
    setSaveError("");
  }

  function handleSave() {
    const name = designName.trim();

    if (!name) {
      setSaveError("Please enter a certificate name.");
      return;
    }

    saveCurrentDesign(name);
    setShowSaveModal(false);
    setDesignName("");
    setSaveError("");
  }

  const button =
    "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-lg px-2.5 text-slate-600 transition-all duration-150 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-35";

  const divider = "mx-1.5 h-6 w-px shrink-0 bg-slate-200";

  const field =
    "h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const group = "flex shrink-0 items-center gap-1";

  const panel =
    "flex h-12 items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 shadow-[0_2px_8px_rgba(15,23,42,0.035)]";

  const colorPicker =
    "absolute inset-0 h-full w-full cursor-pointer opacity-0";

  return (
    <>
      <div className="relative z-40 w-full border-b border-slate-200 bg-slate-50/95 px-3 py-3">
        <div className="overflow-x-auto pb-0.5">
          <div className="min-w-max space-y-2">
            {/* ROW 1: History, layers, typography and export */}
            <div className={panel}>
              <div className={group}>
                <button
                  type="button"
                  onMouseDown={preserveSelection}
                  onClick={undo}
                  disabled={!canUndo}
                  className={button}
                  title="Undo"
                  aria-label="Undo"
                >
                  <Undo2 size={17} strokeWidth={2} />
                </button>

                <button
                  type="button"
                  onMouseDown={preserveSelection}
                  onClick={redo}
                  disabled={!canRedo}
                  className={button}
                  title="Redo"
                  aria-label="Redo"
                >
                  <Redo2 size={17} strokeWidth={2} />
                </button>
              </div>

              <div className={divider} />

              {selectedObject && (
                <>
                  <div className={group}>
                    <span
                      className="flex items-center px-1.5 text-indigo-600"
                      title="Layer controls"
                    >
                      <Layers size={18} strokeWidth={2} />
                    </span>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={bringToFront}
                      className={button}
                      title="Bring to front"
                      aria-label="Bring to front"
                    >
                      <ArrowUpToLine size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={bringForward}
                      className={button}
                      title="Bring forward"
                      aria-label="Bring forward"
                    >
                      <ArrowUp size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={sendBackward}
                      className={button}
                      title="Send backward"
                      aria-label="Send backward"
                    >
                      <ArrowDown size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={sendToBack}
                      className={button}
                      title="Send to back"
                      aria-label="Send to back"
                    >
                      <ArrowDownToLine size={16} />
                    </button>
                  </div>

                  <div className={divider} />

                  <div className={group}>
                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={duplicateSelected}
                      className={button}
                      title="Duplicate object"
                      aria-label="Duplicate object"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={deleteSelected}
                      className={`${button} text-rose-500 hover:bg-rose-50 hover:text-rose-600`}
                      title="Delete object"
                      aria-label="Delete object"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className={divider} />
                </>
              )}

              {isText && (
                <>
                  <div className={group}>
                    <Type size={16} className="text-slate-400" />

                    <select
                      aria-label="Font family"
                      value={selectedObject?.fontFamily ?? "Arial"}
                      onChange={(event) =>
                        setFontFamily(event.target.value)
                      }
                      className={`${field} w-36`}
                      title="Font family"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Inter">Inter</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Courier New">Courier New</option>
                    </select>

                    <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white transition focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
                      <button
                        type="button"
                        onMouseDown={preserveSelection}
                        onClick={decreaseFontSize}
                        className="flex h-full w-8 items-center justify-center text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                        title="Decrease font size"
                        aria-label="Decrease font size"
                      >
                        <Minus size={13} />
                      </button>

                      <input
                        type="number"
                        min={8}
                        max={200}
                        value={fontSize}
                        onChange={(event) =>
                          handleFontSizeChange(event.target.value)
                        }
                        className="h-full w-12 border-x border-slate-200 text-center text-xs font-semibold text-slate-700 outline-none"
                        title="Font size"
                        aria-label="Font size"
                      />

                      <button
                        type="button"
                        onMouseDown={preserveSelection}
                        onClick={increaseFontSize}
                        className="flex h-full w-8 items-center justify-center text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-700"
                        title="Increase font size"
                        aria-label="Increase font size"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>

                  <div className={divider} />

                  <div className="flex items-center gap-0.5 rounded-xl bg-slate-100/80 p-1">
                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={toggleBold}
                      className={button}
                      title="Bold"
                      aria-label="Bold"
                    >
                      <Bold size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={toggleItalic}
                      className={button}
                      title="Italic"
                      aria-label="Italic"
                    >
                      <Italic size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => toggleTextDecoration("underline")}
                      className={button}
                      title="Underline"
                      aria-label="Underline"
                    >
                      <Underline size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => toggleTextDecoration("linethrough")}
                      className={button}
                      title="Strikethrough"
                      aria-label="Strikethrough"
                    >
                      <Strikethrough size={16} />
                    </button>
                  </div>

                  <label
                    className="relative flex h-9 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-indigo-400 hover:bg-indigo-50"
                    title="Text color"
                  >
                    <span className="text-base font-bold text-slate-800">
                      A
                    </span>
                    <span
                      className="absolute bottom-1 h-1 w-5 rounded-full"
                      style={{ backgroundColor: selectedFill }}
                    />
                    <input
                      type="color"
                      value={
                        /^#[0-9a-f]{6}$/i.test(selectedFill)
                          ? selectedFill
                          : "#222222"
                      }
                      onChange={(event) =>
                        setTextColor(event.target.value)
                      }
                      className={colorPicker}
                      aria-label="Text color"
                    />
                  </label>

                  <div className={divider} />

                  {/* Text alignment controls */}
                  <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => alignObject("left")}
                      className={button}
                      title="Align left"
                      aria-label="Align left"
                    >
                      <AlignLeft size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => alignObject("center")}
                      className={button}
                      title="Align center"
                      aria-label="Align center"
                    >
                      <AlignCenter size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => alignObject("right")}
                      className={button}
                      title="Align right"
                      aria-label="Align right"
                    >
                      <AlignRight size={16} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => alignObject("justify")}
                      className={button}
                      title="Justify alignment"
                      aria-label="Justify alignment"
                    >
                      <AlignJustify size={16} />
                    </button>
                  </div>
                </>
              )}

              <div className="ml-auto flex shrink-0 items-center gap-2 pl-3">
                <button
                  type="button"
                  onClick={openSaveModal}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
                >
                  <Save size={15} />
                  Save
                </button>

                <div className="relative" ref={downloadRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setShowDownloadMenu((previous) => !previous)
                    }
                    aria-expanded={showDownloadMenu}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
                  >
                    <Download size={15} />
                    Download
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        showDownloadMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {showDownloadMenu && (
                    <div className="absolute right-0 top-full z-[100] mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDownloadMenu(false);
                          downloadPNG();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-indigo-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <ImageDown size={18} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-slate-800">
                            Download PNG
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-500">
                            Export as a high-quality image
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowDownloadMenu(false);
                          downloadPDF();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-rose-50"
                      >
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                          <FileDown size={18} />
                        </span>
                        <span>
                          <span className="block text-xs font-semibold text-slate-800">
                            Download PDF
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-500">
                            Export a print-ready document
                          </span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ROW 2: Text spacing, lists, rotation and canvas */}
            <div className={panel}>
              {isText && (
                <>
                  <div className={group}>
                    <BetweenVerticalStart
                      size={16}
                      className="text-slate-400"
                    />

                    <select
                      aria-label="Line spacing"
                      value={lineSpacing}
                      onChange={(event) =>
                        handleLineSpacingChange(event.target.value)
                      }
                      className={`${field} w-24`}
                      title="Line spacing"
                    >
                      <option value={0.75}>0.75</option>
                      <option value={1}>1.0</option>
                      <option value={1.16}>1.16</option>
                      <option value={1.25}>1.25</option>
                      <option value={1.5}>1.5</option>
                      <option value={1.75}>1.75</option>
                      <option value={2}>2.0</option>
                      <option value={2.5}>2.5</option>
                      <option value={3}>3.0</option>
                    </select>
                  </div>

                  <div className={divider} />

                  <div className={group}>
                    <LetterText size={16} className="text-slate-400" />

                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={letterSpacing}
                      onChange={(event) =>
                        handleLetterSpacingChange(event.target.value)
                      }
                      className={`${field} w-20 text-center`}
                      title="Letter spacing"
                      aria-label="Letter spacing"
                    />
                  </div>

                  <div className={divider} />

                  <div className="flex items-center gap-0.5 rounded-xl bg-slate-100/80 p-1">
                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => applyList("bullet")}
                      className={button}
                      title="Bulleted list"
                      aria-label="Bulleted list"
                    >
                      <List size={17} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => applyList("number")}
                      className={button}
                      title="Numbered list"
                      aria-label="Numbered list"
                    >
                      <ListOrdered size={17} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => changeIndent("decrease")}
                      className={button}
                      title="Decrease indent"
                      aria-label="Decrease indent"
                    >
                      <IndentDecrease size={17} />
                    </button>

                    <button
                      type="button"
                      onMouseDown={preserveSelection}
                      onClick={() => changeIndent("increase")}
                      className={button}
                      title="Increase indent"
                      aria-label="Increase indent"
                    >
                      <IndentIncrease size={17} />
                    </button>
                  </div>
                </>
              )}

              {selectedObject && (
                <>
                  {isText && <div className={divider} />}

                  {isImage && (
                    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onMouseDown={preserveSelection}
                        onClick={() => rotateSelected(-15)}
                        className={button}
                        title="Rotate left 15 degrees"
                        aria-label="Rotate left"
                      >
                        <RotateCcw size={16} />
                      </button>

                      <span className="min-w-12 rounded-md bg-white px-2 py-1 text-center text-xs font-semibold text-slate-600">
                        {rotation}°
                      </span>

                      <button
                        type="button"
                        onMouseDown={preserveSelection}
                        onClick={() => rotateSelected(15)}
                        className={button}
                        title="Rotate right 15 degrees"
                        aria-label="Rotate right"
                      >
                        <RotateCw size={16} />
                      </button>
                    </div>
                  )}

                  {isShape && (
                    <label
                      className="relative flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 transition hover:border-indigo-300 hover:bg-indigo-50"
                      title="Shape color"
                    >
                      <Palette size={16} className="text-slate-500" />

                      <span className="text-xs font-medium text-slate-600">
                        Shape color
                      </span>

                      <span
                        className="h-4 w-4 rounded-md border border-slate-200 shadow-sm"
                        style={{ backgroundColor: selectedFill }}
                      />

                      <input
                        type="color"
                        value={
                          /^#[0-9a-f]{6}$/i.test(selectedFill)
                            ? selectedFill
                            : "#2563eb"
                        }
                        onChange={(event) =>
                          setShapeColor(event.target.value)
                        }
                        className={colorPicker}
                        aria-label="Shape color"
                      />
                    </label>
                  )}
                </>
              )}

              <div className="ml-auto flex shrink-0 items-center gap-3 pl-3">
                <label
                  className="relative flex h-9 cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50"
                  title="Canvas background color"
                >
                  <Palette size={15} className="text-indigo-500" />

                  <span>Background</span>

                  <span
                    className="h-4 w-4 rounded-md border border-slate-200 shadow-sm"
                    style={{ backgroundColor }}
                  />

                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(event) =>
                      setCanvasBackground(event.target.value)
                    }
                    className={colorPicker}
                    aria-label="Canvas background color"
                  />
                </label>

                <div className="h-7 w-px bg-slate-200" />

                <div className="flex max-w-48 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FileDown size={15} />
                  </span>

                  <span
                    className="max-w-36 truncate text-xs font-semibold text-slate-600"
                    title={currentDesignName ?? "My Certificate"}
                  >
                    {currentDesignName || "My Certificate"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save certificate modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeSaveModal();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl shadow-slate-950/20">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <Save size={20} />
                </span>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Save Certificate
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Give your design a memorable name.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeSaveModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                title="Close"
                aria-label="Close save dialog"
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="p-6"
              onSubmit={(event) => {
                event.preventDefault();
                handleSave();
              }}
            >
              <label
                htmlFor="certificate-name"
                className="mb-2 block text-xs font-semibold text-slate-700"
              >
                Certificate name
              </label>

              <input
                id="certificate-name"
                autoFocus
                type="text"
                value={designName}
                onChange={(event) => {
                  setDesignName(event.target.value);
                  setSaveError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSaveModal();
                }}
                placeholder="Example: Web Development Certificate"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />

              {saveError && (
                <p className="mt-2 text-xs font-medium text-rose-600">
                  {saveError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeSaveModal}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-xs font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-[0.98]"
                >
                  <Save size={14} />
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
