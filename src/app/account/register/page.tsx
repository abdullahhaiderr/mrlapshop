import Link from "next/link";
import { AuthForm } from "@/components/account/auth-form";

export const metadata = { title: "Create an account | Mr LapShop" };

export default function RegisterPage() {
  return (
    <main className="account-page">
      <section className="account-card">
        <span className="eyebrow">JOIN MR LAPSHOP</span>
        <h1>Create your <em>account.</em></h1>
        <p>Keep your orders together, check purchase updates and manage your details. You can also shop as a guest without registering.</p>
        <AuthForm mode="register" />
        <p className="account-footnote">Creating an account does not automatically subscribe you to marketing emails. Promotional email consent is optional and separate.</p>
        <Link className="account-back-link" href="/shop">Back to shopping</Link>
      </section>
    </main>
  );
}
