import { useEffect } from "react";
import { useParams } from "react-router-dom";

import Toolbar from "../components/editor/Toolbar";
import ElementsPanel from "../components/editor/ElementsPanel";
import FabricEditorCanvas from "../components/editor/fabric/FabricCanvas";

import { templates } from "../data/templates";
import { useEditor } from "../context/EditorContext";

export default function Editor() {
  const { id } = useParams();

  const {
    loadTemplate,
    clearCanvas,
    currentDesignId,
  } = useEditor();

  useEffect(() => {
    if (id) {
      const template = templates.find(
        (item) => item.id === id
      );

      if (template) {
        loadTemplate(template);
        return;
      }
    }

    if (!currentDesignId) {
      clearCanvas();
    }
  }, [id, currentDesignId]);

  const selectedTemplate = templates.find(
    (template) => template.id === id
  );

  return (
    <div className="w-full">
      {/* Editor heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">
          Certificate Editor
        </h1>

        <p className="text-gray-500 mt-1">
          {selectedTemplate
            ? `Editing: ${selectedTemplate.name}`
            : currentDesignId
            ? "Editing your saved certificate."
            : "Create your certificate from a blank canvas."}
        </p>
      </div>

      {/* Editor box */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">

        {/* TOOLBAR */}
        <div className="relative z-50">
          <Toolbar />
        </div>

        {/* Editor workspace */}
        <div className="flex h-[700px]">

          {/* Left elements panel */}
          <ElementsPanel />

          {/* Fabric canvas */}
          <FabricEditorCanvas />

        </div>
      </div>
    </div>
  );
}