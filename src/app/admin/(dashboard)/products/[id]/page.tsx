import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { ProductImageUploader } from "@/components/admin/product-image-uploader";
import { archiveProductAction, removeProductImageAction, sendProductAnnouncementAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Edit product | Mr LapShop owner" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; created?: string; imageUploaded?: string; imageRemoved?: string; emailSent?: string; emailError?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase } = await requireStoreOwner();
  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, category_group").order("sort_order"),
    supabase.from("product_images").select("id, storage_path, alt_text, position").eq("product_id", id).order("position"),
  ]);
  if (!product) notFound();
  const imageRows = await Promise.all((images ?? []).map(async (item) => ({ ...item, url: supabase.storage.from("product-images").getPublicUrl(item.storage_path).data.publicUrl })));
  const emailConfigured = Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
  return <section className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">INVENTORY · EDIT RECORD</span><h1>Product <em>details.</em></h1><p>Changes here are saved to the live catalogue database.</p></div><Link href="/admin/products">← All products</Link></div>
    {query.error === "duplicate_slug" && <p className="form-feedback form-feedback-error">That URL slug is already assigned to another product. Choose a different slug.</p>}
    {query.error === "duplicate_sku" && <p className="form-feedback form-feedback-error">That SKU is already assigned to another product. Enter a unique SKU or leave it blank.</p>}
    {query.error === "access_denied" && <p className="form-feedback form-feedback-error">Your owner permission was not accepted by the database. Sign out, sign back in and retry.</p>}
    {query.error && !["duplicate_slug", "duplicate_sku", "access_denied"].includes(query.error) && <p className="form-feedback form-feedback-error">The requested change did not complete. Check the product details and database connection.</p>}
    {query.emailSent && <p className="form-feedback form-feedback-success">New-arrival email sent to {query.emailSent} verified customer{query.emailSent === "1" ? "" : "s"} who opted in.</p>}
    {query.emailError === "not_configured" && <p className="form-feedback form-feedback-error">Resend is not ready yet. Add RESEND_API_KEY and a verified RESEND_FROM_EMAIL in Vercel, then redeploy.</p>}
    {query.emailError === "no_subscribers" && <p className="form-feedback form-feedback-error">No verified customers have opted in to promotional emails yet. Customers can subscribe at registration or in Account → Email preferences.</p>}
    {query.emailError === "already_sent" && <p className="form-feedback form-feedback-error">This product announcement has already been sent. The dashboard prevents accidental duplicate campaigns.</p>}
    {query.emailError === "not_ready" && <p className="form-feedback form-feedback-error">Publish this product with a valid price and available stock before announcing it.</p>}
    {query.emailError === "partial" && <p className="form-feedback form-feedback-error">Resend accepted only part of the announcement, or the request failed. Check Resend logs before retrying.</p>}
    {(query.emailError === "product" || query.emailError === "check" || query.emailError === "recipients" || query.emailError === "too_many") && <p className="form-feedback form-feedback-error">The customer list could not be prepared safely. Check the owner permissions and try again.</p>}
    {query.saved && <p className="form-feedback form-feedback-success">Product updated.</p>}{query.created && <p className="form-feedback form-feedback-success">Product created. Add its photos below.</p>}{query.imageUploaded && <p className="form-feedback form-feedback-success">Product photo uploaded.</p>}{query.imageRemoved && <p className="form-feedback form-feedback-success">Product photo removed.</p>}
    <ProductEditorForm product={product} categories={categories ?? []}/>
    <section className="admin-panel admin-image-panel"><div className="admin-panel-head"><div><h2>Product photos</h2><p>JPEG, PNG or WebP. Maximum 8 MB per image.</p></div></div>
      <ProductImageUploader productId={id} />
      {!imageRows.length ? <div className="admin-empty">No photos have been uploaded for this product.</div> : <div className="admin-image-grid">{imageRows.map((image) => <article key={image.id}><Image src={image.url} alt={image.alt_text} width={800} height={600} sizes="(max-width: 700px) 100vw, 320px"/><p>{image.alt_text}</p><form action={removeProductImageAction}><input type="hidden" name="productId" value={id}/><input type="hidden" name="imageId" value={image.id}/><button className="admin-danger-link" type="submit">Remove photo</button></form></article>)}</div>}
    </section>
    <section className="admin-panel admin-image-panel">
      <div className="admin-panel-head"><div><h2>New-arrival email</h2><p>Send this product to customers who verified their email address and explicitly opted into promotional updates.</p></div></div>
      {product.status !== "active" || Number(product.stock) < 1 || !product.price_pkr
        ? <div className="admin-empty">Publish this product, confirm its price and add available stock before announcing it.</div>
        : emailConfigured
          ? <form action={sendProductAnnouncementAction} className="admin-announcement-form">
              <input type="hidden" name="productId" value={id}/>
              <p>Each customer receives an individual email. The sender will be your verified Resend address, and the message links to the official mrlapshop.pk product page.</p>
              <button className="button button-dark" type="submit">Send new-arrival email to opted-in customers</button>
            </form>
          : <div className="admin-empty">Resend setup is incomplete. Add RESEND_API_KEY and RESEND_FROM_EMAIL in Vercel after verifying your sending domain in Resend, then redeploy.</div>}
    </section>
    {product.status !== "archived" && <form action={archiveProductAction} className="admin-archive-form"><input type="hidden" name="id" value={id}/><div><strong>Archive this product</strong><p>Archiving hides the listing without deleting order-history references or product records.</p></div><button className="button button-outline" type="submit">Archive product</button></form>}
  </section>;
}
