import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { ProductEditorForm } from "@/components/admin/product-editor-form";

export const metadata = { title: "Add product | Mr LapShop owner" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  const { data: categories } = await supabase.from("categories").select("id, name, category_group").order("sort_order");
  return <section className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">INVENTORY</span><h1>Add a <em>product.</em></h1><p>Create a draft first if exact specifications, price or warranty are not ready. After saving, add several product photos in the Product photos section.</p></div><Link href="/admin/products">← Products</Link></div>{params.error === "duplicate_slug" && <p className="form-feedback form-feedback-error">That URL slug is already in use. Choose a unique slug for this product.</p>}{params.error === "duplicate_sku" && <p className="form-feedback form-feedback-error">That SKU is already assigned to another product. Enter a unique SKU or leave it blank.</p>}{params.error === "access_denied" && <p className="form-feedback form-feedback-error">Your owner permission was not accepted by the database. Sign out, sign back in and retry.</p>}{params.error && !["duplicate_slug", "duplicate_sku", "access_denied"].includes(params.error) && <p className="form-feedback form-feedback-error">The product could not be saved. Check required fields and try again.</p>}{!categories?.length ? <div className="admin-empty">Create an active category before adding products.</div> : <ProductEditorForm categories={categories}/>}</section>;
}
