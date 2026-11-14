"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { canPublishProduct } from "@/lib/admin/product-rules";
import { getYouTubeVideoId } from "@/lib/youtube";

const nullableNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
}, z.number().int().nonnegative().nullable());

const nullableText = z.preprocess((value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return String(value).trim();
}, z.string().max(1000).nullable());

const productSchema = z.object({
  id: z.preprocess((v) => v === "" || v == null ? null : v, z.uuid().nullable()),
  title: z.string().trim().min(3).max(180),
  slug: z.string().trim().min(3).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens for the slug."),
  brand: z.string().trim().min(2).max(80),
  sku: nullableText,
  series: nullableText,
  model: nullableText,
  categoryId: z.uuid(),
  condition: z.enum(["new", "used", "open_box"]),
  cosmeticGrade: nullableText,
  cpuFamily: nullableText,
  cpuModel: nullableText,
  generation: nullableText,
  ramGb: nullableNumber,
  ramType: nullableText,
  storageGb: nullableNumber,
  storageType: nullableText,
  screenIn: z.preprocess((v) => v === "" || v == null ? null : Number(v), z.number().positive().max(100).nullable()),
  resolution: nullableText,
  touch: z.boolean(),
  twoInOne: z.boolean(),
  gpu: nullableText,
  operatingSystem: nullableText,
  batteryNote: nullableText,
  warrantyMonths: nullableNumber,
  warrantyTerms: nullableText,
  pricePkr: nullableNumber,
  compareAtPkr: nullableNumber,
  stock: z.preprocess((v) => Number(v), z.number().int().nonnegative().max(100000)),
  status: z.enum(["draft", "active", "archived"]),
  featured: z.boolean(),
  performancePick: z.boolean(),
  shortDescription: nullableText,
  description: nullableText,
});

function formBoolean(value: FormDataEntryValue | null) { return value === "on" || value === "true"; }
function formText(formData: FormData, key: string) { return String(formData.get(key) ?? "").trim(); }

async function recordAudit(supabase: Awaited<ReturnType<typeof requireStoreOwner>>["supabase"], actorId: string, action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  await supabase.from("admin_audit_log").insert({ actor_id: actorId, action, entity_type: entityType, entity_id: entityId, details });
}

