import Link from "next/link";
import { AuthForm } from "@/components/account/auth-form";

export const metadata = { title: "Customer sign in | Mr LapShop" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") && !params.next.startsWith("//") && !params.next.includes("\\") ? params.next : "/account";
  return (
    <main className="account-page">
      <section className="account-card">
        <span className="eyebrow">WELCOME BACK</span>
        <h1>Sign in to your <em>account.</em></h1>
        <p>View your orders and manage your customer details.</p>
        <AuthForm mode="login" nextPath={nextPath} />
        <p className="account-footnote">Want to place an order without an account? Guest checkout is available.</p>
        <Link className="account-back-link" href="/shop">Back to shopping</Link>
      </section>
    </main>
  );
}
