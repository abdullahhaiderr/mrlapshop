"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type CheckoutState = { error?: string; orderNumber?: string };

const checkoutSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.email().trim().max(254),
  fulfillment: z.enum(["delivery", "pickup"]),
  paymentMethod: z.enum(["jazzcash", "easypaisa", "ubl_bank"]),
  city: z.string().trim().max(100).optional(),
  addressLine: z.string().trim().max(500).optional(),
  postalCode: z.string().trim().max(20).optional(),
  customerNotes: z.string().trim().max(1000).optional(),
  idempotencyKey: z.uuid(),
  items: z.array(z.object({ productId: z.uuid(), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
});


async function notifyShopOfOrderRequest(payload: {
  orderNumber: string; customerName: string; phone: string; email: string; fulfillment: string;
  city?: string; addressLine?: string; postalCode?: string; paymentMethod: string; notes?: string;
  subtotalPkr: number; deliveryFeePkr: number; deliveryFeePending: boolean; totalPkr: number;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const to = process.env.ORDER_NOTIFICATION_EMAIL?.trim() || "mrlapshop@gmail.com";
  if (!apiKey || !from) return "not_configured" as const;

  const paymentLabels: Record<string, string> = { jazzcash: "JazzCash", easypaisa: "Easypaisa", ubl_bank: "UBL Bank" };
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "");
  const adminLink = siteUrl ? `${siteUrl}/admin/orders` : "Owner dashboard: /admin/orders";
  const text = [
    "A new Mr LapShop order request has been submitted.",
    "",
    `Order reference: ${payload.orderNumber}`,
    `Customer: ${payload.customerName}`,
    `Phone / WhatsApp: ${payload.phone}`,
    `Email: ${payload.email}`,
    `Fulfilment: ${payload.fulfillment === "pickup" ? "Shop pickup" : "Home delivery"}`,
    `Delivery address: ${payload.fulfillment === "pickup" ? "Shop pickup" : [payload.addressLine, payload.city, payload.postalCode].filter(Boolean).join(", ")}`,
    `Preferred payment: ${paymentLabels[payload.paymentMethod] ?? payload.paymentMethod}`,
    `Product subtotal: PKR ${payload.subtotalPkr.toLocaleString("en-PK")}`,
    `Delivery fee: ${payload.deliveryFeePending ? "Pending shop quote" : `PKR ${payload.deliveryFeePkr.toLocaleString("en-PK")}`}`,
    `Current amount before any pending delivery fee: PKR ${payload.totalPkr.toLocaleString("en-PK")}`,
    `Customer notes: ${payload.notes || "None"}`,
    "",
    "Important: this is a pending request, not a confirmed order. Contact the customer, confirm availability and the final amount, then verify 100% payment before confirming or processing the order.",
    adminLink,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `mrlapshop-order-notification-${payload.orderNumber}`,
      },
      body: JSON.stringify({ from, to: [to], subject: `New order request ${payload.orderNumber} | Mr LapShop`, text }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[order-email] Resend rejected notification (${response.status}).`);
      return "failed" as const;
    }
    return "sent" as const;
  } catch {
    console.error("[order-email] Notification request failed.");
    return "failed" as const;
  }
}

export async function placeOrderAction(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  if (!isSupabaseConfigured()) return { error: "Checkout is not connected yet. The development Supabase project must be configured first." };

  let parsedItems: unknown;
  try {
    parsedItems = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Your cart could not be read. Return to the cart and try again." };
  }

  const parsed = checkoutSchema.safeParse({
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    fulfillment: formData.get("fulfillment"),
    paymentMethod: formData.get("paymentMethod"),
    city: formData.get("city") || undefined,
    addressLine: formData.get("addressLine") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    customerNotes: formData.get("customerNotes") || undefined,
    idempotencyKey: formData.get("idempotencyKey"),
    items: parsedItems,
  });

  if (!parsed.success) return { error: "Please check your contact details, delivery information and cart." };
  if (parsed.data.fulfillment === "delivery" && (!parsed.data.city || !parsed.data.addressLine)) {
    return { error: "Enter your delivery city and complete address." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: parsed.data.customerName,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email,
    p_fulfillment: parsed.data.fulfillment,
    p_payment_method: parsed.data.paymentMethod,
    p_city: parsed.data.city ?? "",
    p_address_line: parsed.data.addressLine ?? "",
    p_postal_code: parsed.data.postalCode ?? "",
    p_customer_notes: parsed.data.customerNotes ?? "",
    p_items: parsed.data.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    p_promo_code: String(formData.get("promoCode") ?? "").trim().toUpperCase() || null,
    p_idempotency_key: parsed.data.idempotencyKey,
  });

  if (error || !data) {
    const message = error?.message ?? "Order could not be submitted.";
    return { error: message.includes("not enabled") || message.includes("not configured")
      ? "Online checkout is not active yet. The store owner still needs to approve payment and delivery settings."
      : message.toLowerCase().includes("promo")
        ? "That promo code is no longer valid for this order. Check the code and try again."
        : message.includes("price") || message.includes("stock") || message.includes("available")
          ? "One or more products do not have confirmed live pricing or stock yet. Please contact the shop before ordering."
          : "We could not submit your order. Please review your details or contact the shop." };
  }

  const result = data as { order_number?: string; guest_tracking_token?: string | null; subtotal_pkr?: number; discount_pkr?: number; promo_code?: string | null; delivery_fee_pkr?: number; delivery_fee_pending?: boolean; total_pkr?: number };
  if (!result.order_number) return { error: "The order response was incomplete. Please contact the shop before trying again." };

  const emailNotification = await notifyShopOfOrderRequest({
    orderNumber: result.order_number,
    customerName: parsed.data.customerName,
    phone: parsed.data.phone,
    email: parsed.data.email,
    fulfillment: parsed.data.fulfillment,
    city: parsed.data.city,
    addressLine: parsed.data.addressLine,
    postalCode: parsed.data.postalCode,
    paymentMethod: parsed.data.paymentMethod,
    notes: parsed.data.customerNotes,
    subtotalPkr: Number(result.subtotal_pkr ?? 0),
    deliveryFeePkr: Number(result.delivery_fee_pkr ?? 0),
    deliveryFeePending: Boolean(result.delivery_fee_pending),
    totalPkr: Number(result.total_pkr ?? 0),
  });
  if (emailNotification !== "sent") {
    console.error(`[order-email] Notification status: ${emailNotification}. Order ${result.order_number} is still saved in Supabase.`);
  }

  if (result.guest_tracking_token) {
    const cookieStore = await cookies();
    cookieStore.set(`mls-guest-${result.order_number}`, result.guest_tracking_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: `/order/${result.order_number}`,
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return { orderNumber: result.order_number };
}


export type PromoCheckState = {
  valid?: boolean;
  code?: string;
  discountPkr?: number;
  subtotalPkr?: number;
  message?: string;
};

export async function validatePromoCodeAction(_previous: PromoCheckState, formData: FormData): Promise<PromoCheckState> {
  if (!isSupabaseConfigured()) return { valid: false, message: "Promo codes are temporarily unavailable." };
  const code = String(formData.get("promoCode") ?? "").trim().toUpperCase();
  if (!code) return { valid: false, message: "Enter a promo code." };

  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { valid: false, message: "Your cart could not be read. Refresh and try again." };
  }
  const itemSchema = z.array(z.object({
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(20);
  const items = itemSchema.safeParse(rawItems);
  if (!items.success) return { valid: false, message: "Add valid products to your cart first." };

  const quantities = new Map<string, number>();
  for (const item of items.data) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  if ([...quantities.values()].some((quantity) => quantity > 10)) {
    return { valid: false, message: "A cart item exceeds the allowed quantity." };
  }

  const supabase = await createClient();
  const { data: products, error: productsError } = await supabase.from("products")
    .select("id, price_pkr")
    .eq("status", "active")
    .in("id", [...quantities.keys()]);
  if (productsError || !products || products.length !== quantities.size) {
    return { valid: false, message: "One or more products are no longer available. Refresh your cart." };
  }

  const subtotal = products.reduce((sum, product) => {
    const price = Number(product.price_pkr ?? 0);
    return sum + price * (quantities.get(product.id) ?? 0);
  }, 0);
  if (subtotal <= 0) return { valid: false, message: "Your cart has no eligible products." };

  const { data, error } = await supabase.rpc("validate_promo_code", {
    p_code: code,
    p_subtotal: subtotal,
    p_email: String(formData.get("email") ?? "").trim().toLowerCase(),
  });
  if (error) {
    console.error("[checkout-promo] Validation failed.", { code: error.code });
    return { valid: false, message: "We could not check that promo code right now. Please try again." };
  }
  const result = data as { valid?: boolean; message?: string; code?: string; discount_pkr?: number } | null;
  if (!result?.valid) return { valid: false, message: result?.message ?? "This promo code is not available." };
  return {
    valid: true,
    code: result.code ?? code,
    discountPkr: Number(result.discount_pkr ?? 0),
    subtotalPkr: subtotal,
    message: "Promo code applied. The final discount will be verified again when you submit your order.",
  };
}
