
import { useRef, useState } from "react";
import {
  UploadCloud,
  ImagePlus,
  Trash2,
  Images,
} from "lucide-react";

import { useEmailEditor } from "../context/EmailEditorContext";

interface UploadedImage {
  id: string;
  name: string;
  url: string;
}

export default function UploadsPanel() {
  const { addImage } = useEmailEditor();

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setError("");

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select valid image files.");
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          setImages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              name: file.name,
              url: reader.result as string,
            },
          ]);
        }
      };

      reader.readAsDataURL(file);
    });

    event.target.value = "";
  }

  function handleRemove(id: string) {
    setImages((current) =>
      current.filter((image) => image.id !== id)
    );
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
            <h2 className="text-base font-bold text-slate-800">
              Uploads
            </h2>
            <p className="text-xs text-slate-400">
              Your personal images
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Upload your images and add them directly to your email design.
        </p>
      </div>

      {/* Upload Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 px-4 py-7 transition-all duration-200 hover:border-violet-400 hover:shadow-md"
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm transition-transform group-hover:scale-110">
          <UploadCloud size={25} className="text-violet-600" />
        </div>

        <span className="text-sm font-semibold text-slate-800">
          Upload images
        </span>

        <span className="mt-1 text-xs text-slate-500">
          Browse your computer
        </span>

        <span className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white">
          <span className="flex items-center gap-1.5">
            <ImagePlus size={14} />
            Choose files
          </span>
        </span>

        <span className="mt-3 text-[10px] text-slate-400">
          PNG, JPG, WEBP, GIF
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

      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
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

        {images.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
            <Images size={25} className="mx-auto text-slate-300" />
            <p className="mt-2 text-xs font-medium text-slate-500">
              No images uploaded yet
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Your images will appear here
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
                  onClick={() => addImage(image.url)}
                  title="Add image to email"
                  className="block w-full text-left"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="h-24 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  <p className="truncate px-2 py-2 text-[10px] font-medium text-slate-600">
                    {image.name}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemove(image.id)}
                  title="Remove image"
                  className="absolute right-1.5 top-1.5 rounded-md bg-white/90 p-1 text-red-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
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
