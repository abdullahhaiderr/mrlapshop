import { requireStoreOwner } from "@/lib/supabase/owner";
import { saveStoreSettingsAction } from "@/app/admin/(dashboard)/actions";

export const metadata = { title: "Store settings | Mr LapShop" };

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  const { data: settings, error } = await supabase.from("store_settings")
    .select("checkout_enabled, pickup_enabled, delivery_enabled, delivery_fee_pkr, jazzcash_enabled, easypaisa_enabled, ubl_bank_enabled")
    .eq("singleton", true)
    .maybeSingle();

  return <section className="admin-content">
    <div className="admin-page-heading">
      <div><span className="eyebrow">STORE CONTROL</span><h1>Store <em>settings.</em></h1><p>Control checkout availability, fulfilment options and the payment methods customers can choose.</p></div>
    </div>
    {params.saved && <p className="form-feedback form-feedback-success" role="status">Store settings saved successfully.</p>}
    {params.error && <p className="form-feedback form-feedback-error" role="alert">{params.error === "delivery_fee" ? "Enter a delivery fee below PKR 1,000,000." : "Settings could not be saved. Check your entries and try again."}</p>}
    {error || !settings ? <div className="admin-panel admin-empty">Store settings could not be loaded. Check the database connection and owner permissions.</div> : <form action={saveStoreSettingsAction} className="admin-settings-form">
      <section className="admin-panel">
        <div className="admin-panel-head"><div><h2>Checkout availability</h2><p>Turn order requests on or pause checkout without changing the storefront.</p></div></div>
        <div className="admin-settings-options">
          <label className="admin-settings-toggle"><input type="checkbox" name="checkoutEnabled" defaultChecked={settings.checkout_enabled}/><span><strong>Accept order requests</strong><small>Allow customers to submit orders at checkout.</small></span></label>
          <label className="admin-settings-toggle"><input type="checkbox" name="pickupEnabled" defaultChecked={settings.pickup_enabled}/><span><strong>Shop pickup</strong><small>Allow customers to collect orders from the shop.</small></span></label>
          <label className="admin-settings-toggle"><input type="checkbox" name="deliveryEnabled" defaultChecked={settings.delivery_enabled}/><span><strong>Home delivery</strong><small>Allow customers to request delivery.</small></span></label>
        </div>
        <label className="admin-field admin-settings-fee"><span>Standard delivery fee (PKR)</span><input type="number" name="deliveryFeePkr" min="0" max="1000000" step="1" defaultValue={settings.delivery_fee_pkr ?? ""} placeholder="Leave blank when quoted individually"/><small>When blank, the customer sees that the delivery fee will be quoted by the shop.</small></label>
      </section>
      <section className="admin-panel">
        <div className="admin-panel-head"><div><h2>Payment methods</h2><p>Only enabled options appear at checkout. Payments are still confirmed manually by the shop.</p></div></div>
        <div className="admin-settings-options">
          <label className="admin-settings-toggle"><input type="checkbox" name="jazzcashEnabled" defaultChecked={settings.jazzcash_enabled}/><span><strong>JazzCash</strong><small>Mobile wallet payment instructions by WhatsApp.</small></span></label>
          <label className="admin-settings-toggle"><input type="checkbox" name="easypaisaEnabled" defaultChecked={settings.easypaisa_enabled}/><span><strong>Easypaisa</strong><small>Mobile wallet payment instructions by WhatsApp.</small></span></label>
          <label className="admin-settings-toggle"><input type="checkbox" name="ublBankEnabled" defaultChecked={settings.ubl_bank_enabled}/><span><strong>UBL Bank transfer</strong><small>Bank transfer instructions shared by the shop.</small></span></label>
        </div>
      </section>
      <div className="admin-settings-submit"><button className="button button-primary" type="submit">Save store settings</button><p>Changes apply to the checkout page immediately after saving.</p></div>
    </form>}
  </section>;
}
