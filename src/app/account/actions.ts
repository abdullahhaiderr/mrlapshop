"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthActionState = { error?: string; message?: string };

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(30).optional(),
  email: z.email().trim().max(254),
  password: z.string().min(8).max(72),
  marketingOptIn: z.boolean(),
});

const loginSchema = z.object({
  email: z.email().trim().max(254),
  password: z.string().min(1).max(72),
  next: z.string().optional(),
});

function getSafeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/account";
  return value;
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Customer accounts are not connected yet. Supabase setup is required first." };

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
    marketingOptIn: formData.get("marketingOptIn") === "on",
  });
  if (!parsed.success) return { error: "Please check your name, email and password. Passwords must contain at least 8 characters." };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/account`,
      data: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone ?? "",
        marketing_opt_in: parsed.data.marketingOptIn,
      },
    },
  });

  if (error) return { error: "We could not create your account. Check your details or try signing in." };

  return {
    message: "Your account request is ready. Check your inbox for the verification email before signing in. Marketing emails are enabled only if you selected the separate consent checkbox.",
  };
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Login is not connected yet. Supabase setup is required first." };

  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
    next: formData.get("next")?.toString(),
  });
  if (!parsed.success) return { error: "Enter a valid email address and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: "Sign-in failed. Check your email and password, then try again." };

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(parsed.data.next));
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  revalidatePath("/", "layout");
  redirect("/");
}

export async function updateMarketingConsentAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  if (!isSupabaseConfigured()) return { error: "Account settings are not connected." };
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { error: "Please sign in to update your preferences." };

  const marketingOptIn = formData.get("marketingOptIn") === "on";
  const { error } = await supabase.from("profiles").update({
    marketing_opt_in: marketingOptIn,
    marketing_opt_in_at: marketingOptIn ? new Date().toISOString() : null,
  }).eq("id", user.id);

  if (error) return { error: "We could not update your email preferences. Please try again." };
  revalidatePath("/account");
  return { message: marketingOptIn ? "You are subscribed to promotional email updates." : "You are unsubscribed from promotional email updates." };
}

const addressSchema = z.object({
  id: z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable()),
  label: z.string().trim().min(2).max(40),
  recipientName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  city: z.string().trim().min(2).max(100),
  addressLine: z.string().trim().min(5).max(500),
  postalCode: z.string().trim().max(20).optional(),
  isDefault: z.boolean(),
});

export async function saveCustomerAddressAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/account/addresses?error=not_configured");
  const parsed = addressSchema.safeParse({
    id: formData.get("id") || null,
    label: formData.get("label"),
    recipientName: formData.get("recipientName"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    addressLine: formData.get("addressLine"),
    postalCode: formData.get("postalCode") || "",
    isDefault: formData.get("isDefault") === "on",
  });
  if (!parsed.success) redirect("/account/addresses?error=validation");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/account/login?next=/account/addresses");
  if (parsed.data.isDefault) {
    const { error } = await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", user.id);
    if (error) redirect("/account/addresses?error=save");
  }
  const record = {
    user_id: user.id,
    label: parsed.data.label,
    recipient_name: parsed.data.recipientName,
    phone: parsed.data.phone,
    city: parsed.data.city,
    address_line: parsed.data.addressLine,
    postal_code: parsed.data.postalCode || null,
    is_default: parsed.data.isDefault,
  };
  const result = parsed.data.id
    ? await supabase.from("customer_addresses").update(record).eq("id", parsed.data.id).eq("user_id", user.id)
    : await supabase.from("customer_addresses").insert(record);
  if (result.error) redirect("/account/addresses?error=save");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  redirect("/account/addresses?saved=1");
}

export async function deleteCustomerAddressAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/account/addresses?error=not_configured");
  const id = String(formData.get("id") ?? "");
  if (!z.uuid().safeParse(id).success) redirect("/account/addresses?error=validation");
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/account/login?next=/account/addresses");
  const { error } = await supabase.from("customer_addresses").delete().eq("id", id).eq("user_id", user.id);
  if (error) redirect("/account/addresses?error=delete");
  revalidatePath("/account/addresses");
  revalidatePath("/checkout");
  redirect("/account/addresses?deleted=1");
}
