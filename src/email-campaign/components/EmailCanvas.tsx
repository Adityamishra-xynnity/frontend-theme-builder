
import { useState } from "react";
import { Share2 } from "lucide-react";

import EmailBlockRenderer from "./EmailBlockRenderer";
import ShareEmailModal from "./ShareEmailModal";

import { useEmailEditor } from "../context/EmailEditorContext";
import { emailCampaignToHtml } from "../utils/emailCampaignToHtml";
import { sendEmailCampaign } from "../services/emailCampaignApi";

export default function EmailCanvas() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const { sections } = useEmailEditor();

  const handleShareSend = async (
    recipientEmail: string,
    subject: string
  ) => {
    if (sections.length === 0) {
      alert("Please add some elements to your email design first.");
      return;
    }

    try {
      setIsSending(true);

      const htmlContent = emailCampaignToHtml(
        sections,
        subject
      );

      await sendEmailCampaign({
        recipientEmail,
        designName: subject,
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
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            Email Design
          </h2>
          <p className="text-xs text-gray-500">
            Editing workspace
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
            Email width: 600px
          </span>

          <button
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
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
