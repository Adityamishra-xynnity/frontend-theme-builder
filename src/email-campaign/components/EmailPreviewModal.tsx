import { useEffect, useState } from "react";
import {
  Code2,
  Loader2,
  Monitor,
  Send,
  Smartphone,
  X,
} from "lucide-react";
import type { EmailRenderWarning } from "../utils/emailCampaignToHtml";

interface EmailPreviewModalProps {
  html: string;
  warnings?: EmailRenderWarning[];
  subject: string;
  isGenerating?: boolean;
  onClose: () => void;
  onOpenShare?: () => void;
}

export default function EmailPreviewModal({
  html,
  subject,
  isGenerating = false,
  onClose,
  onOpenShare,
}: EmailPreviewModalProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [showRawHtml, setShowRawHtml] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-900/60 backdrop-blur-xs">
      {/* Top Preview Bar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-2xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <X size={14} />
            Back to Editor
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-900">
              Email Preview — {subject || "Untitled Campaign"}
            </p>
            <p className="text-[11px] text-slate-500">
              Rendered from the exact HTML sent to recipients
            </p>
          </div>
        </div>

        {/* Viewport & HTML Mode Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
            <button
              type="button"
              onClick={() => {
                setShowRawHtml(false);
                setViewport("desktop");
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                !showRawHtml && viewport === "desktop"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Monitor size={13} />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => {
                setShowRawHtml(false);
                setViewport("mobile");
              }}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                !showRawHtml && viewport === "mobile"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Smartphone size={13} />
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setShowRawHtml((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                showRawHtml
                  ? "bg-white text-violet-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code2 size={13} />
              HTML
            </button>
          </div>

          {onOpenShare && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenShare();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-violet-700"
            >
              <Send size={13} />
              Send Test Email
            </button>
          )}
        </div>
      </div>

      {/* Preview Body */}
      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-6">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center gap-2 text-white">
            <Loader2 size={26} className="animate-spin" />
            <span className="text-xs font-medium">Generating email preview...</span>
          </div>
        ) : showRawHtml ? (
          <div className="w-full max-w-4xl overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-4 text-slate-100 shadow-xl">
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed">
              {html}
            </pre>
          </div>
        ) : (
          <div
            className={`h-full overflow-hidden rounded-xl border border-slate-300 bg-[#f3f4f6] shadow-2xl transition-all duration-200 ${
              viewport === "mobile" ? "w-[375px]" : "w-full max-w-[680px]"
            }`}
          >
            <iframe
              title="Email Campaign Preview"
              srcDoc={html}
              sandbox="allow-same-origin"
              className="h-full w-full border-0 bg-[#f3f4f6]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
