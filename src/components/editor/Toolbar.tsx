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

import { useEffect, useRef, useState } from "react";

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

  const downloadButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const [downloadMenuPosition, setDownloadMenuPosition] =
    useState({
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
      setLineSpacingState(
        selectedObject.lineHeight ?? 1.16
      );

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
    selectedObject?.type === "triangle";

  const isImage = selectedObject?.type === "image";

  /*
   * CURRENT TEXT STATES
   *
   * These values are directly taken from
   * the currently selected Fabric text object.
   */

  const isBold =
    isText && selectedObject?.fontWeight === "bold";

  const isItalic =
    isText && selectedObject?.fontStyle === "italic";

  const currentTextAlign =
    isText
      ? selectedObject?.textAlign ?? "left"
      : "left";

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
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    const safeValue = Math.min(
      3,
      Math.max(1, value)
    );

    setLineSpacingState(safeValue);

    setLineSpacing(safeValue);
  }

  function decreaseLineSpacing() {
    const nextValue = Math.max(
      1,
      Number(
        (lineSpacing - 0.05).toFixed(2)
      )
    );

    setLineSpacingState(nextValue);
    setLineSpacing(nextValue);
  }

  function increaseLineSpacing() {
    const nextValue = Math.min(
      3,
      Number(
        (lineSpacing + 0.05).toFixed(2)
      )
    );

    setLineSpacingState(nextValue);
    setLineSpacing(nextValue);
  }

  function handleLetterSpacingChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const value = Number(event.target.value);

    const safeValue = Math.min(
      200,
      Math.max(0, value)
    );

    setLetterSpacingState(safeValue);

    setLetterSpacing(safeValue);
  }

  function decreaseLetterSpacing() {
    const nextValue = Math.max(
      0,
      letterSpacing - 5
    );

    setLetterSpacingState(nextValue);
    setLetterSpacing(nextValue);
  }

  function increaseLetterSpacing() {
    const nextValue = Math.min(
      200,
      letterSpacing + 5
    );

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

  function openDownloadMenu() {
    const button = downloadButtonRef.current;

    if (!button) {
      setShowDownloadMenu(
        (previous) => !previous
      );

      return;
    }

    const rect = button.getBoundingClientRect();

    const menuWidth = 240;
    const menuHeight = 190;

    const right = Math.max(
      12,
      window.innerWidth - rect.right
    );

    let top = rect.bottom + 8;

    if (
      top + menuHeight >
      window.innerHeight - 12
    ) {
      top =
        rect.top -
        menuHeight -
        8;
    }

    if (top < 12) {
      top = 12;
    }

    setDownloadMenuPosition({
      top,
      right: Math.min(
        right,
        window.innerWidth -
          menuWidth -
          12
      ),
    });

    setShowDownloadMenu(
      (previous) => !previous
    );
  }

  useEffect(() => {
    if (!showDownloadMenu) {
      return;
    }

    function updateDownloadMenuPosition() {
      const button = downloadButtonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();

      const menuWidth = 240;
      const menuHeight = 190;

      const right = Math.max(
        12,
        window.innerWidth - rect.right
      );

      let top = rect.bottom + 8;

      if (
        top + menuHeight >
        window.innerHeight - 12
      ) {
        top =
          rect.top -
          menuHeight -
          8;
      }

      if (top < 12) {
        top = 12;
      }

      setDownloadMenuPosition({
        top,
        right: Math.min(
          right,
          window.innerWidth -
            menuWidth -
            12
        ),
      });
    }

    window.addEventListener(
      "resize",
      updateDownloadMenuPosition
    );

    window.addEventListener(
      "scroll",
      updateDownloadMenuPosition,
      true
    );

    updateDownloadMenuPosition();

    return () => {
      window.removeEventListener(
        "resize",
        updateDownloadMenuPosition
      );

      window.removeEventListener(
        "scroll",
        updateDownloadMenuPosition,
        true
      );
    };
  }, [showDownloadMenu]);

  useEffect(() => {
    if (!showDownloadMenu) {
      return;
    }

    function handleOutsideClick(
      event: MouseEvent
    ) {
      const target = event.target as Node;

      const button = downloadButtonRef.current;

      if (
        button &&
        button.contains(target)
      ) {
        return;
      }

      const menu =
        document.getElementById(
          "download-menu"
        );

      if (
        menu &&
        menu.contains(target)
      ) {
        return;
      }

      setShowDownloadMenu(false);
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
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
    "w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition disabled:opacity-30 disabled:cursor-not-allowed";

  const activeIconButton =
    "w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 hover:text-black transition";

  return (
    <>
      <div className="relative z-40 bg-white border-b border-gray-200 shadow-sm">

        {/* HORIZONTAL SCROLLABLE TOOLBAR */}

        <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">

          <div className="min-w-max min-h-[58px] px-4 flex items-center gap-2">

            {/* UNDO / REDO */}

            <div className="flex-shrink-0 flex items-center gap-1 pr-2 border-r border-gray-200">

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

            {/* SELECTED OBJECT CONTROLS */}

            {selectedObject && (
              <>

                {/* LAYER CONTROLS */}

                <div className="flex-shrink-0 flex items-center gap-1 px-2 border-r border-gray-200">

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

                {/* TEXT CONTROLS */}

                {isText && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-2 border-r border-gray-200">

                    {/* FONT FAMILY */}

                    <div className="flex-shrink-0 flex items-center gap-1">

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

                    {/* FONT SIZE */}

                    <div className="flex-shrink-0 flex items-center h-9 border border-gray-200 rounded-lg overflow-hidden bg-white">

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

                    {/* TEXT COLOR */}

                    <label
                      className="relative flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer overflow-hidden"
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

                    {/* BOLD */}

                    <button
                      onClick={toggleBold}
                      className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg transition ${
                        isBold
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title="Bold"
                    >
                      <Bold size={18} />
                    </button>

                    {/* ITALIC */}

                    <button
                      onClick={toggleItalic}
                      className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg transition ${
                        isItalic
                          ? "bg-black text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      title="Italic"
                    >
                      <Italic size={18} />
                    </button>

                    {/* ALIGNMENT */}

                    <div className="flex-shrink-0 flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5">

                      {/* LEFT */}

                      <button
                        onClick={() =>
                          alignObject("left")
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition ${
                          currentTextAlign ===
                          "left"
                            ? "bg-black text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        title="Align left"
                      >
                        <AlignLeft size={16} />
                      </button>

                      {/* CENTER */}

                      <button
                        onClick={() =>
                          alignObject("center")
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition ${
                          currentTextAlign ===
                          "center"
                            ? "bg-black text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        title="Align center"
                      >
                        <AlignCenter size={16} />
                      </button>

                      {/* RIGHT */}

                      <button
                        onClick={() =>
                          alignObject("right")
                        }
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition ${
                          currentTextAlign ===
                          "right"
                            ? "bg-black text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        title="Align right"
                      >
                        <AlignRight size={16} />
                      </button>

                    </div>

                    {/* LINE SPACING */}

                    <div className="flex-shrink-0 flex items-center gap-1 h-9 border border-gray-200 rounded-lg overflow-hidden bg-white">

                      <button
                        onClick={decreaseLineSpacing}
                        className="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                        title="Decrease line spacing"
                      >
                        <Minus size={14} />
                      </button>

                      <div className="flex items-center gap-1 px-1">

                        <MoveVertical
                          size={14}
                          className="text-gray-400"
                        />

                        <input
                          type="number"
                          min="1"
                          max="3"
                          step="0.05"
                          value={lineSpacing}
                          onChange={
                            handleLineSpacingChange
                          }
                          className="w-12 text-center text-xs text-gray-700 outline-none"
                          title="Line spacing"
                        />

                      </div>

                      <button
                        onClick={increaseLineSpacing}
                        className="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                        title="Increase line spacing"
                      >
                        <Plus size={14} />
                      </button>

                    </div>

                    {/* LETTER SPACING */}

                    <div className="flex-shrink-0 flex items-center gap-1 h-9 border border-gray-200 rounded-lg overflow-hidden bg-white">

                      <button
                        onClick={decreaseLetterSpacing}
                        className="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                        title="Decrease letter spacing"
                      >
                        <Minus size={14} />
                      </button>

                      <div className="flex items-center gap-1 px-1">

                        <MoveHorizontal
                          size={14}
                          className="text-gray-400"
                        />

                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="5"
                          value={letterSpacing}
                          onChange={
                            handleLetterSpacingChange
                          }
                          className="w-12 text-center text-xs text-gray-700 outline-none"
                          title="Letter spacing"
                        />

                      </div>

                      <button
                        onClick={increaseLetterSpacing}
                        className="w-7 h-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition"
                        title="Increase letter spacing"
                      >
                        <Plus size={14} />
                      </button>

                    </div>

                  </div>
                )}

                {/* SHAPE CONTROLS */}

                {isShape && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-2 border-r border-gray-200">

                    <div className="flex items-center gap-1">

                      <Palette
                        size={16}
                        className="text-gray-400"
                      />

                      <span className="text-xs font-semibold text-gray-500">
                        Color
                      </span>

                    </div>

                    <label
                      className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 cursor-pointer overflow-hidden"
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

                {/* IMAGE CONTROLS */}

                {isImage && (
                  <div className="flex-shrink-0 flex items-center gap-2 px-2 border-r border-gray-200">

                    <span className="text-xs font-semibold text-gray-500">
                      Rotate
                    </span>

                    <button
                      onClick={() =>
                        rotateSelected(-15)
                      }
                      className="flex-shrink-0 flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm text-gray-700 transition"
                      title="Rotate left"
                    >
                      <RotateCcw size={15} />
                      <span>15°</span>
                    </button>

                    <button
                      onClick={() =>
                        rotateSelected(15)
                      }
                      className="flex-shrink-0 flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-sm text-gray-700 transition"
                      title="Rotate right"
                    >
                      <RotateCw size={15} />
                      <span>15°</span>
                    </button>

                  </div>
                )}

                {/* DUPLICATE */}

                <button
                  onClick={duplicateSelected}
                  className="flex-shrink-0 flex items-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-sm text-gray-700 transition"
                  title="Duplicate"
                >
                  <Copy size={15} />
                  <span>Duplicate</span>
                </button>

                {/* DELETE */}

                <button
                  onClick={deleteSelected}
                  className="flex-shrink-0 flex items-center justify-center gap-2 h-9 px-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm transition"
                  title="Delete"
                >
                  <Trash2 size={15} />

                  <span>
                    Delete
                  </span>
                </button>

              </>
            )}

            {/* RIGHT CONTROLS */}

            <div className="flex-shrink-0 flex items-center gap-2 ml-4 pl-3 border-l border-gray-200">

              {/* BACKGROUND */}

              <label
                className="relative flex-shrink-0 flex items-center gap-2 h-9 px-2.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 cursor-pointer text-sm text-gray-600 transition"
                title="Canvas background"
              >

                <span>
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

              {/* SAVE */}

              <button
                onClick={openSaveModal}
                className="flex-shrink-0 flex items-center gap-2 h-9 px-4 rounded-lg bg-black text-white hover:bg-gray-800 text-sm font-medium transition"
              >
                <Save size={15} />

                <span>
                  Save
                </span>
              </button>

              {/* DOWNLOAD */}

              <div className="relative flex-shrink-0">

                <button
                  ref={downloadButtonRef}
                  onClick={openDownloadMenu}
                  className="flex-shrink-0 flex items-center gap-2 h-9 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-sm font-medium text-gray-700 transition"
                >

                  <Download size={15} />

                  <span>
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

              </div>

            </div>

          </div>

        </div>

        {/* CURRENT DESIGN */}

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

      {/* FIXED DOWNLOAD MENU */}

      {showDownloadMenu && (
        <div
          id="download-menu"
          className="fixed w-60 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-[9999]"
          style={{
            top:
              `${downloadMenuPosition.top}px`,
            right:
              `${downloadMenuPosition.right}px`,
          }}
        >

          <div className="px-4 py-3 border-b border-gray-100">

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Export
            </p>

            <p className="text-sm font-semibold text-gray-900 mt-1">
              Download certificate
            </p>

          </div>

          {/* PNG */}

          <button
            onClick={handleDownloadPNG}
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

          {/* PDF */}

          <button
            onClick={handleDownloadPDF}
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

      {/* SAVE CERTIFICATE MODAL */}

      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* MODAL HEADER */}

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

            {/* MODAL BODY */}

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