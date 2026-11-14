import Image from "next/image";
import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { getYouTubeVideoId } from "@/lib/youtube";
import { saveTestimonialAction, setProductVisibilityAction, setTestimonialStatusAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Owner dashboard | Mr LapShop" };

function formatPKR(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-PK")}`;
}

function stockLabel(stock: number, status: string) {
  if (status !== "active") return "Draft";
  if (stock <= 0) return "Out of stock";
  if (stock <= 3) return `${stock} left`;
  return "In stock";
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{
  testimonialAdded?: string; testimonialUpdated?: string; testimonialError?: string;
  productUpdated?: string; productError?: string;
}> }) {
  const notices = await searchParams;
  const { supabase } = await requireStoreOwner();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    productsCount,
    ordersCount,
    newOrders,
    lowStock,
    activeProducts,
    recentProducts,
    paidOrdersThirtyDays,
    paidOrdersSixMonths,
    latestTestimonials,
    activeCategoryProducts,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active").lte("stock", 3),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products")
      .select("id, slug, title, brand, model, cpu_family, cpu_model, ram_gb, ram_type, storage_gb, storage_type, price_pkr, stock, status")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("orders").select("total_pkr").eq("payment_status", "paid").gte("created_at", thirtyDaysAgo.toISOString()).limit(1000),
    supabase.from("orders").select("total_pkr, created_at").eq("payment_status", "paid").gte("created_at", sixMonthsAgo.toISOString()).limit(1000),
    supabase.from("customer_testimonials")
      .select("id, display_name, headline, youtube_url, status, created_at, consent_to_publish")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase.from("products").select("category_id, categories(name)").eq("status", "active").limit(1000),
  ]);

  const revenueThirtyDays = (paidOrdersThirtyDays.data ?? []).reduce((sum, order) => sum + Number(order.total_pkr || 0), 0);
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + index, 1);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString("en-PK", { month: "short" }), total: 0 };
  });
  for (const order of paidOrdersSixMonths.data ?? []) {
    const date = new Date(order.created_at);
    const bucket = monthBuckets.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.total += Number(order.total_pkr || 0);
  }
  const maxMonthlyRevenue = Math.max(1, ...monthBuckets.map((item) => item.total));
  const graphPoints = monthBuckets.map((month, index) => ({
    x: 8 + index * (424 / Math.max(1, monthBuckets.length - 1)),
    y: 100 - (month.total > 0 ? month.total / maxMonthlyRevenue * 78 : 2),
  }));
  const graphLinePath = graphPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const graphAreaPath = `${graphLinePath} L 432 112 L 8 112 Z`;

  const categoryTotals = new Map<string, number>();
  for (const product of activeCategoryProducts.data ?? []) {
    const relation = product.categories as unknown as { name: string } | { name: string }[] | null;
    const name = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    if (name) categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + 1);
  }
  const topCategories = [...categoryTotals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count)
    .slice(0, 4);
  const maxCategoryCount = Math.max(1, ...topCategories.map((item) => item.count));

  return (
    <section className="admin-content admin-dashboard-v2">
      {notices.testimonialAdded && <p className="form-feedback form-feedback-success" role="status">Customer testimonial added. It is pending until permission to publish is confirmed.</p>}
      {notices.testimonialUpdated && <p className="form-feedback form-feedback-success" role="status">Testimonial visibility updated.</p>}
      {notices.testimonialError === "consent_required" && <p className="form-feedback form-feedback-error" role="alert">Customer permission must be confirmed before a testimonial can be shown on your website.</p>}
      {notices.testimonialError && notices.testimonialError !== "consent_required" && <p className="form-feedback form-feedback-error" role="alert">The testimonial could not be updated. Open Testimonials to review the record.</p>}
      {notices.productUpdated && <p className="form-feedback form-feedback-success" role="status">Product visibility updated.</p>}
      {notices.productError === "publish_requirements" && <p className="form-feedback form-feedback-error" role="alert">Complete the product price and warranty decision before publishing.</p>}
      {notices.productError && notices.productError !== "publish_requirements" && <p className="form-feedback form-feedback-error" role="alert">The product visibility could not be changed. Open Products to review the record.</p>}
      <header className="dashboard-heading">
        <div className="dashboard-heading-copy">
          <h1>Good morning, Store Owner</h1>
          <p>Here&apos;s how your Mr LapShop store is doing today.</p>
        </div>
        <div className="dashboard-heading-actions">
          <form action="/admin/products" className="dashboard-search">
            <input name="q" type="search" placeholder="Search products, orders, customers" aria-label="Search products"/>
            <button type="submit" aria-label="Search"><span>⌕</span></button>
          </form>
          <button className="dashboard-import-button" type="button" disabled title="CSV import is not available yet">Import CSV</button>
          <Link className="dashboard-add-button" href="/admin/products/new">+ Add product</Link>
        </div>
      </header>

      <div className="dashboard-stat-grid">
        <article className="dashboard-stat-card">
          <span>Revenue, 30 days</span>
          <strong>{formatPKR(revenueThirtyDays)}</strong>
          <small className="dashboard-stat-positive">{revenueThirtyDays > 0 ? "Paid orders" : "No paid orders yet"}</small>
        </article>
        <article className="dashboard-stat-card">
          <span>Orders</span>
          <strong>{(ordersCount.count ?? 0).toLocaleString("en-PK")}</strong>
          <small className="dashboard-stat-positive">{newOrders.count ?? 0} new orders</small>
        </article>
        <article className="dashboard-stat-card">
          <span>Conversion rate</span>
          <strong>—</strong>
          <small className="dashboard-stat-neutral">Analytics not connected</small>
        </article>
        <article className="dashboard-stat-card dashboard-stat-purple">
          <span>Low stock alerts</span>
          <strong>{lowStock.count ?? 0} laptops</strong>
          <Link href="/admin/products?status=active">Review stock</Link>
        </article>
      </div>

      <div className="dashboard-insights-grid">
        <section className="dashboard-panel dashboard-sales-panel">
          <div className="dashboard-panel-heading">
            <div><h2>Sales trend</h2><p>Revenue from paid orders</p></div>
            <span className="dashboard-panel-period">Last 6 months</span>
          </div>
          <div className="dashboard-chart">
            <svg viewBox="0 0 440 126" role="img" aria-label="Six-month paid revenue trend" preserveAspectRatio="none">
              <path d={graphAreaPath} fill="#dafa86" />
              <path d={graphLinePath} fill="none" stroke="#131820" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="dashboard-chart-months">{monthBuckets.map((month) => <span key={month.key}>{month.label}</span>)}</div>
        </section>

        <section className="dashboard-panel dashboard-categories-panel">
          <div className="dashboard-panel-heading"><div><h2>Top categories</h2><p>Published products</p></div></div>
          {topCategories.length ? (
            <div className="dashboard-category-list">
              {topCategories.map((category, index) => (
                <Link href="/admin/products" className="dashboard-category-row" key={category.name}>
                  <div><span>{category.name}</span><small>{category.count}</small></div>
                  <span className={`dashboard-category-track dashboard-category-tone-${index}`}><i style={{ width: `${category.count / maxCategoryCount * 100}%` }}/></span>
                </Link>
              ))}
            </div>
          ) : <p className="dashboard-empty-inline">Your category breakdown will appear when products are published.</p>}
        </section>
      </div>

      <section className="dashboard-panel dashboard-catalogue-panel">
        <div className="dashboard-panel-heading dashboard-catalogue-heading">
          <div><h2>Laptop catalogue</h2><p>{activeProducts.count ?? 0} published · {productsCount.count ?? 0} total products</p></div>
          <div className="dashboard-catalogue-actions">
            {topCategories.slice(0, 2).map((category) => <Link className="dashboard-filter-chip" href="/admin/products" key={category.name}>{category.name}</Link>)}
            <Link className="dashboard-filter-chip" href="/admin/products">Bulk edit</Link>
            <Link className="dashboard-catalogue-add" href="/admin/products/new">+ Add product</Link>
          </div>
        </div>
        {recentProducts.data?.length ? (
          <div className="dashboard-table-wrap">
            <table className="dashboard-catalogue-table">
              <thead><tr><th>Product</th><th>Processor</th><th>RAM and storage</th><th>Stock</th><th>Price</th><th>Actions</th></tr></thead>
              <tbody>
                {recentProducts.data.map((product) => (
                  <tr key={product.id}>
                    <td><strong>{product.title}</strong><small>{product.brand}{product.model ? ` · ${product.model}` : ""}</small></td>
                    <td>{product.cpu_model || product.cpu_family || "—"}</td>
                    <td>{product.ram_gb ? `${product.ram_gb} GB ${product.ram_type || "RAM"}` : "—"}<small>{product.storage_gb ? `${product.storage_gb} GB ${product.storage_type || "storage"}` : "Storage not set"}</small></td>
                    <td><span className={`dashboard-stock-pill dashboard-stock-${product.status !== "active" ? "draft" : Number(product.stock) <= 3 ? "low" : "ok"}`}>{stockLabel(Number(product.stock), product.status)}</span></td>
                    <td>{product.price_pkr ? formatPKR(Number(product.price_pkr)) : "—"}</td>
                    <td><div className="dashboard-row-actions">
                      <Link href={`/admin/products/${product.id}`}>Edit</Link>
                      {product.status === "active" ? (
                        <form action={setProductVisibilityAction}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="status" value="draft"/><button type="submit">Hide</button></form>
                      ) : product.status === "draft" ? (
                        <form action={setProductVisibilityAction}><input type="hidden" name="id" value={product.id}/><input type="hidden" name="status" value="active"/><button className="dashboard-publish-action" type="submit">Publish</button></form>
                      ) : null}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="dashboard-empty-catalogue">No products yet. Add your first product to start building the catalogue.</div>}
      </section>

      <div className="dashboard-bottom-grid">
        <section className="dashboard-panel dashboard-testimonials-panel">
          <div className="dashboard-panel-heading">
            <div><h2>Video testimonials</h2><p>Customer feedback and video reviews</p></div>
            <Link href="/admin/testimonials">Manage all</Link>
          </div>
          <form action={saveTestimonialAction} className="dashboard-add-testimonial">
            <input name="youtubeUrl" type="url" placeholder="Paste a YouTube link here" aria-label="YouTube video URL" required/>
            <input name="displayName" type="text" placeholder="Customer name" aria-label="Customer name" minLength={2} maxLength={80} required/>
            <input type="hidden" name="headline" value="Customer video testimonial"/>
            <input type="hidden" name="status" value="pending"/>
            <input type="hidden" name="rating" value=""/>
            <input type="hidden" name="returnTo" value="dashboard"/>
            <button type="submit">Add to feed</button>
          </form>
          <p className="dashboard-consent-note">New testimonials stay pending until customer permission is confirmed.</p>
          {latestTestimonials.data?.length ? (
            <div className="dashboard-video-row">
              {latestTestimonials.data.map((item) => {
                const videoId = item.youtube_url ? getYouTubeVideoId(item.youtube_url) : null;
                return (
                  <article className="dashboard-video-card" key={item.id}>
                    {videoId ? (
                      <a className="dashboard-video-thumb" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${item.headline}`}>
                        <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={`Video thumbnail for ${item.headline}`} fill sizes="(max-width: 900px) 30vw, 220px"/>
                        <span>▶</span>
                      </a>
                    ) : <div className="dashboard-video-thumb dashboard-video-text">Written review</div>}
                    <strong>{item.display_name}</strong>
                    <small>{item.headline}</small>
                    <span className={`dashboard-testimonial-status dashboard-testimonial-${item.status}`}>{item.status === "published" ? "On feed" : "Hidden"}</span>
                    <div className="dashboard-testimonial-actions">
                      <form action={setTestimonialStatusAction}>
                        <input type="hidden" name="id" value={item.id}/>
                        <input type="hidden" name="status" value={item.status === "published" ? "rejected" : "published"}/>
                        <button type="submit" disabled={item.status !== "published" && !item.consent_to_publish}>{item.status === "published" ? "Remove" : "Show"}</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <div className="dashboard-empty-testimonials">Customer video testimonials will appear here after you add them.</div>}
        </section>

        <aside className="dashboard-panel dashboard-quick-panel">
          <div className="dashboard-panel-heading"><div><h2>Quick actions</h2><p>Common store tasks</p></div></div>
          <button className="dashboard-quick-primary" type="button" disabled>Create discount code</button>
          <button type="button" disabled>Add homepage banner</button>
          <Link href="/admin/products?status=active">Update stock levels</Link>
          <Link href="/admin/orders">Print invoices</Link>
          <Link href="/admin/testimonials?tab=reviews">Reply to reviews</Link>
          <button type="button" disabled>Edit spec comparison</button>
        </aside>
      </div>
    </section>
  );
}
