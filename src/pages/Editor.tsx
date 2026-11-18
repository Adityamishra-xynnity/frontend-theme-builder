import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Menu, X } from "lucide-react";

import Toolbar from "../components/editor/Toolbar";
import FabricEditorCanvas from "../components/editor/fabric/FabricCanvas";

import {
  useEditor,
  type SavedDesign,
  type PaperSize,
  type PageOrientation,
} from "../context/EditorContext";

import {
  getTemplateByKey,
  type CertificateTemplate,
} from "../api/templateApi";

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
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );
  const [isTablet, setIsTablet] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth >= 768 &&
      window.innerWidth < 1024,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(true);

  const [selectedTemplate, setSelectedTemplate] =
    useState<CertificateTemplate | null>(null);

  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateError, setTemplateError] = useState("");

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
    const updateViewportMode = () => {
      const width = window.innerWidth;
      const mobile = width < 768;
      const tablet = width >= 768 && width < 1024;

      setIsMobile(mobile);
      setIsTablet(tablet);

      if (!mobile) {
        setMobileMenuOpen(false);
        setMobilePanelOpen(false);
      }

      if (!tablet) {
        setTabletSidebarOpen(true);
      }
    };

    updateViewportMode();

    // ResizeObserver on the canvas handles the actual fit. This listener only
    // switches the editor navigation mode at the breakpoints.
    window.addEventListener("resize", updateViewportMode);
    window.visualViewport?.addEventListener("resize", updateViewportMode);

    return () => {
      window.removeEventListener("resize", updateViewportMode);
      window.visualViewport?.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (savedDesign) {
      setSelectedTemplate(null);
      setTemplateError("");
      setTemplateLoading(false);

      loadSavedDesign(savedDesign);

      setPageSettings(
        savedDesign.pageSize ?? "A4",
        savedDesign.orientation ?? "landscape",
      );

      return () => {
        cancelled = true;
      };
    }

    if (id) {
      setSelectedTemplate(null);
      setTemplateError("");
      setTemplateLoading(true);

      clearCanvas();
      setPageSettings("A4", "landscape");

      getTemplateByKey(id)
        .then((template) => {
          if (cancelled) return;

          setSelectedTemplate(template);

          loadTemplate({
            id: template.templateKey,
            name: template.name,
            backgroundColor: template.backgroundColor,
            elements: Array.isArray(template.elementsData)
              ? template.elementsData
              : [],
          });

          setPageSettings("A4", "landscape");
        })
        .catch((error) => {
          if (cancelled) return;

          console.error("Failed to load template:", error);

          setSelectedTemplate(null);
          setTemplateError(
            "Unable to load this template. Please try again.",
          );

          clearCanvas();
        })
        .finally(() => {
          if (!cancelled) {
            setTemplateLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }

    setSelectedTemplate(null);
    setTemplateError("");
    setTemplateLoading(false);

    clearCanvas();
    setPageSettings("A4", "landscape");

    return () => {
      cancelled = true;
    };
  }, [
    id,
    savedDesign,
    loadTemplate,
    loadSavedDesign,
    clearCanvas,
    setPageSettings,
  ]);

  const handlePanelChange = (panel: string) => {
    if (isMobile) {
      setActivePanel(panel);
      setMobileMenuOpen(false);
      setMobilePanelOpen(true);
      return;
    }

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
    <main className="flex h-[calc(100dvh-72px)] min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-100">
      <div className="sticky top-0 z-40 w-full min-w-0 shrink-0 border-b border-slate-200 bg-white">
        <Toolbar />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!isMobile && (!isTablet || tabletSidebarOpen) && (
          <div className="z-20 h-full shrink-0 overflow-y-auto overscroll-contain border-r border-slate-200 bg-white">
            <EditorSidebar
              onPanelChange={handlePanelChange}
              activePanel={activePanel}
            />
          </div>
        )}

        {!isMobile &&
          activePanel !== "" &&
          (!isTablet || tabletSidebarOpen) && (
            <div className="z-10 h-full w-64 min-w-0 shrink-0 overflow-y-auto overscroll-contain border-r border-slate-200 bg-white lg:w-72">
              <EditorPanel
                activePanel={activePanel}
                paperSize={pageSize}
                orientation={orientation}
                onPaperSizeChange={handlePaperSizeChange}
                onOrientationChange={handleOrientationChange}
              />
            </div>
          )}

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100">
          <div className="sticky left-0 top-0 z-10 shrink-0 border-b border-slate-200/80 bg-white/95 px-2 py-2 backdrop-blur-sm sm:px-4 sm:py-3 lg:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {(isMobile || isTablet) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isMobile) {
                        setMobileMenuOpen(true);
                      } else {
                        setTabletSidebarOpen((open) => !open);
                      }
                    }}
                    aria-label={
                      isMobile
                        ? "Open editor panels"
                        : tabletSidebarOpen
                          ? "Collapse editor panels"
                          : "Open editor panels"
                    }
                    aria-expanded={
                      isMobile ? mobileMenuOpen : tabletSidebarOpen
                    }
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Menu size={19} />
                  </button>
                )}

                <div className="min-w-0">
                  <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                    Certificate Editor
                  </h1>

                  <p className="mt-0.5 max-w-full truncate text-xs text-slate-500 sm:text-sm">
                    {savedDesign
                      ? `Editing: ${savedDesign.name}`
                      : templateLoading
                        ? "Loading template..."
                        : selectedTemplate
                          ? `Editing: ${selectedTemplate.name}`
                          : templateError
                            ? templateError
                            : "Create your certificate from a blank canvas."}
                  </p>
                </div>
              </div>

              <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:gap-2">
                <button
                  type="button"
                  onClick={addPage}
                  className="flex-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 sm:flex-none sm:px-3 sm:text-sm"
                >
                  + Add Page
                </button>

                <button
                  type="button"
                  onClick={copyPage}
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none sm:px-3 sm:text-sm"
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
                  className="flex-1 rounded-lg border border-red-200 bg-white px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-3 sm:text-sm"
                >
                  Delete Page
                </button>
              </div>
            </div>

            {pages.length > 1 && (
              <div className="mt-2 flex min-w-0 gap-2 overflow-x-auto pb-1 sm:mt-3">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => selectPage(page.id)}
                    aria-pressed={page.id === activePageId}
                    className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
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

          <div className="flex min-h-0 min-w-0 w-full flex-1 items-center justify-center p-1.5 sm:p-3 lg:p-5">
            <div className="h-full min-h-0 w-full min-w-0">
              <FabricEditorCanvas
                pageWidth={dimensions.width}
                pageHeight={dimensions.height}
              />
            </div>
          </div>
        </section>
      </div>

      {/* Mobile navigation: parent owns scrolling; the sidebar itself does not
          create a second nested scroll area. */}
      {isMobile && mobileMenuOpen && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="Close editor navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/40"
          />

          <div className="absolute inset-y-0 left-0 flex w-[112px] max-w-[85vw] flex-col overflow-hidden bg-white shadow-2xl">
            <div className="flex h-14 shrink-0 items-center justify-center border-b border-slate-200 px-2">
              <span className="text-xs font-bold text-slate-900">
                Editor panels
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close editor navigation"
                className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              <EditorSidebar
                onPanelChange={handlePanelChange}
                activePanel={activePanel}
              />
            </div>
          </div>
        </div>
      )}

      {/* The selected tool panel is a bottom sheet on phones. */}
      {isMobile && mobilePanelOpen && activePanel !== "" && (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close selected editor panel"
            onClick={() => setMobilePanelOpen(false)}
            className="absolute inset-0 h-full w-full bg-slate-950/40"
          />

          <div className="absolute inset-x-0 bottom-0 flex max-h-[82dvh] min-h-[45dvh] flex-col overflow-hidden rounded-t-2xl border-t border-slate-200 bg-white shadow-2xl">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
              <span className="text-sm font-bold capitalize text-slate-900">
                {activePanel === "html-import"
                  ? "HTML Import"
                  : activePanel === "page-size"
                    ? "Page Size"
                    : activePanel}
              </span>

              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                aria-label="Close selected editor panel"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <EditorPanel
                activePanel={activePanel}
                paperSize={pageSize}
                orientation={orientation}
                onPaperSizeChange={handlePaperSizeChange}
                onOrientationChange={handleOrientationChange}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
