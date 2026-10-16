import { useEffect, useState } from "react";
import {
  useLocation,
  useParams,
} from "react-router-dom";

import Toolbar from "../components/editor/Toolbar";
import FabricEditorCanvas from "../components/editor/fabric/FabricCanvas";

import { templates } from "../data/templates";

import {
  useEditor,
  type SavedDesign,
} from "../context/EditorContext";

import EditorSidebar from "../components/editor/EditorSidebar";
import EditorPanel from "../components/editor/EditorPanel";

interface EditorLocationState {
  savedDesign?: SavedDesign;
}

export default function Editor() {
  const { id } = useParams();
  const location = useLocation();

  const [activePanel, setActivePanel] =
    useState("elements");

  const {
    loadTemplate,
    loadSavedDesign,
    clearCanvas,
  } = useEditor();

  const locationState =
    location.state as EditorLocationState | null;

  const savedDesign = locationState?.savedDesign;

  useEffect(() => {
    if (savedDesign) {
      loadSavedDesign(savedDesign);
      return;
    }

    if (id) {
      const template = templates.find(
        (item) => item.id === id
      );

      if (template) {
        loadTemplate(template);
      } else {
        clearCanvas();
      }

      return;
    }

    clearCanvas();
  }, [id, savedDesign, loadTemplate, loadSavedDesign, clearCanvas]);

  const selectedTemplate = templates.find(
    (template) => template.id === id
  );

  const handlePanelChange = (panel: string) => {
    setActivePanel((currentPanel) =>
      currentPanel === panel ? "" : panel
    );
  };

  return (
    <main className="flex h-[calc(100dvh-72px)] min-h-0 w-full flex-col overflow-hidden bg-slate-100">
      <div className="sticky top-0 z-40 shrink-0 border-b border-slate-200 bg-white">
        <Toolbar />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="z-20 h-full shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <EditorSidebar
            onPanelChange={handlePanelChange}
            activePanel={activePanel}
          />
        </div>

        {activePanel !== "" && (
          <div className="z-10 h-full w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white sm:w-72">
            <EditorPanel activePanel={activePanel} />
          </div>
        )}

        <section className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-slate-100">
          <div className="sticky left-0 top-0 z-10 w-full border-b border-slate-200/80 bg-white/95 px-5 py-3 backdrop-blur-sm">
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

          <div className="flex min-h-full min-w-max items-start justify-center p-5 sm:p-8">
            <div className="min-h-[650px] w-[900px] shrink-0 rounded-sm bg-white shadow-[0_8px_35px_rgba(15,23,42,0.12)]">
              <FabricEditorCanvas />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}