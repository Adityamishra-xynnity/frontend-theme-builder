import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit3,
  Trash2,
  Plus,
  FileText,
  Clock,
} from "lucide-react";

import {
  useEditor,
  type SavedDesign,
} from "../context/EditorContext";

export default function SavedDesigns() {
  const navigate = useNavigate();

  const {
    getSavedDesigns,
    deleteSavedDesign,
  } = useEditor();

  const [designs, setDesigns] =
    useState<SavedDesign[]>([]);

  useEffect(() => {
    const saved =
      getSavedDesigns();

    setDesigns(saved);
  }, []);

  const handleEdit = (
    design: SavedDesign
  ) => {
    navigate("/editor", {
      state: {
        savedDesign: design,
      },
    });
  };

  const handleDelete = (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this design?"
      );

    if (!confirmed) {
      return;
    }

    deleteSavedDesign(id);

    setDesigns((previous) =>
      previous.filter(
        (design) =>
          design.id !== id
      )
    );
  };

  const formatDate = (
    date: string
  ) => {
    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Unknown date";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getPreviewText = (
    design: SavedDesign
  ) => {
    const textElements =
      design.elements.filter(
        (element) =>
          element.type === "heading" ||
          element.type ===
            "subheading" ||
          element.type === "text"
      );

    return textElements.slice(
      0,
      3
    );
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 px-6 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Saved Designs
            </h1>

            <p className="text-gray-500 mt-2">
              Open and continue editing
              your saved certificates.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/editor")
            }
            className="flex items-center gap-2 bg-black text-white px-5 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            <Plus size={18} />

            Create New
          </button>
        </div>

        {/* Empty State */}
        {designs.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl min-h-[450px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
              <FileText
                size={38}
                className="text-gray-400"
              />
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              No saved designs yet
            </h2>

            <p className="text-gray-500 mt-2 max-w-md">
              Your saved certificates
              will appear here.
            </p>

            <button
              onClick={() =>
                navigate("/editor")
              }
              className="mt-6 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Create Certificate
            </button>
          </div>
        )}

        {/* Saved Designs */}
        {designs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map(
              (design) => {
                const previewText =
                  getPreviewText(
                    design
                  );

                return (
                  <div
                    key={design.id}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    {/* Preview */}
                    <div
                      className="h-52 p-6 flex items-center justify-center"
                      style={{
                        backgroundColor:
                          design.backgroundColor ||
                          "#ffffff",
                      }}
                    >
                      <div className="w-full h-full border border-gray-300 flex flex-col items-center justify-center overflow-hidden px-4">
                        {previewText.length >
                        0 ? (
                          previewText.map(
                            (
                              element
                            ) => (
                              <p
                                key={
                                  element.id
                                }
                                className="text-center truncate max-w-full"
                                style={{
                                  fontSize:
                                    Math.min(
                                      element.fontSize ||
                                        18,
                                      28
                                    ),

                                  fontFamily:
                                    element.fontFamily ||
                                    "Arial",

                                  color:
                                    element.color ||
                                    "#111827",

                                  fontWeight:
                                    element.fontWeight ||
                                    "normal",

                                  fontStyle:
                                    element.fontStyle ||
                                    "normal",
                                }}
                              >
                                {typeof element.text ===
                                "string"
                                  ? element.text
                                  : "Text"}
                              </p>
                            )
                          )
                        ) : (
                          <span className="text-gray-500 text-sm">
                            Blank Certificate
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">
                        {typeof design.name ===
                        "string"
                          ? design.name
                          : "My Certificate"}
                      </h2>

                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                        <Clock
                          size={15}
                        />

                        <span>
                          Updated{" "}
                          {formatDate(
                            design.updatedAt
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-5">
                        <button
                          onClick={() =>
                            handleEdit(
                              design
                            )
                          }
                          className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition"
                        >
                          <Edit3
                            size={16}
                          />

                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(
                              design.id
                            )
                          }
                          className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                          title="Delete design"
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}