
import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import Toolbar from "../components/editor/Toolbar";
import FabricEditorCanvas from "../components/editor/fabric/FabricCanvas";
import { templates } from "../data/templates";
import {
  useEditor,
  type SavedDesign,
  type PaperSize,
  type PageOrientation,
} from "../context/EditorContext";
import EditorSidebar from "../components/editor/EditorSidebar";
import EditorPanel from "../components/editor/EditorPanel";

export type { PaperSize, PageOrientation } from "../context/EditorContext";

export interface PageDimensions {
  width: number;
  height: number;
}

export const PAPER_DIMENSIONS: Record<PaperSize, PageDimensions> = {
  A1: { width: 594, height: 841 },
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
};

const CANVAS_SCALE = 900 / 297;

export function getCanvasDimensions(
  paperSize: PaperSize,
  orientation: PageOrientation,
): PageDimensions {
  const paper = PAPER_DIMENSIONS[paperSize];

  const width =
    orientation === "landscape" ? paper.height : paper.width;

  const height =
    orientation === "landscape" ? paper.width : paper.height;

  return {
    width: Math.round(width * CANVAS_SCALE),
    height: Math.round(height * CANVAS_SCALE),
  };
}

interface EditorLocationState {
  savedDesign?: SavedDesign;
}

export default function Editor() {
  const { id } = useParams();
  const location = useLocation();

  const [activePanel, setActivePanel] = useState("elements");

  const {
    pageSize,
    orientation,
    setPageSettings,
    loadTemplate,
    loadSavedDesign,
    clearCanvas,
    pages,
    activePageId,
    addPage,
    copyPage,
    deletePage,
    selectPage,
  } = useEditor();

  const locationState = location.state as EditorLocationState | null;
  const savedDesign = locationState?.savedDesign;

  useEffect(() => {
    if (savedDesign) {
      loadSavedDesign(savedDesign);

      setPageSettings(
        savedDesign.pageSize ?? "A4",
        savedDesign.orientation ?? "landscape",
      );

      return;
    }

    if (id) {
      const template = templates.find((item) => item.id === id);

      if (template) {
        loadTemplate(template);
      } else {
        clearCanvas();
      }

      setPageSettings("A4", "landscape");
      return;
    }

    clearCanvas();
    setPageSettings("A4", "landscape");
  }, [
    id,
    savedDesign,
    loadTemplate,
    loadSavedDesign,
    clearCanvas,
    setPageSettings,
  ]);

  const selectedTemplate = templates.find((item) => item.id === id);

  const handlePanelChange = (panel: string) => {
    setActivePanel((current) =>
      current === panel ? "" : panel,
    );
  };

  const handlePaperSizeChange = (size: PaperSize) => {
    setPageSettings(size, orientation);
  };

  const handleOrientationChange = (
    nextOrientation: PageOrientation,
  ) => {
    setPageSettings(pageSize, nextOrientation);
  };

  const dimensions = getCanvasDimensions(pageSize, orientation);

  return (
    <main className="flex h-[calc(100dvh-72px)] min-h-0 w-full flex-col overflow-hidden bg-slate-100">
      {/* Existing toolbar */}
      <div className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white">
        <Toolbar />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Existing sidebar */}
        <div className="z-20 h-full shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <EditorSidebar
            onPanelChange={handlePanelChange}
            activePanel={activePanel}
          />
        </div>

        {/* Existing editor panel */}
        {activePanel !== "" && (
          <div className="z-10 h-full w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white sm:w-72">
            <EditorPanel
              activePanel={activePanel}
              paperSize={pageSize}
              orientation={orientation}
              onPaperSizeChange={handlePaperSizeChange}
              onOrientationChange={handleOrientationChange}
            />
          </div>
        )}

        {/* Main canvas area */}
        <section className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-slate-100">
          {/* Page actions and page tabs */}
          <div className="sticky left-0 top-0 z-10 border-b border-slate-200/80 bg-white/95 px-5 py-3 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-slate-900">
                  Certificate Editor
                </h1>

                <p className="mt-0.5 truncate text-sm text-slate-500">
                  {savedDesign
                    ? `Editing: ${savedDesign.name}`
                    : selectedTemplate
                      ? `Editing: ${selectedTemplate.name}`
                      : "Create your certificate from a blank canvas."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addPage}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  + Add Page
                </button>

                <button
                  type="button"
                  onClick={copyPage}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Copy Page
                </button>

                <button
                  type="button"
                  onClick={deletePage}
                  disabled={pages.length <= 1}
                  title={
                    pages.length <= 1
                      ? "At least one page must remain"
                      : "Delete selected page"
                  }
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Delete Page
                </button>
              </div>
            </div>

            {/* Show tabs when there is more than one page */}
            {pages.length > 1 && (
              <div className="mt-3 flex min-w-0 gap-2 overflow-x-auto pb-1">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => selectPage(page.id)}
                    aria-pressed={page.id === activePageId}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                      page.id === activePageId
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                    }`}
                  >
                    Page {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Existing Fabric canvas */}
          <div className="flex min-h-full min-w-full items-center justify-center p-5 sm:p-8">
            <div
              className="shrink-0 bg-white"
              style={{
                width: dimensions.width,
                height: dimensions.height,
              }}
            >
              <FabricEditorCanvas
                pageWidth={dimensions.width}
                pageHeight={dimensions.height}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
