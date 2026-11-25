export interface UserUploadItem {
  id: number;
  userId?: string;
  publicId: string;
  secureUrl: string;
  originalFilename?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  createdAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : "http://localhost:8080";

const UPLOAD_API_URL = `${API_BASE}/api/uploads`;

/**
 * Upload an image file to the backend, which uploads to Cloudinary and saves metadata to PostgreSQL.
 * Supports a progress callback (0-100%) for live UI feedback.
 */
export function uploadImageToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UserUploadItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    xhr.open("POST", `${UPLOAD_API_URL}/image`, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UserUploadItem;
          resolve(data);
        } catch {
          reject(new Error("Invalid response format from server."));
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.message || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during image upload. Please check your connection."));
    };

    xhr.send(formData);
  });
}

/**
 * Fetch all previously uploaded images from PostgreSQL.
 */
export async function getUploadedImages(page = 0, size = 50): Promise<UserUploadItem[]> {
  const response = await fetch(`${UPLOAD_API_URL}?page=${page}&size=${size}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded images (HTTP ${response.status})`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.content)) {
    return data.content;
  }
  return [];
}

/**
 * Delete an uploaded image from Cloudinary and PostgreSQL.
 */
export async function deleteUploadedImage(id: number, force = false): Promise<boolean> {
  const response = await fetch(`${UPLOAD_API_URL}/${id}?force=${force}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    try {
      const errData = await response.json();
      throw new Error(errData.message || `Failed to delete image (HTTP ${response.status})`);
    } catch (e: any) {
      throw new Error(e.message || `Failed to delete image (HTTP ${response.status})`);
    }
  }

  return true;
}
