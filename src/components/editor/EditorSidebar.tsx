import { LayoutTemplate, Shapes, Type, Upload, Wrench } from "lucide-react";
import { act } from "react";

export default function EditorSidebar({
  onPanelChange,
  activePanel,
}: {
  onPanelChange: (panel: string) => void;
  activePanel : string
}) {
  return (
    <aside className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-4">
      
      <button onClick={() => onPanelChange("templates")} 
      className={`flex flex-col items-center gap-1 text-sm hover:bg-gray-100 ${
        activePanel === "templates" ? "bg-gray-200" :""
      }`}>
        <LayoutTemplate size={24} />
        <span>Templates</span>
      </button>

      <button onClick={() => onPanelChange("elements")} 
      className={`flex flex-col items-center gap-1 text-sm hover:bg-gray-100 ${
        activePanel === "elements" ? "bg-gray-200" : ""
      }`}>
        <Shapes size={24} />
        <span>Elements</span>
      </button>

      <button  onClick={() => onPanelChange("text")} 
      className={`flex flex-col items-center gap-1 text-sm hover:bg-gray-100 ${
        activePanel === "text" ? "bg-gray-200" : ""
      }`}>
        <Type size={24} />
        <span>Text</span>
      </button>

      <button onClick={() => onPanelChange("uploads")} 
      className={`flex flex-col items-center gap-1 text-sm hover:bg-gray-100 ${
        activePanel === "uploads" ? "bg-gray-200" : ""
      }`}>
        <Upload size={24} />
        <span>Uploads</span>
      </button>

      <button onClick={() => onPanelChange("tools")} 
      className={`flex flex-col items-center gap-1 text-sm hover:bg-gray-100 ${
        activePanel === "tools" ? "bg-gray-200" : ""
      }`}>
        <Wrench size={24} />
        <span>Tools</span>
      </button>

    </aside>
  );
}