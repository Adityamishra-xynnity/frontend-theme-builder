import {
  Type,
  Heading,
  AlignLeft,
  Square,
  Circle,
  Triangle,
  ImagePlus,
  Sparkles,
  Layers,
  MousePointer2,
} from "lucide-react";

import { useRef } from "react";

import { useFabric } from "../../context/FabricContext";

export default function ElementsPanel() {
  const {
    addText,
    addShape,
    addImage,
    convertCanvasToElements,
    selectObjectById,
    selectedObject,
  } = useFabric();

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result === "string"
      ) {
        addImage(reader.result);
      }
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  const elements =
    convertCanvasToElements();

  const layers =
    [...elements].reverse();

  function getLayerName(
    type: string,
    index: number
  ) {
    if (type === "heading") {
      return "Heading";
    }

    if (type === "subheading") {
      return "Subheading";
    }

    if (type === "text") {
      return "Text";
    }

    if (type === "rectangle") {
      return "Rectangle";
    }

    if (type === "circle") {
      return "Circle";
    }

    if (type === "triangle") {
      return "Triangle";
    }

    if (type === "image") {
      return "Image";
    }

    return `Element ${index + 1}`;
  }

  function getLayerIcon(type: string) {
    if (type === "heading") {
      return <Heading size={16} />;
    }

    if (type === "subheading") {
      return <AlignLeft size={16} />;
    }

    if (type === "text") {
      return <Type size={16} />;
    }

    if (type === "rectangle") {
      return <Square size={16} />;
    }

    if (type === "circle") {
      return <Circle size={16} />;
    }

    if (type === "triangle") {
      return <Triangle size={16} />;
    }

    if (type === "image") {
      return <ImagePlus size={16} />;
    }

    return <MousePointer2 size={16} />;
  }

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-full overflow-y-auto">

      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">

          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <Sparkles
              size={18}
              className="text-gray-700"
            />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Elements
            </h2>

            <p className="text-xs text-gray-500 mt-0.5">
              Add elements to your design
            </p>
          </div>

        </div>
      </div>

      {/* Text Section */}
      <div className="px-4 pt-5">

        <p className="px-1 mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Text
        </p>

        <div className="space-y-2">

          {/* Heading */}
          <button
            type="button"
            onClick={() =>
              addText("heading")
            }
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Heading
                size={20}
                className="text-gray-800"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Heading
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                Large title
              </p>
            </div>
          </button>

          {/* Subheading */}
          <button
            type="button"
            onClick={() =>
              addText("subheading")
            }
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <AlignLeft
                size={19}
                className="text-gray-800"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Subheading
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                Supporting text
              </p>
            </div>
          </button>

          {/* Body Text */}
          <button
            type="button"
            onClick={() =>
              addText("text")
            }
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Type
                size={19}
                className="text-gray-800"
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                Body Text
              </p>

              <p className="text-xs text-gray-500 mt-0.5">
                Normal text
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Shapes Section */}
      <div className="px-4 pt-6">

        <p className="px-1 mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Shapes
        </p>

        <div className="grid grid-cols-3 gap-2">

          {/* Rectangle */}
          <button
            type="button"
            onClick={() =>
              addShape("rectangle")
            }
            className="h-20 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition flex flex-col items-center justify-center gap-2"
            title="Add rectangle"
          >
            <Square
              size={25}
              strokeWidth={1.8}
              className="text-gray-700"
            />

            <span className="text-[11px] font-medium text-gray-600">
              Rectangle
            </span>
          </button>

          {/* Circle */}
          <button
            type="button"
            onClick={() =>
              addShape("circle")
            }
            className="h-20 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition flex flex-col items-center justify-center gap-2"
            title="Add circle"
          >
            <Circle
              size={25}
              strokeWidth={1.8}
              className="text-gray-700"
            />

            <span className="text-[11px] font-medium text-gray-600">
              Circle
            </span>
          </button>

          {/* Triangle */}
          <button
            type="button"
            onClick={() =>
              addShape("triangle")
            }
            className="h-20 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition flex flex-col items-center justify-center gap-2"
            title="Add triangle"
          >
            <Triangle
              size={25}
              strokeWidth={1.8}
              className="text-gray-700"
            />

            <span className="text-[11px] font-medium text-gray-600">
              Triangle
            </span>
          </button>

        </div>
      </div>

      {/* Media Section */}
      <div className="px-4 pt-6">

        <p className="px-1 mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Media
        </p>

        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          className="w-full h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition flex flex-col items-center justify-center gap-2"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <ImagePlus
              size={20}
              className="text-gray-700"
            />
          </div>

          <div className="text-center">

            <p className="text-sm font-semibold text-gray-800">
              Upload Image
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              PNG, JPG, WEBP
            </p>

          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

      </div>

      {/* Layers Section */}
      <div className="px-4 pt-6 pb-6 border-t border-gray-100 mt-4">

        <div className="flex items-center justify-between px-1 mb-3">

          <div className="flex items-center gap-2">

            <Layers
              size={15}
              className="text-gray-500"
            />

            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Layers
            </p>

          </div>

          <span className="text-[10px] font-medium text-gray-400">
            {layers.length}
          </span>

        </div>

        {layers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">

            <Layers
              size={22}
              className="mx-auto text-gray-300"
            />

            <p className="text-xs font-medium text-gray-500 mt-2">
              No layers yet
            </p>

            <p className="text-[11px] text-gray-400 mt-1">
              Add an element to see it here
            </p>

          </div>
        ) : (
          <div className="space-y-1.5">

            {layers.map(
              (element, index) => {

                const isSelected =
                  selectedObject &&
                  selectedObject.elementId ===
                    element.id;

                return (
                  <button
                    key={element.id}
                    type="button"
                    onClick={() =>
                      selectObjectById(
                        element.id
                      )
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                      isSelected
                        ? "bg-gray-100 border border-gray-300"
                        : "bg-white border border-transparent hover:bg-gray-50 hover:border-gray-200"
                    }`}
                  >

                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white text-gray-900"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {getLayerIcon(
                        element.type
                      )}
                    </div>

                    <div className="min-w-0 flex-1">

                      <p
                        className={`text-xs font-medium truncate ${
                          isSelected
                            ? "text-gray-900"
                            : "text-gray-700"
                        }`}
                      >
                        {element.text
                          ? element.text
                          : getLayerName(
                              element.type,
                              index
                            )}
                      </p>

                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {getLayerName(
                          element.type,
                          index
                        )}
                      </p>

                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-semibold text-gray-500">
                        Selected
                      </span>
                    )}

                  </button>
                );
              }
            )}

          </div>
        )}

      </div>

    </aside>
  );
}