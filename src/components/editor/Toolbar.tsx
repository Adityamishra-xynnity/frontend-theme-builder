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
  BetweenVerticalStart,
  LetterText,
} from "lucide-react";

import { useEffect, useState } from "react";

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

  const [lineSpacing, setLineSpacingState] =
    useState(
      selectedObject?.lineHeight ?? 1.16
    );

  const [letterSpacing, setLetterSpacingState] =
    useState(0);

  const [showSaveModal, setShowSaveModal] =
    useState(false);

  const [designName, setDesignName] =
    useState("");

  const [saveError, setSaveError] =
    useState("");

  const [showDownloadMenu, setShowDownloadMenu] =
    useState(false);

  useEffect(() => {
    if (selectedFontSize !== null) {
      setFontSizeState(selectedFontSize);
    }
  }, [selectedFontSize]);

  useEffect(() => {
    if (!selectedObject) return;

    if (
      typeof selectedObject.lineHeight === "number"
    ) {
      setLineSpacingState(
        selectedObject.lineHeight
      );
    } else {
      setLineSpacingState(1.16);
    }

    /*
      Fabric.js charSpacing is internally stored
      in 1/1000 of the font size.

      Example:
      UI 20  -> Fabric 200
      UI 50  -> Fabric 500
      UI 100 -> Fabric 1000
      UI 200 -> Fabric 2000
    */

    const fabricCharSpacing =
      typeof selectedObject.charSpacing ===
      "number"
        ? selectedObject.charSpacing
        : 0;

    setLetterSpacingState(
      Math.round(fabricCharSpacing / 10)
    );
  }, [selectedObject]);

  const isText =
    selectedObject?.type === "i-text" ||
    selectedObject?.type === "textbox";

  const isShape =
    selectedObject?.type === "rect" ||
    selectedObject?.type === "circle" ||
    selectedObject?.type === "triangle";

  const isImage =
    selectedObject?.type === "image";

  function handleFontSizeChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    setFontSizeState(value);

    if (value >= 8 && value <= 200) {
      setFontSize(value);
    }
  }

  function handleLineSpacingChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = Number(event.target.value);

    setLineSpacingState(value);

    setLineSpacing(value);
  }

  function handleLetterSpacingChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    let value = Number(event.target.value);

    if (Number.isNaN(value)) {
      value = 0;
    }

    value = Math.min(
      200,
      Math.max(0, value)
    );

    setLetterSpacingState(value);

    setLetterSpacing(value);
  }

  function decreaseLetterSpacing() {
    const value = Math.max(
      0,
      letterSpacing - 5
    );

    setLetterSpacingState(value);

    setLetterSpacing(value);
  }

  function increaseLetterSpacing() {
    const value = Math.min(
      200,
      letterSpacing + 5
    );

    setLetterSpacingState(value);

    setLetterSpacing(value);
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
      setSaveError(
        "Please enter a certificate name."
      );
      return;
    }

    saveCurrentDesign(trimmedName);

    setShowSaveModal(false);
    setDesignName("");
    setSaveError("");
  }

  function handleDownloadPNG() {
    setShowDownloadMenu(false);
    downloadPNG();
  }

  function handleDownloadPDF() {
    setShowDownloadMenu(false);
    downloadPDF();
  }

  const iconButton =
    "w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed";

  const activeIconButton =
    "w-9 h-9 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black transition";

  return (
    <>
      <div className="relative z-40 bg-white border-b border-gray-200 shadow-sm">

        <div className="min-h-[58px] px-4 flex items-center gap-2 overflow-x-auto">

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-200 shrink-0">

            <button
              onClick={undo}
              disabled={!canUndo}
              className={iconButton}
              title="Undo"
            >
              <Undo2 size={18} />
            </button>

            <button
              onClick={redo}
              disabled={!canRedo}
              className={iconButton}
              title="Redo"
            >
              <Redo2 size={18} />
            </button>

          </div>

          {/* Selected Object Controls */}
          {selectedObject && (
            <>

              {/* Layer Controls */}
              <div className="flex items-center gap-1 px-2 border-r border-gray-200 shrink-0">

                <div className="hidden lg:flex items-center gap-1 mr-1">

                  <Layers
                    size={16}
                    className="text-gray-400"
                  />

                  <span className="text-xs font-semibold text-gray-500">
                    Layers
                  </span>

                </div>

                <button
                  onClick={bringToFront}
                  className={activeIconButton}
                  title="Bring to front"
                >
                  <ArrowUpToLine size={17} />
                </button>

                <button
                  onClick={bringForward}
                  className={activeIconButton}
                  title="Bring forward"
                >
                  <ArrowUp size={17} />
                </button>

                <button
                  onClick={sendBackward}
                  className={activeIconButton}
                  title="Send backward"
                >
                  <ArrowDown size={17} />
                </button>

                <button
                  onClick={sendToBack}
                  className={activeIconButton}
                  title="Send to back"
                >
                  <ArrowDownToLine size={17} />
                </button>

              </div>

              {/* Text Controls */}
              {isText && (
                <div className="flex items-center gap-2 px-2 border-r border-gray-200 shrink-0">

                  {/* Font Family */}
                  <div className="flex items-center gap-1">

                    <Type
                      size={16}
                      className="text-gray-400 hidden xl:block"
                    />

                    <select
                      value={
                        selectedObject?.fontFamily ??
                        "Arial"
                      }
                      onChange={(event) =>
                        setFontFamily(
                          event.target.value
                        )
                      }
                      className="h-9 w-32 lg:w-36 px-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-gray-400"
                      title="Font family"
                    >
                      <option value="Arial">
                        Arial
                      </option>

                      <option value="Helvetica">
                        Helvetica
                      </option>

                      <option value="Times New Roman">
                        Times New Roman
                      </option>

                      <option value="Georgia">
                        Georgia
                      </option>

                      <option value="Verdana">
                        Verdana
                      </option>

                      <option value="Courier New">
                        Courier New
                      </option>
                    </select>

                  </div>

                  {/* Font Size */}
                  <div className="flex items-center h-9 border border-gray-200 rounded-lg overflow-hidden bg-white">

                    <button
                      onClick={decreaseFontSize}
                      className="w-8 h-full text-gray-600 hover:bg-gray-100 text-lg transition"
                      title="Decrease font size"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="8"
                      max="200"
                      value={fontSize}
                      onChange={
                        handleFontSizeChange
                      }
                      className="w-12 h-full text-center text-sm text-gray-700 border-x border-gray-200 outline-none"
                      title="Font size"
                    />

                    <button
                      onClick={increaseFontSize}
                      className="w-8 h-full text-gray-600 hover:bg-gray-100 text-lg transition"
                      title="Increase font size"
                    >
                      +
                    </button>

                  </div>

                  {/* Text Color */}
                  <label
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer overflow-hidden shrink-0"
                    title="Text color"
                  >
                    <span className="text-sm font-bold text-gray-800">
                      A
                    </span>

                    <span
                      className="absolute bottom-1 left-2 right-2 h-1 rounded-full"
                      style={{
                        backgroundColor:
                          typeof selectedObject?.fill ===
                          "string"
                            ? selectedObject.fill
                            : "#111827",
                      }}
                    />

                    <input
                      type="color"
                      value={
                        typeof selectedObject?.fill ===
                        "string"
                          ? selectedObject.fill
                          : "#111827"
                      }
                      onChange={(event) =>
                        setTextColor(
                          event.target.value
                        )
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>

                  {/* Bold */}
                  <button
                    onClick={toggleBold}
                    className={activeIconButton}
                    title="Bold"
                  >
                    <Bold size={18} />
                  </button>

                  {/* Italic */}
                  <button
                    onClick={toggleItalic}
                    className={activeIconButton}
                    title="Italic"
                  >
                    <Italic size={18} />
                  </button>

                  {/* Alignment */}
                  <div className="hidden md:flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5">

                    <button
                      onClick={() =>
                        alignObject("left")
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
                      title="Align left"
                    >
                      <AlignLeft size={16} />
                    </button>

                    <button
                      onClick={() =>
                        alignObject("center")
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
                      title="Align center"
                    >
                      <AlignCenter size={16} />
                    </button>

                    <button
                      onClick={() =>
                        alignObject("right")
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
                      title="Align right"
                    >
                      <AlignRight size={16} />
                    </button>

                  </div>

                  {/* LINE SPACING */}
                  <div className="flex items-center gap-1 h-9 px-2 border border-gray-200 rounded-lg bg-white shrink-0">

                    <BetweenVerticalStart
                      size={15}
                      className="text-gray-500"
                    />

                    <select
                      value={lineSpacing}
                      onChange={
                        handleLineSpacingChange
                      }
                      className="h-8 w-24 bg-transparent text-xs text-gray-700 outline-none cursor-pointer"
                      title="Line spacing"
                    >
                      <option value={1}>
                        Normal
                      </option>

                      <option value={1.16}>
                        1.16
                      </option>

                      <option value={1.25}>
                        1.25
                      </option>

                      <option value={1.5}>
                        1.5
                      </option>

                      <option value={1.75}>
                        1.75
                      </option>

                      <option value={2}>
                        2.0
                      </option>

                      <option value={2.5}>
                        2.5
                      </option>

                      <option value={3}>
                        3.0
                      </option>
                    </select>

                  </div>

                  {/* LETTER SPACING */}
                  <div className="flex items-center h-9 border border-gray-200 rounded-lg bg-white overflow-hidden shrink-0">

                    <div className="px-2 flex items-center">
                      <LetterText
                        size={15}
                        className="text-gray-500"
                      />
                    </div>

                    <button
                      onClick={
                        decreaseLetterSpacing
                      }
                      disabled={
                        letterSpacing <= 0
                      }
                      className="w-7 h-9 border-l border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      title="Decrease letter spacing"
                    >
                      −
                    </button>

                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      value={letterSpacing}
                      onChange={
                        handleLetterSpacingChange
                      }
                      className="w-12 h-9 text-center text-xs text-gray-700 outline-none border-l border-gray-200"
                      title="Letter spacing 0 to 200"
                    />

                    <button
                      onClick={
                        increaseLetterSpacing
                      }
                      disabled={
                        letterSpacing >= 200
                      }
                      className="w-7 h-9 border-l border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
                      title="Increase letter spacing"
                    >
                      +
                    </button>

                  </div>

                </div>
              )}

              {/* Shape Controls */}
              {isShape && (
                <div className="flex items-center gap-2 px-2 border-r border-gray-200 shrink-0">

                  <div className="hidden sm:flex items-center gap-1">

                    <Palette
                      size={16}
                      className="text-gray-400"
                    />

                    <span className="text-xs font-semibold text-gray-500">
                      Color
                    </span>

                  </div>

                  <label
                    className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer overflow-hidden"
                    title="Shape color"
                  >
                    <span
                      className="w-5 h-5 rounded-md border border-gray-300"
                      style={{
                        backgroundColor:
                          typeof selectedObject?.fill ===
                          "string"
                            ? selectedObject.fill
                            : "#2563eb",
                      }}
                    />

                    <input
                      type="color"
                      value={
                        typeof selectedObject?.fill ===
                        "string"
                          ? selectedObject.fill
                          : "#2563eb"
                      }
                      onChange={(event) =>
                        setShapeColor(
                          event.target.value
                        )
                      }
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />

                  </label>

                </div>
              )}

              {/* Image Controls */}
              {isImage && (
                <div className="flex items-center gap-2 px-2 border-r border-gray-200 shrink-0">

                  <span className="hidden sm:block text-xs font-semibold text-gray-500">
                    Rotate
                  </span>

                  <button
                    onClick={() =>
                      rotateSelected(-15)
                    }
                    className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm text-gray-700 transition"
                    title="Rotate left"
                  >
                    <RotateCcw size={15} />
                    <span>15°</span>
                  </button>

                  <button
                    onClick={() =>
                      rotateSelected(15)
                    }
                    className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm text-gray-700 transition"
                    title="Rotate right"
                  >
                    <RotateCw size={15} />
                    <span>15°</span>
                  </button>

                </div>
              )}

              {/* Duplicate */}
              <button
                onClick={duplicateSelected}
                className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-sm text-gray-700 transition shrink-0"
                title="Duplicate"
              >
                <Copy size={15} />

                <span>
                  Duplicate
                </span>
              </button>

              {/* Delete */}
              <button
                onClick={deleteSelected}
                className="flex items-center justify-center gap-2 h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm transition shrink-0"
                title="Delete"
              >
                <Trash2 size={15} />

                <span className="hidden sm:inline">
                  Delete
                </span>
              </button>

            </>
          )}

          {/* Right Controls */}
          <div className="ml-auto flex items-center gap-2 shrink-0">

            {/* Background */}
            <label
              className="relative flex items-center gap-2 h-9 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 cursor-pointer text-sm text-gray-600 transition"
              title="Canvas background"
            >
              <span className="hidden lg:inline">
                Background
              </span>

              <span
                className="w-5 h-5 rounded-md border border-gray-300"
                style={{
                  backgroundColor:
                    backgroundColor,
                }}
              />

              <input
                type="color"
                value={backgroundColor}
                onChange={(event) =>
                  setCanvasBackground(
                    event.target.value
                  )
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>

            {/* Save */}
            <button
              onClick={openSaveModal}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-black text-white hover:bg-gray-800 text-sm font-medium transition"
            >
              <Save size={15} />

              <span className="hidden sm:inline">
                Save
              </span>
            </button>

            {/* Download */}
            <div className="relative">

              <button
                onClick={() =>
                  setShowDownloadMenu(
                    (previous) => !previous
                  )
                }
                className="flex items-center gap-2 h-9 px-3 sm:px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
              >
                <Download size={15} />

                <span className="hidden sm:inline">
                  Download
                </span>

                <ChevronDown
                  size={14}
                  className={
                    showDownloadMenu
                      ? "rotate-180 transition"
                      : "transition"
                  }
                />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[100]">

                  <div className="px-4 py-3 border-b border-gray-100">

                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Export
                    </p>

                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      Download certificate
                    </p>

                  </div>

                  <button
                    onClick={
                      handleDownloadPNG
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                  >

                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageDown size={18} />
                    </div>

                    <div>

                      <p className="text-sm font-medium text-gray-900">
                        Download PNG
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        High quality image
                      </p>

                    </div>

                  </button>

                  <button
                    onClick={
                      handleDownloadPDF
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 border-t border-gray-100 transition"
                  >

                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <FileDown size={18} />
                    </div>

                    <div>

                      <p className="text-sm font-medium text-gray-900">
                        Download PDF
                      </p>

                      <p className="text-xs text-gray-500 mt-0.5">
                        Printable certificate
                      </p>

                    </div>

                  </button>

                </div>
              )}

            </div>

          </div>

        </div>

        {/* Current Design */}
        {currentDesignName && (
          <div className="px-5 pb-2">

            <p className="text-[11px] text-gray-400">

              Editing:{" "}

              <span className="font-medium text-gray-500">
                {currentDesignName}
              </span>

            </p>

          </div>
        )}

      </div>

      {/* Save Certificate Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-semibold text-gray-900">
                  Save Certificate
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Give your certificate a name.
                </p>

              </div>

              <button
                onClick={closeSaveModal}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
                title="Close"
              >
                <X size={18} />
              </button>

            </div>

            <div className="p-6">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Certificate Name
              </label>

              <input
                autoFocus
                type="text"
                value={designName}
                onChange={(event) => {
                  setDesignName(
                    event.target.value
                  );

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
                className="w-full h-11 px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-black focus:border-black transition"
              />

              {saveError && (
                <p className="text-sm text-red-600 mt-2">
                  {saveError}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={closeSaveModal}
                  className="h-10 px-4 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="h-10 px-5 rounded-lg bg-black text-white hover:bg-gray-800 text-sm font-medium transition"
                >
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