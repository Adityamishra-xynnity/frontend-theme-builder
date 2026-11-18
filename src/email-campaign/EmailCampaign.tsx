
import { useState } from "react";
import EmailSidebar, {
  type EmailPanelType,
} from "./components/EmailSidebar";
import EmailElementsPanel from "./panels/EmailElementsPanel";
import EmailCanvas from "./components/EmailCanvas";
import { EmailEditorProvider } from "./context/EmailEditorContext";
import UploadsPanel from "./components/UploadsPanel";

export default function EmailCampaign() {
  const [activePanel, setActivePanel] =
    useState<EmailPanelType | null>(null);

  const togglePanel = (panel: EmailPanelType) => {
    setActivePanel((current) =>
      current === panel ? null : panel
    );
  };

  const panelTitles: Record<EmailPanelType, string> = {
    templates: "Templates",
    elements: "Elements",
    uploads: "Uploads",
    projects: "Projects",
  };

  return (
    <EmailEditorProvider>
      <div className="flex h-[calc(100vh-72px)] overflow-hidden bg-gray-100">

        {/* Main navigation sidebar */}
        <EmailSidebar
          activePanel={activePanel}
          onPanelChange={togglePanel}
        />

        {/* Expandable side panel */}
        {activePanel && (
          <div className="w-[320px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            {activePanel === "elements" ? (
              <EmailElementsPanel />
            ) : activePanel === "uploads" ? (
              <UploadsPanel />
            ) : (
              <div className="p-5">
                <h2 className="text-lg font-semibold text-gray-800">
                  {panelTitles[activePanel]}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  This section is coming next.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Main email workspace */}
        <main className="flex min-w-0 flex-1 flex-col">
          <EmailCanvas />
        </main>

      </div>
    </EmailEditorProvider>
  );
}
