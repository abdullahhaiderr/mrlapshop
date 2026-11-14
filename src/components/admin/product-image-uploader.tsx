"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadProductImagesForProduct, type PendingProductImage } from "@/lib/admin/product-images";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProductImageUploader({ productId }: { productId: string }) {
  const router = useRouter();
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function selectFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    setMessage("");
    setError("");
    if (files.length > 12) {
      setError("Please select no more than 12 images at a time.");
      return;
    }
    setPendingImages(files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      altText: "",
    })));
  }

  function updateAltText(id: string, altText: string) {
    setPendingImages((current) => current.map((item) => item.id === id ? { ...item, altText } : item));
  }

  async function uploadSelectedImages() {
    if (!pendingImages.length || uploading) return;
    const invalid = pendingImages.find((item) =>
      !ALLOWED_TYPES.has(item.file.type)
      || item.file.size < 1
      || item.file.size > MAX_IMAGE_BYTES
      || item.altText.trim().length < 4
      || item.altText.trim().length > 180
    );
    if (invalid) {
      setError(`Check ${invalid.file.name}: use a JPEG, PNG or WebP image under 8 MB and add a description (4–180 characters).`);
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    const result = await uploadProductImagesForProduct(productId, pendingImages);
    setPendingImages((current) => current.filter((item) => !result.uploadedIds.includes(item.id)));
    if (result.error) {
      setError(result.uploadedCount
        ? `${result.uploadedCount} photo(s) uploaded. The remaining selected photos are ready to retry. ${result.error}`
        : result.error);
    } else {
      setMessage(`${result.uploadedCount} product photo${result.uploadedCount === 1 ? "" : "s"} uploaded successfully.`);
    }
    if (result.uploadedCount > 0) router.refresh();
    setUploading(false);
  }

  return (
    <div className="admin-image-uploader">
      <label className="admin-field">
        <span>Select product photos</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading}
          onChange={(event) => selectFiles(event.currentTarget.files)}
        />
        <small>Select several views at once. JPEG, PNG or WebP; maximum 8 MB per image.</small>
      </label>

      {pendingImages.length > 0 && (
        <div className="admin-pending-images">
          {pendingImages.map((item) => (
            <div className="admin-pending-image" key={item.id}>
              <div><strong>{item.file.name}</strong><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB</small></div>
              <label className="admin-field">
                <span>Describe this photo *</span>
                <input
                  value={item.altText}
                  maxLength={180}
                  minLength={4}
                  placeholder="e.g. Dell Latitude 5550 front view"
                  onChange={(event) => updateAltText(item.id, event.currentTarget.value)}
                  disabled={uploading}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      {error && <p className="form-feedback form-feedback-error" role="alert">{error}</p>}
      {message && <p className="form-feedback form-feedback-success" role="status">{message}</p>}
      <button className="button button-dark" type="button" onClick={uploadSelectedImages} disabled={!pendingImages.length || uploading}>
        {uploading ? "Uploading photos…" : `Upload ${pendingImages.length || ""} selected photo${pendingImages.length === 1 ? "" : "s"}`}
      </button>
    </div>
  );
}
