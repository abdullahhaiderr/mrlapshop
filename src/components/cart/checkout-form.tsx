"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, PackageCheck, PhoneCall, ShieldCheck } from "lucide-react";
import { placeOrderAction, validatePromoCodeAction, type CheckoutState } from "@/app/checkout/actions";
import { useStorefront } from "@/components/providers/storefront-provider";
import type { StoredCartItem } from "@/lib/local-commerce";

const initialState: CheckoutState = {};
export type CheckoutSettings = {
  checkout_enabled: boolean;
  pickup_enabled: boolean;
  delivery_enabled: boolean;
  delivery_fee_pkr: number | null;
  cash_on_delivery_enabled: boolean;
  bank_transfer_enabled: boolean;
  cash_at_pickup_enabled: boolean;
  jazzcash_enabled: boolean;
  easypaisa_enabled: boolean;
  ubl_bank_enabled: boolean;
};

type SavedAddress = { id: string; label: string; recipient_name: string; phone: string; city: string; address_line: string; postal_code: string | null; is_default: boolean };
type Props = { settings: CheckoutSettings | null; savedAddresses?: SavedAddress[]; customerEmail?: string };

const paymentChoices = [
  { value: "jazzcash", label: "JazzCash", sub: "Mobile wallet · instructions by WhatsApp" },
  { value: "easypaisa", label: "Easypaisa", sub: "Mobile wallet · instructions by WhatsApp" },
  { value: "ubl_bank", label: "UBL Bank", sub: "Bank transfer · details shared by the shop" },
] as const;

function PaymentWordmark({ value }: { value: string }) {
  if (value === "jazzcash") return <span className="payment-logo-frame payment-logo-jazzcash"><Image src="https://upload.wikimedia.org/wikipedia/commons/4/41/JazzCash_logo_%282025%29.png" alt="JazzCash" width={56} height={40} unoptimized /></span>;
  if (value === "easypaisa") return <span className="payment-logo-frame payment-logo-easypaisa"><Image src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Easypaisa_Digital_Bank_logo.png" alt="Easypaisa" width={108} height={40} unoptimized /></span>;
  return <span className="payment-logo-frame payment-logo-ubl"><Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/United_Bank_Limited_logo.svg/320px-United_Bank_Limited_logo.svg.png" alt="United Bank Limited (UBL)" width={55} height={40} unoptimized /></span>;
}

