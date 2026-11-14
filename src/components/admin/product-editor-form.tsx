"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveProductAction, createProductWithResultAction } from "@/app/admin/(dashboard)/actions";
import { uploadProductImagesForProduct, type PendingProductImage } from "@/lib/admin/product-images";
type Category = { id: string; name: string; category_group: string };
type Product = {
  id: string; title: string; slug: string; brand: string; sku: string | null; series: string | null; model: string | null; category_id: string | null;
  condition: "new" | "used" | "open_box"; cosmetic_grade: string | null; cpu_family: string | null; cpu_model: string | null;
  generation: string | null; ram_gb: number | null; ram_type: string | null; storage_gb: number | null; storage_type: string | null;
  screen_in: number | null; resolution: string | null; touch: boolean; two_in_one: boolean; gpu: string | null;
  operating_system: string | null; battery_note: string | null; warranty_months: number | null; warranty_terms: string | null;
  price_pkr: number | null; compare_at_pkr: number | null; stock: number; status: "draft" | "active" | "archived";
  featured: boolean; performance_pick: boolean; short_description: string | null; description: string | null;
};

function Field({ label, name, defaultValue, type = "text", required = false, hint }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; hint?: string }) {
  return <label className="admin-field"><span>{label}{required ? " *" : ""}</span><input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />{hint && <small>{hint}</small>}</label>;
}

