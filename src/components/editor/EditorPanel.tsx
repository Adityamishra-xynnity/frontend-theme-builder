import ElementsPanel from "./ElementsPanel";
import TextPanel from "./TextPanel";
import { templates } from "../../data/templates";
import UploadsPanel from "./UploadsPanel";
import ToolsPanel from "./ToolsPanel";


interface EditorPanelProps {
  activePanel: string;
}

export default function EditorPanel({
  activePanel,
}: EditorPanelProps) {
  return activePanel === "templates" ? (
    <div>
      {templates.map((template) => (
        <div key={template.id}>
          {template.name}
        </div>
      ))}
    </div>
  ) : activePanel === "elements" ? (
    <ElementsPanel />
  ) : activePanel === "text" ? (
    <TextPanel />
  ) : activePanel === "uploads" ? (
    <UploadsPanel/>
  ) : activePanel === "tools" ? (
    <ToolsPanel/>
  ) : (
    <div>Current Panel: {activePanel}</div>
  );
}