export function CheckoutForm({ settings, savedAddresses = [], customerEmail = "" }: Props) {
  const router = useRouter();
  const { cartItems, clearCart } = useStorefront();
  const [state, formAction, pending] = useActionState(placeOrderAction, initialState);
  const [promoState, promoFormAction, checkingPromo] = useActionState(validatePromoCodeAction, {});
  const defaultAddress = savedAddresses.find((address) => address.is_default) ?? savedAddresses[0];
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id ?? "");
  const [addressFields, setAddressFields] = useState({ city: defaultAddress?.city ?? "", postalCode: defaultAddress?.postal_code ?? "", addressLine: defaultAddress?.address_line ?? "", customerName: defaultAddress?.recipient_name ?? "", phone: defaultAddress?.phone ?? "" });
  const validProductIds = cartItems.every((item: StoredCartItem) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.productId));
  const fulfillmentChoices = [
    ...(settings?.delivery_enabled ? [{ value: "delivery", label: "Home Delivery" }] : []),
    ...(settings?.pickup_enabled ? [{ value: "pickup", label: "Shop Pickup" }] : []),
  ];
  const availablePaymentChoices = paymentChoices.filter((choice) => choice.value === "jazzcash" ? Boolean(settings?.jazzcash_enabled) : choice.value === "easypaisa" ? Boolean(settings?.easypaisa_enabled) : Boolean(settings?.ubl_bank_enabled));
  const checkoutReady = Boolean(settings?.checkout_enabled && validProductIds && cartItems.length > 0 && fulfillmentChoices.length > 0 && availablePaymentChoices.length > 0);
  const checkoutBlocker = !cartItems.length || !validProductIds
    ? "Your cart must contain real, published products with confirmed prices and available stock. Sample listings cannot be ordered."
    : !settings?.checkout_enabled
      ? "Order requests are temporarily unavailable. Please contact the shop on WhatsApp."
      : !fulfillmentChoices.length
        ? "The shop is not accepting delivery or pickup requests right now."
        : !availablePaymentChoices.length
        ? "The shop has not enabled a payment method yet. Please contact the shop."
        : "Order requests are not available right now. Please contact the shop.";

  useEffect(() => {
    if (!state.orderNumber) return;
    clearCart();
    router.push(`/order/${state.orderNumber}`);
  }, [state.orderNumber, clearCart, router]);

  return (
    <form action={formAction} className="checkout-form-v15">
      <input type="hidden" name="itemsJson" value={JSON.stringify(cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })))} />
      <section className="checkout-form-section-v15">
        <span className="eyebrow">01 · CONTACT DETAILS</span><h2>Who should we contact?</h2>
        <div className="checkout-fields-v15">
          <label>Full name<input name="customerName" autoComplete="name" minLength={2} maxLength={120} required value={addressFields.customerName} onChange={(event) => setAddressFields((current) => ({ ...current, customerName: event.target.value }))} /></label>
          <label>Phone / WhatsApp number<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={30} required value={addressFields.phone} onChange={(event) => setAddressFields((current) => ({ ...current, phone: event.target.value }))} /></label>
          <label className="checkout-field-wide-v15">Email address<input name="email" type="email" autoComplete="email" maxLength={254} required defaultValue={customerEmail} /></label>
        </div>
        <p className="checkout-account-hint-v15">Already have an account? <Link href="/account/login?next=/checkout">Sign in</Link>. You can also submit this request as a guest.</p>
      </section>

      <section className="checkout-form-section-v15">
        <span className="eyebrow">02 · DELIVERY OR PICKUP</span><h2>How would you like to receive it?</h2>
        {fulfillmentChoices.length ? <div className="checkout-choice-grid-v15">{fulfillmentChoices.map((choice, index) => <label key={choice.value}><input type="radio" name="fulfillment" value={choice.value} defaultChecked={index === 0} required /><span>{choice.label}</span></label>)}</div> : <p className="checkout-setup-message-v15">Delivery and pickup are currently unavailable.</p>}
        {savedAddresses.length > 0 && <label className="checkout-saved-address-v17">Use a saved address<select value={selectedAddressId} onChange={(event) => { const selected = savedAddresses.find((address) => address.id === event.target.value); setSelectedAddressId(event.target.value); if (selected) setAddressFields((current) => ({ ...current, city: selected.city, postalCode: selected.postal_code ?? "", addressLine: selected.address_line, customerName: selected.recipient_name, phone: selected.phone })); else setAddressFields((current) => ({ ...current, city: "", postalCode: "", addressLine: "" })); }}><option value="">Enter a new address</option>{savedAddresses.map((address) => <option key={address.id} value={address.id}>{address.label} · {address.city}{address.is_default ? " · Default" : ""}</option>)}</select></label>}
        <div className="checkout-fields-v15">
          <label>City<input name="city" autoComplete="address-level2" maxLength={100} placeholder="Required for home delivery" value={addressFields.city} onChange={(event) => setAddressFields((current) => ({ ...current, city: event.target.value }))} /></label>
          <label>Postal code<input name="postalCode" autoComplete="postal-code" maxLength={20} value={addressFields.postalCode} onChange={(event) => setAddressFields((current) => ({ ...current, postalCode: event.target.value }))} /></label>
          <label className="checkout-field-wide-v15">Complete delivery address<textarea name="addressLine" autoComplete="street-address" rows={3} maxLength={500} placeholder="Street, building, area and nearby landmark" value={addressFields.addressLine} onChange={(event) => setAddressFields((current) => ({ ...current, addressLine: event.target.value }))} /></label>
        </div>
        <p className="checkout-account-hint-v15">For home delivery, the shop will confirm delivery coverage and any delivery charges by phone or WhatsApp before confirming the order.</p>
      </section>

      <section className="checkout-form-section-v15">
        <span className="eyebrow">03 · PREFERRED PAYMENT METHOD</span><h2>How would you prefer to pay?</h2>
        <div className="checkout-choice-grid-v15 payment-method-grid-v20">
          {availablePaymentChoices.map((choice, index) => <label className="payment-choice-v20" key={choice.value}>
            <input type="radio" name="paymentMethod" value={choice.value} defaultChecked={index === 0} required />
            <span className="payment-choice-content-v20"><PaymentWordmark value={choice.value}/><span className="payment-choice-copy"><strong>{choice.label}</strong><small>{choice.sub}</small></span></span>
          </label>)}
        </div>
        <div className="checkout-policy-callout"><ShieldCheck size={19}/><div><strong>Full payment is required before order confirmation.</strong><p>Submitting this form does not charge you or confirm your order. The shop will call you, confirm the final amount and availability, then share payment instructions and any requested product pictures or shop details through WhatsApp. Do not transfer money until the shop has contacted you.</p></div></div>
        <div className="checkout-promo-box">
          <label className="checkout-notes-v15">Promo code <span>(optional)</span><input name="promoCode" type="text" maxLength={32} autoCapitalize="characters" autoComplete="off" placeholder="Enter your promo code" /></label>
          <button className="button button-outline" type="submit" formAction={promoFormAction} formNoValidate disabled={checkingPromo || !cartItems.length}>{checkingPromo ? "Checking…" : "Apply code"}</button>
          {promoState.message && <p className={promoState.valid ? "form-feedback form-feedback-success" : "form-feedback form-feedback-error"} role="status">{promoState.message}</p>}
          {promoState.valid && <p className="checkout-promo-savings">Your discount: Rs. {Number(promoState.discountPkr ?? 0).toLocaleString("en-PK")}</p>}
        </div>
        <label className="checkout-notes-v15">Order notes <span>(optional)</span><textarea name="customerNotes" rows={3} maxLength={1000} placeholder="Anything the shop should know?" /></label>
      </section>

      <div className="checkout-secure-note-v15"><LockKeyhole size={17}/><span>Your product prices and available stock are rechecked on the server. No card details, wallet PINs, bank credentials or payment proof are collected on this form.</span></div>
      {state.error && <p className="form-feedback form-feedback-error" role="alert">{state.error}</p>}
      {!checkoutReady && <p className="checkout-blocker-v15"><PackageCheck size={18}/><span><strong>Order request unavailable.</strong> {checkoutBlocker}</span></p>}
      <button className="button button-primary checkout-submit-v20" type="submit" disabled={!checkoutReady || pending}>{pending ? "Submitting request…" : "Submit order request"}<PhoneCall size={16}/></button>
      <p className="checkout-terms-hint-v15">Your request is saved for the shop to review. Payment is collected separately after the shop contacts you. An order is confirmed only after the full payment is received and verified.</p>
    </form>
  );
}
