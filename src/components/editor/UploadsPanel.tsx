import {
  ImagePlus,
  UploadCloud,
  Sparkles,
  AlertCircle,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useFabric } from "../../context/useFabric";
import { registerPendingUpload } from "../../services/pendingUploadService";

export default function UploadsPanel() {
  const { addImage } = useFabric();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status message state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Process a locally selected file:
   * Instantly loads it on Fabric.js canvas locally without making any Cloudinary request.
   * Defers Cloudinary upload until the user clicks Save.
   */
  const processLocalImage = async (file: File, offsetIndex = 0) => {
    if (!file) return;

    // Client-side quick check
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".svg")) {
      setErrorMessage("Please select a valid image file (JPEG, PNG, WEBP, or SVG).");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image size exceeds the 15 MB limit.");
      return;
    }

    setErrorMessage(null);

    try {
      // 1. Register file locally (no Cloudinary API request at this stage)
      const record = registerPendingUpload(file);

      // 2. Immediately add to canvas for instant editing
      await addImage(record.localUrl, {
        pendingUploadId: record.id,
        offsetIndex,
      });

      setSuccessMessage("Image added to canvas! Cloudinary upload will happen when you click Save.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("Failed to load image onto canvas:", err);
      setErrorMessage(
        err.message || "Failed to load image locally. Please try again."
      );
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        void processLocalImage(files[i], i);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        void processLocalImage(files[i], i);
      }
    }
  };

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="px-4 pt-6 pb-2 shrink-0">
        {/* HEADER */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-indigo-200">
              <ImagePlus size={18} className="text-white" />
            </div>

            <div>
              <h3 className="text-base font-bold tracking-tight text-slate-800">
                Uploads
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                Cloud Media
              </p>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Select images to edit on canvas immediately. They are saved to Cloudinary when you click Save.
          </p>
        </div>

        {/* NOTIFICATIONS */}
        {errorMessage && (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1 break-words">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-600" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-600"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* UPLOAD DROP ZONE BUTTON */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group relative w-full overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/80 scale-[1.02]"
              : "border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/70"
          }`}
        >
          <div className="relative flex flex-col items-center">
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm shadow-indigo-100 transition-transform duration-300 group-hover:scale-110">
              <UploadCloud size={24} strokeWidth={1.8} className="text-indigo-600" />
            </div>

            <h4 className="text-xs font-bold text-slate-800">
              Upload image
            </h4>

            <p className="mt-1 text-[11px] leading-4 text-slate-500">
              Drag & drop or browse device
            </p>

            <span className="mt-2.5 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-all group-hover:shadow-md">
              <ImagePlus size={12} />
              Choose file
            </span>
          </div>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* FORMATS PILLS */}
        <div className="mt-2.5 flex flex-wrap justify-center gap-1">
          {["PNG", "JPG", "WEBP", "SVG"].map((format) => (
            <span
              key={format}
              className="rounded border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500"
            >
              {format}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}
