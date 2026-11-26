import { useEffect, useState, type FormEvent } from "react";
import { X, Code2, Upload, Check } from "lucide-react";
import {
  ASSET_TYPES,
  getAdminCategories,
  type AdminAssetItem,
  type AdminAssetPayload,
} from "../../api/adminAssetApi";
import { uploadImageToCloudinary } from "../../api/uploadApi";

interface AdminAssetFormModalProps {
  open: boolean;
  initialAsset: AdminAssetItem | null;
  categories: string[];
  defaultType?: string;
  onClose: () => void;
  onSave: (payload: AdminAssetPayload, id?: number) => Promise<void>;
}

function slugifyKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminAssetFormModal({
  open,
  initialAsset,
  categories,
  defaultType = "GRAPHIC",
  onClose,
  onSave,
}: AdminAssetFormModalProps) {
  const isEditing = Boolean(initialAsset);

  const [assetKey, setAssetKey] = useState("");
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(defaultType);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [jsonText, setJsonText] = useState("{}");
  const [isActive, setIsActive] = useState(true);
  const [isDeleted, setIsDeleted] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [error, setError] = useState("");
  const [typeCategories, setTypeCategories] = useState<string[]>(categories);

  useEffect(() => {
    if (!open || !type) return;
    let active = true;
    getAdminCategories(type)
      .then((list) => {
        if (active) setTypeCategories(list);
      })
      .catch(() => {
        if (active) setTypeCategories(categories);
      });
    return () => {
      active = false;
    };
  }, [open, type, categories]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setUploadedUrl("");
    if (initialAsset) {
      setAssetKey(initialAsset.assetKey || "");
      setKeyManuallyEdited(true);
      setName(initialAsset.name || "");
      setType(initialAsset.type || "GRAPHIC");
      setCategory(initialAsset.category || "");
      setSubcategory(initialAsset.subcategory || "");
      setJsonText(JSON.stringify(initialAsset.jsonData || {}, null, 2));
      setIsActive(initialAsset.isActive !== false);
      setIsDeleted(Boolean(initialAsset.isDeleted));
    } else {
      setAssetKey("");
      setKeyManuallyEdited(false);
      setName("");
      setType(defaultType === "ALL" ? "GRAPHIC" : defaultType);
      setCategory("");
      setSubcategory("");
      setJsonText("{}");
      setIsActive(true);
      setIsDeleted(false);
    }
  }, [open, initialAsset, defaultType]);

  if (!open) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !keyManuallyEdited) {
      setAssetKey(slugifyKey(val));
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? `Invalid JSON: ${e.message}` : "Invalid JSON syntax");
    }
  };

  const handleCloudinaryUpload = async (file: File) => {
    setUploadingMedia(true);
    setError("");
    try {
      const uploaded = await uploadImageToCloudinary(file);
      setUploadedUrl(uploaded.secureUrl);
      try {
        const parsed = JSON.parse(jsonText || "{}");
        if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          parsed.url = uploaded.secureUrl;
          if (!parsed.thumbnailUrl) parsed.thumbnailUrl = uploaded.secureUrl;
          if (uploaded.width) parsed.width = uploaded.width;
          if (uploaded.height) parsed.height = uploaded.height;
          setJsonText(JSON.stringify(parsed, null, 2));
        }
      } catch {
        // Leave raw jsonText intact if user had invalid JSON while editing
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!assetKey.trim() || !name.trim() || !type.trim() || !category.trim()) {
      setError("asset_key, name, type, and category are required.");
      return;
    }

    let parsedJson: Record<string, unknown>;
    try {
      const raw = JSON.parse(jsonText);
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        setError("json_data must be a valid JSON object ({ ... }).");
        return;
      }
      parsedJson = raw;
    } catch (err) {
      setError(err instanceof Error ? `Invalid json_data: ${err.message}` : "Invalid json_data");
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          assetKey: assetKey.trim(),
          name: name.trim(),
          type: type.trim().toUpperCase(),
          category: category.trim(),
          subcategory: subcategory.trim() ? subcategory.trim() : null,
          sortOrder: isEditing ? initialAsset?.sortOrder : undefined,
          jsonData: parsedJson,
          isActive,
          isDeleted,
        },
        initialAsset?.id
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? `Edit Asset #${initialAsset?.id}` : "Add New Asset"}
            </h2>
            <p className="text-xs text-slate-500">
              Direct mapping to <code className="rounded bg-slate-100 px-1 py-0.5">public.asset_library</code> columns
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

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          {/* Row 1: name & asset_key */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Classic Gold"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                asset_key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={assetKey}
                onChange={(e) => {
                  setKeyManuallyEdited(true);
                  setAssetKey(e.target.value);
                }}
                placeholder="e.g. classic-gold"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: type, category, subcategory, sort_order */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                type <span className="text-rose-500">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              >
                {ASSET_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                list="admin-category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Handdrawn Animals"
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
              <datalist id="admin-category-suggestions">
                {typeCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                subcategory
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: json_data + optional Cloudinary upload helper */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                json_data (JSONB) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  <Upload size={13} />
                  {uploadingMedia ? "Uploading..." : "Upload Media to URL"}
                  <input
                    type="file"
                    accept="image/*,.svg"
                    disabled={uploadingMedia}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCloudinaryUpload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Code2 size={13} />
                  Format JSON
                </button>
              </div>
            </div>

            {uploadedUrl && (
              <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700">
                <Check size={14} />
                Uploaded &amp; injected URL into json_data: <span className="truncate font-mono">{uploadedUrl}</span>
              </div>
            )}

            <textarea
              rows={9}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="w-full rounded-xl border border-slate-300 bg-slate-950 p-3 font-mono text-xs text-emerald-300 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Row 4: Active */}
          <div className="flex flex-wrap items-center gap-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Create Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
