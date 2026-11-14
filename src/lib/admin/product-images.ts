"use client";

import { createClient } from "@/lib/supabase/client";

export type PendingProductImage = {
  id: string;
  file: File;
  altText: string;
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function uploadProductImagesForProduct(productId: string, items: PendingProductImage[]) {
  const uploadedIds: string[] = [];
  if (!items.length) return { uploadedIds, uploadedCount: 0, error: null as string | null };

  const invalid = items.find((item) =>
    !ALLOWED_TYPES.has(item.file.type)
    || item.file.size < 1
    || item.file.size > MAX_IMAGE_BYTES
    || item.altText.trim().length < 4
    || item.altText.trim().length > 180
  );
  if (invalid) {
    return {
      uploadedIds,
      uploadedCount: 0,
      error: `Check ${invalid.file.name}: use a JPEG, PNG or WebP image under 8 MB and add a description (4–180 characters).`,
    };
  }

  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Your owner session has expired. Sign in again and retry.");

    const { data: latestImage, error: positionError } = await supabase
      .from("product_images")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (positionError) throw new Error("Could not read the current image order. Refresh and retry.");

    let nextPosition = (latestImage?.position ?? -1) + 1;
    for (const item of items) {
      if (!(await hasValidImageSignature(item.file))) {
        return { uploadedIds, uploadedCount: uploadedIds.length, error: `${item.file.name} is not a valid JPEG, PNG or WebP image.` };
      }

      const extension = item.file.type === "image/jpeg" ? "jpg" : item.file.type === "image/png" ? "png" : "webp";
      const storagePath = `${productId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(storagePath, item.file, {
          contentType: item.file.type,
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        return { uploadedIds, uploadedCount: uploadedIds.length, error: `Could not upload ${item.file.name}. Check your connection and owner permissions.` };
      }

      const { error: rowError } = await supabase.from("product_images").insert({
        product_id: productId,
        storage_path: storagePath,
        alt_text: item.altText.trim(),
        position: nextPosition,
      });
      if (rowError) {
        await supabase.storage.from("product-images").remove([storagePath]);
        return {
          uploadedIds,
          uploadedCount: uploadedIds.length,
          error: rowError.code === "23505"
            ? "An image record already exists. Refresh the page before retrying."
            : "The image file could not be connected to the product. The uploaded file was removed; please retry.",
        };
      }

      nextPosition += 1;
      uploadedIds.push(item.id);
    }

    return { uploadedIds, uploadedCount: uploadedIds.length, error: null as string | null };
  } catch (cause) {
    return {
      uploadedIds,
      uploadedCount: uploadedIds.length,
      error: cause instanceof Error ? cause.message : "An unexpected upload error occurred.",
    };
  }
}
