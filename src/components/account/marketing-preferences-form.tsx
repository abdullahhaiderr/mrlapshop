"use client";

import { useActionState } from "react";
import { updateMarketingConsentAction, type AuthActionState } from "@/app/account/actions";

const initialState: AuthActionState = {};

export function MarketingPreferencesForm({ defaultChecked }: { defaultChecked: boolean }) {
  const [state, formAction, pending] = useActionState(updateMarketingConsentAction, initialState);
  return <form action={formAction} className="account-marketing-form"><label className="account-consent"><input type="checkbox" name="marketingOptIn" defaultChecked={defaultChecked} /><span>Send me new-arrival, discount and special-offer emails.</span></label><button className="button button-outline" type="submit" disabled={pending}>{pending ? "Saving…" : "Save email preference"}</button>{state.error && <p className="form-feedback form-feedback-error" role="alert">{state.error}</p>}{state.message && <p className="form-feedback form-feedback-success" role="status">{state.message}</p>}</form>;
}
