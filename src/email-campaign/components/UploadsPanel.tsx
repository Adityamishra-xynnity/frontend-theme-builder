import { useEffect, useRef, useState, useCallback } from "react";
import {
  UploadCloud,
  ImagePlus,
  Trash2,
  Images,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useEmailEditor } from "../context/EmailEditorContext";
import {
  uploadImageToCloudinary,
  getUploadedImages,
  deleteUploadedImage,
  type UserUploadItem,
} from "../../api/uploadApi";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export default function UploadsPanel() {
  const { addImage } = useEmailEditor();

  const [images, setImages] = useState<UserUploadItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadUploads = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const items = await getUploadedImages(0, 50);
      setImages(items);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load uploaded images."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUploads();
  }, [loadUploads]);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setActionError("");
    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          setActionError(`"${file.name}" is not a valid image file.`);
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          setActionError(`"${file.name}" exceeds the 10 MB size limit.`);
          continue;
        }

        const uploaded = await uploadImageToCloudinary(file, (percent) => {
          setUploadProgress(percent);
        });

        setImages((current) => {
          const exists = current.some((item) => item.id === uploaded.id);
          return exists ? current : [uploaded, ...current];
        });
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to upload image to Cloudinary."
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleRemove(id: number) {
    setActionError("");
    setDeletingId(id);
    try {
      await deleteUploadedImage(id, false);
      setImages((current) => current.filter((image) => image.id !== id));
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to delete uploaded image."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-5">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-md shadow-indigo-100">
            <Images size={20} className="text-white" />
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-800">Uploads</h2>
            <p className="text-xs text-slate-400">Cloudinary media library</p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Upload your images to Cloudinary and add them directly to your email design.
        </p>
      </div>

      {/* Upload Button */}
      <button
        type="button"
        disabled={isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-7 transition-all duration-200 hover:border-violet-400 hover:shadow-md disabled:opacity-60"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110">
          <UploadCloud size={25} className="text-violet-600" />
        </div>

        <span className="text-sm font-semibold text-slate-800">
          {isUploading ? `Uploading (${uploadProgress}%)...` : "Upload images"}
        </span>

        <span className="mt-1 text-xs text-slate-500">Browse your computer</span>

        <span className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
          <span className="flex items-center gap-1.5">
            <ImagePlus size={14} />
            Choose files
          </span>
        </span>

        <span className="mt-3 text-[10px] text-slate-400">
          PNG, JPG, WEBP, SVG (Max 10 MB)
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {actionError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Uploaded Images */}
      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Uploaded images
          </h3>

          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-600">
            {images.length}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className="h-28 animate-pulse rounded-xl border border-slate-100 bg-slate-100"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-5 text-center">
            <AlertCircle size={22} className="mx-auto mb-2 text-red-500" />
            <p className="text-xs font-semibold text-slate-800">
              Could not load uploaded images
            </p>
            <p className="mt-1 text-[11px] text-slate-500">{loadError}</p>
            <button
              type="button"
              onClick={loadUploads}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              <RefreshCw size={12} />
              Retry
            </button>
          </div>
        ) : images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <Images size={25} className="mx-auto text-slate-300" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              No images uploaded yet
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Your Cloudinary images will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() => addImage(image.secureUrl)}
                  title="Add image to email"
                  className="block w-full text-left"
                >
                  <img
                    src={image.secureUrl}
                    alt={image.originalFilename || "Uploaded image"}
                    className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  <p className="truncate px-2 py-2 text-[10px] font-medium text-slate-600">
                    {image.originalFilename || image.publicId}
                  </p>
                </button>

                <button
                  type="button"
                  disabled={deletingId === image.id}
                  onClick={() => handleRemove(image.id)}
                  title="Delete image"
                  className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-red-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 disabled:opacity-50"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
