"use server";

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireStoreOwner } from "@/lib/supabase/owner";
import { canPublishProduct, getAllowedProductImageExtension } from "@/lib/admin/product-rules";

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
    const { error } = await supabase.from("products").update(record).eq("id", value.id);
    if (error) redirect(`/admin/products/${value.id}?error=save`);
    await recordAudit(supabase, user.id, "product.updated", "product", value.id, { status: value.status, price_pkr: value.pricePkr, stock: value.stock });
    revalidatePath(`/admin/products/${value.id}`);
    revalidatePath("/admin/products");
    redirect(`/admin/products/${value.id}?saved=1`);
  }

  const { data, error } = await supabase.from("products").insert(record).select("id").single();
  if (error || !data) redirect("/admin/products/new?error=save");
  await recordAudit(supabase, user.id, "product.created", "product", data.id, { status: value.status });
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}?created=1`);
}

export async function archiveProductAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const id = formText(formData, "id");
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) redirect("/admin/products?error=invalid_id");
  const { error } = await supabase.from("products").update({ status: "archived" }).eq("id", id);
  if (error) redirect(`/admin/products/${id}?error=archive`);
  await recordAudit(supabase, user.id, "product.archived", "product", id);
  revalidatePath("/admin/products");
  redirect("/admin/products?archived=1");
}

export async function uploadProductImageAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const productId = formText(formData, "productId");
  const altText = formText(formData, "altText");
  if (!z.uuid().safeParse(productId).success || altText.length < 4 || altText.length > 180) redirect(`/admin/products/${productId}?error=image_details`);
  const image = formData.get("image");
  if (!(image instanceof File) || image.size < 1 || image.size > 8 * 1024 * 1024) redirect(`/admin/products/${productId}?error=image_size`);
  const bytes = new Uint8Array(await image.arrayBuffer());
  const extension = getAllowedProductImageExtension(image.type, bytes);
  if (!extension) redirect(`/admin/products/${productId}?error=image_type`);

  const storagePath = `${productId}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, bytes, { contentType: image.type, cacheControl: "3600", upsert: false });
  if (uploadError) redirect(`/admin/products/${productId}?error=image_upload`);
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId);
  const { error: insertError } = await supabase.from("product_images").insert({ product_id: productId, storage_path: storagePath, alt_text: altText, position: count ?? 0 });
  if (insertError) {
    await supabase.storage.from("product-images").remove([storagePath]);
    redirect(`/admin/products/${productId}?error=image_record`);
  }
  await recordAudit(supabase, user.id, "product.image_uploaded", "product", productId, { storage_path: storagePath, mime_type: image.type, size: image.size });
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?imageUploaded=1`);
}

export async function removeProductImageAction(formData: FormData) {
  const { supabase, user } = await requireStoreOwner();
  const imageId = formText(formData, "imageId");
  const productId = formText(formData, "productId");
  if (!z.uuid().safeParse(imageId).success || !z.uuid().safeParse(productId).success) redirect("/admin/products?error=invalid_image");
  const { data: image, error: readError } = await supabase.from("product_images").select("storage_path").eq("id", imageId).eq("product_id", productId).single();
  if (readError || !image) redirect(`/admin/products/${productId}?error=image_missing`);
  const { error: rowError } = await supabase.from("product_images").delete().eq("id", imageId).eq("product_id", productId);
  if (rowError) redirect(`/admin/products/${productId}?error=image_record`);
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
    const { error } = await supabase.from("categories").update(row).eq("id", parsed.data.id);
    if (error) redirect("/admin/categories?error=save");
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
    .select("id, order_number, status, fulfillment, subtotal_pkr")
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
  const { error } = await supabase.from("orders").update({
    status: parsed.data.status,
    payment_status: parsed.data.paymentStatus,
    delivery_fee_pkr: deliveryFeePkr,
    delivery_fee_pending: deliveryFeePending,
    total_pkr: Number(currentOrder.subtotal_pkr) + deliveryFeePkr,
  }).eq("id", parsed.data.orderId);
  if (error) {
    const code = error.message.includes("Full payment") ? "payment_required" : error.message.toLowerCase().includes("delivery fee") ? "delivery_fee_required" : "update";
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
