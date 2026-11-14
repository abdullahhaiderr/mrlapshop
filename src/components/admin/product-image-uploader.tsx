"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PendingImage = { file: File; altText: string; error?: string };
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function ProductImageUploader({ productId }: { productId: string }) {
  const router = useRouter();
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
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
      file,
      altText: "",
      error: !ALLOWED_TYPES.has(file.type)
        ? "Use a JPEG, PNG or WebP image."
        : file.size < 1 || file.size > MAX_IMAGE_BYTES
          ? "Each image must be smaller than 8 MB."
          : undefined,
    })));
  }

  function updateAltText(index: number, altText: string) {
    setPendingImages((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, altText, error: item.error } : item));
  }

  async function uploadSelectedImages() {
    if (!pendingImages.length || uploading) return;
    const invalid = pendingImages.some((item) => item.error || item.altText.trim().length < 4 || item.altText.trim().length > 180);
    if (invalid) {
      setError("Check every image type, file size and description (4–180 characters).");
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");
    const supabase = createClient();
    let uploaded = 0;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Your owner session has expired. Sign in again and retry.");

      const { data: latestImage, error: positionError } = await supabase
        .from("product_images")
        .select("position")
        .eq("product_id", productId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (positionError) throw new Error("Could not read the current image order. Refresh the page and retry.");

      let nextPosition = (latestImage?.position ?? -1) + 1;
      for (const item of pendingImages) {
        const extension = item.file.type === "image/jpeg" ? "jpg" : item.file.type === "image/png" ? "png" : "webp";
        const storagePath = `${productId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(storagePath, item.file, {
            contentType: item.file.type,
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadError) throw new Error(`Could not upload ${item.file.name}. Check your connection and owner permissions.`);

        const { error: rowError } = await supabase.from("product_images").insert({
          product_id: productId,
          storage_path: storagePath,
          alt_text: item.altText.trim(),
          position: nextPosition,
        });
        if (rowError) {
          await supabase.storage.from("product-images").remove([storagePath]);
          if (rowError.code === "23505") throw new Error("An image record already exists. Refresh the page before retrying.");
          throw new Error("The image was uploaded but its catalogue record could not be saved. The uploaded file was removed; please retry.");
        }

        nextPosition += 1;
        uploaded += 1;
      }

      setPendingImages([]);
      setMessage(`${uploaded} product photo${uploaded === 1 ? "" : "s"} uploaded successfully.`);
      router.refresh();
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "An unexpected upload error occurred.";
      setError(uploaded ? `${uploaded} image(s) uploaded. ${detail}` : detail);
      if (uploaded) router.refresh();
    } finally {
      setUploading(false);
    }
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
          {pendingImages.map((item, index) => (
            <div className="admin-pending-image" key={`${item.file.name}-${item.file.lastModified}-${index}`}>
              <div><strong>{item.file.name}</strong><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB</small></div>
              <label className="admin-field">
                <span>Describe this photo *</span>
                <input
                  value={item.altText}
                  maxLength={180}
                  minLength={4}
                  placeholder="e.g. Dell Latitude 5550 front view"
                  onChange={(event) => updateAltText(index, event.currentTarget.value)}
                  disabled={uploading}
                />
              </label>
              {item.error && <small className="form-feedback form-feedback-error">{item.error}</small>}
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
