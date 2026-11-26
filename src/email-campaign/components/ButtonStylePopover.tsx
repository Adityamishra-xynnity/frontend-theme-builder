import type { EmailNode } from "../types/campaign";
import { X } from "lucide-react";
import {
  EMAIL_EDITING_LIMITS,
  EMAIL_SAFE_FONT_OPTIONS,
  getNodeMinDimensions,
} from "../utils/emailCompatibilityEngine";

interface ButtonStylePopoverProps {
  node: EmailNode;
  onChange: (patch: Partial<EmailNode>) => void;
  onClose: () => void;
}

const FONT_FAMILIES = EMAIL_SAFE_FONT_OPTIONS.map((f) => ({
  label: f.label,
  value:
    f.value ||
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
}));

export default function ButtonStylePopover({
  node,
  onChange,
  onClose,
}: ButtonStylePopoverProps) {
  const { minWidth: btnMinWidth, minHeight: btnMinHeight } =
    getNodeMinDimensions("button", node);
  const borderRadiusNum =
    typeof node.borderRadius === "number"
      ? node.borderRadius
      : parseInt(String(node.borderRadius || "6"), 10) || 0;

  return (
    <div
      className="w-72 rounded-xl border border-gray-200 bg-white p-3.5 text-xs text-gray-700 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="mb-2.5 flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="font-semibold text-gray-800">Button Style</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      </div>

      <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
        {/* Button Text */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Button Text
          </label>
          <input
            type="text"
            value={node.content}
            onChange={(e) => onChange({ content: e.target.value })}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
          />
        </div>

        {/* Font Family & Weight */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Font Family
            </label>
            <select
              value={node.fontFamily || FONT_FAMILIES[0].value}
              onChange={(e) => onChange({ fontFamily: e.target.value })}
              className="w-full rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-violet-500"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Weight
            </label>
            <select
              value={node.fontWeight || "bold"}
              onChange={(e) => onChange({ fontWeight: e.target.value })}
              className="w-full rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] outline-none focus:border-violet-500"
            >
              <option value="normal">Normal</option>
              <option value="600">Semibold</option>
              <option value="bold">Bold</option>
            </select>
          </div>
        </div>

        {/* Font Size & Border Radius */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Font Size (px)
            </label>
            <input
              type="number"
              min={10}
              max={48}
              value={Math.round(node.fontSize ?? 15)}
              onChange={(e) =>
                onChange({ fontSize: Math.max(10, Math.min(48, Number(e.target.value) || 14)) })
              }
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Corner Radius (px)
            </label>
            <input
              type="number"
              min={0}
              max={9999}
              value={borderRadiusNum}
              onChange={(e) =>
                onChange({ borderRadius: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Text Color & Background Color */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Text Color
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={node.color || "#ffffff"}
                onChange={(e) => onChange({ color: e.target.value })}
                className="h-6 w-7 cursor-pointer rounded border border-gray-200 p-0"
              />
              <span className="text-[10px] font-mono text-gray-500">
                {node.color || "#ffffff"}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Background
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={node.backgroundColor || "#6d28d9"}
                onChange={(e) =>
                  onChange({ backgroundColor: e.target.value, gradient: undefined })
                }
                className="h-6 w-7 cursor-pointer rounded border border-gray-200 p-0"
              />
              <span className="text-[10px] font-mono text-gray-500">
                {node.backgroundColor || "#6d28d9"}
              </span>
            </div>
          </div>
        </div>

        {/* Border Color & Width */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Border Color
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={node.borderColor || "#111827"}
                onChange={(e) =>
                  onChange({
                    borderColor: e.target.value,
                    borderWidth: node.borderWidth || 1.5,
                  })
                }
                className="h-6 w-7 cursor-pointer rounded border border-gray-200 p-0"
              />
              <span className="text-[10px] font-mono text-gray-500">
                {node.borderColor || "none"}
              </span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Border Width (px)
            </label>
            <input
              type="number"
              min={0}
              max={EMAIL_EDITING_LIMITS.maxBorderWidth}
              step={0.5}
              value={node.borderWidth ?? 0}
              onChange={(e) =>
                onChange({
                  borderWidth: Math.max(
                    0,
                    Math.min(
                      EMAIL_EDITING_LIMITS.maxBorderWidth,
                      Number(e.target.value) || 0
                    )
                  ),
                })
              }
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Padding */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Padding
          </label>
          <input
            type="text"
            value={node.padding || "10px 20px"}
            onChange={(e) => onChange({ padding: e.target.value })}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
          />
        </div>

        {/* Width & Height */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Width (px)
            </label>
            <input
              type="number"
              min={btnMinWidth}
              max={600}
              value={Math.round(node.width)}
              onChange={(e) =>
                onChange({
                  width: Math.max(
                    btnMinWidth,
                    Math.min(600, Number(e.target.value) || btnMinWidth)
                  ),
                })
              }
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-500">
              Height (px)
            </label>
            <input
              type="number"
              min={btnMinHeight}
              max={200}
              value={Math.round(node.height)}
              onChange={(e) =>
                onChange({
                  height: Math.max(
                    btnMinHeight,
                    Math.min(200, Number(e.target.value) || btnMinHeight)
                  ),
                })
              }
              className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Link URL */}
        <div>
          <label className="mb-1 block text-[11px] font-medium text-gray-500">
            Link URL
          </label>
          <input
            type="url"
            value={node.linkUrl || node.url || ""}
            placeholder="https://example.com"
            onChange={(e) => {
              const val = e.target.value;
              onChange({ linkUrl: val || undefined, url: val || undefined });
            }}
            className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs outline-none focus:border-violet-500"
          />
        </div>
      </div>
    </div>
  );
}
