import Link from "next/link";
import { AuthForm } from "@/components/account/auth-form";

export const metadata = { title: "Owner sign in | Mr LapShop", robots: { index: false, follow: false } };

export default function OwnerLoginPage() {
  return <main className="account-page"><section className="account-card"><span className="eyebrow">PRIVATE STORE ACCESS</span><h1>Owner <em>sign in.</em></h1><p>This area is restricted to the single shop-owner account. Customer registration cannot grant dashboard access.</p><AuthForm mode="login" nextPath="/admin" admin /><p className="account-footnote">Owner access must be provisioned manually in the Supabase database. There is no public admin registration.</p><Link className="account-back-link" href="/">Return to storefront</Link></section></main>;
}
