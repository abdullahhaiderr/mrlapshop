import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Order tracking | Mr LapShop", robots: { index: false, follow: false } };

type OrderView = {
  order_number: string;
  status: string;
  payment_status: string;
  total_pkr: number;
  subtotal_pkr?: number;
  delivery_fee_pkr?: number;
  created_at: string;
  fulfillment?: "delivery" | "pickup";
  payment_method?: string;
  delivery_fee_pending?: boolean;
  payment_required_before_confirmation?: boolean;
  items?: Array<{ title_snapshot?: string; title?: string; quantity: number; unit_price_pkr: number; line_total_pkr: number }>;
};

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  if (!isSupabaseConfigured()) redirect("/checkout");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let order: OrderView | null = null;

  if (user) {
    const { data } = await supabase.from("orders").select("order_number, status, payment_status, payment_method, fulfillment, total_pkr, subtotal_pkr, delivery_fee_pkr, delivery_fee_pending, payment_required_before_confirmation, created_at, items:order_items(title_snapshot, quantity, unit_price_pkr, line_total_pkr)").eq("order_number", orderNumber).eq("user_id", user.id).maybeSingle();
    order = data as unknown as OrderView | null;
  }

  // Preserve guest tracking if this browser signs in after placing a guest order.
  if (!order) {
    const cookieStore = await cookies();
    const token = cookieStore.get(`mls-guest-${orderNumber}`)?.value;
    if (token) {
      const { data } = await supabase.rpc("track_guest_order", { p_order_number: orderNumber, p_tracking_token: token });
      order = data as unknown as OrderView | null;
    }
  }

  const progressSteps = ["new", "confirmed", "packed", order?.fulfillment === "pickup" ? "ready_for_pickup" : "dispatched", "delivered"];
  const terminalStatuses = ["cancelled", "return_requested", "returned", "refunded"];
  const currentProgressIndex = order ? progressSteps.indexOf(order.status) : -1;
  const isTerminalStatus = order ? terminalStatuses.includes(order.status) : false;

  return (
    <main className="account-page account-page-wide">
      <section className="account-card order-confirmation-card-v15">
        <span className="order-success-icon-v15"><CheckCircle2 size={30}/></span>
        <span className="eyebrow">ORDER CONFIRMATION</span>
        {order ? <><h1>Your request is <em>received.</em></h1><p>This is a pending order request, not a confirmed purchase. The Mr LapShop team will call you or contact you on WhatsApp to confirm availability, delivery details and the final amount.</p><div className="order-reference-v15"><span>ORDER REFERENCE</span><strong>{order.order_number}</strong><span className="account-status">{order.status.replaceAll("_", " ")}</span></div><section className="order-progress-v17" aria-label="Order progress"><div className="order-progress-heading-v17"><span className="eyebrow">ORDER PROGRESS</span><strong>{order.fulfillment === "pickup" ? "Shop pickup" : "Home delivery"}</strong></div>{progressSteps.map((step, index) => { const complete = currentProgressIndex >= index && !isTerminalStatus; return <div className={`order-progress-step-v17${complete ? " is-complete" : ""}${order.status === step ? " is-current" : ""}`} key={step}><span>{complete ? "✓" : index + 1}</span><strong>{step.replaceAll("_", " ")}</strong></div>; })}{isTerminalStatus && <p className="order-terminal-status-v17">Current status: {order.status.replaceAll("_", " ")}. Please contact the shop for assistance with this order.</p>}</section><div className="order-summary-confirm-v15 order-summary-confirm-v20"><div><span>Payment status</span><strong>{order.payment_status}</strong></div><div><span>Preferred payment</span><strong>{({ jazzcash: "JazzCash", easypaisa: "Easypaisa", ubl_bank: "UBL Bank" } as Record<string,string>)[order.payment_method ?? ""] ?? (order.payment_method ?? "To be confirmed").replaceAll("_", " ")}</strong></div><div><span>Product subtotal</span><strong>Rs. {Number(order.subtotal_pkr ?? order.total_pkr).toLocaleString("en-PK")}</strong></div><div><span>Delivery fee</span><strong className={order.fulfillment === "delivery" && (order.delivery_fee_pending ?? Number(order.delivery_fee_pkr ?? 0) === 0) ? "order-fee-pending-v20" : ""}>{order.fulfillment === "pickup" ? "Not applicable" : (order.delivery_fee_pending ?? Number(order.delivery_fee_pkr ?? 0) === 0) ? "To be confirmed" : `Rs. ${Number(order.delivery_fee_pkr).toLocaleString("en-PK")}`}</strong></div><div><span>{order.fulfillment === "delivery" && (order.delivery_fee_pending ?? false) ? "Amount before delivery fee" : "Final order total"}</span><strong>Rs. {Number(order.total_pkr).toLocaleString("en-PK")}</strong></div><div><span>Placed on</span><strong>{new Date(order.created_at).toLocaleString("en-PK")}</strong></div></div>{order.items?.length ? <div className="account-order-items-v15"><h2>Items</h2>{order.items.map((item, index) => <div key={`${item.title_snapshot ?? item.title}-${index}`}><span>{item.title_snapshot ?? item.title} × {item.quantity}</span><strong>Rs. {Number(item.line_total_pkr).toLocaleString("en-PK")}</strong></div>)}</div> : null}<div className="order-request-next-steps-v20"><strong>What happens next?</strong><br/>The shop will contact you to confirm the exact laptop, stock, delivery fee (if applicable) and final amount. Payment instructions will be shared separately through WhatsApp. <strong>100% payment must be received and verified before the order is confirmed or processed.</strong> Do not send money until the shop has contacted you. {order.fulfillment === "pickup" ? "You can also collect from the Mr LapShop store after confirmation." : "Delivery charges, if any, will be confirmed before payment."}</div><p className="account-footnote">For a guest order, this request reference is available on this browser using a secure, HTTP-only tracking cookie. Save the reference and contact the store if you need help.</p></> : <><h1>Order details <em>unavailable.</em></h1><p>For privacy, order details are shown only to the signed-in customer or the guest browser that placed the order. If you have an account, sign in to view your order history.</p><Link href={`/account/login?next=${encodeURIComponent(`/order/${orderNumber}`)}`} className="button button-primary">Sign in to view order</Link></>}
        <div className="order-next-actions-v15"><Link className="button button-primary" href="/shop"><Package size={17}/> Continue shopping</Link><Link href="/contact" className="account-back-link">Need help with your order? <ArrowRight size={14}/></Link></div>
      </section>
    </main>
  );
}
