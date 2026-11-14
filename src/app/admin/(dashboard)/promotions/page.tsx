import { requireStoreOwner } from "@/lib/supabase/owner";
import { createPromoCodeAction, setPromoCodeStatusAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Promotions | Mr LapShop" };

function formatPKR(value: number) {
  return "Rs. " + Number(value).toLocaleString("en-PK");
}

export default async function AdminPromotionsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; saved?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  const { data: codes, error } = await supabase.from("promo_codes")
    .select("id, code, description, discount_type, discount_value, minimum_order_pkr, maximum_discount_pkr, usage_limit, usage_count, per_customer_limit, starts_at, expires_at, is_active, created_at")
    .order("created_at", { ascending: false }).limit(100);

  const messages: Record<string, string> = {
    validation: "Complete the required promotion fields with valid values.",
    percentage: "Percentage discounts must be between 1% and 100%.",
    max_discount: "A maximum discount cap is only used with percentage codes.",
    code: "Use 4–32 uppercase letters, numbers, hyphens or underscores for a custom code.",
    dates: "Check the start and expiry dates. The expiry must be after the start.",
    duplicate: "That promo code already exists. Generate a new code or choose another one.",
    save: "The promo code could not be saved. Please try again.",
    invalid_id: "That promo code could not be found.",
  };

  return <section className="admin-content">
    <div className="admin-page-heading">
      <div><span className="eyebrow">CUSTOMER OFFERS</span><h1>Promo <em>codes.</em></h1><p>Create real checkout discounts, set usage limits and pause codes whenever you need.</p></div>
    </div>
    {params.created && <p className="form-feedback form-feedback-success" role="status">Promo code {params.created} has been created and is ready to use at checkout.</p>}
    {params.saved && <p className="form-feedback form-feedback-success" role="status">Promotion status updated.</p>}
    {params.error && <p className="form-feedback form-feedback-error" role="alert">{messages[params.error] ?? "Something went wrong while managing promo codes."}</p>}

    <section className="admin-panel admin-promo-create">
      <div className="admin-panel-head"><div><h2>Create a promotion</h2><p>Leave the code blank to generate a unique Mr LapShop code automatically.</p></div></div>
      <form action={createPromoCodeAction} className="admin-promo-form">
        <label className="admin-field"><span>Promo code</span><input name="code" maxLength={32} placeholder="Leave blank to auto-generate (e.g. MLS-A1B2C3D4)"/><small>Custom codes are converted to uppercase.</small></label>
        <label className="admin-field"><span>Internal description</span><input name="description" maxLength={240} placeholder="e.g. November launch offer"/></label>
        <div className="admin-promo-grid">
          <label className="admin-field"><span>Discount type *</span><select name="discountType" defaultValue="percentage"><option value="percentage">Percentage (%)</option><option value="fixed">Fixed amount (PKR)</option></select></label>
          <label className="admin-field"><span>Discount value *</span><input name="discountValue" type="number" min="1" max="100000000" required defaultValue="10"/></label>
          <label className="admin-field"><span>Minimum order (PKR)</span><input name="minimumOrderPkr" type="number" min="0" defaultValue="0"/></label>
          <label className="admin-field"><span>Maximum discount (PKR)</span><input name="maximumDiscountPkr" type="number" min="1" placeholder="Optional; percentage only"/></label>
          <label className="admin-field"><span>Total uses allowed</span><input name="usageLimit" type="number" min="1" placeholder="Unlimited"/></label>
          <label className="admin-field"><span>Uses per customer</span><input name="perCustomerLimit" type="number" min="1" max="1000" defaultValue="1"/></label>
          <label className="admin-field"><span>Starts at</span><input name="startsAt" type="datetime-local"/></label>
          <label className="admin-field"><span>Expires at</span><input name="expiresAt" type="datetime-local"/></label>
        </div>
        <label className="admin-settings-toggle"><input type="checkbox" name="isActive" defaultChecked/><span><strong>Activate immediately</strong><small>Customers can apply the code once it is created and within its date limits.</small></span></label>
        <button className="button button-primary" type="submit">Generate &amp; save promo code</button>
      </form>
    </section>

    <section className="admin-panel">
      <div className="admin-panel-head"><div><h2>Promotion library ({codes?.length ?? 0})</h2><p>Discounts are validated and redeemed on the server during checkout.</p></div></div>
      {error ? <div className="admin-empty">Promo codes could not be loaded. Confirm the promotion database migration is applied.</div> : !codes?.length ? <div className="admin-empty">No promo codes yet. Create your first customer offer above.</div> : <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Usage</th><th>Validity</th><th>Status</th><th/></tr></thead>
        <tbody>{codes.map((promo) => <tr key={promo.id}>
          <td><strong>{promo.code}</strong><small>{promo.description || "No description"}</small></td>
          <td>{promo.discount_type === "percentage" ? promo.discount_value + "%" : formatPKR(promo.discount_value)}{promo.maximum_discount_pkr ? <small>Up to {formatPKR(promo.maximum_discount_pkr)}</small> : null}</td>
          <td>{formatPKR(promo.minimum_order_pkr)}</td>
          <td>{promo.usage_count}{promo.usage_limit ? " / " + promo.usage_limit : " / Unlimited"}<small>{promo.per_customer_limit} per customer</small></td>
          <td>{promo.starts_at ? new Date(promo.starts_at).toLocaleDateString("en-PK") : "Now"}<small>{promo.expires_at ? "Until " + new Date(promo.expires_at).toLocaleDateString("en-PK") : "No expiry"}</small></td>
          <td><span className={"admin-pill " + (promo.is_active ? "admin-pill-active" : "admin-pill-archived")}>{promo.is_active ? "Active" : "Paused"}</span></td>
          <td><form action={setPromoCodeStatusAction}><input type="hidden" name="id" value={promo.id}/><input type="hidden" name="isActive" value={promo.is_active ? "false" : "true"}/><button className="admin-danger-link" type="submit">{promo.is_active ? "Pause" : "Activate"}</button></form></td>
        </tr>)}</tbody>
      </table></div>}
    </section>
  </section>;
}
