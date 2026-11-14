import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { archiveProductAction, removeProductImageAction, uploadProductImageAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Edit product | Mr LapShop owner" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string; created?: string; imageUploaded?: string; imageRemoved?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase } = await requireStoreOwner();
  const [{ data: product }, { data: categories }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name, category_group").order("sort_order"),
    supabase.from("product_images").select("id, storage_path, alt_text, position").eq("product_id", id).order("position"),
  ]);
  if (!product) notFound();
  const imageRows = await Promise.all((images ?? []).map(async (item) => ({ ...item, url: supabase.storage.from("product-images").getPublicUrl(item.storage_path).data.publicUrl })));
  return <section className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">INVENTORY · EDIT RECORD</span><h1>Product <em>details.</em></h1><p>Changes here are saved to the live catalogue database.</p></div><Link href="/admin/products">← All products</Link></div>
    {query.error && <p className="form-feedback form-feedback-error">The requested change did not complete. Check the file, product details and database connection.</p>}
    {query.saved && <p className="form-feedback form-feedback-success">Product updated.</p>}{query.created && <p className="form-feedback form-feedback-success">Product created. Add its photos below.</p>}{query.imageUploaded && <p className="form-feedback form-feedback-success">Product photo uploaded.</p>}{query.imageRemoved && <p className="form-feedback form-feedback-success">Product photo removed.</p>}
    <ProductEditorForm product={product} categories={categories ?? []}/>
    <section className="admin-panel admin-image-panel"><div className="admin-panel-head"><div><h2>Product photos</h2><p>JPEG, PNG or WebP. Maximum 8 MB per image.</p></div></div>
      <form action={uploadProductImageAction} className="admin-upload-form" encType="multipart/form-data"><input type="hidden" name="productId" value={id}/><label className="admin-field"><span>Choose image</span><input type="file" name="image" accept="image/jpeg,image/png,image/webp" required/></label><label className="admin-field"><span>Alt text</span><input name="altText" minLength={4} maxLength={180} placeholder="Describe the actual product photo" required/></label><button className="button button-dark" type="submit">Upload photo</button></form>
      {!imageRows.length ? <div className="admin-empty">No photos have been uploaded for this product.</div> : <div className="admin-image-grid">{imageRows.map((image) => <article key={image.id}><Image src={image.url} alt={image.alt_text} width={800} height={600} sizes="(max-width: 700px) 100vw, 320px"/><p>{image.alt_text}</p><form action={removeProductImageAction}><input type="hidden" name="productId" value={id}/><input type="hidden" name="imageId" value={image.id}/><button className="admin-danger-link" type="submit">Remove photo</button></form></article>)}</div>}
    </section>
    {product.status !== "archived" && <form action={archiveProductAction} className="admin-archive-form"><input type="hidden" name="id" value={id}/><div><strong>Archive this product</strong><p>Archiving hides the listing without deleting order-history references or product records.</p></div><button className="button button-outline" type="submit">Archive product</button></form>}
  </section>;
}
