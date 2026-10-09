
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  RotateCcw,
  RotateCw,
  Trash2,
  Copy,
  Undo2,
  Redo2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  X,
  Download,
  ImageDown,
  FileDown,
  Palette,
  Type,
  Layers,
  ChevronDown,
  Minus,
  Plus,
  MoveHorizontal,
  MoveVertical,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { ChangeEvent, MouseEvent as ReactMouseEvent } from "react";

import { useFabric } from "../../context/FabricContext";
import { useEditor } from "../../context/EditorContext";

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

  const [fontSize, setFontSizeState] = useState(
    selectedFontSize ?? 18
  );

  const [lineSpacing, setLineSpacingState] = useState(
    selectedObject?.lineHeight ?? 1.16
  );

  const [letterSpacing, setLetterSpacingState] = useState(
    selectedObject?.charSpacing
      ? selectedObject.charSpacing / 10
      : 0
  );

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designName, setDesignName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const downloadButtonRef = useRef<HTMLButtonElement | null>(null);

  const [downloadMenuPosition, setDownloadMenuPosition] = useState({
    top: 0,
    right: 16,
  });

  useEffect(() => {
    if (selectedFontSize !== null) {
      setFontSizeState(selectedFontSize);
    }
  }, [selectedFontSize]);

  useEffect(() => {
    if (
      selectedObject?.type === "i-text" ||
      selectedObject?.type === "textbox"
    ) {
      setLineSpacingState(selectedObject.lineHeight ?? 1.16);

      setLetterSpacingState(
        (selectedObject.charSpacing ?? 0) / 10
      );
    } else {
      setLineSpacingState(1.16);
      setLetterSpacingState(0);
    }
  }, [selectedObject]);

  const isText =
    selectedObject?.type === "i-text" ||
    selectedObject?.type === "textbox";

  const isShape =
    selectedObject?.type === "rect" ||
    selectedObject?.type === "circle" ||
    selectedObject?.type === "triangle" ||
    selectedObject?.type === "polygon" ||
    selectedObject?.type === "line" ||
    selectedObject?.type === "path";

  const isImage = selectedObject?.type === "image";

  const isBold =
    isText && selectedObject?.fontWeight === "bold";

  const isItalic =
    isText && selectedObject?.fontStyle === "italic";

  const currentTextAlign = isText
    ? selectedObject?.textAlign ?? "left"
    : "left";

  const textColor =
    typeof selectedObject?.fill === "string"
      ? selectedObject.fill
      : "#111827";

  const shapeColor =
    typeof selectedObject?.stroke === "string"
      ? selectedObject.stroke
      : typeof selectedObject?.fill === "string"
        ? selectedObject.fill
        : "#2563eb";

  function handleFontSizeChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    setFontSizeState(value);

    if (value >= 8 && value <= 200) {
      setFontSize(value);
    }
  }

  function handleLineSpacingChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);
    const safeValue = Math.min(3, Math.max(1, value));

    setLineSpacingState(safeValue);
    setLineSpacing(safeValue);
  }

  function decreaseLineSpacing() {
    const nextValue = Math.max(
      1,
      Number((lineSpacing - 0.05).toFixed(2))
    );

    setLineSpacingState(nextValue);
    setLineSpacing(nextValue);
  }

  function increaseLineSpacing() {
    const nextValue = Math.min(
      3,
      Number((lineSpacing + 0.05).toFixed(2))
    );

    setLineSpacingState(nextValue);
    setLineSpacing(nextValue);
  }

  function handleLetterSpacingChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);
    const safeValue = Math.min(200, Math.max(0, value));

    setLetterSpacingState(safeValue);
    setLetterSpacing(safeValue);
  }

  function decreaseLetterSpacing() {
    const nextValue = Math.max(0, letterSpacing - 5);

    setLetterSpacingState(nextValue);
    setLetterSpacing(nextValue);
  }

  function increaseLetterSpacing() {
    const nextValue = Math.min(200, letterSpacing + 5);

    setLetterSpacingState(nextValue);
    setLetterSpacing(nextValue);
  }

  function openSaveModal() {
    setDesignName(
      currentDesignName &&
        currentDesignName !== "My Certificate"
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
    const trimmedName = designName.trim();

    if (!trimmedName) {
      setSaveError("Please enter a certificate name.");
      return;
    }

    saveCurrentDesign(trimmedName);

    setShowSaveModal(false);
    setDesignName("");
    setSaveError("");
  }

  function updateDownloadMenuPosition() {
    const button = downloadButtonRef.current;

    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 190;

    const right = Math.max(
      12,
      window.innerWidth - rect.right
    );

    let top = rect.bottom + 8;

    if (top + menuHeight > window.innerHeight - 12) {
      top = rect.top - menuHeight - 8;
    }

    if (top < 12) {
      top = 12;
    }

    setDownloadMenuPosition({
      top,
      right: Math.min(
        right,
        window.innerWidth - menuWidth - 12
      ),
    });
  }

  function openDownloadMenu() {
    if (!showDownloadMenu) {
      updateDownloadMenuPosition();
    }

    setShowDownloadMenu((previous) => !previous);
  }

  useEffect(() => {
    if (!showDownloadMenu) return;

    function handlePositionUpdate() {
      updateDownloadMenuPosition();
    }

    function handleOutsideClick(
      event: globalThis.MouseEvent
    ) {
      const target = event.target as Node;
      const button = downloadButtonRef.current;
      const menu = document.getElementById("download-menu");

      if (button?.contains(target)) return;
      if (menu?.contains(target)) return;

      setShowDownloadMenu(false);
    }

    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, true);
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, true);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showDownloadMenu]);

  function handleDownloadPNG() {
    setShowDownloadMenu(false);
    downloadPNG();
  }

  function handleDownloadPDF() {
    setShowDownloadMenu(false);
    downloadPDF();
  }

  const iconButton =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30";

  const activeIconButton =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-violet-50 hover:text-violet-700";

  const inputClass =
    "h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

  const sectionClass =
    "flex shrink-0 items-center gap-1.5 border-r border-slate-200 pr-3";

  return (
    <>
      <div className="relative z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overflow-y-hidden">
          <div className="flex min-h-[64px] min-w-max items-center gap-3 px-4 py-2">
            {/* UNDO / REDO */}
            <div className={sectionClass}>
              <button
                onClick={undo}
                disabled={!canUndo}
                className={iconButton}
                title="Undo"
                aria-label="Undo"
              >
                <Undo2 size={18} />
              </button>

              <button
                onClick={redo}
                disabled={!canRedo}
                className={iconButton}
                title="Redo"
                aria-label="Redo"
              >
                <Redo2 size={18} />
              </button>
            </div>

            {selectedObject && (
              <>
                {/* LAYER CONTROLS */}
                <div className={sectionClass}>
                  <div className="hidden items-center gap-1.5 pr-1 lg:flex">
                    <Layers size={16} className="text-violet-600" />
                    <span className="text-xs font-semibold text-slate-500">
                      Layers
                    </span>
                  </div>

                  <button
                    onClick={bringToFront}
                    className={activeIconButton}
                    title="Bring to front"
                    aria-label="Bring to front"
                  >
                    <ArrowUpToLine size={17} />
                  </button>

                  <button
                    onClick={bringForward}
                    className={activeIconButton}
                    title="Bring forward"
                    aria-label="Bring forward"
                  >
                    <ArrowUp size={17} />
                  </button>

                  <button
                    onClick={sendBackward}
                    className={activeIconButton}
                    title="Send backward"
                    aria-label="Send backward"
                  >
                    <ArrowDown size={17} />
                  </button>

                  <button
                    onClick={sendToBack}
                    className={activeIconButton}
                    title="Send to back"
                    aria-label="Send to back"
                  >
                    <ArrowDownToLine size={17} />
                  </button>
                </div>

                {/* TEXT CONTROLS */}
                {isText && (
                  <div className="flex shrink-0 items-center gap-2.5 border-r border-slate-200 pr-3">
                    <div className="flex items-center gap-1.5">
                      <Type size={16} className="hidden text-slate-400 xl:block" />

                      <select
                        value={selectedObject?.fontFamily ?? "Arial"}
                        onChange={(event) =>
                          setFontFamily(event.target.value)
                        }
                        className={`${inputClass} w-32 lg:w-36`}
                        title="Font family"
                        aria-label="Font family"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">
                          Times New Roman
                        </option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    {/* FONT SIZE */}
                    <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <button
                        onClick={decreaseFontSize}
                        className="flex h-full w-8 items-center justify-center text-slate-600 transition hover:bg-slate-100"
                        title="Decrease font size"
                        aria-label="Decrease font size"
                      >
                        <Minus size={15} />
                      </button>

                      <input
                        type="number"
                        min="8"
                        max="200"
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        className="h-full w-12 border-x border-slate-200 text-center text-sm outline-none"
                        title="Font size"
                        aria-label="Font size"
                      />

                      <button
                        onClick={increaseFontSize}
                        className="flex h-full w-8 items-center justify-center text-slate-600 transition hover:bg-slate-100"
                        title="Increase font size"
                        aria-label="Increase font size"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    {/* TEXT COLOR */}
                    <label
                      className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 transition hover:border-violet-300 hover:bg-violet-50"
                      title="Text color"
                    >
                      <span className="text-base font-bold text-slate-800">
                        A
                      </span>

                      <span
                        className="absolute bottom-1 left-2 right-2 h-1 rounded-full"
                        style={{ backgroundColor: textColor }}
                      />

                      <input
                        type="color"
                        value={textColor}
                        onChange={(event) =>
                          setTextColor(event.target.value)
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Text color"
                      />
                    </label>

                    {/* BOLD */}
                    <button
                      onClick={toggleBold}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                        isBold
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Bold"
                      aria-label="Bold"
                      aria-pressed={Boolean(isBold)}
                    >
                      <Bold size={18} />
                    </button>

                    {/* ITALIC */}
                    <button
                      onClick={toggleItalic}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                        isItalic
                          ? "bg-violet-600 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                      title="Italic"
                      aria-label="Italic"
                      aria-pressed={Boolean(isItalic)}
                    >
                      <Italic size={18} />
                    </button>

                    {/* TEXT ALIGNMENT */}
                    <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                      <button
                        onClick={() => alignObject("left")}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                          currentTextAlign === "left"
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-white"
                        }`}
                        title="Align left"
                        aria-label="Align left"
                        aria-pressed={currentTextAlign === "left"}
                      >
                        <AlignLeft size={16} />
                      </button>

                      <button
                        onClick={() => alignObject("center")}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                          currentTextAlign === "center"
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-white"
                        }`}
                        title="Align center"
                        aria-label="Align center"
                        aria-pressed={currentTextAlign === "center"}
                      >
                        <AlignCenter size={16} />
                      </button>

                      <button
                        onClick={() => alignObject("right")}
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                          currentTextAlign === "right"
                            ? "bg-violet-600 text-white shadow-sm"
                            : "text-slate-600 hover:bg-white"
                        }`}
                        title="Align right"
                        aria-label="Align right"
                        aria-pressed={currentTextAlign === "right"}
                      >
                        <AlignRight size={16} />
                      </button>
                    </div>

                    {/* LINE SPACING */}
                    <div className="flex h-9 shrink-0 items-center gap-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <button
                        onClick={decreaseLineSpacing}
                        className="flex h-full w-7 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                        title="Decrease line spacing"
                        aria-label="Decrease line spacing"
                      >
                        <Minus size={13} />
                      </button>

                      <div className="flex items-center gap-1">
                        <MoveVertical size={14} className="text-slate-400" />

                        <input
                          type="number"
                          min="1"
                          max="3"
                          step="0.05"
                          value={lineSpacing}
                          onChange={handleLineSpacingChange}
                          className="w-11 text-center text-xs outline-none"
                          title="Line spacing"
                          aria-label="Line spacing"
                        />
                      </div>

                      <button
                        onClick={increaseLineSpacing}
                        className="flex h-full w-7 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                        title="Increase line spacing"
                        aria-label="Increase line spacing"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    {/* LETTER SPACING */}
                    <div className="flex h-9 shrink-0 items-center gap-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
                      <button
                        onClick={decreaseLetterSpacing}
                        className="flex h-full w-7 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                        title="Decrease letter spacing"
                        aria-label="Decrease letter spacing"
                      >
                        <Minus size={13} />
                      </button>

                      <div className="flex items-center gap-1">
                        <MoveHorizontal
                          size={14}
                          className="text-slate-400"
                        />

                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="5"
                          value={letterSpacing}
                          onChange={handleLetterSpacingChange}
                          className="w-11 text-center text-xs outline-none"
                          title="Letter spacing"
                          aria-label="Letter spacing"
                        />
                      </div>

                      <button
                        onClick={increaseLetterSpacing}
                        className="flex h-full w-7 items-center justify-center text-slate-500 transition hover:bg-slate-100"
                        title="Increase letter spacing"
                        aria-label="Increase letter spacing"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* SHAPE AND LINE COLOR */}
                {isShape && (
                  <div className={sectionClass}>
                    <div className="flex items-center gap-1.5">
                      <Palette size={16} className="text-violet-600" />
                      <span className="text-xs font-semibold text-slate-500">
                        Color
                      </span>
                    </div>

                    <label
                      className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 transition hover:border-violet-300 hover:bg-violet-50"
                      title={
                        selectedObject?.type === "line" ||
                        selectedObject?.type === "path"
                          ? "Line color"
                          : "Shape color"
                      }
                    >
                      <span
                        className="h-5 w-5 rounded-md border border-slate-200"
                        style={{ backgroundColor: shapeColor }}
                      />

                      <input
                        type="color"
                        value={shapeColor}
                        onChange={(event) =>
                          setShapeColor(event.target.value)
                        }
                        className="absolute inset-0 cursor-pointer opacity-0"
                        aria-label="Shape color"
                      />
                    </label>
                  </div>
                )}

                {/* IMAGE ROTATION */}
                {isImage && (
                  <div className={sectionClass}>
                    <span className="text-xs font-semibold text-slate-500">
                      Rotate
                    </span>

                    <button
                      onClick={() => rotateSelected(-15)}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                      title="Rotate left"
                    >
                      <RotateCcw size={15} />
                      15°
                    </button>

                    <button
                      onClick={() => rotateSelected(15)}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                      title="Rotate right"
                    >
                      <RotateCw size={15} />
                      15°
                    </button>
                  </div>
                )}

                {/* DUPLICATE */}
                <button
                  onClick={duplicateSelected}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                  title="Duplicate selected object"
                >
                  <Copy size={15} />
                  <span>Duplicate</span>
                </button>

                {/* DELETE */}
                <button
                  onClick={deleteSelected}
                  className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  title="Delete selected object"
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </>
            )}

            {/* RIGHT-SIDE CONTROLS */}
            <div className="ml-auto flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3">
              {/* CANVAS BACKGROUND */}
              <label
                className="relative flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-600 transition hover:border-violet-200 hover:bg-violet-50"
                title="Canvas background"
              >
                <span className="hidden sm:inline">Background</span>

                <span
                  className="h-5 w-5 rounded-md border border-slate-200"
                  style={{ backgroundColor }}
                />

                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) =>
                    setCanvasBackground(event.target.value)
                  }
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Canvas background color"
                />
              </label>

              {/* SAVE */}
              <button
                onClick={openSaveModal}
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-[0.98]"
              >
                <Save size={15} />
                <span>Save</span>
              </button>

              {/* DOWNLOAD */}
              <button
                ref={downloadButtonRef}
                onClick={openDownloadMenu}
                className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                aria-expanded={showDownloadMenu}
                aria-haspopup="menu"
              >
                <Download size={15} />
                <span>Download</span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    showDownloadMenu ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* CURRENT DESIGN NAME */}
        {currentDesignName && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-1.5">
            <p className="text-[11px] text-slate-400">
              Editing:{" "}
              <span className="font-semibold text-slate-600">
                {currentDesignName}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* DOWNLOAD MENU */}
      {showDownloadMenu && (
        <div
          id="download-menu"
          role="menu"
          className="fixed z-[9999] w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          style={{
            top: `${downloadMenuPosition.top}px`,
            right: `${downloadMenuPosition.right}px`,
          }}
        >
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">
              Export options
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              Download certificate
            </p>
          </div>

          <button
            onClick={handleDownloadPNG}
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-violet-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <ImageDown size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Download PNG
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Export as an image
              </p>
            </div>
          </button>

          <button
            onClick={handleDownloadPDF}
            role="menuitem"
            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left transition hover:bg-violet-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <FileDown size={19} />
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-800">
                Download PDF
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Ready for printing
              </p>
            </div>
          </button>
        </div>
      )}

      {/* SAVE CERTIFICATE MODAL */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
          onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
            if (event.target === event.currentTarget) {
              closeSaveModal();
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <Save size={19} />
                </div>

                <h2 className="text-lg font-bold text-slate-900">
                  Save Certificate
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Give your design a name so you can find it later.
                </p>
              </div>

              <button
                onClick={closeSaveModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Close"
                aria-label="Close save dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6">
              <label
                htmlFor="certificate-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
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
                  if (event.key === "Enter") {
                    handleSave();
                  }

                  if (event.key === "Escape") {
                    closeSaveModal();
                  }
                }}
                placeholder="Example: Web Development Certificate"
                className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              />

              {saveError && (
                <p className="mt-2 text-sm text-rose-600">
                  {saveError}
                </p>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeSaveModal}
                  className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                >
                  <Save size={15} />
                  Save Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

