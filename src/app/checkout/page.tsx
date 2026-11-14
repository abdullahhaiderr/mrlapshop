import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CheckoutForm, type CheckoutSettings } from "@/components/cart/checkout-form";

export const metadata = { title: "Checkout | Mr LapShop", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  let settings: CheckoutSettings | null = null;
  let customerEmail = "";
  let savedAddresses: Array<{ id: string; label: string; recipient_name: string; phone: string; city: string; address_line: string; postal_code: string | null; is_default: boolean }> = [];
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      const [{ data: publicSettings }, { data: { user } }] = await Promise.all([
        supabase.rpc("get_public_checkout_settings"),
        supabase.auth.getUser(),
      ]);
      settings = publicSettings as unknown as CheckoutSettings | null;
      if (user) {
        customerEmail = user.email ?? "";
        const { data } = await supabase.from("customer_addresses").select("id, label, recipient_name, phone, city, address_line, postal_code, is_default").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
        savedAddresses = data ?? [];
      }
    } catch {
      settings = null;
      savedAddresses = [];
    }
  }

  return <main className="commerce-page"><section className="commerce-page-hero"><div className="container"><span className="eyebrow eyebrow-on-dark">SECURE ORDER PROCESS</span><h1>Send an order <em>request.</em></h1><p>Choose your preferred payment method and share your contact and delivery details. The shop will call you to confirm everything before the order is accepted.</p></div></section><section className="container checkout-content-v15"><div className="checkout-intro-v15"><div><span className="eyebrow">MR LAPSHOP CHECKOUT</span><h2>Request your <em>laptop.</em></h2><p>Submit your details once. Mr LapShop will contact you by phone or WhatsApp to confirm product availability, the final amount and payment instructions.</p></div><Link href="/cart">← Back to cart</Link></div><CheckoutForm settings={settings} savedAddresses={savedAddresses} customerEmail={customerEmail} /></section></main>;
}
