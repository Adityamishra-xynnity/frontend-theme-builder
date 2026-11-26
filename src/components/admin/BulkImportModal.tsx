export {};
/*
import { useState } from "react";
import { FileUp, X } from "lucide-react";
import {
  bulkImportAdminAssets,
  type AdminAssetPayload,
  type BulkImportResult,
} from "../../api/adminAssetApi";

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function BulkImportModal({
  open,
  onClose,
  onImported,
}: BulkImportModalProps) {
  const [rawJson, setRawJson] = useState("[]");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BulkImportResult | null>(null);

  if (!open) return null;

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setRawJson(text);
      setError("");
      setResult(null);
    } catch {
      setError("Unable to read selected JSON file.");
    }
  };

  const handleImport = async () => {
    setError("");
    setResult(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON");
      return;
    }

    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && Array.isArray((parsed as any).assets)
      ? (parsed as any).assets
      : null;

    if (!list) {
      setError('JSON must be an array `[...]` or an object with `{ "assets": [...] }`.');
      return;
    }

    const normalized: AdminAssetPayload[] = list.map((item: any) => ({
      assetKey: String(item.assetKey ?? item.asset_key ?? "").trim(),
      name: String(item.name ?? "").trim(),
      type: String(item.type ?? item.assetType ?? "GRAPHIC").trim().toUpperCase(),
      category: String(item.category ?? "Uncategorized").trim(),
      subcategory: item.subcategory ?? null,
      sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0),
      jsonData: item.jsonData ?? item.json_data ?? item.assetData ?? {},
      isActive: item.isActive ?? item.is_active ?? true,
      isDeleted: item.isDeleted ?? item.is_deleted ?? false,
    }));

    setImporting(true);
    try {
      const res = await bulkImportAdminAssets(normalized);
      setResult(res);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Bulk JSON Import</h2>
            <p className="text-xs text-slate-500">
              Import or upsert multiple records into <code className="rounded bg-slate-100 px-1">asset_library</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
              <div className="font-bold">Import Complete</div>
              <div className="mt-1">
                Total: {result.total} | Inserted: {result.inserted} | Updated: {result.updated} | Failed: {result.failed}
              </div>
              {result.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-4 text-rose-700">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              JSON Array (`assetKey`, `name`, `type`, `category`, `subcategory`, `sortOrder`, `jsonData`, `isActive`, `isDeleted`)
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
              <FileUp size={14} />
              Load .json file
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFileUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <textarea
            rows={12}
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            spellCheck={false}
            className="w-full rounded-xl border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-emerald-300 focus:border-violet-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={importing}
            onClick={handleImport}
            className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
          >
            {importing ? "Importing..." : "Run Import"}
          </button>
        </div>
      </div>
    </div>
  );
}
*/
