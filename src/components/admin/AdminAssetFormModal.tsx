import { useEffect, useMemo, useState, type FormEvent } from "react";
import { X, Upload, Image as ImageIcon, FileJson } from "lucide-react";
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [dataTab, setDataTab] = useState<"image" | "json">("image");
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
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  useEffect(() => {
    if (!open) return;
    setError("");
    setPendingFile(null);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
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
      const jd = initialAsset.jsonData || {};
      const mediaUrl =
        (typeof jd.thumbnailUrl === "string" && jd.thumbnailUrl) ||
        (typeof jd.url === "string" && jd.url) ||
        (typeof jd.imageUrl === "string" && jd.imageUrl) ||
        "";
      setExistingImageUrl(mediaUrl);
      setDataTab(mediaUrl ? "image" : "json");
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
      setExistingImageUrl("");
      setDataTab("image");
    }
  }, [open, initialAsset, defaultType]);

  const parsedPreview = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return { valid: false as const, data: null };
      }
      return { valid: true as const, data: parsed as Record<string, unknown> };
    } catch {
      return { valid: false as const, data: null };
    }
  }, [jsonText]);

  if (!open) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !keyManuallyEdited) {
      setAssetKey(slugifyKey(val));
    }
  };

  const handleSelectFile = (file: File) => {
    setError("");
    setPendingFile(file);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemoveImage = () => {
    setPendingFile(null);
    setLocalPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return "";
    });
    setExistingImageUrl("");
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
      const raw = JSON.parse(jsonText.trim() || "{}");
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        setError("json_data must be a valid JSON object ({ ... }).");
        return;
      }
      parsedJson = { ...raw };
    } catch (err) {
      setError(err instanceof Error ? `Invalid json_data: ${err.message}` : "Invalid json_data");
      return;
    }

    setSaving(true);
    try {
      if (pendingFile) {
        const uploaded = await uploadImageToCloudinary(pendingFile);
        parsedJson.url = uploaded.secureUrl;
        parsedJson.thumbnailUrl = uploaded.secureUrl;
        if (uploaded.width) parsedJson.width = uploaded.width;
        if (uploaded.height) parsedJson.height = uploaded.height;
      }

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

          {/* Row 3: Image / JSON tabs */}
          <div className="space-y-3">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setDataTab("image")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  dataTab === "image"
                    ? "bg-white text-violet-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ImageIcon size={14} />
                Image
              </button>
              <button
                type="button"
                onClick={() => setDataTab("json")}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  dataTab === "json"
                    ? "bg-white text-violet-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileJson size={14} />
                JSON
              </button>
            </div>

            {dataTab === "image" ? (
              <div className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-violet-400 hover:bg-violet-50/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <Upload size={18} />
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Upload Media
                  </div>
                  <div className="text-xs text-slate-500">
                    Click to select an image or SVG file
                  </div>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    disabled={saving}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSelectFile(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                {(localPreviewUrl || existingImageUrl) && (
                  <div className="relative rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-600">Preview</p>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        title="Remove image"
                        aria-label="Remove image"
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="flex h-36 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <img
                        src={localPreviewUrl || existingImageUrl}
                        alt={name || "Media preview"}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700">
                    json_data (JSONB) <span className="text-rose-500">*</span>
                  </label>
                  {jsonText.trim() !== "" && (
                    <button
                      type="button"
                      onClick={() => setJsonText("")}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X size={12} />
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder="{}"
                  spellCheck={false}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-xs text-slate-800 focus:border-violet-500 focus:outline-none"
                />
                {jsonText.trim() !== "" && jsonText.trim() !== "{}" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-600">Preview</p>
                    {(() => {
                      if (!parsedPreview.valid) {
                        return <p className="text-xs text-rose-600">Invalid JSON syntax</p>;
                      }
                      const jd = parsedPreview.data;
                      const svg = typeof jd.svgContent === "string" ? jd.svgContent : "";
                      const imgUrl =
                        (typeof jd.thumbnailUrl === "string" && jd.thumbnailUrl) ||
                        (typeof jd.url === "string" && jd.url) ||
                        (typeof jd.imageUrl === "string" && jd.imageUrl) ||
                        "";
                      const unicode =
                        (typeof jd.unicode === "string" && jd.unicode) ||
                        (typeof jd.emoji === "string" && jd.emoji) ||
                        "";
                      const textVal = typeof jd.text === "string" ? jd.text : "";

                      if (svg && svg.includes("<svg")) {
                        return (
                          <div
                            className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2 [&>svg]:max-h-full [&>svg]:max-w-full"
                            dangerouslySetInnerHTML={{ __html: svg }}
                          />
                        );
                      }
                      if (imgUrl) {
                        return (
                          <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2">
                            <img src={imgUrl} alt={name || "JSON preview"} className="max-h-full max-w-full object-contain" />
                          </div>
                        );
                      }
                      if (unicode) {
                        return (
                          <div className="flex h-24 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-4xl">
                            {unicode}
                          </div>
                        );
                      }
                      if (textVal) {
                        return (
                          <div className="flex h-20 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-800">
                            {textVal}
                          </div>
                        );
                      }
                      return (
                        <p className="text-xs text-slate-400">
                          Enter svgContent, url, imageUrl, unicode, or text in json_data to preview.
                        </p>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
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
