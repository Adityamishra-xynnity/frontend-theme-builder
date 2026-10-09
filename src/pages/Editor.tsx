
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

  // Initially Elements panel open rahega
  const [activePanel, setActivePanel] = useState("elements");

  const {
    loadTemplate,
    loadSavedDesign,
    clearCanvas,
  } = useEditor();

  const locationState =
    location.state as EditorLocationState | null;

  const savedDesign = locationState?.savedDesign;

  // Template ya saved certificate load karna
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
        return;
      }
    }

    if (!id) {
      clearCanvas();
    }
  }, [id]);

  // Selected template find karna
  const selectedTemplate = templates.find(
    (template) => template.id === id
  );

  // Sidebar panel ko open/close karna
  const handlePanelChange = (panel: string) => {
    setActivePanel((currentPanel) =>
      currentPanel === panel ? "" : panel
    );
  };

  return (
    <div className="w-full px-1 py-6">
      {/* Editor Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Certificate Editor
        </h1>

        <p className="text-gray-500 mt-1">
          {savedDesign
            ? `Editing: ${savedDesign.name}`
            : selectedTemplate
            ? `Editing: ${selectedTemplate.name}`
            : "Create your certificate from a blank canvas."}
        </p>
      </div>

      {/* Editor */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="relative z-50">
          <Toolbar />
        </div>

        {/* Sidebar + Panel + Canvas */}
        <div className="flex h-[700px]">
          <EditorSidebar
            onPanelChange={handlePanelChange}
            activePanel={activePanel}
          />

          {/* Panel sirf tab render hoga jab koi section open ho */}
          {activePanel !== "" && (
            <EditorPanel activePanel={activePanel} />
          )}

          {/* Existing certificate canvas */}
          <FabricEditorCanvas />
        </div>
      </div>
    </div>
  );
}

