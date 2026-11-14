"use client";

import { useState, type FormEvent } from "react";
import { Send, MessageCircle } from "lucide-react";
import { store } from "@/config/store";

export function ContactForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const details = [
      "Hello Mr LapShop, I would like to make an enquiry.",
      `Name: ${String(formData.get("name") ?? "").trim()}`,
      `Phone: ${String(formData.get("phone") ?? "").trim()}`,
      `Email: ${String(formData.get("email") ?? "").trim() || "Not provided"}`,
      `Topic: ${String(formData.get("topic") ?? "").trim()}`,
      `Message: ${String(formData.get("message") ?? "").trim() || "I would like to discuss my requirements."}`,
    ];
    const whatsappUrl = `${store.contact.whatsappHref}?text=${encodeURIComponent(details.join("\\n"))}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setSubmitted(true);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-heading"><span className="eyebrow">SEND AN ENQUIRY</span><h2>How can we <em>help?</em></h2><p>Share a few details and continue the conversation with our team in WhatsApp.</p></div>
      <div className="form-grid-two">
        <label>Your name<input required name="name" placeholder="Enter your name" autoComplete="name" /></label>
        <label>Phone number<input required name="phone" type="tel" placeholder="03XX XXXXXXX" autoComplete="tel" /></label>
      </div>
      <label>Email address <span className="optional-label">Optional</span><input name="email" type="email" placeholder="you@example.com" autoComplete="email" /></label>
      <label>What are you looking for?<select name="topic" defaultValue="Laptop enquiry"><option>Laptop enquiry</option><option>MacBook or Chromebook</option><option>Accessories or gaming gear</option><option>Store visit</option><option>Other question</option></select></label>
      <label>Your message<textarea name="message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us a little about what you need..." /></label>
      <div className="form-submit-row"><button className="button button-primary" type="submit">Continue in WhatsApp <MessageCircle size={17} /></button><span>WhatsApp opens with your message ready to review. You send it yourself.</span></div>
      {submitted && <div className="form-preview-notice" role="status"><Send size={18} /><span>Your enquiry has been prepared in WhatsApp. Review the details and press Send there to contact Mr LapShop.</span></div>}
    </form>
  );
}
