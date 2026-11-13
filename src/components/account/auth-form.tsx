"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, registerAction, type AuthActionState } from "@/app/account/actions";

type AuthFormProps = { mode: "login" | "register"; nextPath?: string; admin?: boolean };
const initialState: AuthActionState = {};

export function AuthForm({ mode, nextPath = "/account", admin = false }: AuthFormProps) {
  const action = mode === "register" ? registerAction : loginAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="account-form">
      {mode === "register" && <label>Full name<input name="fullName" type="text" autoComplete="name" minLength={2} maxLength={120} required /></label>}
      {mode === "register" && <label>Phone number <span>(optional)</span><input name="phone" type="tel" autoComplete="tel" maxLength={30} /></label>}
      <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : 1} maxLength={72} required /></label>
      {mode === "register" && (
        <label className="account-consent">
          <input name="marketingOptIn" type="checkbox" />
          <span>Send me optional emails about new arrivals, discounts and special offers. I can unsubscribe at any time.</span>
        </label>
      )}
      {mode === "login" && <input type="hidden" name="next" value={nextPath} />}
      {state.error && <p className="form-feedback form-feedback-error" role="alert">{state.error}</p>}
      {state.message && <p className="form-feedback form-feedback-success" role="status">{state.message}</p>}
      <button className="button button-primary account-submit" type="submit" disabled={pending}>
        {pending ? "Please wait…" : mode === "register" ? "Create customer account" : admin ? "Sign in to owner dashboard" : "Sign in"}
      </button>
      {!admin && <p className="account-switch">{mode === "register" ? "Already have an account?" : "New to Mr LapShop?"} {mode === "register" ? <Link href="/account/login">Sign in</Link> : <Link href="/account/register">Create an account</Link>}</p>}
      {!admin && mode === "login" && <p className="account-switch"><Link href="/checkout">Continue as a guest at checkout</Link></p>}
    </form>
  );
}
