import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  Palette,
  BetweenVerticalStart,
  LetterText,
  Minus,
  Plus,
} from "lucide-react";

export const TOOLBAR_CLASSES = {
  barWrapper:
    "relative z-40 w-full border-b border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
  barInner:
    "flex h-12 w-full items-center justify-between gap-1.5 px-3 overflow-x-auto overflow-y-visible",
  toolBtn:
    "inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-lg border border-transparent px-2 text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-35 select-none",
  divider: "mx-1 h-5 w-px shrink-0 bg-slate-200",
  field:
    "h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100",
  group: "flex shrink-0 items-center gap-1",
  colorPicker: "absolute inset-0 h-full w-full cursor-pointer opacity-0",
};

export function preserveToolbarSelection(
  event: ReactMouseEvent<HTMLButtonElement>
) {
  event.preventDefault();
}

export interface FontOption {
  label: string;
  value: string;
}

export const DEFAULT_TOOLBAR_FONTS: FontOption[] = [
  { label: "Arial", value: "Arial" },
  { label: "Inter", value: "Inter" },
  { label: "Helvetica", value: "Helvetica" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
  { label: "Verdana", value: "Verdana" },
  { label: "Courier New", value: "Courier New" },
];

export interface TextFormattingControlsProps {
  fontFamily: string;
  fontOptions?: FontOption[];
  fontSize: number;
  maxFontSize?: number;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough?: boolean;
  showStrikethrough?: boolean;
  textAlign: string;
  showJustify?: boolean;
  lineSpacing: number;
  letterSpacing: number;
  letterSpacingStep?: number;
  minLetterSpacing?: number;
  maxLetterSpacing?: number;
  onFontFamilyChange: (value: string) => void;
  onFontSizeDecrease: () => void;
  onFontSizeIncrease: () => void;
  onFontSizeChange: (value: string) => void;
  onColorChange: (color: string) => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onToggleUnderline: () => void;
  onToggleStrikethrough?: () => void;
  onAlignChange: (align: "left" | "center" | "right" | "justify") => void;
  onLineSpacingChange: (value: string) => void;
  onLetterSpacingDecrease: () => void;
  onLetterSpacingIncrease: () => void;
  onLetterSpacingChange: (value: string) => void;
}

export function TextFormattingControls({
  fontFamily,
  fontOptions = DEFAULT_TOOLBAR_FONTS,
  fontSize,
  maxFontSize = 200,
  color,
  isBold,
  isItalic,
  isUnderline,
  isStrikethrough = false,
  showStrikethrough = true,
  textAlign,
  showJustify = true,
  lineSpacing,
  letterSpacing,
  letterSpacingStep = 5,
  minLetterSpacing = 0,
  maxLetterSpacing = 100,
  onFontFamilyChange,
  onFontSizeDecrease,
  onFontSizeIncrease,
  onFontSizeChange,
  onColorChange,
  onToggleBold,
  onToggleItalic,
  onToggleUnderline,
  onToggleStrikethrough,
  onAlignChange,
  onLineSpacingChange,
  onLetterSpacingDecrease,
  onLetterSpacingIncrease,
  onLetterSpacingChange,
}: TextFormattingControlsProps) {
  const { divider, field, colorPicker } = TOOLBAR_CLASSES;
  const safeHex = /^#[0-9a-f]{6}$/i.test(color) ? color : "#222222";

  return (
    <>
      {/* Font Family */}
      <div className="relative">
        <select
          aria-label="Font family"
          value={fontFamily}
          onChange={(event) => onFontFamilyChange(event.target.value)}
          className={`${field} w-32 cursor-pointer appearance-none pr-6 text-xs font-medium`}
          title="Font family"
        >
          {fontOptions.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>

      {/* Font Size (- / input / +) */}
      <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
        <button
          type="button"
          onMouseDown={preserveToolbarSelection}
          onClick={onFontSizeDecrease}
          className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
          title="Decrease font size"
          aria-label="Decrease font size"
        >
          <Minus size={12} />
        </button>

        <input
          type="number"
          min={8}
          max={maxFontSize}
          value={fontSize}
          onChange={(event) => onFontSizeChange(event.target.value)}
          className="h-full w-10 border-x border-slate-200 text-center text-xs font-semibold text-slate-700 outline-none focus:bg-indigo-50/50"
          title="Font size"
          aria-label="Font size"
        />

        <button
          type="button"
          onMouseDown={preserveToolbarSelection}
          onClick={onFontSizeIncrease}
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
          style={{ backgroundColor: safeHex }}
        />
        <input
          type="color"
          value={safeHex}
          onChange={(event) => onColorChange(event.target.value)}
          className={colorPicker}
          aria-label="Text color"
        />
      </label>

      <div className={divider} />

      {/* Formatting Pill: Bold, Italic, Underline, Strikethrough */}
      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
        <button
          type="button"
          onMouseDown={preserveToolbarSelection}
          onClick={onToggleBold}
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
          onMouseDown={preserveToolbarSelection}
          onClick={onToggleItalic}
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
          onMouseDown={preserveToolbarSelection}
          onClick={onToggleUnderline}
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

        {showStrikethrough && onToggleStrikethrough && (
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={onToggleStrikethrough}
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
        )}
      </div>

      {/* Text Alignment */}
      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
        <button
          type="button"
          onMouseDown={preserveToolbarSelection}
          onClick={() => onAlignChange("left")}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            textAlign === "left"
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
          onMouseDown={preserveToolbarSelection}
          onClick={() => onAlignChange("center")}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            textAlign === "center"
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
          onMouseDown={preserveToolbarSelection}
          onClick={() => onAlignChange("right")}
          className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
            textAlign === "right"
              ? "bg-white text-indigo-700 shadow-xs font-semibold"
              : "text-slate-600 hover:bg-white hover:text-slate-900"
          }`}
          title="Align right"
          aria-label="Align right"
        >
          <AlignRight size={14} />
        </button>

        {showJustify && (
          <button
            type="button"
            onMouseDown={preserveToolbarSelection}
            onClick={() => onAlignChange("justify")}
            className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
              textAlign === "justify"
                ? "bg-white text-indigo-700 shadow-xs font-semibold"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
            title="Justify alignment"
            aria-label="Justify alignment"
          >
            <AlignJustify size={14} />
          </button>
        )}
      </div>

      <div className={divider} />

      {/* Line Spacing & Letter Spacing */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1 shrink-0" title="Line spacing">
          <span
            className="flex items-center text-slate-500"
            title="Line spacing"
            aria-hidden="true"
          >
            <BetweenVerticalStart size={15} />
          </span>
          <div className="relative">
            <select
              aria-label="Line spacing"
              value={lineSpacing}
              onChange={(e) => onLineSpacingChange(e.target.value)}
              className={`${field} w-16 cursor-pointer appearance-none pr-5 text-xs font-medium`}
              title="Line spacing"
            >
              {![0.75, 1, 1.16, 1.25, 1.5, 1.75, 2, 2.5, 3].includes(lineSpacing) && (
                <option value={lineSpacing}>{lineSpacing}</option>
              )}
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
            <ChevronDown
              size={11}
              className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" title="Letter spacing">
          <span
            className="flex items-center text-slate-500"
            title="Letter spacing"
            aria-hidden="true"
          >
            <LetterText size={15} />
          </span>
          <div className="flex h-8 items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            <button
              type="button"
              onMouseDown={preserveToolbarSelection}
              onClick={onLetterSpacingDecrease}
              className="flex h-full w-6 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Decrease letter spacing"
              aria-label="Decrease letter spacing"
            >
              <Minus size={11} />
            </button>

            <input
              type="number"
              min={minLetterSpacing}
              max={maxLetterSpacing}
              step={letterSpacingStep}
              value={letterSpacing}
              onChange={(event) => onLetterSpacingChange(event.target.value)}
              className="h-full w-9 border-x border-slate-200 text-center text-xs font-semibold text-slate-700 outline-none focus:bg-indigo-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              title="Letter spacing"
              aria-label="Letter spacing"
            />

            <button
              type="button"
              onMouseDown={preserveToolbarSelection}
              onClick={onLetterSpacingIncrease}
              className="flex h-full w-6 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Increase letter spacing"
              aria-label="Increase letter spacing"
            >
              <Plus size={11} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function ColorSwatchButton({
  label,
  value,
  fallback = "#2563eb",
  onChange,
}: {
  label: string;
  value: string;
  fallback?: string;
  onChange: (hex: string) => void;
}) {
  const safeHex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return (
    <label
      className="relative flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 shadow-xs transition hover:border-indigo-300 hover:bg-slate-50"
      title={label}
    >
      <Palette size={14} className="text-slate-500" />
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <span
        className="h-4 w-4 rounded-md border border-slate-200 shadow-xs"
        style={{ backgroundColor: safeHex }}
      />
      <input
        type="color"
        value={safeHex}
        onChange={(event) => onChange(event.target.value)}
        className={TOOLBAR_CLASSES.colorPicker}
        aria-label={label}
      />
    </label>
  );
}
