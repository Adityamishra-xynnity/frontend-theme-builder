import { useState } from "react";
import { Share2, Link2 } from "lucide-react";

import EmailBlockRenderer from "./EmailBlockRenderer";
import ShareEmailModal from "./ShareEmailModal";
import LinkPopover from "./LinkPopover";

import { useEmailEditor } from "../context/EmailEditorContext";
import { emailCampaignToHtml } from "../utils/emailCampaignToHtml";
import { sendEmailCampaign } from "../services/emailCampaignApi";
import { getNodeLinkUrl } from "../utils/linkUtils";

export default function EmailCanvas() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTopLinkOpen, setIsTopLinkOpen] = useState(false);

  const {
    sections,
    selectedSectionId,
    selectedNodeId,
    updateNodeLink,
    campaignName,
    setCampaignName,
    campaignSubject,
  } = useEmailEditor();

  const selectedSection = sections.find((s) => s.id === selectedSectionId);
  const selectedNode = selectedSection?.nodes.find((n) => n.id === selectedNodeId);
  const selectedNodeLink = getNodeLinkUrl(selectedNode);

  const handleShareSend = async (
    recipientEmail: string,
    subject: string
  ) => {
    if (sections.length === 0) {
      alert("Please add some elements or select a template for your email design first.");
      return;
    }

    try {
      setIsSending(true);

      const emailSubject = subject || campaignSubject || campaignName || "Email Campaign";
      const htmlContent = await emailCampaignToHtml(
        sections,
        emailSubject
      );

      await sendEmailCampaign({
        recipientEmail,
        designName: emailSubject,
        htmlContent,
      });

      alert("Email sent successfully!");
      setIsShareOpen(false);
    } catch (error) {
      console.error("Email sending failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to send email."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {/* Workspace toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="rounded border border-transparent px-2 py-1 text-sm font-semibold text-gray-800 transition-colors hover:border-gray-200 focus:border-violet-500 focus:bg-white focus:outline-none"
            placeholder="Untitled Campaign"
          />
          <span className="text-xs text-gray-300">•</span>
          <p className="text-xs text-gray-500">
            {sections.length} {sections.length === 1 ? "section" : "sections"}
          </p>

          {/* Contextual Link control for selected element */}
          {selectedNode && (
            <div className="relative ml-2 flex items-center gap-2 border-l border-gray-200 pl-3">
              <button
                type="button"
                onClick={() => setIsTopLinkOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all shadow-2xs ${
                  selectedNodeLink
                    ? "border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100"
                    : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
                title={
                  selectedNodeLink
                    ? `Hyperlink attached: ${selectedNodeLink}`
                    : "Attach hyperlink to selected element"
                }
              >
                <Link2 className="h-3.5 w-3.5 text-violet-600" />
                <span className="max-w-[140px] truncate">
                  {selectedNodeLink ? selectedNodeLink : "Add Link"}
                </span>
              </button>

              {isTopLinkOpen && (
                <div className="absolute left-0 top-full mt-2 z-50">
                  <LinkPopover
                    initialUrl={selectedNodeLink}
                    onApply={(url) => {
                      if (selectedSectionId && selectedNodeId) {
                        updateNodeLink(selectedSectionId, selectedNodeId, url);
                      }
                      setIsTopLinkOpen(false);
                    }}
                    onRemove={() => {
                      if (selectedSectionId && selectedNodeId) {
                        updateNodeLink(selectedSectionId, selectedNodeId, undefined);
                      }
                      setIsTopLinkOpen(false);
                    }}
                    onClose={() => setIsTopLinkOpen(false)}
                    title={`Edit ${selectedNode.type} Link`}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            Email width: 600px
          </span>

          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors hover:bg-violet-700"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>

      {/* Scrollable workspace */}
      <div className="flex min-h-0 flex-1 justify-center overflow-auto bg-gray-100 p-6">
        <div className="min-h-[800px] w-full max-w-[600px] shrink-0 bg-white shadow-md">
          <EmailBlockRenderer />
        </div>
      </div>

      {/* Share Email Modal */}
      {isShareOpen && (
        <ShareEmailModal
          onClose={() => setIsShareOpen(false)}
          onSend={handleShareSend}
          isSending={isSending}
        />
      )}
    </div>
  );
}
