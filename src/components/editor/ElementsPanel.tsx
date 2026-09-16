import {
  Type,
  Heading,
  Text,
  Square,
  Circle as CircleIcon,
  Triangle,
  ImagePlus,
  Trash2,
  Copy,
  Layers,
} from "lucide-react";

import { useRef } from "react";

import { useFabric } from "../../context/FabricContext";

function getLayerIcon(type: string) {
  if (type === "heading") {
    return <Heading size={16} />;
  }

  if (type === "subheading") {
    return <Type size={16} />;
  }

  if (type === "text") {
    return <Text size={16} />;
  }

  if (type === "rectangle") {
    return <Square size={16} />;
  }

  if (type === "circle") {
    return <CircleIcon size={16} />;
  }

  if (type === "triangle") {
    return <Triangle size={16} />;
  }

  if (type === "image") {
    return <ImagePlus size={16} />;
  }

  return <Layers size={16} />;
}

function getLayerName(type: string) {
  if (type === "heading") return "Heading";
  if (type === "subheading")
    return "Subheading";
  if (type === "text") return "Body Text";
  if (type === "rectangle")
    return "Rectangle";
  if (type === "circle") return "Circle";
  if (type === "triangle")
    return "Triangle";
  if (type === "image") return "Image";

  return "Element";
}

export default function ElementsPanel() {
  const imageInputRef =
    useRef<HTMLInputElement | null>(null);

  const {
    addText,
    addShape,
    addImage,
    selectedObject,
    deleteSelected,
    duplicateSelected,
    selectObjectById,
    convertCanvasToElements,
  } = useFabric();

  const layers =
    convertCanvasToElements().reverse();

  function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

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

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">
          Elements
        </h2>

        <p className="text-xs text-gray-500 mt-1">
          Add elements to your certificate
        </p>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Text
          </p>

          <div className="space-y-2">
            <button
              onClick={() =>
                addText("heading")
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              <Heading size={18} />

              <span className="text-sm font-medium">
                Heading
              </span>
            </button>

            <button
              onClick={() =>
                addText("subheading")
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              <Type size={18} />

              <span className="text-sm font-medium">
                Subheading
              </span>
            </button>

            <button
              onClick={() =>
                addText("text")
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              <Text size={18} />

              <span className="text-sm font-medium">
                Body Text
              </span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Shapes
          </p>

          <div className="space-y-2">
            <button
              onClick={() =>
                addShape("rectangle")
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              <Square size={18} />

              <span className="text-sm font-medium">
                Rectangle
              </span>
            </button>

            <button
              onClick={() =>
                addShape("circle")
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              <CircleIcon size={18} />

              <span className="text-sm font-medium">
                Circle
              </span>
            </button>

            <button
              onClick={() =>
                addShape("triangle")
              }
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
            >
              <Triangle size={18} />

              <span className="text-sm font-medium">
                Triangle
              </span>
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Media
          </p>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleImageUpload}
          />

          <button
            onClick={() =>
              imageInputRef.current?.click()
            }
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition text-left"
          >
            <ImagePlus size={18} />

            <span className="text-sm font-medium">
              Upload Image
            </span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Layers
            </p>

            <Layers size={15} className="text-gray-400" />
          </div>

          {layers.length === 0 ? (
            <p className="text-xs text-gray-400">
              No elements yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer border transition ${
                    selectedObject &&
                    (
                      selectedObject as any
                    ).elementId === layer.id
                      ? "bg-gray-100 border-gray-300"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                  onClick={() =>
                    selectObjectById(
                      layer.id
                    )
                  }
                >
                  <span className="text-gray-600">
                    {getLayerIcon(
                      layer.type
                    )}
                  </span>

                  <span className="text-xs font-medium text-gray-700 truncate flex-1">
                    {layer.text
                      ? layer.text
                      : getLayerName(
                          layer.type
                        )}
                  </span>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();

                      selectObjectById(
                        layer.id
                      );

                      duplicateSelected();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 transition"
                    title="Duplicate"
                  >
                    <Copy size={13} />
                  </button>

                  <button
                    onClick={(event) => {
                      event.stopPropagation();

                      selectObjectById(
                        layer.id
                      );

                      deleteSelected();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500 transition"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 leading-5">
            💡 Tip: Select an image and drag
            its corner handles to resize it.
            Use the rotation handle to rotate
            it.
          </p>
        </div>
      </div>
    </aside>
  );
}