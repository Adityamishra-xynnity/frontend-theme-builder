import { uploadImageToCloudinary } from "../api/uploadApi";

export interface PendingUploadRecord {
  id: string;
  file: File;
  localUrl: string;
  status: "pending" | "uploading" | "uploaded" | "failed";
  secureUrl?: string;
  publicId?: string;
  error?: string;
}

// In-memory registry of locally selected images pending upload
const pendingRegistry = new Map<string, PendingUploadRecord>();

/**
 * Register a newly selected image file in the local pending registry.
 * Creates an object URL for immediate, latency-free display on Fabric canvas.
 */
export function registerPendingUpload(file: File): PendingUploadRecord {
  const id = `pending_${crypto.randomUUID()}`;
  const localUrl = URL.createObjectURL(file);
  const record: PendingUploadRecord = {
    id,
    file,
    localUrl,
    status: "pending",
  };
  pendingRegistry.set(id, record);
  return record;
}

export function getPendingUpload(id: string): PendingUploadRecord | undefined {
  return pendingRegistry.get(id);
}

/**
 * Fallback finder by localUrl in case only the blob URL is available.
 */
export function getPendingUploadByLocalUrl(url: string): PendingUploadRecord | undefined {
  if (!url) return undefined;
  for (const record of pendingRegistry.values()) {
    if (record.localUrl === url) return record;
  }
  return undefined;
}

/**
 * Safely revoke the temporary browser object URL once replaced with Cloudinary CDN URL.
 */
export function revokePendingUrl(id: string): void {
  const record = pendingRegistry.get(id);
  if (record && record.localUrl) {
    try {
      URL.revokeObjectURL(record.localUrl);
    } catch {
      // Browser already released or invalid
    }
  }
}

/**
 * Upload all pending images referenced by the current design to Cloudinary.
 * Skips images that were already uploaded (in case of partial saves or duplicates).
 * Uploads each unique pending file only ONCE.
 */
export async function uploadPendingImagesForDesign(
  referencedPendingIds: Set<string>,
  onProgress?: (uploadedCount: number, totalCount: number) => void
): Promise<Map<string, { secureUrl: string; publicId: string }>> {
  const results = new Map<string, { secureUrl: string; publicId: string }>();

  const pendingToUpload: PendingUploadRecord[] = [];
  for (const id of referencedPendingIds) {
    const record = pendingRegistry.get(id);
    if (!record) continue;

    if (record.status === "uploaded" && record.secureUrl) {
      // Already uploaded from earlier attempt or duplicate instance
      results.set(id, {
        secureUrl: record.secureUrl,
        publicId: record.publicId || "",
      });
    } else {
      pendingToUpload.push(record);
    }
  }

  if (pendingToUpload.length === 0) {
    return results;
  }

  let completed = results.size;
  const total = results.size + pendingToUpload.length;

  for (const record of pendingToUpload) {
    record.status = "uploading";
    try {
      const uploadRes = await uploadImageToCloudinary(record.file);
      record.status = "uploaded";
      record.secureUrl = uploadRes.secureUrl;
      record.publicId = uploadRes.publicId;

      results.set(record.id, {
        secureUrl: uploadRes.secureUrl,
        publicId: uploadRes.publicId,
      });

      completed++;
      onProgress?.(completed, total);
    } catch (err: any) {
      record.status = "failed";
      record.error = err.message || "Upload failed";
      throw new Error(
        `Failed to upload image "${record.file.name}" to Cloudinary: ${
          err.message || "Network error"
        }. Your design has been kept safe on the canvas. Please check your connection and try saving again.`
      );
    }
  }

  // Notify gallery to refresh thumbnails
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("user-uploads-updated"));
  }

  return results;
}
