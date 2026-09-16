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
    const value = Number(
      event.target.value
    );

    setFontSizeState(value);

    if (
      value >= 8 &&
      value <= 200
    ) {
      setFontSize(value);
    }
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
    const trimmedName =
      designName.trim();

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

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 size={17} />
            </button>

            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 size={17} />
            </button>
          </div>

          {/* Layer controls */}
          {selectedObject && (
            <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
              <button
                onClick={bringToFront}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Bring to front"
              >
                <ArrowUpToLine size={17} />
              </button>

              <button
                onClick={bringForward}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Bring forward"
              >
                <ArrowUp size={17} />
              </button>

              <button
                onClick={sendBackward}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Send backward"
              >
                <ArrowDown size={17} />
              </button>

              <button
                onClick={sendToBack}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Send to back"
              >
                <ArrowDownToLine size={17} />
              </button>
            </div>
          )}

          {/* Text controls */}
          {isText && (
            <div className="flex items-center gap-2 border-r border-gray-200 pr-3">

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
                className="h-9 px-2 border border-gray-300 rounded-lg text-sm outline-none"
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

              <button
                onClick={decreaseFontSize}
                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100"
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
                className="w-16 h-8 border border-gray-300 rounded-lg text-center text-sm"
              />

              <button
                onClick={increaseFontSize}
                className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-100"
                title="Increase font size"
              >
                +
              </button>

              <label
                className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer flex items-center justify-center overflow-hidden"
                title="Text color"
              >
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
                  className="w-6 h-6 cursor-pointer"
                />
              </label>

              <button
                onClick={toggleBold}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Bold"
              >
                <Bold size={17} />
              </button>

              <button
                onClick={toggleItalic}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Italic"
              >
                <Italic size={17} />
              </button>

              <button
                onClick={() =>
                  alignObject("left")
                }
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Align left"
              >
                <AlignLeft size={17} />
              </button>

              <button
                onClick={() =>
                  alignObject("center")
                }
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Align center"
              >
                <AlignCenter size={17} />
              </button>

              <button
                onClick={() =>
                  alignObject("right")
                }
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Align right"
              >
                <AlignRight size={17} />
              </button>
            </div>
          )}

          {/* Shape controls */}
          {isShape && (
            <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
              <span className="text-xs font-medium text-gray-500">
                Shape
              </span>

              <label
                className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer flex items-center justify-center overflow-hidden"
                title="Shape color"
              >
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
                  className="w-6 h-6 cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Image controls */}
          {isImage && (
            <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
              <span className="text-xs font-medium text-gray-500">
                Image
              </span>

              <button
                onClick={() =>
                  rotateSelected(-15)
                }
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
                title="Rotate left"
              >
                <RotateCcw size={15} />
                15°
              </button>

              <button
                onClick={() =>
                  rotateSelected(15)
                }
                className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
                title="Rotate right"
              >
                <RotateCw size={15} />
                15°
              </button>

              <span className="text-xs text-gray-400">
                Drag corners to resize
              </span>
            </div>
          )}

          {/* Right side controls */}
          <div className="ml-auto flex items-center gap-2">

            {/* Canvas background */}
            <label
              className="flex items-center gap-2 text-sm text-gray-600"
              title="Canvas background"
            >
              <span>Background</span>

              <input
                type="color"
                value={backgroundColor}
                onChange={(event) =>
                  setCanvasBackground(
                    event.target.value
                  )
                }
                className="w-8 h-8 cursor-pointer"
              />
            </label>

            {/* Duplicate */}
            {selectedObject && (
              <button
                onClick={duplicateSelected}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm"
              >
                <Copy size={15} />
                Duplicate
              </button>
            )}

            {/* Delete */}
            {selectedObject && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}

            {/* Save */}
            <button
              onClick={openSaveModal}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 text-sm font-medium"
            >
              <Save size={15} />
              Save
            </button>

            {/* Download */}
            <div className="relative">
              <button
                onClick={() =>
                  setShowDownloadMenu(
                    (previous) =>
                      !previous
                  )
                }
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-sm font-medium"
              >
                <Download size={15} />
                Download

                <span className="text-xs">
                  ▾
                </span>
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-[80] overflow-hidden">

                  <button
                    onClick={
                      handleDownloadPNG
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50"
                  >
                    <ImageDown
                      size={18}
                    />

                    <div>
                      <p className="font-medium text-gray-900">
                        Download PNG
                      </p>

                      <p className="text-xs text-gray-500">
                        High quality image
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={
                      handleDownloadPDF
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 border-t border-gray-100"
                  >
                    <FileDown
                      size={18}
                    />

                    <div>
                      <p className="font-medium text-gray-900">
                        Download PDF
                      </p>

                      <p className="text-xs text-gray-500">
                        Printable certificate
                      </p>
                    </div>
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>

        {currentDesignName && (
          <p className="text-xs text-gray-400 mt-2">
            Editing: {currentDesignName}
          </p>
        )}
      </div>

      {/* Save Certificate Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Save Certificate
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Enter a name for your certificate.
                </p>
              </div>

              <button
                onClick={closeSaveModal}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

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
              className="w-full h-11 px-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black focus:border-black"
            />

            {saveError && (
              <p className="text-sm text-red-600 mt-2">
                {saveError}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={closeSaveModal}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-lg bg-black text-white hover:bg-gray-800 text-sm font-medium"
              >
                Save Certificate
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}