import { useEffect } from "react";
import {
  useLocation,
  useParams,
} from "react-router-dom";

import Toolbar from "../components/editor/Toolbar";
import ElementsPanel from "../components/editor/ElementsPanel";
import FabricEditorCanvas from "../components/editor/fabric/FabricCanvas";

import { templates } from "../data/templates";
import {
  useEditor,
  type SavedDesign,
} from "../context/EditorContext";

interface EditorLocationState {
  savedDesign?: SavedDesign;
}

export default function Editor() {
  const { id } = useParams();

  const location = useLocation();

  const {
    loadTemplate,
    loadSavedDesign,
    clearCanvas,
  } = useEditor();

  const locationState =
    location.state as EditorLocationState | null;

  const savedDesign =
    locationState?.savedDesign;

  useEffect(() => {
    // Saved Design open karna
    if (savedDesign) {
      loadSavedDesign(savedDesign);
      return;
    }

    // Template open karna
    if (id) {
      const template = templates.find(
        (item) => item.id === id
      );

      if (template) {
        loadTemplate(template);
        return;
      }
    }

    // Blank editor
    if (!id) {
      clearCanvas();
    }
  }, [id]);

  const selectedTemplate = templates.find(
    (template) => template.id === id
  );

  return (
    <div className="w-full px-6 py-6">
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

        {/* Sidebar + Canvas */}
        <div className="flex h-[700px]">
          <ElementsPanel />

          <FabricEditorCanvas />
        </div>
      </div>
    </div>
  );
}