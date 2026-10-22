
import {
  Type,
  Heading,
  AlignLeft,
  Sparkles,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";

export default function TextPanel() {
  const {
    addText,
    selectedObject,
  } = useFabric();

  const isTextSelected = Boolean(
    selectedObject &&
      ["i-text", "textbox"].includes(selectedObject.type),
  );

  return (
    <aside className="h-full w-64 shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
      <div className="px-4 pb-5 pt-5">
        <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Add text
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => addText("heading")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Heading size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Heading
              </span>
              <span className="text-xs text-gray-500">
                Large title
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => addText("subheading")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Type size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Subheading
              </span>
              <span className="text-xs text-gray-500">
                Supporting text
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => addText("text")}
            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <AlignLeft size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-gray-800">
                Body text
              </span>
              <span className="text-xs text-gray-500">
                Normal text
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 px-4 pb-5 pt-5">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Sparkles size={15} className="text-blue-600" />

          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Text formatting
          </p>
        </div>

        {isTextSelected ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3 py-4">
            <p className="text-sm font-medium text-gray-800">
              Text selected
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-600">
              Double-click the text on the canvas to edit its content.
              Use the editor toolbar to change font size, color, style,
              alignment, and spacing.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-5 text-center">
            <Type
              size={20}
              className="mx-auto mb-2 text-gray-400"
            />

            <p className="text-sm font-medium text-gray-700">
              Select a text element
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Add a heading or text, then select it on the canvas to
              edit its content and formatting.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
