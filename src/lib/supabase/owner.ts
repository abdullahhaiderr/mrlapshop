import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function requireStoreOwner() {
  if (!isSupabaseConfigured()) redirect("/admin/login?setup=required");

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/admin/login");

  const { data: ownerRecord, error: ownerError } = await supabase
    .from("admin_users")
    .select("user_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (ownerError || !ownerRecord || ownerRecord.role !== "owner") {
    redirect("/admin/login?access=restricted");
  }

  return { supabase, user };
}
