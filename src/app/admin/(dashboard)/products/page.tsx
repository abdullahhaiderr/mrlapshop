import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { setProductVisibilityAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Products | Mr LapShop owner" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; error?: string; archived?: string; deleted?: string; storageCleanup?: string; productUpdated?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  let query = supabase.from("products").select("id, title, brand, sku, condition, price_pkr, stock, status, updated_at, categories(name)").order("updated_at", { ascending: false });
  if (params.q?.trim()) query = query.ilike("title", `%${params.q.trim().slice(0, 80)}%`);
  if (["draft", "active", "archived"].includes(params.status ?? "")) query = query.eq("status", params.status as "draft" | "active" | "archived");
  const { data: products, error } = await query.limit(150);
  return (
    <section className="admin-content">
      <div className="admin-page-heading"><div><span className="eyebrow">CATALOGUE CONTROL</span><h1>Product <em>inventory.</em></h1><p>Create and maintain real product records. Drafts stay unpublished until their details are complete.</p></div><Link className="button button-primary" href="/admin/products/new">Add product</Link></div>
      {params.error === "publish_requirements" && <p className="form-feedback form-feedback-error">To publish or republish a product, enter a confirmed price and a warranty decision (including zero months if no warranty applies).</p>}
      {params.error === "not_found" && <p className="form-feedback form-feedback-error">That product could not be found. Refresh the inventory and try again.</p>}
      {params.error === "access_denied" && <p className="form-feedback form-feedback-error">Your owner permission was not accepted for this update. Sign out, sign back in and retry.</p>}
      {params.productUpdated && <p className="form-feedback form-feedback-success" role="status">Product visibility updated successfully.</p>}
      {params.error === "duplicate_slug" && <p className="form-feedback form-feedback-error">That URL slug is already in use. Choose a unique slug.</p>}
      {params.error === "duplicate_sku" && <p className="form-feedback form-feedback-error">That SKU is already assigned to another product. Enter a unique SKU or leave it blank.</p>}
      {params.error === "access_denied" && <p className="form-feedback form-feedback-error">Your owner permission was not accepted. Sign out, sign back in and retry.</p>}
      {params.error && !["publish_requirements", "duplicate_slug", "duplicate_sku", "access_denied", "not_found"].includes(params.error) && <p className="form-feedback form-feedback-error">That change could not be completed. Check the details and try again.</p>}
      {params.archived && <p className="form-feedback form-feedback-success">Product archived. It remains in the database for order-history integrity.</p>}
      {params.deleted && <p className="form-feedback form-feedback-success">Product deleted. Existing order history was preserved.{params.storageCleanup === "pending" ? " Some stored image files need manual cleanup." : ""}</p>}
      <form className="admin-filterbar" action="/admin/products"><input name="q" defaultValue={params.q} placeholder="Search product title" aria-label="Search products"/><select name="status" defaultValue={params.status ?? "all"} aria-label="Filter by status"><option value="all">All statuses</option><option value="draft">Draft</option><option value="active">Published</option><option value="archived">Archived</option></select><button className="button button-dark" type="submit">Filter</button></form>
      <section className="admin-panel"><div className="admin-panel-head"><div><h2>Products ({products?.length ?? 0})</h2><p>Showing up to 150 most recently updated records.</p></div></div>
        {error ? <div className="admin-empty">Could not load products. Verify the Supabase migration and owner database permissions.</div> : !products?.length ? <div className="admin-empty">No products match this filter. Add your first real product when its specifications, price, stock and warranty are confirmed.</div> : <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Product</th><th>Category</th><th>Condition</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead><tbody>{products.map((product) => { const categoryRelation = product.categories as unknown as { name: string } | { name: string }[] | null; const categoryName = Array.isArray(categoryRelation) ? categoryRelation[0]?.name : categoryRelation?.name; return <tr key={product.id}><td><strong>{product.title}</strong><small>{product.brand}{product.sku ? ` · ${product.sku}` : ""}</small></td><td>{categoryName ?? "—"}</td><td>{product.condition.replaceAll("_", " ")}</td><td>{product.price_pkr ? `Rs. ${Number(product.price_pkr).toLocaleString("en-PK")}` : "Not set"}</td><td>{product.stock}</td><td><span className={`admin-pill admin-pill-${product.status}`}>{product.status}</span></td><td><div className="dashboard-row-actions"><Link href={`/admin/products/${product.id}`}>Edit</Link>{product.status === "archived" ? <form action={setProductVisibilityAction}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="status" value="active"/><input type="hidden" name="returnTo" value="products"/><button className="dashboard-publish-action" type="submit">Republish</button></form> : product.status === "draft" ? <form action={setProductVisibilityAction}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="status" value="active"/><input type="hidden" name="returnTo" value="products"/><button className="dashboard-publish-action" type="submit">Publish</button></form> : <form action={setProductVisibilityAction}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="status" value="draft"/><input type="hidden" name="returnTo" value="products"/><button type="submit">Hide</button></form>}</div></td></tr>; })}</tbody></table></div>}
      </section>
    </section>
  );
}
