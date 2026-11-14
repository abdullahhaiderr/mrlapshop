import { requireStoreOwner } from "@/lib/supabase/owner";
import { saveTestimonialAction } from "@/app/admin/(dashboard)/actions";
import { getYouTubeVideoId } from "@/lib/youtube";

export const metadata = { title: "Customer testimonials | Mr LapShop owner" };

type Testimonial = {
  id: string;
  display_name: string;
  headline: string;
  review_text: string | null;
  rating: number | null;
  youtube_url: string | null;
  consent_to_publish: boolean;
  status: "pending" | "published" | "rejected";
  created_at: string;
  published_at: string | null;
};

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const { supabase } = await requireStoreOwner();
  const [{ data, error }, pendingResult, publishedResult] = await Promise.all([
    supabase.from("customer_testimonials")
      .select("id, display_name, headline, review_text, rating, youtube_url, consent_to_publish, status, created_at, published_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("customer_testimonials").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("customer_testimonials").select("id", { count: "exact", head: true }).eq("status", "published"),
  ]);
  const testimonials = (data ?? []) as Testimonial[];

  const errorMessage = params.error === "consent_required"
    ? "Customer permission must be confirmed before a testimonial can be published."
    : params.error === "validation"
      ? "Enter a customer name and headline, then add either a valid YouTube video URL or a written review of at least 20 characters."
      : params.error === "duplicate_video"
        ? "That YouTube video is already attached to another testimonial. Use a different video URL or edit the existing testimonial."
        : params.error === "access_denied"
          ? "Your owner permission was not accepted by the database. Sign out, sign back in and retry."
          : params.error
            ? "The testimonial could not be saved. Refresh the page and try again."
            : null;

  return (
    <section className="admin-content">
      <div className="admin-page-heading">
        <div><span className="eyebrow">CUSTOMER TRUST</span><h1>Customer <em>testimonials.</em></h1><p>Add a YouTube video or written review. Published, consented videos appear in the homepage testimonial rail automatically.</p></div>
      </div>

      {params.saved && <p className="form-feedback form-feedback-success" role="status">Testimonial saved. The public homepage has been refreshed.</p>}
      {errorMessage && <p className="form-feedback form-feedback-error" role="alert">{errorMessage}</p>}

      <div className="admin-stats-grid admin-stats-grid-v16">
        <article><span>All loaded testimonials</span><strong>{testimonials.length}</strong></article>
        <article><span>Pending review</span><strong>{pendingResult.count ?? "—"}</strong></article>
        <article><span>Published</span><strong>{publishedResult.count ?? "—"}</strong></article>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head"><div><h2>Add a customer story</h2><p>Paste a YouTube watch, Shorts or youtu.be link, or enter a written review.</p></div></div>
        <form action={saveTestimonialAction} className="admin-form admin-testimonial-form">
          <div className="admin-form-grid">
            <label className="admin-field"><span>Customer display name *</span><input name="displayName" required minLength={2} maxLength={80} placeholder="e.g. Verified Mr LapShop customer" /></label>
            <label className="admin-field"><span>Headline *</span><input name="headline" required minLength={3} maxLength={120} placeholder="e.g. My new laptop from Mr LapShop" /></label>
            <label className="admin-field admin-field-wide"><span>YouTube video URL</span><input name="youtubeUrl" type="url" maxLength={500} placeholder="https://www.youtube.com/watch?v=..." /></label>
            <label className="admin-field"><span>Rating (optional)</span><select name="rating" defaultValue=""><option value="">No rating</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>
            <label className="admin-field"><span>Publication status</span><select name="status" defaultValue="pending"><option value="pending">Pending review</option><option value="published">Publish now</option><option value="rejected">Do not publish</option></select></label>
          </div>
          <label className="admin-field"><span>Written review (optional, minimum 20 characters)</span><textarea name="reviewText" rows={3} maxLength={1200} placeholder="Add a short review or context for the video..." /></label>
          <label className="admin-check-label"><input type="checkbox" name="consentToPublish" /> I have the customer&apos;s permission to publish this testimonial and video.</label>
          <p className="admin-testimonial-hint">At least one piece of content is required: a valid YouTube link or a written review of at least 20 characters. A testimonial is shown publicly only when its status is Published and customer permission is confirmed. A YouTube link is embedded; the video file itself is not uploaded.</p>
          <button className="button button-primary" type="submit">Save testimonial</button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head"><div><h2>Manage existing testimonials</h2><p>Update details, publish approved stories or unpublish a video. Changes appear on the homepage after saving.</p></div></div>
        {error ? <div className="admin-empty">Could not load testimonials from the database. Refresh the page and check the owner database connection.</div> : testimonials.length === 0 ? <div className="admin-empty">No customer testimonials have been submitted yet.</div> : (
          <div className="admin-testimonial-list">
            {testimonials.map((item) => {
              const videoId = item.youtube_url ? getYouTubeVideoId(item.youtube_url) : null;
              return (
                <form action={saveTestimonialAction} className="admin-testimonial-card" key={item.id}>
                  <input type="hidden" name="id" value={item.id} />
                  <div className="admin-testimonial-card-head">
                    <div><span className={`admin-pill admin-pill-${item.status}`}>{item.status.replaceAll("_", " ")}</span><small>Added {new Date(item.created_at).toLocaleDateString("en-PK")}</small></div>
                    {videoId ? <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Open YouTube video ↗</a> : <span className="admin-testimonial-no-video">Written review</span>}
                  </div>
                  <div className="admin-form-grid">
                    <label className="admin-field"><span>Customer display name *</span><input name="displayName" defaultValue={item.display_name} required minLength={2} maxLength={80} /></label>
                    <label className="admin-field"><span>Headline *</span><input name="headline" defaultValue={item.headline} required minLength={3} maxLength={120} /></label>
                    <label className="admin-field admin-field-wide"><span>YouTube video URL</span><input name="youtubeUrl" type="url" defaultValue={item.youtube_url ?? ""} maxLength={500} placeholder="https://www.youtube.com/watch?v=..." /></label>
                    <label className="admin-field"><span>Rating</span><select name="rating" defaultValue={item.rating?.toString() ?? ""}><option value="">No rating</option><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></label>
                    <label className="admin-field"><span>Publication status</span><select name="status" defaultValue={item.status}><option value="pending">Pending review</option><option value="published">Published</option><option value="rejected">Rejected / hidden</option></select></label>
                  </div>
                  <label className="admin-field"><span>Written review</span><textarea name="reviewText" rows={3} defaultValue={item.review_text ?? ""} maxLength={1200} /></label>
                  <label className="admin-check-label"><input type="checkbox" name="consentToPublish" defaultChecked={item.consent_to_publish} /> Customer permission confirmed</label>
                  <div className="admin-testimonial-card-footer"><small>{item.published_at ? `Published ${new Date(item.published_at).toLocaleDateString("en-PK")}` : "Not published"}</small><button className="button button-outline" type="submit">Save changes</button></div>
                </form>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
