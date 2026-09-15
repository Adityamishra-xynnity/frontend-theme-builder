import {
  useEffect,
  useState,
} from "react";

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

    saveCurrentDesign,
  } = useFabric();

  const {
    backgroundColor,
    setCanvasBackground,
    currentDesignName,
  } = useEditor();

  /*
   * Check whether selected object
   * is a text object.
   */

  const isText =
    selectedObject?.type === "i-text" ||
    selectedObject?.type === "textbox";

  /*
   * Font size input ko string rakha hai
   * taki typing smooth rahe.
   */

  const [fontSize, setFontSizeValue] =
    useState("18");

  /*
   * Jab selected object ya font size change
   * hota hai to input automatically update hoga.
   */

  useEffect(() => {
    if (isText) {
      setFontSizeValue(
        String(selectedFontSize)
      );
    }
  }, [
    selectedFontSize,
    isText,
  ]);

  /*
   * Manual font size input.
   */

  const handleFontSizeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value =
      event.target.value;

    setFontSizeValue(value);

    if (value === "") {
      return;
    }

    const numberValue =
      Number(value);

    if (
      Number.isNaN(numberValue)
    ) {
      return;
    }

    if (
      numberValue >= 8 &&
      numberValue <= 200
    ) {
      setFontSize(numberValue);
    }
  };

  /*
   * Input se bahar click karne par
   * invalid value ko correct kar denge.
   */

  const handleFontSizeBlur = () => {
    let numberValue =
      Number(fontSize);

    if (
      Number.isNaN(numberValue)
    ) {
      numberValue =
        selectedFontSize;
    }

    numberValue = Math.max(
      8,
      Math.min(
        200,
        Math.round(numberValue)
      )
    );

    setFontSizeValue(
      String(numberValue)
    );

    setFontSize(numberValue);
  };

  /*
   * Font family.
   */

  const currentFontFamily =
    selectedObject?.fontFamily ??
    "Arial";

  /*
   * Text color.
   */

  const currentTextColor =
    typeof selectedObject?.fill ===
    "string"
      ? selectedObject.fill
      : "#111827";

  /*
   * Bold state.
   */

  const isBold =
    selectedObject?.fontWeight ===
    "bold";

  /*
   * Italic state.
   */

  const isItalic =
    selectedObject?.fontStyle ===
    "italic";

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm">

      {/* =========================
          MAIN TOOLBAR
      ========================= */}

      <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">

        {/* Undo */}

        <button
          type="button"
          onClick={undo}
          className="toolbar-button"
          title="Undo"
        >
          ↩
        </button>

        {/* Redo */}

        <button
          type="button"
          onClick={redo}
          className="toolbar-button"
          title="Redo"
        >
          ↪
        </button>

        <div className="toolbar-divider" />

        {/* Background */}

        <span className="text-xs font-semibold text-gray-500">
          Background
        </span>

        <input
          type="color"
          value={backgroundColor}
          onChange={(event) =>
            setCanvasBackground(
              event.target.value
            )
          }
          className="toolbar-color"
          title="Certificate background color"
        />

        <div className="toolbar-divider" />

        {/* Save */}

        <button
          type="button"
          onClick={() =>
            saveCurrentDesign(
              currentDesignName ||
                "My Certificate"
            )
          }
          className="toolbar-action-button"
          title="Save certificate"
        >
          💾 Save
        </button>

        {/* Selected object buttons */}

        {selectedObject && (
          <>
            <div className="toolbar-divider" />

            {/* Duplicate */}

            <button
              type="button"
              onClick={
                duplicateSelected
              }
              className="toolbar-button"
              title="Duplicate"
            >
              ⧉
            </button>

            {/* Delete */}

            <button
              type="button"
              onClick={
                deleteSelected
              }
              className="toolbar-button delete-button"
              title="Delete"
            >
              🗑
            </button>
          </>
        )}
      </div>

      {/* =========================
          TEXT TOOLBAR
      ========================= */}

      {isText && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100 overflow-x-auto">

          {/* Font Family */}

          <select
            className="toolbar-select"
            value={currentFontFamily}
            onChange={(event) =>
              setFontFamily(
                event.target.value
              )
            }
          >
            <option value="Arial">
              Arial
            </option>

            <option value="Georgia">
              Georgia
            </option>

            <option value="Times New Roman">
              Times New Roman
            </option>

            <option value="Verdana">
              Verdana
            </option>

            <option value="Courier New">
              Courier New
            </option>

            <option value="Trebuchet MS">
              Trebuchet MS
            </option>
          </select>

          {/* Decrease Font */}

          <button
            type="button"
            onClick={
              decreaseFontSize
            }
            className="toolbar-button"
            title="Decrease font size"
          >
            A−
          </button>

          {/* Font Size Input */}

          <input
            type="number"
            min="8"
            max="200"
            value={fontSize}
            onChange={
              handleFontSizeChange
            }
            onBlur={
              handleFontSizeBlur
            }
            className="w-16 h-[38px] px-2 text-center border border-gray-300 rounded-lg outline-none focus:border-gray-900"
            title="Font size"
          />

          {/* Increase Font */}

          <button
            type="button"
            onClick={
              increaseFontSize
            }
            className="toolbar-button"
            title="Increase font size"
          >
            A+
          </button>

          <div className="toolbar-divider" />

          {/* Text */}

          <span className="text-xs font-semibold text-gray-500">
            Text
          </span>

          {/* Text Color */}

          <input
            type="color"
            value={currentTextColor}
            className="toolbar-color"
            title="Text color"
            onChange={(event) =>
              setTextColor(
                event.target.value
              )
            }
          />

          {/* Bold */}

          <button
            type="button"
            onClick={toggleBold}
            className={`toolbar-button ${
              isBold
                ? "bg-gray-200 border-gray-300"
                : ""
            }`}
            title="Bold"
          >
            <strong>B</strong>
          </button>

          {/* Italic */}

          <button
            type="button"
            onClick={toggleItalic}
            className={`toolbar-button ${
              isItalic
                ? "bg-gray-200 border-gray-300"
                : ""
            }`}
            title="Italic"
          >
            <span className="italic">
              I
            </span>
          </button>

          <div className="toolbar-divider" />

          {/* Alignment */}

          <span className="text-xs font-semibold text-gray-500">
            Align
          </span>

          <button
            type="button"
            onClick={() =>
              alignObject("left")
            }
            className="toolbar-button"
            title="Align left"
          >
            ⬅
          </button>

          <button
            type="button"
            onClick={() =>
              alignObject("center")
            }
            className="toolbar-button"
            title="Align center"
          >
            ↔
          </button>

          <button
            type="button"
            onClick={() =>
              alignObject("right")
            }
            className="toolbar-button"
            title="Align right"
          >
            ➡
          </button>
        </div>
      )}

      {/* =========================
          SHAPE TOOLBAR
      ========================= */}

      {selectedObject &&
        !isText && (
          <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-100">

            <span className="text-xs font-semibold text-gray-500">
              Shape Color
            </span>

            <input
              type="color"
              className="toolbar-color"
              title="Shape color"
              onChange={(event) =>
                setShapeColor(
                  event.target.value
                )
              }
            />

            <span className="text-xs text-gray-500">
              Select a shape to edit
            </span>
          </div>
        )}
    </div>
  );
}