export function ProductEditorForm({ product, categories }: { product?: Product | null; categories: Category[] }) {
  const router = useRouter();
  const isNewProduct = !product;
  const [pendingImages, setPendingImages] = useState<PendingProductImage[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  function selectProductPhotos(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    setPhotoError("");
    setPhotoMessage("");
    if (files.length > 12) {
      setPhotoError("Select no more than 12 product photos at a time.");
      return;
    }
    setPendingImages(files.map((file) => ({ id: crypto.randomUUID(), file, altText: "" })));
  }

  function updatePhotoAltText(id: string, altText: string) {
    setPendingImages((current) => current.map((item) => item.id === id ? { ...item, altText } : item));
  }

  async function uploadRemainingPhotos(productId: string) {
    if (!pendingImages.length) {
      router.push(`/admin/products/${productId}?created=1`);
      return;
    }
    const invalid = pendingImages.find((item) =>
      !["image/jpeg", "image/png", "image/webp"].includes(item.file.type)
      || item.file.size < 1
      || item.file.size > 8 * 1024 * 1024
      || item.altText.trim().length < 4
      || item.altText.trim().length > 180
    );
    if (invalid) {
      setPhotoError(`Check ${invalid.file.name}: use JPEG, PNG or WebP under 8 MB and add a description of 4–180 characters.`);
      return;
    }

    setUploading(true);
    setPhotoError("");
    const result = await uploadProductImagesForProduct(productId, pendingImages);
    setPendingImages((current) => current.filter((item) => !result.uploadedIds.includes(item.id)));
    if (result.error) {
      setPhotoError(`${result.uploadedCount ? `${result.uploadedCount} photo(s) uploaded. ` : ""}${result.error} You can retry the remaining photos or continue and upload them from the product page.`);
      setUploading(false);
      return;
    }
    setPhotoMessage(`${result.uploadedCount} product photo${result.uploadedCount === 1 ? "" : "s"} uploaded successfully.`);
    router.push(`/admin/products/${productId}?created=1&imageUploaded=${result.uploadedCount}`);
  }

  async function handleCreateProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isNewProduct || creating || uploading || createdProductId) return;
    setFormError("");
    setPhotoError("");
    const invalidPhoto = pendingImages.find((item) =>
      !["image/jpeg", "image/png", "image/webp"].includes(item.file.type)
      || item.file.size < 1
      || item.file.size > 8 * 1024 * 1024
      || item.altText.trim().length < 4
      || item.altText.trim().length > 180
    );
    if (invalidPhoto) {
      setPhotoError(`Check ${invalidPhoto.file.name}: use JPEG, PNG or WebP under 8 MB and add a description of 4–180 characters.`);
      return;
    }
    const formData = new FormData(event.currentTarget);
    setCreating(true);
    const result = await createProductWithResultAction(formData);
    setCreating(false);
    if (!result.ok) {
      const messages: Record<string, string> = {
        validation: "Check the required product details, URL slug, numbers and category.",
        publish_requirements: "To publish this product, enter a confirmed price and a warranty decision. You can also save it as a draft.",
        duplicate_slug: "That URL slug is already in use. Choose a unique slug.",
        duplicate_sku: "That SKU is already assigned to another product. Enter a unique SKU or leave it blank.",
        access_denied: "Your owner permission was not accepted by the database. Sign out, sign back in and retry.",
      };
      setFormError(messages[result.error] ?? "The product could not be saved. Check the details and try again.");
      return;
    }
    setCreatedProductId(result.productId);
    await uploadRemainingPhotos(result.productId);
  }

  return (
    <form action={product ? saveProductAction : undefined} onSubmit={isNewProduct ? handleCreateProduct : undefined} className="admin-form">
      <input type="hidden" name="id" value={product?.id ?? ""}/>
      {!product && (
        <section className="admin-form-section admin-create-photos">
          <div className="admin-create-photos-heading"><span className="admin-photo-step">STEP 1 · PRODUCT IMAGES</span><h2>Upload product photos</h2><p className="admin-photo-intro">Choose the laptop photos before entering the rest of the details. The first image is the main product photo; the second appears when shoppers hover over the listing.</p></div>
          <label className="admin-field">
            <span>Select images to upload <strong>· required for a photo listing</strong></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={creating || uploading} onChange={(event) => selectProductPhotos(event.currentTarget.files)} />
            <small>Click to browse or drag files into the browser&apos;s file picker. JPEG, PNG or WebP · 8 MB max each · up to 12 images.</small>
          </label>
          {pendingImages.length > 0 && (
            <div className="admin-pending-images">
              {pendingImages.map((item) => (
                <div className="admin-pending-image" key={item.id}>
                  <div><strong>{item.file.name}</strong><small>{(item.file.size / 1024 / 1024).toFixed(2)} MB</small></div>
                  <label className="admin-field"><span>Photo description *</span><input value={item.altText} maxLength={180} minLength={4} placeholder="e.g. HP EliteBook front view" onChange={(event) => updatePhotoAltText(item.id, event.currentTarget.value)} disabled={uploading}/></label>
                </div>
              ))}
            </div>
          )}
          {photoError && <p className="form-feedback form-feedback-error" role="alert">{photoError}</p>}
          {photoMessage && <p className="form-feedback form-feedback-success" role="status">{photoMessage}</p>}
          {formError && <p className="form-feedback form-feedback-error" role="alert">{formError}</p>}
          {createdProductId && (
            <div className="admin-created-product-state">
              <strong>Product saved as a draft.</strong>
              <span>{pendingImages.length ? "Upload the remaining photos, or continue to the product editor." : "Your product record has been created."}</span>
              <div>
                {pendingImages.length > 0 && <button className="button button-primary" type="button" onClick={() => uploadRemainingPhotos(createdProductId)} disabled={uploading}>{uploading ? "Uploading photos…" : "Retry photo upload"}</button>}
                <button className="button button-outline" type="button" onClick={() => router.push(`/admin/products/${createdProductId}?created=1`)}>Continue to product</button>
              </div>
            </div>
          )}
        </section>
      )}
      <section className="admin-form-section"><h2>Product identity</h2><div className="admin-form-grid">
        <Field label="Display title" name="title" defaultValue={product?.title} required />
        <Field label="URL slug" name="slug" defaultValue={product?.slug} required hint="Lowercase words separated with hyphens." />
        <Field label="Brand" name="brand" defaultValue={product?.brand} required />
        <Field label="Series" name="series" defaultValue={product?.series} />
        <Field label="Model" name="model" defaultValue={product?.model} />
        <label className="admin-field"><span>Category *</span><select name="categoryId" required defaultValue={product?.category_id ?? ""}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {category.category_group}</option>)}</select></label>
        <label className="admin-field"><span>Condition *</span><select name="condition" required defaultValue={product?.condition ?? "new"}><option value="new">New</option><option value="used">Used</option><option value="open_box">Open Box</option></select></label>
        <Field label="SKU (optional)" name="sku" defaultValue={product?.sku ?? ""} hint="SKU may be entered on the product record later." />
        <Field label="Cosmetic grade" name="cosmeticGrade" defaultValue={product?.cosmetic_grade} />
      </div></section>
      <section className="admin-form-section"><h2>Specifications</h2><div className="admin-form-grid">
        <Field label="Processor family" name="cpuFamily" defaultValue={product?.cpu_family}/><Field label="Processor model" name="cpuModel" defaultValue={product?.cpu_model}/><Field label="Generation" name="generation" defaultValue={product?.generation}/>
        <Field label="RAM (GB)" name="ramGb" type="number" defaultValue={product?.ram_gb}/><Field label="RAM type" name="ramType" defaultValue={product?.ram_type}/><Field label="Storage (GB)" name="storageGb" type="number" defaultValue={product?.storage_gb}/>
        <Field label="Storage type" name="storageType" defaultValue={product?.storage_type}/><Field label="Screen size (inches)" name="screenIn" type="number" defaultValue={product?.screen_in}/><Field label="Resolution" name="resolution" defaultValue={product?.resolution}/>
        <Field label="Graphics" name="gpu" defaultValue={product?.gpu}/><Field label="Operating system" name="operatingSystem" defaultValue={product?.operating_system}/><Field label="Battery / condition notes" name="batteryNote" defaultValue={product?.battery_note}/>
      </div><div className="admin-check-row"><label><input type="checkbox" name="touch" defaultChecked={product?.touch ?? false}/> Touchscreen</label><label><input type="checkbox" name="twoInOne" defaultChecked={product?.two_in_one ?? false}/> 2-in-1 convertible</label></div></section>
      <section className="admin-form-section"><h2>Price, stock and warranty</h2><div className="admin-form-grid">
        <Field label="Price (PKR)" name="pricePkr" type="number" defaultValue={product?.price_pkr} hint="Leave blank for a draft that is not ready to sell."/><Field label="Compare-at price (PKR)" name="compareAtPkr" type="number" defaultValue={product?.compare_at_pkr}/><Field label="Available stock" name="stock" type="number" defaultValue={product?.stock ?? 0} required/>
        <Field label="Warranty duration (months)" name="warrantyMonths" type="number" defaultValue={product?.warranty_months} hint="Use 0 only when the owner has confirmed no warranty applies."/><Field label="Warranty terms" name="warrantyTerms" defaultValue={product?.warranty_terms}/>
        <label className="admin-field"><span>Listing status</span><select name="status" defaultValue={product?.status ?? "draft"}><option value="draft">Draft</option><option value="active">Published</option><option value="archived">Archived</option></select></label>
      </div><div className="admin-product-flags"><label className="admin-check-label"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false}/> Feature this product in the catalogue</label><label className="admin-check-label"><input type="checkbox" name="performancePick" defaultChecked={product?.performance_pick ?? false}/> Show in The Beast Collection (high-performance / upgraded picks)</label></div></section>
      <section className="admin-form-section"><h2>Product copy</h2><label className="admin-field"><span>Short description</span><textarea name="shortDescription" rows={2} defaultValue={product?.short_description ?? ""}/></label><label className="admin-field"><span>Full description</span><textarea name="description" rows={5} defaultValue={product?.description ?? ""}/></label></section>
      <div className="admin-form-footer"><p>Required product facts must be verified by the shop owner. Publishing is blocked until a price and warranty decision are entered.</p><button className="button button-primary" type="submit" disabled={creating || uploading || Boolean(createdProductId)}>{creating ? "Saving product…" : product ? "Save changes" : createdProductId ? "Product saved" : "Create product & upload photos"}</button></div>
    </form>
  );
}
