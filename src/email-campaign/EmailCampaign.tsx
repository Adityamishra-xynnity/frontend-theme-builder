import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import EmailSidebar, {
  type EmailPanelType,
} from "./components/EmailSidebar";
import EmailTemplatesPanel from "./panels/EmailTemplatesPanel";
import EmailElementsPanel from "./panels/EmailElementsPanel";
import EmailCanvas from "./components/EmailCanvas";
import { EmailEditorProvider, useEmailEditor } from "./context/EmailEditorContext";
import UploadsPanel from "./components/UploadsPanel";

function EmailCampaignLayout() {
  const [activePanel, setActivePanel] =
    useState<EmailPanelType | null>("templates");

  const location = useLocation();
  const navigate = useNavigate();
  const { resetToBlank } = useEmailEditor();
  const lastResetRef = useRef<number | null>(null);

  // When navigated with newBlank state, initialize a fresh blank campaign
  useEffect(() => {
    const newBlankTimestamp = (location.state as { newBlank?: number } | null)?.newBlank;
    if (newBlankTimestamp && newBlankTimestamp !== lastResetRef.current) {
      lastResetRef.current = newBlankTimestamp;
      resetToBlank();
      // Open elements panel so user can immediately drag/click elements onto the blank canvas
      setActivePanel("elements");
      // Clear navigation state so refresh doesn't re-trigger
      navigate("/email-campaign", { replace: true, state: {} });
    }
  }, [location.state, resetToBlank, navigate]);

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
    <div className="flex h-[calc(100vh-72px)] overflow-hidden bg-gray-100">
      {/* Main navigation sidebar */}
      <EmailSidebar
        activePanel={activePanel}
        onPanelChange={togglePanel}
      />

      {/* Expandable side panel */}
      {activePanel && (
        <div className="w-[360px] shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
          {activePanel === "templates" ? (
            <EmailTemplatesPanel />
          ) : activePanel === "elements" ? (
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
  );
}

export default function EmailCampaign() {
  return (
    <EmailEditorProvider>
      <EmailCampaignLayout />
    </EmailEditorProvider>
  );
}
