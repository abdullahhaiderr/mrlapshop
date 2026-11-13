import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AddressForm } from "@/components/account/address-form";
import { deleteCustomerAddressAction } from "@/app/account/actions";

export const metadata = { title: "Saved addresses | Mr LapShop" };
export const dynamic = "force-dynamic";

type Address = { id: string; label: string; recipient_name: string; phone: string; city: string; address_line: string; postal_code: string | null; is_default: boolean };

export default async function CustomerAddressesPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const params = await searchParams;
  if (!isSupabaseConfigured()) return <main className="account-page"><section className="account-card"><span className="eyebrow">CUSTOMER AREA</span><h1>Saved <em>addresses.</em></h1><p>Connect the Supabase development project to save delivery addresses securely to your customer account.</p><Link href="/account" className="button button-primary">Back to account</Link></section></main>;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account/login?next=/account/addresses");
  const { data, error } = await supabase.from("customer_addresses").select("id, label, recipient_name, phone, city, address_line, postal_code, is_default").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
  const addresses = (data ?? []) as Address[];
  return (
    <main className="account-page account-page-wide"><section className="account-card account-dashboard">
      <div className="account-dashboard-head"><div><span className="eyebrow">CUSTOMER AREA</span><h1>Saved <em>addresses.</em></h1><p>Keep delivery details ready for your next order.</p></div><Link href="/account" className="account-back-link">← Account</Link></div>
      {params.saved && <p className="form-feedback form-feedback-success">Your address has been saved.</p>}{params.deleted && <p className="form-feedback form-feedback-success">The address has been removed.</p>}{(params.error || error) && <p className="form-feedback form-feedback-error">We could not complete that address update. Please check your details and try again.</p>}
      <div className="address-book-grid-v17"><div className="address-list-v17">
        <h2>Your addresses ({addresses.length})</h2>
        {!addresses.length ? <div className="account-empty"><MapPin size={23}/><p>No saved addresses yet. Add one to make future delivery checkout quicker.</p></div> : addresses.map((address) => <article className="saved-address-card-v17" key={address.id}><div className="saved-address-head-v17"><div><span>{address.label}</span>{address.is_default && <strong>Default</strong>}</div><form action={deleteCustomerAddressAction}><input type="hidden" name="id" value={address.id}/><button className="address-delete-v17" type="submit" aria-label={`Delete ${address.label} address`}><Trash2 size={15}/></button></form></div><strong>{address.recipient_name}</strong><p>{address.phone}</p><p>{address.address_line}, {address.city}{address.postal_code ? ` ${address.postal_code}` : ""}</p><details><summary>Edit address</summary><AddressForm address={address}/></details></article>)}
      </div><div className="address-add-panel-v17"><span className="eyebrow">NEW DELIVERY ADDRESS</span><h2>Add an address.</h2><p>Address details are visible only to your signed-in account and are protected by customer-level database access rules.</p><AddressForm/></div></div>
    </section></main>
  );
}
