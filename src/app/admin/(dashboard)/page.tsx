import Image from "next/image";
import Link from "next/link";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { getYouTubeVideoId } from "@/lib/youtube";

export const metadata = { title: "Owner dashboard | Mr LapShop" };

function formatPKR(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-PK")}`;
}

export default async function AdminPage() {
  const { supabase } = await requireStoreOwner();
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    productsCount,
    categoryCount,
    activeProducts,
    lowStock,
    ordersCount,
    newOrders,
    customers,
    publishedTestimonials,
    pendingTestimonials,
    recentOrders,
    recentProducts,
    paidOrdersThirtyDays,
    paidOrdersSixMonths,
    latestTestimonials,
    activeCategoryProducts,
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active").lte("stock", 3),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("customer_testimonials").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("customer_testimonials").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("orders").select("id, order_number, customer_name, status, payment_status, total_pkr, created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("products").select("id, title, brand, price_pkr, stock, status").order("created_at", { ascending: false }).limit(6),
    supabase.from("orders").select("total_pkr").eq("payment_status", "paid").gte("created_at", thirtyDaysAgo.toISOString()).limit(1000),
    supabase.from("orders").select("total_pkr, created_at").eq("payment_status", "paid").gte("created_at", sixMonthsAgo.toISOString()).limit(1000),
    supabase.from("customer_testimonials").select("id, display_name, headline, youtube_url, status, created_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("products").select("category_id, categories(name)").eq("status", "active").limit(1000),
  ]);

  const revenueThirtyDays = (paidOrdersThirtyDays.data ?? []).reduce((sum, order) => sum + Number(order.total_pkr || 0), 0);
  const monthBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + index, 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString("en-PK", { month: "short" }),
      total: 0,
    };
  });
  for (const order of paidOrdersSixMonths.data ?? []) {
    const date = new Date(order.created_at);
    const bucket = monthBuckets.find((item) => item.key === `${date.getFullYear()}-${date.getMonth()}`);
    if (bucket) bucket.total += Number(order.total_pkr || 0);
  }
  const maxMonthlyRevenue = Math.max(1, ...monthBuckets.map((item) => item.total));
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

  const stats = [
    { label: "Paid revenue · 30 days", value: formatPKR(revenueThirtyDays), note: "Verified paid orders only" },
    { label: "Total orders", value: ordersCount.count ?? "—", note: `${newOrders.count ?? 0} awaiting review` },
    { label: "Live products", value: activeProducts.count ?? "—", note: `${productsCount.count ?? 0} products in catalogue` },
    { label: "Low-stock alerts", value: lowStock.count ?? "—", note: "Published products with 3 or fewer units" },
  ];

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div>
          <span className="eyebrow">STORE OVERVIEW</span>
          <h1>Good morning, <em>Store Owner.</em></h1>
          <p>Your store at a glance. Keep inventory accurate, fulfil customer requests and publish new arrivals.</p>
        </div>
        <Link className="button button-primary" href="/admin/products/new">+ Add product</Link>
      </div>

      <div className="admin-stats-grid admin-stats-grid-v16">
        {stats.map((stat) => (
          <article key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </article>
        ))}
      </div>

      <div className="admin-dashboard-columns">
        <div className="admin-dashboard-main">
          <section className="admin-panel admin-sales-card">
            <div className="admin-panel-head">
              <div><h2>Sales trend</h2><p>Monthly revenue from orders marked as fully paid</p></div>
              <span className="admin-chart-period">Last 6 months</span>
            </div>
            <div className="admin-sales-chart" role="img" aria-label="Monthly paid revenue chart">
              {monthBuckets.map((month) => (
                <div className="admin-sales-month" key={month.key}>
                  <div className="admin-sales-bar-track">
                    <span className="admin-sales-bar" style={{ height: `${month.total > 0 ? Math.max(8, month.total / maxMonthlyRevenue * 100) : 3}%` }} />
                  </div>
                  <span>{month.label}</span>
                </div>
              ))}
            </div>
            <div className="admin-chart-footnote"><span>Paid sales are counted after payment is verified.</span><strong>{formatPKR(monthBuckets.reduce((sum, item) => sum + item.total, 0))}</strong></div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div><h2>Product catalogue</h2><p>Latest products and their current publishing status</p></div>
              <Link href="/admin/products">Manage catalogue →</Link>
            </div>
            {!recentProducts.data?.length ? (
              <div className="admin-empty">
                Your catalogue is ready for inventory. Add a product, upload its photos and publish it when its price, condition and stock are confirmed.
                <div className="admin-empty-action"><Link className="button button-primary" href="/admin/products/new">Create first product</Link></div>
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table admin-products-preview-table">
                  <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {recentProducts.data.map((product) => (
                      <tr key={product.id}>
                        <td><strong>{product.title}</strong><small>{product.brand}</small></td>
                        <td>{product.price_pkr ? formatPKR(Number(product.price_pkr)) : "Not set"}</td>
                        <td>{product.stock}</td>
                        <td><span className={`admin-pill admin-pill-${product.status}`}>{product.status}</span></td>
                        <td><Link href={`/admin/products/${product.id}`}>Edit</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head">
              <div><h2>Recent orders</h2><p>Latest customer order requests</p></div>
              <Link href="/admin/orders">View all orders →</Link>
            </div>
            {!recentOrders.data?.length ? (
              <div className="admin-empty">No orders yet. New requests will appear here when customers check out.</div>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Payment</th><th>Total</th><th /></tr></thead>
                  <tbody>
                    {recentOrders.data.map((order) => (
                      <tr key={order.id}>
                        <td>{order.order_number}</td>
                        <td>{order.customer_name}</td>
                        <td><span className="admin-pill">{order.status.replaceAll("_", " ")}</span></td>
                        <td>{order.payment_status.replaceAll("_", " ")}</td>
                        <td>{formatPKR(Number(order.total_pkr))}</td>
                        <td><Link href={`/admin/orders/${order.order_number}`}>Open</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="admin-dashboard-side">
          <section className="admin-panel admin-quick-panel">
            <div className="admin-panel-head"><div><h2>Quick actions</h2><p>Common store tasks</p></div></div>
            <Link href="/admin/products/new">Add a new product <span>→</span></Link>
            <Link href="/admin/orders">Review new orders <span>→</span></Link>
            <Link href="/admin/testimonials">Add a testimonial <span>→</span></Link>
            <Link href="/admin/categories">Manage categories <span>→</span></Link>
            <Link href="/admin/customers">View customers <span>→</span></Link>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head"><div><h2>Store activity</h2><p>Customer engagement at a glance</p></div></div>
            <div className="admin-side-stat"><span>Customer accounts</span><strong>{customers.count ?? "—"}</strong></div>
            <div className="admin-side-stat"><span>Published testimonials</span><strong>{publishedTestimonials.count ?? "—"}</strong></div>
            <div className="admin-side-stat"><span>Pending testimonials</span><strong>{pendingTestimonials.count ?? "—"}</strong></div>
            <div className="admin-side-stat"><span>Categories</span><strong>{categoryCount.count ?? "—"}</strong></div>
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head"><div><h2>Top categories</h2><p>Published catalogue distribution</p></div><Link href="/admin/categories">Manage →</Link></div>
            {!topCategories.length ? <div className="admin-empty">Your category structure is ready. Published products will appear here as soon as you add inventory.</div> : (
              <div className="admin-category-bars">
                {topCategories.map((category) => (
                  <div className="admin-category-bar-row" key={category.name}>
                    <div><strong>{category.name}</strong><span>{category.count} product{category.count === 1 ? "" : "s"}</span></div>
                    <div className="admin-category-bar-track"><span style={{ width: `${category.count / maxCategoryCount * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="admin-panel">
            <div className="admin-panel-head"><div><h2>Video testimonials</h2><p>Latest customer stories</p></div><Link href="/admin/testimonials">Manage →</Link></div>
            {!latestTestimonials.data?.length ? <div className="admin-empty">Customer stories will appear here after they are added.</div> : (
              <div className="admin-recent-testimonials">
                {latestTestimonials.data.map((item) => {
                  const videoId = item.youtube_url ? getYouTubeVideoId(item.youtube_url) : null;
                  return (
                    <article key={item.id}>
                      {videoId ? (
                        <a className="admin-recent-video" href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer" aria-label={`Watch ${item.headline}`}>
                          <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt={`Video thumbnail for ${item.headline}`} fill sizes="(max-width: 1020px) 40vw, 300px" />
                          <span aria-hidden="true">▶</span>
                        </a>
                      ) : <div className="admin-recent-video admin-recent-video-empty">Written review</div>}
                      <div><strong>{item.display_name}</strong><span>{item.status}</span></div>
                      <p>{item.headline}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>

      <p className="admin-v16-note">Only active products appear in the public catalogue. Published testimonials appear publicly only after customer consent is confirmed.</p>
    </section>
  );
}