export async function saveProductAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const parsed = productSchema.safeParse({
    id: formText(formData, "id") || null,
    title: formText(formData, "title"),
    slug: formText(formData, "slug"),
    brand: formText(formData, "brand"),
    sku: formText(formData, "sku"),
    series: formText(formData, "series"),
    model: formText(formData, "model"),
    categoryId: formText(formData, "categoryId"),
    condition: formText(formData, "condition"),
    cosmeticGrade: formText(formData, "cosmeticGrade"),
    cpuFamily: formText(formData, "cpuFamily"),
    cpuModel: formText(formData, "cpuModel"),
    generation: formText(formData, "generation"),
    ramGb: formText(formData, "ramGb"),
    ramType: formText(formData, "ramType"),
    storageGb: formText(formData, "storageGb"),
    storageType: formText(formData, "storageType"),
    screenIn: formText(formData, "screenIn"),
    resolution: formText(formData, "resolution"),
    touch: formBoolean(formData.get("touch")),
    twoInOne: formBoolean(formData.get("twoInOne")),
    gpu: formText(formData, "gpu"),
    operatingSystem: formText(formData, "operatingSystem"),
    batteryNote: formText(formData, "batteryNote"),
    warrantyMonths: formText(formData, "warrantyMonths"),
    warrantyTerms: formText(formData, "warrantyTerms"),
    pricePkr: formText(formData, "pricePkr"),
    compareAtPkr: formText(formData, "compareAtPkr"),
    stock: formText(formData, "stock") || "0",
    status: formText(formData, "status"),
    featured: formBoolean(formData.get("featured")),
    performancePick: formBoolean(formData.get("performancePick")),
    shortDescription: formText(formData, "shortDescription"),
    description: formText(formData, "description"),
  });
  if (!parsed.success) redirect(`/admin/products?error=validation`);
  const value = parsed.data;
  if (value.status === "active" && !canPublishProduct(value.pricePkr, value.warrantyMonths)) {
    redirect(`/admin/products?error=publish_requirements`);
  }
  const record = {
    title: value.title, slug: value.slug, brand: value.brand, sku: value.sku, series: value.series, model: value.model,
    category_id: value.categoryId, condition: value.condition, cosmetic_grade: value.cosmeticGrade,
    cpu_family: value.cpuFamily, cpu_model: value.cpuModel, generation: value.generation,
    ram_gb: value.ramGb, ram_type: value.ramType, storage_gb: value.storageGb, storage_type: value.storageType,
    screen_in: value.screenIn, resolution: value.resolution, touch: value.touch, two_in_one: value.twoInOne,
    gpu: value.gpu, operating_system: value.operatingSystem, battery_note: value.batteryNote,
    warranty_months: value.warrantyMonths, warranty_terms: value.warrantyTerms, price_pkr: value.pricePkr,
    compare_at_pkr: value.compareAtPkr, stock: value.stock, status: value.status, featured: value.featured,
    performance_pick: value.performancePick,
    short_description: value.shortDescription, description: value.description,
  };

  if (value.id) {
    const { data: updatedProduct, error } = await supabase.from("products")
      .update(record)
      .eq("id", value.id)
      .select("id, status, slug")
      .maybeSingle();
    if (error || !updatedProduct) {
      const code = error?.code === "23505"
        ? error.message.toLowerCase().includes("slug") ? "duplicate_slug" : "duplicate_sku"
        : error?.code === "42501" ? "access_denied" : "save";
      console.error("[admin-product] Update failed or matched no row.", { code: error?.code });
      redirect(`/admin/products/${value.id}?error=${code}`);
    }
    await recordAudit(supabase, user.id, "product.updated", "product", value.id, {
      status: value.status,
      price_pkr: value.pricePkr,
      stock: value.stock,
    });
    revalidatePath(`/admin/products/${value.id}`);
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    revalidatePath(`/product/${updatedProduct.slug}`);
    redirect(`/admin/products/${value.id}?saved=1`);
  }

  const { data, error } = await supabase.from("products").insert(record).select("id").single();
  if (error || !data) {
    const code = error?.code === "23505"
      ? error.message.toLowerCase().includes("slug") ? "duplicate_slug" : "duplicate_sku"
      : error?.code === "42501" ? "access_denied" : "save";
    console.error("[admin-product] Insert failed.", { code: error?.code });
    redirect(`/admin/products/new?error=${code}`);
  }
  await recordAudit(supabase, user.id, "product.created", "product", data.id, { status: value.status });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function archiveProductAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const id = formText(formData, "id");
  if (!z.uuid().safeParse(id).success) redirect("/admin/products?error=invalid_id");

  const { data: product, error: readError } = await supabase.from("products")
    .select("id, title, slug, status")
    .eq("id", id)
    .maybeSingle();
  if (readError || !product) redirect(`/admin/products/${id}?error=not_found`);

  const { data: archivedProduct, error } = await supabase.from("products")
    .update({ status: "archived" })
    .eq("id", id)
    .select("id, status, slug")
    .maybeSingle();
  if (error || !archivedProduct) {
    console.error("[admin-product] Archive update failed or matched no row.", { code: error?.code });
    redirect(`/admin/products/${id}?error=archive`);
  }

  await recordAudit(supabase, user.id, "product.archived", "product", id, {
    previous_status: product.status,
    status: archivedProduct.status,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/product/${archivedProduct.slug}`);
  redirect("/admin/products?archived=1");
}

export async function removeProductImageAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const imageId = formText(formData, "imageId");
  const productId = formText(formData, "productId");
  if (!z.uuid().safeParse(imageId).success || !z.uuid().safeParse(productId).success) redirect("/admin/products?error=invalid_image");
  const { data: image, error: readError } = await supabase.from("product_images").select("storage_path").eq("id", imageId).eq("product_id", productId).single();
  if (readError || !image) redirect(`/admin/products/${productId}?error=image_missing`);
  const { data: deletedImage, error: rowError } = await supabase.from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", productId)
    .select("id")
    .maybeSingle();
  if (rowError || !deletedImage) redirect(`/admin/products/${productId}?error=image_record`);
  const { error: storageError } = await supabase.storage.from("product-images").remove([image.storage_path]);
  if (storageError) redirect(`/admin/products/${productId}?error=image_storage_orphan`);
  await recordAudit(supabase, user.id, "product.image_removed", "product", productId, { storage_path: image.storage_path });
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?imageRemoved=1`);
}

const categorySchema = z.object({
  id: z.preprocess((v) => v === "" || v == null ? null : v, z.uuid().nullable()),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: nullableText,
  categoryGroup: z.enum(["Laptops", "Accessories"]),
  sortOrder: z.preprocess((v) => Number(v), z.number().int().min(0).max(10000)),
  active: z.boolean(),
});

export async function saveCategoryAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const parsed = categorySchema.safeParse({
    id: formText(formData, "id") || null,
    name: formText(formData, "name"), slug: formText(formData, "slug"),
    description: formText(formData, "description"), categoryGroup: formText(formData, "categoryGroup"),
    sortOrder: formText(formData, "sortOrder") || "0", active: formBoolean(formData.get("active")),
  });
  if (!parsed.success) redirect("/admin/categories?error=validation");
  const row = { name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description, category_group: parsed.data.categoryGroup, sort_order: parsed.data.sortOrder, is_active: parsed.data.active };
  if (parsed.data.id) {
    const { data: updatedCategory, error } = await supabase.from("categories")
      .update(row)
      .eq("id", parsed.data.id)
      .select("id")
      .maybeSingle();
    if (error || !updatedCategory) redirect("/admin/categories?error=save");
    await recordAudit(supabase, user.id, "category.updated", "category", parsed.data.id, { slug: parsed.data.slug });
  } else {
    const { data, error } = await supabase.from("categories").insert(row).select("id").single();
    if (error || !data) redirect("/admin/categories?error=save");
    await recordAudit(supabase, user.id, "category.created", "category", data.id, { slug: parsed.data.slug });
  }
  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  redirect("/admin/categories?saved=1");
}

const orderUpdateSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["new", "confirmed", "packed", "dispatched", "ready_for_pickup", "delivered", "cancelled", "return_requested", "returned", "refunded"]),
  paymentStatus: z.enum(["pending", "awaiting_transfer", "paid", "failed", "refunded"]),
  deliveryFeePkr: z.preprocess((value) => value === "" || value === null || value === undefined ? null : Number(value), z.number().int().nonnegative().nullable()),
});

