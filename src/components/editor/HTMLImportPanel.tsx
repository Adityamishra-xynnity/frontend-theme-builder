
import { useState } from "react";
import { Code2, Trash2, Download } from "lucide-react";

import { useEditor } from "../../context/EditorContext";
import { htmlToElements } from "./HtmlToElements";

export default function HTMLImportPanel() {
  const [htmlCode, setHtmlCode] = useState("");
  const { loadTemplate, elements } = useEditor();

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleClear = () => {
    setHtmlCode("");
    setError("");
    setSuccess("");
  };

  const handleImport = () => {
    setError("");
    setSuccess("");

    if (!htmlCode.trim()) {
      setError("Please paste some HTML code first.");
      return;
    }

    try {
      const result = htmlToElements(htmlCode);

      if (result.elements.length === 0) {
        setError("No supported text or images found in the HTML.");
        return;
      }

      if (
        elements.length > 0 &&
        !window.confirm(
          "Importing this HTML will replace your current canvas. Continue?",
        )
      ) {
        return;
      }

      loadTemplate({
        id: "html-import",
        name: "Imported HTML",
        backgroundColor: result.backgroundColor,
        elements: result.elements,
      });

      setSuccess("HTML imported successfully!");
    } catch (error) {
      console.error("HTML import failed:", error);
      setError("Something went wrong while importing the HTML.");
    }
  };

  return (
    <div className="space-y-5 p-4">
      <div>
        <div className="flex items-center gap-2">
          <Code2 size={22} className="text-violet-600" />

          <h2 className="text-lg font-semibold text-gray-900">
            HTML Import
          </h2>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Paste your HTML code to turn it into an editable design.
        </p>
      </div>

      <div>
        <label
          htmlFor="html-import-code"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          HTML Code
        </label>

        <textarea
          id="html-import-code"
          value={htmlCode}
          onChange={(event) => {
            setHtmlCode(event.target.value);
            setError("");
            setSuccess("");
          }}
          placeholder={'<h1>Welcome!</h1>\n<p>Your design starts here.</p>'}
          spellCheck={false}
          className="min-h-64 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs leading-relaxed text-gray-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        />

        <p className="mt-2 text-xs text-gray-400">
          {htmlCode.length} characters
        </p>
      </div>

      <button
        type="button"
        onClick={handleClear}
        disabled={!htmlCode}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 size={17} />
        Clear HTML
      </button>

      <div className="rounded-xl border border-violet-100 bg-violet-50 p-3">
        <p className="text-sm font-medium text-violet-900">
          Supported content
        </p>

        <p className="mt-1 text-xs leading-relaxed text-violet-700">
          We'll start with headings, paragraphs, images, simple shapes,
          colors, and basic text styling.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={handleImport}
        disabled={!htmlCode.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Download size={17} />
        Import to Canvas
      </button>
    </div>
  );
}
