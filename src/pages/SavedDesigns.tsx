
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Edit3,
  FileText,
  FolderOpen,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useEditor,
  type SavedDesign,
} from "../context/EditorContext";

export default function SavedDesigns() {
  const navigate = useNavigate();

  const { getSavedDesigns, deleteSavedDesign } = useEditor();

  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDesigns = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const saved = await getSavedDesigns();

        if (active) {
          setDesigns(saved);
        }
      } catch (error) {
        console.error("Failed to load saved designs:", error);

        if (active) {
          setLoadError(
            "Your saved designs could not be loaded. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadDesigns();

    return () => {
      active = false;
    };
  }, [getSavedDesigns]);

  const handleEdit = (design: SavedDesign) => {
    navigate("/editor", {
      state: {
        savedDesign: design,
      },
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this saved design? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      await deleteSavedDesign(id);

      setDesigns((previous) =>
        previous.filter((design) => design.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete design:", error);

      window.alert(
        "The design could not be deleted. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPreviewText = (design: SavedDesign) => {
    return design.elements
      .filter(
        (element) =>
          element.type === "heading" ||
          element.type === "subheading" ||
          element.type === "text"
      )
      .slice(0, 3);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-slate-50 text-slate-900">
      {/* Page Header */}
      <section className="border-b border-slate-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-sm font-semibold text-indigo-700 shadow-sm">
                <FolderOpen size={16} />
                Your workspace
              </div>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Saved Designs
              </h1>

              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                All your saved certificates in one place. Open an existing
                design to continue editing whenever you need.
              </p>

              {!loading && !loadError && (
                <p className="mt-4 text-sm font-medium text-slate-500">
                  {designs.length}{" "}
                  {designs.length === 1 ? "design" : "designs"} saved
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/editor")}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <Plus size={19} />
              Create New
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-12 lg:px-10">
        {/* Loading State */}
        {loading && (
          <div
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading saved designs"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div className="aspect-[4/3] animate-pulse bg-slate-200" />

                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                  <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load Error */}
        {!loading && loadError && (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center"
          >
            <h2 className="text-xl font-bold text-slate-900">
              Unable to load designs
            </h2>

            <p className="mt-3 text-sm text-slate-600">{loadError}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-indigo-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !loadError && designs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm sm:px-12 sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText size={37} strokeWidth={1.6} />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
              <Sparkles size={16} />
              Your creative space
            </div>

            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              No saved designs yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500 sm:text-base">
              Once you save a certificate from the editor, it will appear
              here. You can come back anytime to continue editing it.
            </p>

            <button
              type="button"
              onClick={() => navigate("/editor")}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              <Plus size={19} />
              Create Your First Certificate
            </button>
          </div>
        )}

        {/* Saved Design Cards */}
        {!loading && !loadError && designs.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Your certificates
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select a design to continue your work.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {designs.map((design) => {
                const previewText = getPreviewText(design);

                const designName =
                  typeof design.name === "string" && design.name.trim()
                    ? design.name
                    : "My Certificate";

                return (
                  <article
                    key={design.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40"
                  >
                    {/* Certificate Preview */}
                    <div
                      className="relative flex aspect-[4/3] items-center justify-center overflow-hidden p-5 sm:p-6"
                      style={{
                        backgroundColor:
                          design.backgroundColor || "#f1f5f9",
                      }}
                    >
                      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden border-2 border-slate-300/70 bg-white/50 px-4 py-3 shadow-sm">
                        <div className="pointer-events-none absolute inset-2 border border-slate-300/40" />

                        <div className="relative flex w-full flex-col items-center justify-center gap-1">
                          {previewText.length > 0 ? (
                            previewText.map((element) => (
                              <p
                                key={element.id}
                                className="max-w-full truncate text-center"
                                style={{
                                  fontSize: `${Math.min(
                                    Math.max(element.fontSize || 18, 8),
                                    26
                                  )}px`,
                                  fontFamily:
                                    element.fontFamily || "Arial, sans-serif",
                                  color: element.color || "#111827",
                                  fontWeight:
                                    element.fontWeight || "normal",
                                  fontStyle:
                                    element.fontStyle || "normal",
                                  lineHeight: 1.35,
                                }}
                              >
                                {typeof element.text === "string"
                                  ? element.text
                                  : "Text"}
                              </p>
                            ))
                          ) : (
                            <>
                              <Award
                                size={30}
                                className="mb-2 text-slate-400"
                                strokeWidth={1.4}
                              />

                              <span className="text-sm font-semibold text-slate-500">
                                Blank Certificate
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="absolute right-3 top-3 rounded-lg border border-white/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                        Saved design
                      </div>
                    </div>

                    {/* Design Information */}
                    <div className="p-5">
                      <h3
                        className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-indigo-700"
                        title={designName}
                      >
                        {designName}
                      </h3>

                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={15} className="shrink-0" />
                        <span>
                          Updated {formatDate(design.updatedAt)}
                        </span>
                      </div>

                      <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => handleEdit(design)}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                        >
                          <Edit3 size={16} />
                          Continue Editing
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(design.id)}
                          disabled={deletingId === design.id}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete design"
                          aria-label={`Delete ${designName}`}
                        >
                          {deletingId === design.id ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-600" />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
}