export async function updateOrderAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const parsed = orderUpdateSchema.safeParse({
    orderId: formText(formData, "orderId"),
    status: formText(formData, "status"),
    paymentStatus: formText(formData, "paymentStatus"),
    deliveryFeePkr: formText(formData, "deliveryFeePkr"),
  });
  if (!parsed.success) redirect("/admin/orders?error=validation");
  const { data: currentOrder, error: loadError } = await supabase.from("orders")
    .select("id, order_number, status, fulfillment, subtotal_pkr, discount_pkr")
    .eq("id", parsed.data.orderId)
    .single();
  if (loadError || !currentOrder) redirect("/admin/orders?error=update");
  const isFirstProcessingTransition = currentOrder.status === "new" && parsed.data.status !== "new" && parsed.data.status !== "cancelled";
  if (isFirstProcessingTransition && parsed.data.paymentStatus !== "paid") redirect(`/admin/orders/${currentOrder.order_number}?error=payment_required`);
  if (currentOrder.fulfillment === "delivery" && isFirstProcessingTransition && parsed.data.deliveryFeePkr === null) {
    redirect(`/admin/orders/${currentOrder.order_number}?error=delivery_fee_required`);
  }
  const deliveryFeePending = currentOrder.fulfillment === "delivery" && parsed.data.deliveryFeePkr === null;
  const deliveryFeePkr = currentOrder.fulfillment === "pickup" ? 0 : (parsed.data.deliveryFeePkr ?? 0);
  const { data: updatedOrder, error } = await supabase.from("orders").update({
    status: parsed.data.status,
    payment_status: parsed.data.paymentStatus,
    delivery_fee_pkr: deliveryFeePkr,
    delivery_fee_pending: deliveryFeePending,
    total_pkr: Math.max(0, Number(currentOrder.subtotal_pkr) - Number(currentOrder.discount_pkr ?? 0)) + deliveryFeePkr,
  })
    .eq("id", parsed.data.orderId)
    .select("id")
    .maybeSingle();
  if (error || !updatedOrder) {
    const code = error?.message.includes("Full payment") ? "payment_required" : error?.message.toLowerCase().includes("delivery fee") ? "delivery_fee_required" : "update";
    redirect(`/admin/orders/${currentOrder.order_number}?error=${code}`);
  }
  await recordAudit(supabase, user.id, "order.updated", "order", parsed.data.orderId, {
    status: parsed.data.status,
    payment_status: parsed.data.paymentStatus,
    delivery_fee_pkr: deliveryFeePkr,
    delivery_fee_pending: deliveryFeePending,
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders/${currentOrder.order_number}?updated=1`);
}

const fulfilmentSchema = z.object({
  orderId: z.uuid(),
  osInstalled: z.boolean(), driversInstalled: z.boolean(), updatesRun: z.boolean(),
  requestedAppsInstalled: z.boolean(), finalTestCompleted: z.boolean(), internalNote: z.string().trim().max(2000),
});

export async function saveFulfilmentChecklistAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const parsed = fulfilmentSchema.safeParse({
    orderId: formText(formData, "orderId"),
    osInstalled: formBoolean(formData.get("osInstalled")), driversInstalled: formBoolean(formData.get("driversInstalled")),
    updatesRun: formBoolean(formData.get("updatesRun")), requestedAppsInstalled: formBoolean(formData.get("requestedAppsInstalled")),
    finalTestCompleted: formBoolean(formData.get("finalTestCompleted")), internalNote: formText(formData, "internalNote"),
  });
  if (!parsed.success) redirect("/admin/orders?error=checklist");
  const { error } = await supabase.from("order_fulfilment_checks").upsert({
    order_id: parsed.data.orderId, os_installed: parsed.data.osInstalled, drivers_installed: parsed.data.driversInstalled,
    updates_run: parsed.data.updatesRun, requested_apps_installed: parsed.data.requestedAppsInstalled,
    final_test_completed: parsed.data.finalTestCompleted, internal_note: parsed.data.internalNote || null,
    updated_by: user.id,
  }, { onConflict: "order_id" });
  if (error) redirect("/admin/orders?error=checklist_save");
  await recordAudit(supabase, user.id, "order.fulfilment_checklist_saved", "order", parsed.data.orderId, {
    os_installed: parsed.data.osInstalled, drivers_installed: parsed.data.driversInstalled,
    updates_run: parsed.data.updatesRun, requested_apps_installed: parsed.data.requestedAppsInstalled,
    final_test_completed: parsed.data.finalTestCompleted,
  });
  revalidatePath("/admin/orders");
  redirect("/admin/orders?checklistSaved=1");
}


const nullableTestimonialText = z.preprocess((value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return String(value).trim();
}, z.string().min(20).max(1200).nullable());

const nullableYouTubeUrl = z.preprocess((value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return String(value).trim();
}, z.string().url().max(500).refine((value) => Boolean(getYouTubeVideoId(value)), "Enter a valid YouTube video or Shorts URL.").nullable());

const testimonialSchema = z.object({
  id: z.preprocess((value) => value === "" || value == null ? null : value, z.uuid().nullable()),
  displayName: z.string().trim().min(2).max(80),
  headline: z.string().trim().min(3).max(120),
  reviewText: nullableTestimonialText,
  rating: z.preprocess((value) => value === "" || value === null || value === undefined ? null : Number(value), z.number().int().min(1).max(5).nullable()),
  youtubeUrl: nullableYouTubeUrl,
  consentToPublish: z.boolean(),
  status: z.enum(["pending", "published", "rejected"]),
}).refine((value) => Boolean(value.reviewText || value.youtubeUrl), {
  message: "Add review text or a YouTube video URL.",
});

export async function saveTestimonialAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const returnToDashboard = formText(formData, "returnTo") === "dashboard";
  const parsed = testimonialSchema.safeParse({
    id: formText(formData, "id") || null,
    displayName: formText(formData, "displayName"),
    headline: formText(formData, "headline"),
    reviewText: formText(formData, "reviewText"),
    rating: formText(formData, "rating"),
    youtubeUrl: formText(formData, "youtubeUrl"),
    consentToPublish: formBoolean(formData.get("consentToPublish")),
    status: formText(formData, "status"),
  });

  if (!parsed.success) redirect(returnToDashboard ? "/admin?testimonialError=validation" : "/admin/testimonials?error=validation");
  const value = parsed.data;
  if (value.status === "published" && !value.consentToPublish) {
    redirect(returnToDashboard ? "/admin?testimonialError=consent_required" : "/admin/testimonials?error=consent_required");
  }

  if (value.id) {
    const { data: existing, error: readError } = await supabase
      .from("customer_testimonials")
      .select("published_at")
      .eq("id", value.id)
      .single();
    if (readError || !existing) redirect("/admin/testimonials?error=missing");

    const row = {
      display_name: value.displayName,
      headline: value.headline,
      review_text: value.reviewText,
      rating: value.rating,
      youtube_url: value.youtubeUrl,
      consent_to_publish: value.consentToPublish,
      status: value.status,
      // Keep the original publication date when an already-published testimonial is edited.
      published_at: value.status === "published" ? (existing.published_at ?? new Date().toISOString()) : null,
    };
    const { data: updatedTestimonial, error } = await supabase.from("customer_testimonials")
      .update(row)
      .eq("id", value.id)
      .select("id")
      .maybeSingle();
    if (error || !updatedTestimonial) {
      const code = error?.code === "23505" ? "duplicate_video" : error?.code === "42501" ? "access_denied" : "save";
      console.error("[admin-testimonial] Update failed or matched no row.", { code: error?.code });
      redirect(`/admin/testimonials?error=${code}`);
    }
    await recordAudit(supabase, user.id, "testimonial.updated", "customer_testimonial", value.id, {
      status: value.status,
      youtube_video_id: value.youtubeUrl ? getYouTubeVideoId(value.youtubeUrl) : null,
      consent_to_publish: value.consentToPublish,
    });
  } else {
    const row = {
      display_name: value.displayName,
      headline: value.headline,
      review_text: value.reviewText,
      rating: value.rating,
      youtube_url: value.youtubeUrl,
      consent_to_publish: value.consentToPublish,
      status: value.status,
      published_at: value.status === "published" ? new Date().toISOString() : null,
    };
    const { data, error } = await supabase.from("customer_testimonials").insert(row).select("id").single();
    if (error || !data) {
      const code = error?.code === "23505" ? "duplicate_video" : error?.code === "42501" ? "access_denied" : "save";
      console.error("[admin-testimonial] Insert failed.", { code: error?.code });
      redirect(`/admin/testimonials?error=${code}`);
    }
    await recordAudit(supabase, user.id, "testimonial.created", "customer_testimonial", data.id, {
      status: value.status,
      youtube_video_id: value.youtubeUrl ? getYouTubeVideoId(value.youtubeUrl) : null,
      consent_to_publish: value.consentToPublish,
    });
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  redirect(returnToDashboard ? "/admin?testimonialAdded=1" : "/admin/testimonials?saved=1");
}


function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

/**
 * Sends a one-time product announcement to verified customer accounts that explicitly opted in.
 * Each product can be announced once; Resend batch idempotency protects a retry after a partial send.
 */
export async function sendProductAnnouncementAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const productId = formText(formData, "productId");
  if (!z.uuid().safeParse(productId).success) redirect("/admin/products?error=invalid_id");

  const productPath = `/admin/products/${productId}`;
  if (formData.get("confirmSend") !== "yes") redirect(`${productPath}?emailError=confirmation_required`);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://mrlapshop.pk").replace(/\/+$/, "");

  if (!apiKey || !from) redirect(`${productPath}?emailError=not_configured`);

  const [{ data: product, error: productError }, { data: alreadySent, error: auditReadError }] = await Promise.all([
    supabase.from("products")
      .select("id, slug, title, brand, short_description, description, price_pkr, stock, status, product_images(storage_path, alt_text, position)")
      .eq("id", productId)
      .maybeSingle(),
    supabase.from("admin_audit_log")
      .select("id")
      .eq("action", "product.new_arrival_email_sent")
      .eq("entity_type", "product")
      .eq("entity_id", productId)
      .limit(1)
      .maybeSingle(),
  ]);

  if (productError || !product) {
    console.error("[product-announcement] Could not load product.", { code: productError?.code });
    redirect(`${productPath}?emailError=product`);
  }
  if (auditReadError) {
    console.error("[product-announcement] Could not check previous send.", { code: auditReadError.code });
    redirect(`${productPath}?emailError=check`);
  }
  if (alreadySent) redirect(`${productPath}?emailError=already_sent`);

  const productRow = product as unknown as {
    id: string; slug: string; title: string; brand: string; short_description: string | null;
    description: string | null; price_pkr: number | null; stock: number; status: string;
    product_images: Array<{ storage_path: string; alt_text: string; position: number }> | null;
  };
  if (productRow.status !== "active" || productRow.stock < 1 || !productRow.price_pkr || productRow.price_pkr < 1) {
    redirect(`${productPath}?emailError=not_ready`);
  }

  const { data: customers, count, error: customersError } = await supabase.from("profiles")
    .select("email, full_name", { count: "exact" })
    .eq("email_verified", true)
    .eq("marketing_opt_in", true)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (customersError) {
    console.error("[product-announcement] Could not load opted-in customers.", { code: customersError.code });
    redirect(`${productPath}?emailError=recipients`);
  }
  if (!customers?.length) redirect(`${productPath}?emailError=no_subscribers`);
  if ((count ?? customers.length) > customers.length) redirect(`${productPath}?emailError=too_many`);

  const uniqueCustomers = Array.from(new Map(
    customers
      .filter((customer) => customer.email && customer.email.includes("@"))
      .map((customer) => [customer.email.toLowerCase(), { email: customer.email.toLowerCase(), name: customer.full_name || "there" }]),
  ).values());
  if (!uniqueCustomers.length) redirect(`${productPath}?emailError=no_subscribers`);

  const productImages = [...(productRow.product_images ?? [])].sort((a, b) => a.position - b.position);
  const imageUrl = productImages[0]
    ? supabase.storage.from("product-images").getPublicUrl(productImages[0].storage_path).data.publicUrl
    : null;
  const productUrl = `${siteUrl}/product/${productRow.slug}`;
  const title = escapeEmailHtml(productRow.title);
  const brand = escapeEmailHtml(productRow.brand);
  const description = escapeEmailHtml((productRow.short_description || productRow.description || "A new addition to the Mr LapShop catalogue.").slice(0, 600));
  const price = Number(productRow.price_pkr).toLocaleString("en-PK");
  const escapedProductUrl = escapeEmailHtml(productUrl);
  const imageMarkup = imageUrl
    ? `<img src="${escapeEmailHtml(imageUrl)}" alt="${escapeEmailHtml(productImages[0].alt_text)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:14px;margin:0 auto 22px;" />`
    : "";
  const baseHtml = `<!doctype html><html lang="en"><body style="margin:0;padding:28px 12px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#182131;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e7eaf0;border-radius:16px;"><tr><td style="padding:28px;"><div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#677286;">MR LAPSHOP</div><h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;">A new arrival is here.</h1><p style="margin:0 0 22px;color:#687487;font-size:14px;line-height:1.6;">A fresh addition to the Mr LapShop catalogue.</p>${imageMarkup}<div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#798395;">${brand}</div><h2 style="margin:7px 0 10px;font-size:22px;line-height:1.3;">${title}</h2><p style="margin:0 0 15px;color:#687487;font-size:14px;line-height:1.7;">${description}</p><p style="margin:0 0 22px;color:#182131;font-size:18px;font-weight:800;">PKR ${price}</p><a href="${escapedProductUrl}" style="display:inline-block;padding:13px 20px;border-radius:9px;background:#c7f442;color:#17200e;text-decoration:none;font-size:13px;font-weight:800;">View product</a><hr style="margin:28px 0 16px;border:0;border-top:1px solid #edf0f3;" /><p style="margin:0;color:#8b95a4;font-size:11px;line-height:1.7;">You are receiving this because you chose to receive optional new-arrival and promotional emails from Mr LapShop. To change your preference, sign in to your <a href="${escapeEmailHtml(siteUrl)}/account" style="color:#59677a;">customer account</a>.</p><p style="margin:12px 0 0;color:#8b95a4;font-size:11px;">Mr LapShop · Rawalpindi, Pakistan</p></td></tr></table></body></html>`;
  const plainText = [
    "A new arrival is here at Mr LapShop.",
    `${productRow.brand} · ${productRow.title}`,
    `Price: PKR ${price}`,
    productRow.short_description || productRow.description || "",
    `View product: ${productUrl}`,
    "",
    "You are receiving this because you opted in to optional promotional emails. Sign in to your Mr LapShop account to change your email preference.",
    `${siteUrl}/account`,
  ].filter(Boolean).join("\n");

  const batches = [];
  for (let index = 0; index < uniqueCustomers.length; index += 100) {
    batches.push(uniqueCustomers.slice(index, index + 100));
  }

  let sent = 0;
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const emails = batches[batchIndex].map((customer) => ({
      from,
      to: [customer.email],
      subject: `New arrival: ${productRow.title} | Mr LapShop`,
      html: baseHtml.replace("A new arrival is here.", `A new arrival is here, ${escapeEmailHtml(customer.name)}.`),
      text: plainText,
    }));
    try {
      const response = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `mrlapshop-product-launch-${productId}-${batchIndex + 1}`,
        },
        body: JSON.stringify(emails),
        cache: "no-store",
      });
      if (!response.ok) {
        console.error("[product-announcement] Resend rejected a batch.", { status: response.status, batch: batchIndex + 1 });
        redirect(`${productPath}?emailError=partial`);
      }
      sent += batches[batchIndex].length;
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      console.error("[product-announcement] Resend request failed.", { batch: batchIndex + 1 });
      redirect(`${productPath}?emailError=partial`);
    }
  }

  await recordAudit(supabase, user.id, "product.new_arrival_email_sent", "product", productId, {
    recipient_count: sent,
    batch_count: batches.length,
  });
  revalidatePath(productPath);
  redirect(`${productPath}?emailSent=${sent}`);
}

