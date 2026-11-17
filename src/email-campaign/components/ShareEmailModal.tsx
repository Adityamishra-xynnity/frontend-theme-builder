
interface ShareEmailModalProps {
  onClose: () => void;
  onSend: (recipientEmail: string, subject: string) => void;
  isSending?: boolean;
}

import { useState } from "react";
import { X, Mail } from "lucide-react";

export default function ShareEmailModal({
  onClose,
  onSend,
  isSending = false,
}: ShareEmailModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("My Email Campaign");
  const [error, setError] = useState("");

  const handleSend = () => {
    if (!recipientEmail.trim()) {
      setError("Please enter the recipient's email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter an email subject.");
      return;
    }

    setError("");
    onSend(recipientEmail.trim(), subject.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-100 p-2">
              <Mail className="h-5 w-5 text-violet-600" />
            </div>

            <h2 className="text-lg font-semibold text-gray-800">
              Share Email Design
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={isSending}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Recipient Email
            </label>

            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Subject
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isSending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={handleSend}
              disabled={isSending}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {isSending ? "Sending..." : "Send Email"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
