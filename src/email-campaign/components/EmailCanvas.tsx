import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Share2,
  Save,
  Check,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
} from "lucide-react";

import EmailBlockRenderer from "./EmailBlockRenderer";
import ShareEmailModal from "./ShareEmailModal";
import EmailPreviewModal from "./EmailPreviewModal";
import EmailContextualToolbar from "./EmailContextualToolbar";

import { useEmailEditor } from "../context/EmailEditorContext";
import {
  emailCampaignToHtmlWithReport,
  type EmailRenderWarning,
} from "../utils/emailCampaignToHtml";
import {
  sendEmailCampaign,
  createEmailCampaign,
  updateEmailCampaign,
} from "../services/emailCampaignApi";

interface ToastState {
  type: "success" | "error";
  title: string;
  detail?: string;
}

export default function EmailCanvas() {
  const navigate = useNavigate();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewWarnings, setPreviewWarnings] = useState<EmailRenderWarning[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast || toast.type !== "success") return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const {
    sections,
    campaignName,
    setCampaignName,
    campaignSubject,
    setCampaignSubject,
    currentCampaignId,
    setCurrentCampaignId,
  } = useEmailEditor();

  const inFlightSaveRef = useRef<Promise<number | null> | null>(null);
  const pendingResaveRef = useRef(false);
  const lastSavedSignatureRef = useRef<string | null>(null);
  const campaignIdRef = useRef<number | null>(currentCampaignId);
  campaignIdRef.current = currentCampaignId;

  const latestPayloadRef = useRef({
    sections,
    campaignName,
    campaignSubject,
  });
  latestPayloadRef.current = { sections, campaignName, campaignSubject };

  const persistCampaign = useCallback(async (): Promise<number | null> => {
    if (inFlightSaveRef.current) {
      pendingResaveRef.current = true;
      return inFlightSaveRef.current;
    }

    const runSave = async (): Promise<number | null> => {
      const {
        sections: curSections,
        campaignName: curName,
        campaignSubject: curSubject,
      } = latestPayloadRef.current;

      const cleanName = curName.trim() || "Untitled Campaign";
      const cleanSubject = curSubject.trim() || cleanName;
      const signature = JSON.stringify({
        name: cleanName,
        subject: cleanSubject,
        sectionsData: curSections,
      });

      setIsSaving(true);
      setSaveError(null);

      try {
        const payload = {
          name: cleanName,
          subject: cleanSubject,
          previewText: "",
          sectionsData: curSections,
          status: "DRAFT",
        };

        const activeId = campaignIdRef.current;
        if (activeId !== null) {
          const updated = await updateEmailCampaign(activeId, payload);
          campaignIdRef.current = updated.id;
          setCurrentCampaignId(updated.id);
          lastSavedSignatureRef.current = signature;
          setSaveMessage("Saved");
          return updated.id;
        } else {
          const created = await createEmailCampaign(payload);
          campaignIdRef.current = created.id;
          setCurrentCampaignId(created.id);
          lastSavedSignatureRef.current = signature;
          setSaveMessage("Saved");
          navigate(`/email-campaign/${created.id}`, { replace: true });
          return created.id;
        }
      } catch (error) {
        setSaveMessage(null);
        setSaveError(
          error instanceof Error ? error.message : "Failed to save campaign."
        );
        return null;
      } finally {
        setIsSaving(false);
        inFlightSaveRef.current = null;
        if (pendingResaveRef.current) {
          pendingResaveRef.current = false;
          void persistCampaign();
        }
      }
    };

    const promise = runSave();
    inFlightSaveRef.current = promise;
    return promise;
  }, [navigate, setCurrentCampaignId]);

  const handleSaveCampaign = async () => {
    await persistCampaign();
  };

  // Debounced autosave to PostgreSQL (1.2s after edits, serialized via inFlightSaveRef)
  useEffect(() => {
    if (sections.length === 0 && currentCampaignId === null) {
      return;
    }

    const cleanName = campaignName.trim() || "Untitled Campaign";
    const cleanSubject = campaignSubject.trim() || cleanName;
    const signature = JSON.stringify({
      name: cleanName,
      subject: cleanSubject,
      sectionsData: sections,
    });

    if (lastSavedSignatureRef.current === null && currentCampaignId !== null) {
      lastSavedSignatureRef.current = signature;
      return;
    }

    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      void persistCampaign();
    }, 1200);

    return () => clearTimeout(timer);
  }, [sections, campaignName, campaignSubject, currentCampaignId, persistCampaign]);

  const handleOpenPreview = async () => {
    if (sections.length === 0) {
      setToast({
        type: "error",
        title: "Nothing to preview yet",
        detail: "Add elements or select a template before previewing your email.",
      });
      return;
    }

    setIsPreviewOpen(true);
    setIsGeneratingPreview(true);
    try {
      const emailSubject = campaignSubject || campaignName || "Email Campaign";
      const { html, warnings } = await emailCampaignToHtmlWithReport(
        sections,
        emailSubject
      );
      setPreviewHtml(html);
      setPreviewWarnings(warnings);
    } catch (error) {
      setIsPreviewOpen(false);
      setToast({
        type: "error",
        title: "Preview failed",
        detail:
          error instanceof Error
            ? error.message
            : "Unable to generate email preview.",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleShareSend = async (
    recipientEmail: string,
    subject: string
  ) => {
    if (isSending) return;

    if (sections.length === 0) {
      setToast({
        type: "error",
        title: "Cannot send empty campaign",
        detail: "Please add elements or select a template first.",
      });
      return;
    }

    try {
      setIsSending(true);

      // Ensure latest pending edits are persisted before sending
      if (sections.length > 0) {
        await persistCampaign();
      }

      const emailSubject = subject || campaignSubject || campaignName || "Email Campaign";
      const { html: htmlContent } = await emailCampaignToHtmlWithReport(
        sections,
        emailSubject
      );

      await sendEmailCampaign({
        recipientEmail,
        designName: emailSubject,
        htmlContent,
      });

      setIsShareOpen(false);
      setToast({
        type: "success",
        title: "Email sent successfully!",
        detail: `Delivered to ${recipientEmail}`,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      setToast({
        type: "error",
        title: "Failed to send email",
        detail:
          error instanceof Error
            ? error.message
            : "Please check recipient details and try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Workspace toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="w-44 rounded border border-transparent px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-200 focus:border-violet-500 focus:bg-white focus:outline-none"
            placeholder="Untitled Campaign"
            aria-label="Campaign name"
          />
          <span className="text-xs text-gray-300">•</span>
          <input
            type="text"
            value={campaignSubject}
            onChange={(e) => setCampaignSubject(e.target.value)}
            className="w-48 rounded border border-gray-200 bg-gray-50/70 px-2.5 py-1 text-xs text-gray-700 transition-colors focus:border-violet-500 focus:bg-white focus:outline-none"
            placeholder="Email subject line..."
            aria-label="Email subject"
          />
          <span className="hidden text-xs text-gray-400 lg:inline">
            ({sections.length} {sections.length === 1 ? "section" : "sections"})
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {saveMessage && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <Check size={12} />
              {saveMessage}
            </span>
          )}
          {saveError && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700"
              title={saveError}
            >
              <AlertCircle size={12} />
              Save failed
            </span>
          )}

          <button
            type="button"
            onClick={handleOpenPreview}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50"
          >
            <Eye className="h-3.5 w-3.5 text-slate-600" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveCampaign}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5 text-violet-600" />
            <span>
              {isSaving
                ? "Saving..."
                : currentCampaignId !== null
                  ? "Save Changes"
                  : "Save"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-violet-700"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </button>
        </div>
      </div>

      {/* Canva-style Contextual Toolbar */}
      <EmailContextualToolbar />

      {/* Scrollable workspace */}
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-gray-100 p-6">
        <div className="min-h-[800px] w-full max-w-[600px] shrink-0 bg-white shadow-md">
          <EmailBlockRenderer />
        </div>
      </div>

      {/* Email Preview Modal */}
      {isPreviewOpen && (
        <EmailPreviewModal
          html={previewHtml}
          warnings={previewWarnings}
          subject={campaignSubject || campaignName || "My Email Campaign"}
          isGenerating={isGeneratingPreview}
          onClose={() => setIsPreviewOpen(false)}
          onOpenShare={() => setIsShareOpen(true)}
        />
      )}

      {/* Share Email Modal */}
      {isShareOpen && (
        <ShareEmailModal
          onClose={() => setIsShareOpen(false)}
          onSend={handleShareSend}
          isSending={isSending}
          defaultSubject={campaignSubject || campaignName || "My Email Campaign"}
        />
      )}

      {/* In-App Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-5 bottom-5 z-[120] flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all ${
            toast.type === "success"
              ? "border-emerald-200 bg-white text-slate-800"
              : "border-red-200 bg-white text-slate-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900">{toast.title}</p>
            {toast.detail && (
              <p className="mt-0.5 text-[11px] text-slate-500">{toast.detail}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