/**
 * Create-mode action used by the Add Product screen. It returns the new product ID
 * so the browser can upload selected photos directly to Supabase Storage before
 * navigating away from the form.
 */
export async function createProductWithResultAction(formData: FormData): Promise<
  { ok: true; productId: string } | { ok: false; error: string }
> {
  const { supabase, user } = await requireStoreOwner();
  const parsed = productSchema.safeParse({
    id: null,
    title: formText(formData, "title"),
    slug: formText(formData, "slug"),
    brand: formText(formData, "brand"),
    sku: formText(formData, "sku"),
    series: formText(formData, "series"),
    model: formText(formData, "model"),
    categoryId: formText(formData, "categoryId"),
    condition: formText(formData, "condition"),
    cosmeticGrade: formText(formData, "cosmeticGrade"),
    cpuFamily: formText(formData, "cpuFamily"),
    cpuModel: formText(formData, "cpuModel"),
    generation: formText(formData, "generation"),
    ramGb: formText(formData, "ramGb"),
    ramType: formText(formData, "ramType"),
    storageGb: formText(formData, "storageGb"),
    storageType: formText(formData, "storageType"),
    screenIn: formText(formData, "screenIn"),
    resolution: formText(formData, "resolution"),
    touch: formBoolean(formData.get("touch")),
    twoInOne: formBoolean(formData.get("twoInOne")),
    gpu: formText(formData, "gpu"),
    operatingSystem: formText(formData, "operatingSystem"),
    batteryNote: formText(formData, "batteryNote"),
    warrantyMonths: formText(formData, "warrantyMonths"),
    warrantyTerms: formText(formData, "warrantyTerms"),
    pricePkr: formText(formData, "pricePkr"),
    compareAtPkr: formText(formData, "compareAtPkr"),
    stock: formText(formData, "stock") || "0",
    status: formText(formData, "status"),
    featured: formBoolean(formData.get("featured")),
    performancePick: formBoolean(formData.get("performancePick")),
    shortDescription: formText(formData, "shortDescription"),
    description: formText(formData, "description"),
  });

  if (!parsed.success) return { ok: false, error: "validation" };
  const value = parsed.data;
  if (value.status === "active" && !canPublishProduct(value.pricePkr, value.warrantyMonths)) {
    return { ok: false, error: "publish_requirements" };
  }

  const record = {
    title: value.title, slug: value.slug, brand: value.brand, sku: value.sku, series: value.series, model: value.model,
    category_id: value.categoryId, condition: value.condition, cosmetic_grade: value.cosmeticGrade,
    cpu_family: value.cpuFamily, cpu_model: value.cpuModel, generation: value.generation,
    ram_gb: value.ramGb, ram_type: value.ramType, storage_gb: value.storageGb, storage_type: value.storageType,
    screen_in: value.screenIn, resolution: value.resolution, touch: value.touch, two_in_one: value.twoInOne,
    gpu: value.gpu, operating_system: value.operatingSystem, battery_note: value.batteryNote,
    warranty_months: value.warrantyMonths, warranty_terms: value.warrantyTerms, price_pkr: value.pricePkr,
    compare_at_pkr: value.compareAtPkr, stock: value.stock, status: value.status, featured: value.featured,
    performance_pick: value.performancePick,
    short_description: value.shortDescription, description: value.description,
  };

  const { data, error } = await supabase.from("products").insert(record).select("id").single();
  if (error || !data) {
    const code = error?.code === "23505"
      ? error.message.toLowerCase().includes("slug") ? "duplicate_slug" : "duplicate_sku"
      : error?.code === "42501" ? "access_denied" : "save";
    console.error("[admin-product] Create-mode insert failed.", { code: error?.code });
    return { ok: false, error: code };
  }

  await recordAudit(supabase, user.id, "product.created", "product", data.id, { status: value.status });
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  return { ok: true, productId: data.id };
}


