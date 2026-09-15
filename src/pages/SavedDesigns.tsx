import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  useEditor,
  type SavedDesign,
} from "../context/EditorContext";

export default function SavedDesigns() {
  const navigate = useNavigate();

  const {
    getSavedDesigns,
    loadSavedDesign,
    deleteSavedDesign,
  } = useEditor();

  const [designs, setDesigns] =
    useState<SavedDesign[]>([]);

  const loadDesigns = () => {
    setDesigns(getSavedDesigns());
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const handleOpen = (
    design: SavedDesign
  ) => {
    loadSavedDesign(design);

    navigate("/editor");
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

    loadDesigns();
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
          Your Designs
        </p>

        <h1 className="text-4xl font-bold text-gray-900 mt-2">
          Saved Designs
        </h1>

        <p className="text-gray-500 mt-3">
          Open and continue editing your saved certificates.
        </p>
      </div>

      {designs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
          <div className="text-6xl mb-5">
            💾
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">
            No saved designs yet
          </h2>

          <p className="text-gray-500 mt-3 max-w-md mx-auto">
            Create a certificate in the editor and save it.
            Your saved certificates will appear here.
          </p>

          <Link
            to="/editor"
            className="inline-flex mt-7 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Create Certificate
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {designs.map((design) => (
            <div
              key={design.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition"
            >
              <div
                className="relative aspect-[900/650] overflow-hidden"
                style={{
                  backgroundColor:
                    design.backgroundColor,
                }}
              >
                <div className="absolute inset-[4%] border-2 border-gray-500 pointer-events-none" />

                <div className="absolute inset-[7%] border border-gray-300 pointer-events-none" />

                {design.elements.map(
                  (element) => {
                    const left =
                      (element.x / 900) * 100;

                    const top =
                      (element.y / 650) * 100;

                    const width =
                      (element.width / 900) * 100;

                    const height =
                      (element.height / 650) * 100;

                    const baseStyle = {
                      position:
                        "absolute" as const,
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    };

                    if (
                      element.type ===
                      "rectangle"
                    ) {
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...baseStyle,
                            backgroundColor:
                              element.backgroundColor,
                          }}
                        />
                      );
                    }

                    if (
                      element.type ===
                      "circle"
                    ) {
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...baseStyle,
                            backgroundColor:
                              element.backgroundColor,
                            borderRadius:
                              "50%",
                          }}
                        />
                      );
                    }

                    if (
                      element.type ===
                      "triangle"
                    ) {
                      return (
                        <div
                          key={element.id}
                          style={{
                            ...baseStyle,
                          }}
                        >
                          <div
                            style={{
                              width: 0,
                              height: 0,
                              borderLeft:
                                `${element.width / 2}px solid transparent`,
                              borderRight:
                                `${element.width / 2}px solid transparent`,
                              borderBottom:
                                `${element.height}px solid ${element.backgroundColor}`,
                              transform:
                                "scale(0.45)",
                              transformOrigin:
                                "top left",
                            }}
                          />
                        </div>
                      );
                    }

                    return (
                      <div
                        key={element.id}
                        style={{
                          ...baseStyle,
                          fontSize: `${Math.max(
                            6,
                            element.fontSize *
                              0.45
                          )}px`,
                          fontFamily:
                            element.fontFamily,
                          color:
                            element.color,
                          fontWeight:
                            element.fontWeight,
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          textAlign:
                            "center",
                          lineHeight: "1.2",
                          padding: "2px",
                          overflow: "hidden",
                        }}
                      >
                        {element.text}
                      </div>
                    );
                  }
                )}
              </div>

              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900">
                  {design.name}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Last updated:{" "}
                  {new Date(
                    design.updatedAt
                  ).toLocaleString()}
                </p>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() =>
                      handleOpen(design)
                    }
                    className="flex-1 bg-black text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition"
                  >
                    Open
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        design.id
                      )
                    }
                    className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}