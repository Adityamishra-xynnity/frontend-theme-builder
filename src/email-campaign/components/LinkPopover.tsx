import { useState, useEffect, useRef } from "react";
import { Link2, ExternalLink, Trash2, X, Check } from "lucide-react";
import { isValidEmailUrl, normalizeLinkUrl, formatDisplayUrl } from "../utils/linkUtils";

interface LinkPopoverProps {
  initialUrl?: string;
  onApply: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
  title?: string;
}

export default function LinkPopover({
  initialUrl = "",
  onApply,
  onRemove,
  onClose,
  title = "Attach Link",
}: LinkPopoverProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [errorMessage, setErrorMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  // Handle escape key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleApply = () => {
    const trimmed = urlInput.trim();

    if (!trimmed) {
      // Empty input treated as link removal
      onRemove();
      return;
    }

    if (/^(javascript|data|vbscript):/i.test(trimmed)) {
      setErrorMessage("Unsafe URL protocol. Use http://, https://, or mailto:");
      return;
    }

    const normalized = normalizeLinkUrl(trimmed);

    if (!isValidEmailUrl(normalized)) {
      setErrorMessage("Please enter a valid web URL or email link");
      return;
    }

    setErrorMessage("");
    onApply(normalized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApply();
    }
  };

  const hasExistingLink = Boolean(initialUrl && initialUrl.trim());

  return (
    <div
      ref={popoverRef}
      className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl bg-white p-3.5 shadow-2xl ring-1 ring-black/10 transition-all select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
          <Link2 size={14} className="text-violet-600" />
          <span>{title}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          title="Close"
        >
          <X size={13} />
        </button>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              if (errorMessage) setErrorMessage("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="Paste link or type URL (e.g. https://...)"
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 py-1.5 pl-3 pr-8 text-xs text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />

          {urlInput.trim() && (
            <button
              type="button"
              onClick={() => {
                setUrlInput("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Clear input"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {errorMessage && (
          <p className="text-[11px] font-medium text-red-500">{errorMessage}</p>
        )}

        {/* Existing Link Info if attached */}
        {hasExistingLink && (
          <div className="flex items-center justify-between rounded-lg bg-violet-50/70 px-2.5 py-1.5 text-[11px]">
            <span
              className="truncate text-violet-900 font-medium max-w-[190px]"
              title={initialUrl}
            >
              {formatDisplayUrl(initialUrl, 28)}
            </span>

            <div className="flex items-center gap-1.5">
              <a
                href={initialUrl}
                target="_blank"
                rel="noreferrer"
                className="text-violet-600 hover:text-violet-800"
                title="Test link in new tab"
              >
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                onClick={onRemove}
                className="text-red-500 hover:text-red-700"
                title="Remove link"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          {hasExistingLink ? (
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 hover:underline"
            >
              <Trash2 size={12} />
              Remove
            </button>
          ) : (
            <span className="text-[10px] text-gray-400">Press Enter to apply</span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white shadow-xs transition-colors hover:bg-violet-700 active:scale-95"
            >
              <Check size={12} strokeWidth={2.5} />
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