export async function setTestimonialStatusAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const id = formText(formData, "id");
  const status = formText(formData, "status");
  if (!z.uuid().safeParse(id).success || !["published", "rejected"].includes(status)) {
    redirect("/admin?testimonialError=validation");
  }

  const { data: current, error: readError } = await supabase.from("customer_testimonials")
    .select("consent_to_publish, published_at, headline")
    .eq("id", id)
    .maybeSingle();
  if (readError || !current) redirect("/admin?testimonialError=save");
  if (status === "published" && !current.consent_to_publish) {
    redirect("/admin?testimonialError=consent_required");
  }

  const { data: updatedTestimonial, error } = await supabase.from("customer_testimonials").update({
    status,
    published_at: status === "published" ? (current.published_at ?? new Date().toISOString()) : null,
  })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updatedTestimonial) {
    console.error("[admin-testimonial] Quick status update failed or matched no row.", { code: error?.code });
    redirect("/admin?testimonialError=save");
  }

  await recordAudit(supabase, user.id, status === "published" ? "testimonial.published" : "testimonial.hidden", "customer_testimonial", id, {
    status,
    source: "dashboard",
  });
  revalidatePath("/admin");
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
  redirect("/admin?testimonialUpdated=1");
}

export async function setProductVisibilityAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const id = formText(formData, "id");
  const status = formText(formData, "status");
  const returnTo = formText(formData, "returnTo");
  const redirectAfterUpdate = () => {
    if (returnTo === "products") return "/admin/products?productUpdated=1";
    if (returnTo === "product") return `/admin/products/${id}?republished=1`;
    return "/admin?productUpdated=1";
  };
  const redirectOnError = (code: string) => {
    if (returnTo === "products") return `/admin/products?error=${code}`;
    if (returnTo === "product") return `/admin/products/${id}?error=${code}`;
    return `/admin?productError=${code}`;
  };

  if (!z.uuid().safeParse(id).success || !["active", "draft", "archived"].includes(status)) {
    redirect(redirectOnError("validation"));
  }

  // Read first so republishing applies the same requirements as a normal publish
  // and audit records distinguish a restore from a first-time publication.
  const { data: product, error: readError } = await supabase.from("products")
    .select("id, title, slug, price_pkr, warranty_months, status")
    .eq("id", id)
    .maybeSingle();
  if (readError || !product) {
    console.error("[admin-product] Visibility lookup failed.", { code: readError?.code });
    redirect(redirectOnError("not_found"));
  }

  if (status === "active" && !canPublishProduct(product.price_pkr, product.warranty_months)) {
    redirect(redirectOnError("publish_requirements"));
  }

  // Select the updated row: PostgREST can return no error but zero rows when
  // an UPDATE is filtered by RLS. Never show success unless the status changed.
  const { data: updatedProduct, error } = await supabase.from("products")
    .update({ status })
    .eq("id", id)
    .select("id, status, slug")
    .maybeSingle();
  if (error || !updatedProduct) {
    console.error("[admin-product] Visibility update failed or matched no row.", { code: error?.code });
    redirect(redirectOnError(error?.code === "42501" ? "access_denied" : "save"));
  }

  const auditAction = status === "archived"
    ? "product.archived"
    : status === "draft"
      ? "product.hidden"
      : product.status === "archived" ? "product.republished" : "product.published";
  await recordAudit(supabase, user.id, auditAction, "product", id, {
    previous_status: product.status,
    status,
    source: "dashboard",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/product/${updatedProduct.slug}`);
  redirect(redirectAfterUpdate());
}


const storeSettingsSchema = z.object({
  checkoutEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  deliveryEnabled: z.boolean(),
  deliveryFeePkr: z.preprocess((value) => value === "" || value === null || value === undefined ? null : Number(value), z.number().int().nonnegative().nullable()),
  jazzcashEnabled: z.boolean(),
  easypaisaEnabled: z.boolean(),
  ublBankEnabled: z.boolean(),
});

export async function saveStoreSettingsAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const parsed = storeSettingsSchema.safeParse({
    checkoutEnabled: formBoolean(formData.get("checkoutEnabled")),
    pickupEnabled: formBoolean(formData.get("pickupEnabled")),
    deliveryEnabled: formBoolean(formData.get("deliveryEnabled")),
    deliveryFeePkr: formText(formData, "deliveryFeePkr"),
    jazzcashEnabled: formBoolean(formData.get("jazzcashEnabled")),
    easypaisaEnabled: formBoolean(formData.get("easypaisaEnabled")),
    ublBankEnabled: formBoolean(formData.get("ublBankEnabled")),
  });
  if (!parsed.success) redirect("/admin/settings?error=validation");
  if (parsed.data.deliveryEnabled && parsed.data.deliveryFeePkr !== null && parsed.data.deliveryFeePkr > 1000000) {
    redirect("/admin/settings?error=delivery_fee");
  }
  const { data: updatedSettings, error } = await supabase.from("store_settings").update({
    checkout_enabled: parsed.data.checkoutEnabled,
    pickup_enabled: parsed.data.pickupEnabled,
    delivery_enabled: parsed.data.deliveryEnabled,
    delivery_fee_pkr: parsed.data.deliveryFeePkr,
    jazzcash_enabled: parsed.data.jazzcashEnabled,
    easypaisa_enabled: parsed.data.easypaisaEnabled,
    ubl_bank_enabled: parsed.data.ublBankEnabled,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  })
    .eq("singleton", true)
    .select("singleton")
    .maybeSingle();
  if (error || !updatedSettings) {
    console.error("[admin-settings] Store settings save failed or matched no row.", { code: error?.code });
    redirect("/admin/settings?error=save");
  }
  await recordAudit(supabase, user.id, "store.settings_updated", "store_settings", "singleton", {
    checkout_enabled: parsed.data.checkoutEnabled,
    pickup_enabled: parsed.data.pickupEnabled,
    delivery_enabled: parsed.data.deliveryEnabled,
  });
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
  revalidatePath("/");
  redirect("/admin/settings?saved=1");
}

const promoCodeSchema = z.object({
  code: z.string().trim().max(32).optional(),
  description: nullableText,
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.preprocess((value) => Number(value), z.number().int().positive().max(100000000)),
  minimumOrderPkr: z.preprocess((value) => value === "" ? 0 : Number(value), z.number().int().nonnegative().max(100000000)),
  maximumDiscountPkr: z.preprocess((value) => value === "" ? null : Number(value), z.number().int().positive().nullable()),
  usageLimit: z.preprocess((value) => value === "" ? null : Number(value), z.number().int().positive().nullable()),
  perCustomerLimit: z.preprocess((value) => value === "" ? 1 : Number(value), z.number().int().positive().max(1000)),
});

export async function createPromoCodeAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const parsed = promoCodeSchema.safeParse({
    code: formText(formData, "code"),
    description: formText(formData, "description"),
    discountType: formText(formData, "discountType"),
    discountValue: formText(formData, "discountValue"),
    minimumOrderPkr: formText(formData, "minimumOrderPkr"),
    maximumDiscountPkr: formText(formData, "maximumDiscountPkr"),
    usageLimit: formText(formData, "usageLimit"),
    perCustomerLimit: formText(formData, "perCustomerLimit"),
  });
  if (!parsed.success) redirect("/admin/promotions?error=validation");
  if (parsed.data.discountType === "percentage" && parsed.data.discountValue > 100) redirect("/admin/promotions?error=percentage");
  if (parsed.data.discountType === "fixed" && parsed.data.maximumDiscountPkr !== null) redirect("/admin/promotions?error=max_discount");

  const code = (parsed.data.code || ("MLS-" + randomBytes(4).toString("hex"))).trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{3,31}$/.test(code)) redirect("/admin/promotions?error=code");
  const startsRaw = formText(formData, "startsAt");
  const expiresRaw = formText(formData, "expiresAt");
  const startsAt = startsRaw ? new Date(startsRaw) : null;
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  if ((startsAt && !Number.isFinite(startsAt.getTime())) || (expiresAt && !Number.isFinite(expiresAt.getTime()))) redirect("/admin/promotions?error=dates");
  if (startsAt && expiresAt && expiresAt <= startsAt) redirect("/admin/promotions?error=dates");

  const { data, error } = await supabase.from("promo_codes").insert({
    code,
    description: parsed.data.description,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    minimum_order_pkr: parsed.data.minimumOrderPkr,
    maximum_discount_pkr: parsed.data.maximumDiscountPkr,
    usage_limit: parsed.data.usageLimit,
    per_customer_limit: parsed.data.perCustomerLimit,
    starts_at: startsAt?.toISOString() ?? null,
    expires_at: expiresAt?.toISOString() ?? null,
    is_active: formData.get("isActive") === "on",
    created_by: user.id,
  }).select("id").single();

  if (error || !data) {
    console.error("[admin-promotions] Promo code create failed.", { code: error?.code });
    redirect("/admin/promotions?error=" + (error?.code === "23505" ? "duplicate" : "save"));
  }
  await recordAudit(supabase, user.id, "promo_code.created", "promo_code", data.id, {
    code, discount_type: parsed.data.discountType, discount_value: parsed.data.discountValue,
  });
  revalidatePath("/admin/promotions");
  revalidatePath("/checkout");
  redirect("/admin/promotions?created=" + encodeURIComponent(code));
}

export async function setPromoCodeStatusAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const id = formText(formData, "id");
  const active = formData.get("isActive") === "true";
  if (!z.uuid().safeParse(id).success) redirect("/admin/promotions?error=invalid_id");
  const { data: updatedPromo, error } = await supabase.from("promo_codes").update({
    is_active: active,
    updated_at: new Date().toISOString(),
  })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !updatedPromo) redirect("/admin/promotions?error=save");
  await recordAudit(supabase, user.id, active ? "promo_code.activated" : "promo_code.deactivated", "promo_code", id);
  revalidatePath("/admin/promotions");
  redirect("/admin/promotions?saved=1");
}

export async function deleteProductAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const id = formText(formData, "productId");
  if (!z.uuid().safeParse(id).success) redirect("/admin/products?error=invalid_id");

  const [{ data: product, error: productReadError }, { data: images, error: imageReadError }] = await Promise.all([
    supabase.from("products").select("id, title").eq("id", id).maybeSingle(),
    supabase.from("product_images").select("storage_path").eq("product_id", id),
  ]);
  if (productReadError || !product || imageReadError) redirect("/admin/products?error=delete_read");

  // The products -> order_items foreign key uses ON DELETE SET NULL, preserving every order snapshot.
  const { data: deletedProduct, error } = await supabase.from("products")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !deletedProduct) {
    console.error("[admin-product] Permanent delete failed or matched no row.", { code: error?.code });
    redirect("/admin/products/" + id + "?error=delete");
  }

  const storagePaths = (images ?? []).map((image) => image.storage_path);
  let storageCleanup = "complete";
  if (storagePaths.length) {
    const { error: storageError } = await supabase.storage.from("product-images").remove(storagePaths);
    if (storageError) {
      storageCleanup = "pending";
      console.error("[admin-product] Product deleted but photo cleanup needs review.", { code: storageError.message });
    }
  }

  await recordAudit(supabase, user.id, "product.deleted", "product", id, {
    title: product.title,
    photo_count: storagePaths.length,
    storage_cleanup: storageCleanup,
    order_history_preserved: true,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products?deleted=1&storageCleanup=" + storageCleanup);
}
