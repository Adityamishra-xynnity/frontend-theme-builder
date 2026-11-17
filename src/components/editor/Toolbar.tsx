import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
  Mail
} from "lucide-react";

import { useFabric } from "../../context/useFabric";
import { useEditor } from "../../context/EditorContext";
import { designToHtml } from "../../utils/designToHtml";
import type {
  MouseEvent as ReactMouseEvent,
} from "react";

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
    canvasRef,
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
    setGraphicColor,
  } = useFabric();

  const {
    backgroundColor,
    setCanvasBackground,
    currentDesignName,
    pages,
  } = useEditor();

  const object = selectedObject as EditableText | null;

  const [fontSize, setFontSizeState] = useState(selectedFontSize ?? 18);
  const [lineSpacing, setLineSpacingState] = useState(1.16);
  const [letterSpacing, setLetterSpacingState] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designName, setDesignName] = useState("");
  const [saveError, setSaveError] = useState("");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Shared PNG / PDF page-selection modal
  const [showExportPagesModal, setShowExportPagesModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<"png" | "pdf">("png");
  const [selectedExportPageIds, setSelectedExportPageIds] = useState<string[]>([]);

  const [rotation, setRotation] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");

  const downloadRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const [downloadMenuPosition, setDownloadMenuPosition] = useState({
    top: 300,
    right: 12,
    maxHeight: 400,
  });

  const [showSpacingPopover, setShowSpacingPopover] = useState(false);
  const spacingRef = useRef<HTMLDivElement>(null);

  const isText =
    selectedObject?.type === "i-text" ||
    selectedObject?.type === "textbox";

  const isGraphic = Boolean(
    selectedObject &&
    ((selectedObject as any).elementType === "graphic" ||
     (selectedObject as any).elementType === "animated-graphic" ||
     Boolean((selectedObject as any).graphicKey))
  );

  const graphicColorPalette: string[] =
    isGraphic && Array.isArray((selectedObject as any).colorPalette)
      ? (selectedObject as any).colorPalette
      : [];

  const [paletteOverride, setPaletteOverride] = useState<string[]>([]);

  useEffect(() => {
    if (selectedObject && Array.isArray((selectedObject as any).colorPalette)) {
      setPaletteOverride([...(selectedObject as any).colorPalette]);
    } else {
      setPaletteOverride([]);
    }
  }, [selectedObject]);

  const activePalette =
    paletteOverride.length > 0 ? paletteOverride : graphicColorPalette;

  const isShape =
    !isGraphic &&
    [
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

  // Close dropdowns and popovers when clicking outside or pressing Escape.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        downloadRef.current &&
        !downloadRef.current.contains(target) &&
        !downloadMenuRef.current?.contains(target)
      ) {
        setShowDownloadMenu(false);
      }

      if (
        spacingRef.current &&
        !spacingRef.current.contains(target)
      ) {
        setShowSpacingPopover(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowSpacingPopover(false);
        setShowDownloadMenu(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Reset popovers when selected object changes
  useEffect(() => {
    setShowSpacingPopover(false);
  }, [selectedObject]);

  // Position dropdown BELOW the toolbar button, inside the canvas area.
  function updateDownloadMenuPosition() {
    if (!downloadRef.current) return;

    const rect = downloadRef.current.getBoundingClientRect();

    const gap = 10;
    const padding = 12;
    const menuHeight = 150;

    const top = rect.bottom + gap;

    const availableHeight = Math.max(
      100,
      window.innerHeight - top - padding
    );

    const maxHeight = Math.max(
      100,
      Math.min(menuHeight, availableHeight)
    );

    const right = Math.max(
      padding,
      window.innerWidth - rect.right
    );

    setDownloadMenuPosition({
      top,
      right,
      maxHeight,
    });
  }

  // Reposition the menu if the page or editor scrolls.
  useEffect(() => {
    if (!showDownloadMenu) return;

    function handleViewportChange() {
      updateDownloadMenuPosition();
    }

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [showDownloadMenu]);

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

  async function handleSendCanvasEmail() {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas is not available");
      return;
    }

    console.log("Canvas dimensions:", canvas.getWidth(), canvas.getHeight());

    console.log(
      "Complete element positions:",
      canvas.getObjects().map((obj) => ({
        type: obj.type,
        left: obj.left,
        top: obj.top,
        width: obj.width,
        height: obj.height,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        angle: obj.angle,
        originX: obj.originX,
        originY: obj.originY,
        boundingRect: obj.getBoundingRect(),
      }))
    );

    if (!canvas) {
      setEmailMessage("The canvas is not ready.");
      return;
    }

    if (!recipientEmail.trim()) {
      setEmailMessage("Please enter a recipient email address.");
      return;
    }

    try {
      setEmailSending(true);
      setEmailMessage("");

      const svgContent = canvas.toSVG();

      console.log(
        "Canvas objects:",
        canvas.getObjects().map((obj) => ({
          type: obj.type,
          left: obj.left,
          top: obj.top,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX,
          scaleY: obj.scaleY,
          angle: obj.angle,
          fill: obj.fill,
          stroke: obj.stroke,
          text: "text" in obj ? obj.text : undefined,
        }))
      );

      console.log(
        "Shape details:",
        canvas.getObjects()
          .filter(
            (obj) =>
              obj.type !== "textbox" &&
              obj.type !== "i-text" &&
              obj.type !== "image"
          )
          .map((obj) => obj.toObject())
      );

      console.log(
        "Canvas object types:",
        canvas.getObjects().map((obj) => obj.type)
      );

      console.log(
        "Image source:",
        canvas.getObjects()
          .filter((obj) => obj.type === "image")
          .map((obj) => ({
            source: (obj as any).getSrc(),
            crossOrigin: (obj as any).getCrossOrigin(),
          }))
      );

      console.log(
        "Text objects:",
        canvas.getObjects()
          .filter((obj) => obj.type === "textbox" || obj.type === "i-text")
          .map((obj: any) => ({
            text: obj.text,
            left: obj.left,
            top: obj.top,
            width: obj.width,
            height: obj.height,
            fontSize: obj.fontSize,
            fontFamily: obj.fontFamily,
            fontWeight: obj.fontWeight,
            fontStyle: obj.fontStyle,
            fill: obj.fill,
            textAlign: obj.textAlign,
            angle: obj.angle,
            opacity: obj.opacity,
          }))
      );

      console.log("SVG generated:", svgContent.includes("<svg"));
      console.log("SVG length:", svgContent.length);
      console.log("SVG preview:", svgContent.substring(0, 500));
      console.log("Canvas background:", canvas.backgroundColor);


      console.log(
        "FULL FABRIC OBJECT DATA:",
        canvas.getObjects().map((obj) => ({
          type: obj.type,
          data: obj.toObject(),
          boundingRect: obj.getBoundingRect(),
          center: obj.getCenterPoint(),
        }))
      );

      const htmlContent = designToHtml(
        canvas,
        currentDesignName || "My Design"
      );

      const response = await fetch(
        "http://localhost:8080/api/email/send-design",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipientEmail: recipientEmail.trim(),
            designName: currentDesignName || "My Design",
            htmlContent,
          }),
        }
      );

      const result = await response.text();

      if (!response.ok) {
        throw new Error(result || "Email sending failed.");
      }

      setEmailMessage("Design email sent successfully!");
    } catch (error) {
      setEmailMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the email."
      );
    } finally {
      setEmailSending(false);
    }
  }

  // Open shared page-selection modal for PNG or PDF.
  function openExportPagesModal(format: "png" | "pdf") {
    setExportFormat(format);
    setSelectedExportPageIds(pages.map((page) => page.id));
    setShowExportPagesModal(true);
  }

  // Export all pages or only selected pages.
  function handleExportPages(allPages: boolean) {
    const pageIds = allPages
      ? pages.map((page) => page.id)
      : selectedExportPageIds;

    setShowExportPagesModal(false);

    if (pageIds.length === 0) return;

    if (exportFormat === "png") {
      void downloadPNG(pageIds);
    } else {
      void downloadPDF(pageIds);
    }
  }

  

  const toolBtn =
    "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-35 select-none";

  const toolBtnActive =
    "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 font-semibold text-indigo-700 shadow-xs transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 select-none";

  const divider = "mx-1 h-5 w-px shrink-0 bg-slate-200";

  const field =
    "h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const group = "flex shrink-0 items-center gap-1";

  const colorPicker =
    "absolute inset-0 h-full w-full cursor-pointer opacity-0";

  const isBold =
    object?.fontWeight === "bold" ||
    object?.fontWeight === 700 ||
    object?.fontWeight === "700";

  const isItalic = object?.fontStyle === "italic";
  const isUnderline = Boolean(object?.underline);
  const isStrikethrough = Boolean(object?.linethrough);
  const currentAlign = object?.textAlign || "left";

  return (
    <>
      {/* PROFESSIONAL CANVA-INSPIRED SINGLE-ROW TOOLBAR */}
      <div className="relative z-40 w-full border-b border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex h-12 w-full items-center justify-between gap-1.5 px-3 overflow-x-auto overflow-y-visible">

          {/* LEFT / CONTEXTUAL CONTROLS */}
          <div className="flex items-center gap-1 shrink-0">
            {/* HISTORY GROUP */}
            <div className={group}>
              <button
                type="button"
                onMouseDown={preserveSelection}
                onClick={undo}
                disabled={!canUndo}
                className={toolBtn}
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo2 size={16} strokeWidth={2} />
              </button>

              <button
                type="button"
                onMouseDown={preserveSelection}
                onClick={redo}
                disabled={!canRedo}
                className={toolBtn}
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo2 size={16} strokeWidth={2} />
              </button>
            </div>

            <div className={divider} />

            {/* CONTEXTUAL TOOLBAR BASED ON SELECTION */}

            {/* 1. TEXT SELECTED */}
            {isText && (
              <>
                {/* Font Family */}
                <div className="relative">
                  <select
                    aria-label="Font family"
                    value={selectedObject?.fontFamily ?? "Arial"}
                    onChange={(event) => setFontFamily(event.target.value)}
                    className={`${field} w-32 cursor-pointer appearance-none pr-6 text-xs font-medium`}
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
                  <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>

                {/* Font Size (+ / input / -) */}
                <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={decreaseFontSize}
                    className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
                    title="Decrease font size"
                    aria-label="Decrease font size"
                  >
                    <Minus size={12} />
                  </button>

                  <input
                    type="number"
                    min={8}
                    max={200}
                    value={fontSize}
                    onChange={(event) => handleFontSizeChange(event.target.value)}
                    className="h-full w-10 border-x border-slate-200 text-center text-xs font-semibold text-slate-700 outline-none focus:bg-indigo-50/50"
                    title="Font size"
                    aria-label="Font size"
                  />

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={increaseFontSize}
                    className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
                    title="Increase font size"
                    aria-label="Increase font size"
                  >
                    <Plus size={12} />
                  </button>
                </div>

                {/* Text Color Swatch */}
                <label
                  className="relative flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs transition hover:border-indigo-400 hover:bg-slate-50"
                  title="Text color"
                >
                  <span className="text-xs font-bold text-slate-800 leading-none">A</span>
                  <span
                    className="absolute bottom-1 h-1 w-4 rounded-full"
                    style={{ backgroundColor: selectedFill }}
                  />
                  <input
                    type="color"
                    value={
                      /^#[0-9a-f]{6}$/i.test(selectedFill) ? selectedFill : "#222222"
                    }
                    onChange={(event) => setTextColor(event.target.value)}
                    className={colorPicker}
                    aria-label="Text color"
                  />
                </label>

                <div className={divider} />

                {/* Formatting Pill: Bold, Italic, Underline, Strikethrough */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={toggleBold}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
                      isBold
                        ? "bg-white text-indigo-700 shadow-xs font-bold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Bold (Ctrl+B)"
                    aria-label="Bold"
                  >
                    <Bold size={14} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={toggleItalic}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
                      isItalic
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Italic (Ctrl+I)"
                    aria-label="Italic"
                  >
                    <Italic size={14} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => toggleTextDecoration("underline")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
                      isUnderline
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Underline (Ctrl+U)"
                    aria-label="Underline"
                  >
                    <Underline size={14} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => toggleTextDecoration("linethrough")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition ${
                      isStrikethrough
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Strikethrough"
                    aria-label="Strikethrough"
                  >
                    <Strikethrough size={14} />
                  </button>
                </div>

                {/* Text Alignment */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => alignObject("left")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                      currentAlign === "left"
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Align left"
                    aria-label="Align left"
                  >
                    <AlignLeft size={14} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => alignObject("center")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                      currentAlign === "center"
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Align center"
                    aria-label="Align center"
                  >
                    <AlignCenter size={14} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => alignObject("right")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                      currentAlign === "right"
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Align right"
                    aria-label="Align right"
                  >
                    <AlignRight size={14} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => alignObject("justify")}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                      currentAlign === "justify"
                        ? "bg-white text-indigo-700 shadow-xs font-semibold"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                    title="Justify alignment"
                    aria-label="Justify alignment"
                  >
                    <AlignJustify size={14} />
                  </button>
                </div>

                {/* Spacing Popover */}
                <div className="relative" ref={spacingRef}>
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => setShowSpacingPopover((prev) => !prev)}
                    className={showSpacingPopover ? toolBtnActive : toolBtn}
                    title="Letter and line spacing"
                    aria-expanded={showSpacingPopover}
                  >
                    <BetweenVerticalStart size={15} className="text-slate-500" />
                    <span className="hidden xl:inline text-xs">Spacing</span>
                    <ChevronDown size={11} className={`transition-transform duration-150 ${showSpacingPopover ? "rotate-180" : ""}`} />
                  </button>

                  {showSpacingPopover && (
                    <div className="absolute left-0 top-full mt-1.5 z-[150] w-64 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <LetterText size={14} className="text-slate-400" /> Letter spacing
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {letterSpacing}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={letterSpacing}
                          onChange={(e) => handleLetterSpacingChange(e.target.value)}
                          className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <BetweenVerticalStart size={14} className="text-slate-400" /> Line spacing
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            {lineSpacing}
                          </span>
                        </div>
                        <select
                          value={lineSpacing}
                          onChange={(e) => handleLineSpacingChange(e.target.value)}
                          className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
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
                    </div>
                  )}
                </div>

                {/* Lists and Indents */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => applyList("bullet")}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                    title="Bulleted list"
                    aria-label="Bulleted list"
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => applyList("number")}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                    title="Numbered list"
                    aria-label="Numbered list"
                  >
                    <ListOrdered size={14} />
                  </button>
                  <span className="h-4 w-px bg-slate-200 mx-0.5" />
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => changeIndent("decrease")}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                    title="Decrease indent"
                    aria-label="Decrease indent"
                  >
                    <IndentDecrease size={14} />
                  </button>
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => changeIndent("increase")}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                    title="Increase indent"
                    aria-label="Increase indent"
                  >
                    <IndentIncrease size={14} />
                  </button>
                </div>
              </>
            )}

            {/* 2. SHAPE SELECTED */}
            {isShape && (
              <label
                className="relative flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 shadow-xs transition hover:border-indigo-300 hover:bg-slate-50"
                title="Shape color"
              >
                <Palette size={14} className="text-slate-500" />
                <span className="text-xs font-medium text-slate-700">Shape color</span>
                <span
                  className="h-4 w-4 rounded-md border border-slate-200 shadow-xs"
                  style={{ backgroundColor: selectedFill }}
                />
                <input
                  type="color"
                  value={
                    /^#[0-9a-f]{6}$/i.test(selectedFill) ? selectedFill : "#2563eb"
                  }
                  onChange={(event) => setShapeColor(event.target.value)}
                  className={colorPicker}
                  aria-label="Shape color"
                />
              </label>
            )}

            {/* 3. GRAPHIC OR IMAGE SELECTED */}
            {(isImage || isGraphic) && (
              <>
                {/* Graphic Multi-Color Palette */}
                {isGraphic && activePalette.length > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 shadow-xs">
                    <Palette size={14} className="text-slate-500" />
                    <span className="text-xs font-medium text-slate-600">Colors</span>
                    <div className="flex items-center gap-1 ml-0.5">
                      {activePalette.map((color, index) => (
                        <label
                          key={index}
                          className="relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-slate-200 shadow-xs transition hover:scale-110 hover:border-indigo-400"
                          title={`Color ${index + 1}: ${color}`}
                        >
                          <span
                            className="h-4 w-4 rounded-md border border-slate-200 shadow-xs"
                            style={{ backgroundColor: color }}
                          />
                          <input
                            type="color"
                            value={
                              /^#[0-9a-f]{6}$/i.test(color) ? color : "#2563eb"
                            }
                            onChange={(event) => {
                              const newColor = event.target.value;
                              setPaletteOverride((prev) => {
                                const next = [...prev];
                                next[index] = newColor;
                                return next;
                              });
                              setGraphicColor(index, newColor);
                            }}
                            className={colorPicker}
                            aria-label={`Graphic color ${index + 1}`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rotation Controls */}
                <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => rotateSelected(-15)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                    title="Rotate left 15°"
                    aria-label="Rotate left 15 degrees"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <span className="min-w-9 px-1 text-center text-xs font-mono font-semibold text-slate-700">
                    {rotation}°
                  </span>
                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={() => rotateSelected(15)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                    title="Rotate right 15°"
                    aria-label="Rotate right 15 degrees"
                  >
                    <RotateCw size={14} />
                  </button>
                </div>
              </>
            )}

            {/* LAYER & OBJECT ACTIONS (FOR ANY SELECTED OBJECT) */}
            {selectedObject && (
              <>
                <div className={divider} />

                {/* Visible Layer Actions & Object Controls */}
                <div className="flex items-center gap-0.5">
                  <span
                    className="flex items-center px-1.5 text-indigo-600"
                    title="Layer controls"
                    aria-hidden="true"
                  >
                    <Layers size={16} strokeWidth={2} />
                  </span>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={bringForward}
                    className={toolBtn}
                    title="Bring forward"
                    aria-label="Bring forward"
                  >
                    <ArrowUp size={15} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={sendBackward}
                    className={toolBtn}
                    title="Send backward"
                    aria-label="Send backward"
                  >
                    <ArrowDown size={15} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={bringToFront}
                    className={toolBtn}
                    title="Bring to front"
                    aria-label="Bring to front"
                  >
                    <ArrowUpToLine size={15} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={sendToBack}
                    className={toolBtn}
                    title="Send to back"
                    aria-label="Send to back"
                  >
                    <ArrowDownToLine size={15} />
                  </button>

                  <div className={divider} />

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={duplicateSelected}
                    className={toolBtn}
                    title="Duplicate object (Ctrl+D)"
                    aria-label="Duplicate object"
                  >
                    <Copy size={15} />
                  </button>

                  <button
                    type="button"
                    onMouseDown={preserveSelection}
                    onClick={deleteSelected}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete object (Del)"
                    aria-label="Delete object"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </>
            )}

            {/* 4. NOTHING SELECTED - GENERAL CANVAS CONTROLS */}
            {!selectedObject && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <label
                  className="relative flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 shadow-xs transition hover:border-indigo-300 hover:bg-slate-50"
                  title="Canvas background color"
                >
                  <Palette size={14} className="text-indigo-500" />
                  <span className="font-medium text-slate-700">Background</span>
                  <span
                    className="h-4 w-4 rounded-md border border-slate-200 shadow-xs"
                    style={{ backgroundColor }}
                  />
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(event) => setCanvasBackground(event.target.value)}
                    className={colorPicker}
                    aria-label="Canvas background color"
                  />
                </label>

                <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
                  •
                </span>

                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  {currentDesignName || "Untitled Certificate"}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT / DOCUMENT ACTIONS */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Always accessible background color when object selected */}
            {selectedObject && (
              <label
                className="relative hidden md:flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 shadow-xs transition hover:border-slate-300 hover:bg-slate-50"
                title="Canvas background color"
              >
                <Palette size={13} className="text-indigo-500" />
                <span className="h-3.5 w-3.5 rounded border border-slate-200 shadow-xs" style={{ backgroundColor }} />
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(event) => setCanvasBackground(event.target.value)}
                  className={colorPicker}
                  aria-label="Canvas background color"
                />
              </label>
            )}

            {/* Send by Email */}
            <button
              type="button"
              onMouseDown={preserveSelection}
              onClick={() => {
                setEmailMessage("");
                setShowEmailModal(true);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 shadow-xs transition hover:bg-violet-50 active:scale-95"
              title="Send canvas design by email"
            >
              <Mail size={14} />
              <span className="hidden sm:inline">Send by Email</span>
            </button>

            {/* Save */}
            <button
              type="button"
              onClick={openSaveModal}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-xs shadow-indigo-600/20 transition hover:bg-indigo-700 active:scale-95"
              title="Save certificate"
            >
              <Save size={14} />
              <span>Save</span>
            </button>

            {/* Download Dropdown */}
            <div className="relative" ref={downloadRef}>
              <button
                type="button"
                onClick={() => {
                  if (!showDownloadMenu) updateDownloadMenuPosition();
                  setShowDownloadMenu((prev) => !prev);
                }}
                aria-expanded={showDownloadMenu}
                aria-haspopup="menu"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
              >
                <Download size={14} />
                <span>Download</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${showDownloadMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showDownloadMenu &&
                createPortal(
                  <div
                    ref={downloadMenuRef}
                    style={{
                      position: "fixed",
                      top: downloadMenuPosition.top,
                      right: downloadMenuPosition.right,
                      maxHeight: downloadMenuPosition.maxHeight,
                      zIndex: 2147483647,
                    }}
                    className="w-72 overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.30)] ring-1 ring-slate-900/10"
                    role="menu"
                    aria-label="Download options"
                  >
                    {/* DOWNLOAD PNG */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowDownloadMenu(false);
                        if (pages.length <= 1) {
                          void downloadPNG(pages.map((page) => page.id));
                        } else {
                          openExportPagesModal("png");
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-indigo-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                        <ImageDown size={19} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          Download PNG
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          Export pages as separate images
                        </span>
                      </span>
                    </button>

                    {/* DOWNLOAD PDF */}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowDownloadMenu(false);
                        if (pages.length <= 1) {
                          void downloadPDF(pages.map((page) => page.id));
                        } else {
                          openExportPagesModal("pdf");
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-rose-50"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                        <FileDown size={19} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-slate-800">
                          Download PDF
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          Export a print-ready document
                        </span>
                      </span>
                    </button>
                  </div>,
                  document.body
                )}
            </div>
          </div>
        </div>
      </div>

      {/* PNG / PDF PAGE SELECTION MODAL */}
      {showExportPagesModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-pages-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2
                id="export-pages-title"
                className="text-sm font-semibold text-slate-900"
              >
                Choose {exportFormat.toUpperCase()} pages
              </h2>

              <button
                type="button"
                onClick={() => setShowExportPagesModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close page selection"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xs font-medium text-slate-700">
                Select pages to export
              </span>

              <button
                type="button"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                onClick={() =>
                  setSelectedExportPageIds(
                    selectedExportPageIds.length === pages.length
                      ? []
                      : pages.map((page) => page.id)
                  )
                }
              >
                {selectedExportPageIds.length === pages.length
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>

            <div className="mb-5 max-h-64 space-y-1 overflow-y-auto">
              {pages.map((page, index) => (
                <label
                  key={page.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-indigo-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-indigo-600"
                    checked={selectedExportPageIds.includes(page.id)}
                    onChange={(event) =>
                      setSelectedExportPageIds((current) =>
                        event.target.checked
                          ? [...current, page.id]
                          : current.filter((id) => id !== page.id)
                      )
                    }
                  />

                  <span>
                    {page.name?.trim() || `Page ${index + 1}`}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExportPagesModal(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleExportPages(true)}
                className="rounded-lg border border-indigo-200 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Download All Pages
              </button>

              <button
                type="button"
                disabled={selectedExportPageIds.length === 0}
                onClick={() => handleExportPages(false)}
                className="rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Download Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAVE CERTIFICATE MODAL */}
    {showSaveModal && (
      <div
        className="fixed inset-0 .z-\[200\] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-[3px]"
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


    {/* SEND DESIGN BY EMAIL MODAL */}
    {showEmailModal && (
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
        onMouseDown={(event: ReactMouseEvent<HTMLDivElement>) => {
          if (event.target === event.currentTarget && !emailSending) {
            setShowEmailModal(false);
            setEmailMessage("");
          }
        }}
      >
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Mail size={19} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Send Design by Email
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter the email address where you want to send this design.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!emailSending) {
                  setShowEmailModal(false);
                  setEmailMessage("");
                }
              }}
              disabled={emailSending}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              aria-label="Close email dialog"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6">
            <label
              htmlFor="recipient-email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Recipient email
            </label>

            <input
              id="recipient-email"
              autoFocus
              type="email"
              value={recipientEmail}
              onChange={(event) => {
                setRecipientEmail(event.target.value);
                setEmailMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !emailSending) {
                  void handleSendCanvasEmail();
                }
                if (event.key === "Escape" && !emailSending) {
                  setShowEmailModal(false);
                  setEmailMessage("");
                }
              }}
              placeholder="name@example.com"
              className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />

            {emailMessage && (
              <p
                role="status"
                className={`mt-3 text-sm ${emailMessage === "Design email sent successfully!"
                  ? "text-emerald-600"
                  : "text-rose-600"
                  }`}
              >
                {emailMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!emailSending) {
                    setShowEmailModal(false);
                    setEmailMessage("");
                  }
                }}
                disabled={emailSending}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSendCanvasEmail()}
                disabled={emailSending || !recipientEmail.trim()}
                className="flex h-10 items-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Mail size={15} />
                {emailSending ? "Sending Email..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

  </>
);
}
