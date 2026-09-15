import {
  Type,
  Heading,
  AlignLeft,
  Square,
  Circle,
  Triangle,
  Plus,
  Sparkles,
} from "lucide-react";

import { useFabric } from "../../context/FabricContext";

export default function ElementsPanel() {
  const {
    addHeading,
    addSubheading,
    addText,
    addRectangle,
    addCircle,
    addTriangle,
  } = useFabric();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        {/* Panel Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center">
              <Sparkles size={18} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Elements
              </h2>

              <p className="text-xs text-gray-500">
                Build your certificate
              </p>
            </div>
          </div>
        </div>

        {/* Text Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Text
            </h3>

            <span className="text-[11px] text-gray-400">
              Add
            </span>
          </div>

          <div className="space-y-2">
            {/* Heading */}
            <button
              type="button"
              onClick={addHeading}
              className="group w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center transition">
                <Heading size={19} />
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Heading
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Large title text
                </p>
              </div>

              <Plus
                size={16}
                className="text-gray-400 group-hover:text-gray-900 transition"
              />
            </button>

            {/* Subheading */}
            <button
              type="button"
              onClick={addSubheading}
              className="group w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center transition">
                <Type size={19} />
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Subheading
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Supporting title
                </p>
              </div>

              <Plus
                size={16}
                className="text-gray-400 group-hover:text-gray-900 transition"
              />
            </button>

            {/* Body Text */}
            <button
              type="button"
              onClick={addText}
              className="group w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-sm transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-gray-900 group-hover:text-white flex items-center justify-center transition">
                <AlignLeft size={19} />
              </div>

              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Body Text
                </p>

                <p className="text-xs text-gray-500 mt-0.5">
                  Normal paragraph
                </p>
              </div>

              <Plus
                size={16}
                className="text-gray-400 group-hover:text-gray-900 transition"
              />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200" />

        {/* Shapes Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Shapes
            </h3>

            <span className="text-[11px] text-gray-400">
              Add
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Rectangle */}
            <button
              type="button"
              onClick={addRectangle}
              title="Add Rectangle"
              className="group h-20 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-sm transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <Square
                size={23}
                strokeWidth={1.8}
                className="text-gray-700 group-hover:text-gray-900"
              />

              <span className="text-[11px] font-medium text-gray-600">
                Rectangle
              </span>
            </button>

            {/* Circle */}
            <button
              type="button"
              onClick={addCircle}
              title="Add Circle"
              className="group h-20 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-sm transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <Circle
                size={23}
                strokeWidth={1.8}
                className="text-gray-700 group-hover:text-gray-900"
              />

              <span className="text-[11px] font-medium text-gray-600">
                Circle
              </span>
            </button>

            {/* Triangle */}
            <button
              type="button"
              onClick={addTriangle}
              title="Add Triangle"
              className="group h-20 rounded-xl border border-gray-200 bg-white hover:border-gray-900 hover:shadow-sm transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <Triangle
                size={23}
                strokeWidth={1.8}
                className="text-gray-700 group-hover:text-gray-900"
              />

              <span className="text-[11px] font-medium text-gray-600">
                Triangle
              </span>
            </button>
          </div>
        </div>

        {/* Help Card */}
        <div className="mt-6 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-xs font-semibold text-gray-700">
            Quick tip
          </p>

          <p className="text-[11px] leading-4 text-gray-500 mt-1">
            Add an element and select it on the canvas to edit its
            properties.
          </p>
        </div>
      </div>
    </aside>
  );
}