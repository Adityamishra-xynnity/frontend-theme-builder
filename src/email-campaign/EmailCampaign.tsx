import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import EmailSidebar, {
  type EmailPanelType,
} from "./components/EmailSidebar";
import EmailTemplatesPanel from "./panels/EmailTemplatesPanel";
import EmailElementsPanel from "./panels/EmailElementsPanel";
import EmailProjectsPanel from "./panels/EmailProjectsPanel";
import EmailCanvas from "./components/EmailCanvas";
import { EmailEditorProvider, useEmailEditor } from "./context/EmailEditorContext";
import UploadsPanel from "./components/UploadsPanel";
import { fetchEmailCampaignById } from "./services/emailCampaignApi";

function EmailCampaignLayout() {
  const [activePanel, setActivePanel] =
    useState<EmailPanelType | null>("templates");
  const [isHydrating, setIsHydrating] = useState(false);
  const [hydrateError, setHydrateError] = useState<string | null>(null);

  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { resetToBlank, loadCampaign, currentCampaignId } = useEmailEditor();
  const lastResetRef = useRef<number | null>(null);
  const loadedIdRef = useRef<string | null>(null);

  // Load saved campaign when navigated to /email-campaign/:id or on browser refresh
  useEffect(() => {
    if (!id) {
      loadedIdRef.current = null;
      setIsHydrating(false);
      setHydrateError(null);
      return;
    }
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    // If this campaign was just created/saved in-place and navigated here,
    // skip redundant re-fetch so in-progress local edits are never overwritten.
    if (currentCampaignId === numericId && loadedIdRef.current === null) {
      loadedIdRef.current = id;
      setIsHydrating(false);
      return;
    }
    if (loadedIdRef.current === id) return;

    const controller = new AbortController();
    let completed = false;
    loadedIdRef.current = id;
    setIsHydrating(true);
    setHydrateError(null);

    fetchEmailCampaignById(numericId)
      .then((campaign) => {
        if (!controller.signal.aborted) {
          completed = true;
          loadCampaign(campaign);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          loadedIdRef.current = null;
          setHydrateError(
            err instanceof Error
              ? err.message
              : `Failed to load campaign #${id}.`
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsHydrating(false);
        }
      });

    return () => {
      controller.abort();
      if (!completed) {
        // Reset loadedIdRef on StrictMode/unmount abort so next mount can hydrate cleanly
        loadedIdRef.current = null;
        setIsHydrating(false);
      }
    };
  }, [id, currentCampaignId, loadCampaign]);

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
            <EmailProjectsPanel />
          )}
        </div>
      )}

      {/* Main email workspace */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        {isHydrating && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-xs">
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700 shadow-sm">
              Loading saved campaign...
            </div>
          </div>
        )}
        {hydrateError && (
          <div className="flex items-center justify-between border-b border-red-200 bg-red-50 px-5 py-2 text-xs text-red-700">
            <span>{hydrateError}</span>
            <button
              type="button"
              onClick={() => {
                loadedIdRef.current = null;
                setHydrateError(null);
              }}
              className="font-semibold underline hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        )}
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