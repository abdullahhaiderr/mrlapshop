import { saveProductAction } from "@/app/admin/(dashboard)/actions";

type Category = { id: string; name: string; category_group: string };
type Product = {
  id: string; title: string; slug: string; brand: string; sku: string | null; series: string | null; model: string | null; category_id: string | null;
  condition: "new" | "used" | "open_box"; cosmetic_grade: string | null; cpu_family: string | null; cpu_model: string | null;
  generation: string | null; ram_gb: number | null; ram_type: string | null; storage_gb: number | null; storage_type: string | null;
  screen_in: number | null; resolution: string | null; touch: boolean; two_in_one: boolean; gpu: string | null;
  operating_system: string | null; battery_note: string | null; warranty_months: number | null; warranty_terms: string | null;
  price_pkr: number | null; compare_at_pkr: number | null; stock: number; status: "draft" | "active" | "archived";
  featured: boolean; performance_pick: boolean; short_description: string | null; description: string | null;
};

function Field({ label, name, defaultValue, type = "text", required = false, hint }: { label: string; name: string; defaultValue?: string | number | null; type?: string; required?: boolean; hint?: string }) {
  return <label className="admin-field"><span>{label}{required ? " *" : ""}</span><input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />{hint && <small>{hint}</small>}</label>;
}

export function ProductEditorForm({ product, categories }: { product?: Product | null; categories: Category[] }) {
  return (
    <form action={saveProductAction} className="admin-form">
      <input type="hidden" name="id" value={product?.id ?? ""}/>
      <section className="admin-form-section"><h2>Product identity</h2><div className="admin-form-grid">
        <Field label="Display title" name="title" defaultValue={product?.title} required />
        <Field label="URL slug" name="slug" defaultValue={product?.slug} required hint="Lowercase words separated with hyphens." />
        <Field label="Brand" name="brand" defaultValue={product?.brand} required />
        <Field label="Series" name="series" defaultValue={product?.series} />
        <Field label="Model" name="model" defaultValue={product?.model} />
        <label className="admin-field"><span>Category *</span><select name="categoryId" required defaultValue={product?.category_id ?? ""}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name} · {category.category_group}</option>)}</select></label>
        <label className="admin-field"><span>Condition *</span><select name="condition" required defaultValue={product?.condition ?? "new"}><option value="new">New</option><option value="used">Used</option><option value="open_box">Open Box</option></select></label>
        <Field label="SKU (optional)" name="sku" defaultValue={product?.sku ?? ""} hint="SKU may be entered on the product record later." />
        <Field label="Cosmetic grade" name="cosmeticGrade" defaultValue={product?.cosmetic_grade} />
      </div></section>
      <section className="admin-form-section"><h2>Specifications</h2><div className="admin-form-grid">
        <Field label="Processor family" name="cpuFamily" defaultValue={product?.cpu_family}/><Field label="Processor model" name="cpuModel" defaultValue={product?.cpu_model}/><Field label="Generation" name="generation" defaultValue={product?.generation}/>
        <Field label="RAM (GB)" name="ramGb" type="number" defaultValue={product?.ram_gb}/><Field label="RAM type" name="ramType" defaultValue={product?.ram_type}/><Field label="Storage (GB)" name="storageGb" type="number" defaultValue={product?.storage_gb}/>
        <Field label="Storage type" name="storageType" defaultValue={product?.storage_type}/><Field label="Screen size (inches)" name="screenIn" type="number" defaultValue={product?.screen_in}/><Field label="Resolution" name="resolution" defaultValue={product?.resolution}/>
        <Field label="Graphics" name="gpu" defaultValue={product?.gpu}/><Field label="Operating system" name="operatingSystem" defaultValue={product?.operating_system}/><Field label="Battery / condition notes" name="batteryNote" defaultValue={product?.battery_note}/>
      </div><div className="admin-check-row"><label><input type="checkbox" name="touch" defaultChecked={product?.touch ?? false}/> Touchscreen</label><label><input type="checkbox" name="twoInOne" defaultChecked={product?.two_in_one ?? false}/> 2-in-1 convertible</label></div></section>
      <section className="admin-form-section"><h2>Price, stock and warranty</h2><div className="admin-form-grid">
        <Field label="Price (PKR)" name="pricePkr" type="number" defaultValue={product?.price_pkr} hint="Leave blank for a draft that is not ready to sell."/><Field label="Compare-at price (PKR)" name="compareAtPkr" type="number" defaultValue={product?.compare_at_pkr}/><Field label="Available stock" name="stock" type="number" defaultValue={product?.stock ?? 0} required/>
        <Field label="Warranty duration (months)" name="warrantyMonths" type="number" defaultValue={product?.warranty_months} hint="Use 0 only when the owner has confirmed no warranty applies."/><Field label="Warranty terms" name="warrantyTerms" defaultValue={product?.warranty_terms}/>
        <label className="admin-field"><span>Listing status</span><select name="status" defaultValue={product?.status ?? "draft"}><option value="draft">Draft</option><option value="active">Published</option><option value="archived">Archived</option></select></label>
      </div><div className="admin-product-flags"><label className="admin-check-label"><input type="checkbox" name="featured" defaultChecked={product?.featured ?? false}/> Feature this product in the catalogue</label><label className="admin-check-label"><input type="checkbox" name="performancePick" defaultChecked={product?.performance_pick ?? false}/> Show in The Beast Collection (high-performance / upgraded picks)</label></div></section>
      <section className="admin-form-section"><h2>Product copy</h2><label className="admin-field"><span>Short description</span><textarea name="shortDescription" rows={2} defaultValue={product?.short_description ?? ""}/></label><label className="admin-field"><span>Full description</span><textarea name="description" rows={5} defaultValue={product?.description ?? ""}/></label></section>
      <div className="admin-form-footer"><p>Required product facts must be verified by the shop owner. Publishing is blocked until a price and warranty decision are entered.</p><button className="button button-primary" type="submit">{product ? "Save changes" : "Create product"}</button></div>
    </form>
  );
}
