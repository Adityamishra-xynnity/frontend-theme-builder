import {
  ImagePlus,
  UploadCloud,
  Sparkles,
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useFabric } from "../../context/useFabric";
import {
  getUploadedImages,
  deleteUploadedImage,
  type UserUploadItem,
} from "../../api/uploadApi";
import { registerPendingUpload } from "../../services/pendingUploadService";

export default function UploadsPanel() {
  const { addImage } = useFabric();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status message state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Uploaded media gallery state
  const [galleryImages, setGalleryImages] = useState<UserUploadItem[]>([]);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch previously uploaded images from backend
  const loadGallery = useCallback(async () => {
    try {
      setIsLoadingGallery(true);
      const items = await getUploadedImages();
      setGalleryImages(items);
    } catch {
      // Backend might be warming up or offline; non-fatal for initial render
    } finally {
      setIsLoadingGallery(false);
    }
  }, []);

  useEffect(() => {
    void loadGallery();
  }, [loadGallery]);

  // Listen for design saves to refresh gallery with newly uploaded Cloudinary items
  useEffect(() => {
    const handleUploadsUpdated = () => {
      void loadGallery();
    };

    window.addEventListener("user-uploads-updated", handleUploadsUpdated);
    return () => {
      window.removeEventListener("user-uploads-updated", handleUploadsUpdated);
    };
  }, [loadGallery]);

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

  // Re-insert an existing image from the gallery
  const handleSelectGalleryItem = async (item: UserUploadItem) => {
    try {
      await addImage(item.secureUrl);
    } catch (err) {
      console.error("Failed to add image to canvas:", err);
    }
  };

  // Delete an image from Cloudinary and PostgreSQL
  const handleDeleteItem = async (e: React.MouseEvent, item: UserUploadItem) => {
    e.stopPropagation();
    if (deletingId !== null) return;

    const confirmed = window.confirm(
      `Delete "${item.originalFilename || "this image"}" from your uploads?`
    );
    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setErrorMessage(null);
      await deleteUploadedImage(item.id);
      setGalleryImages((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete uploaded image.");
    } finally {
      setDeletingId(null);
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

      {/* UPLOADED MEDIA GALLERY SECTION */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mt-4 mb-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700">Uploaded Media</span>
            {galleryImages.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700">
                {galleryImages.length}
              </span>
            )}
          </div>

          <button
            type="button"
            title="Refresh uploads"
            onClick={() => void loadGallery()}
            disabled={isLoadingGallery}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none"
          >
            <RefreshCw
              size={12}
              className={isLoadingGallery ? "animate-spin text-indigo-600" : ""}
            />
          </button>
        </div>

        {/* GALLERY GRID */}
        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {galleryImages.map((img) => (
              <div
                key={img.id}
                role="button"
                tabIndex={0}
                onClick={() => void handleSelectGalleryItem(img)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    void handleSelectGalleryItem(img);
                  }
                }}
                title={img.originalFilename || "Uploaded Image"}
                className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md"
              >
                <img
                  src={img.secureUrl}
                  alt={img.originalFilename || "User upload"}
                  loading="lazy"
                  crossOrigin="anonymous"
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                />

                {/* DELETE BUTTON ON HOVER */}
                <button
                  type="button"
                  title="Delete from uploads"
                  disabled={deletingId === img.id}
                  onClick={(e) => void handleDeleteItem(e, img)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 focus:opacity-100"
                >
                  {deletingId === img.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                </button>

                {/* FORMAT BADGE */}
                {img.format && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider text-white">
                    {img.format}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          !isLoadingGallery && (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-center">
              <Sparkles size={16} className="mx-auto text-indigo-400 mb-1.5" />
              <p className="text-xs font-medium text-slate-600">No uploads yet</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Photos you upload will appear here for easy reuse.
              </p>
            </div>
          )
        )}
      </div>
    </aside>
  );
}
