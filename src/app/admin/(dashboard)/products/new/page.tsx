import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { ProductEditorForm } from "@/components/admin/product-editor-form";

export const metadata = { title: "Add product | Mr LapShop owner" };

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  const { data: categories } = await supabase.from("categories").select("id, name, category_group").order("sort_order");
  return <section className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">INVENTORY</span><h1>Add a <em>product.</em></h1><p>Create a draft first if exact specifications, price or warranty are not ready.</p></div><Link href="/admin/products">← Products</Link></div>{params.error && <p className="form-feedback form-feedback-error">The product could not be saved. Check required fields and make sure the URL slug is unique.</p>}{!categories?.length ? <div className="admin-empty">Create an active category before adding products.</div> : <ProductEditorForm categories={categories}/>}</section>;
}
