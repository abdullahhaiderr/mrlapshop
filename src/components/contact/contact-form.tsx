"use client";

import { useState, type FormEvent } from "react";
import { Send, Info } from "lucide-react";

export function ContactForm({ initialMessage = "" }: { initialMessage?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-heading"><span className="eyebrow">SEND AN ENQUIRY</span><h2>How can we <em>help?</em></h2><p>Use this form preview to see the planned contact experience.</p></div>
      <div className="form-grid-two">
        <label>Your name<input required name="name" placeholder="Enter your name" autoComplete="name" /></label>
        <label>Phone number<input required name="phone" type="tel" placeholder="03XX XXXXXXX" autoComplete="tel" /></label>
      </div>
      <label>Email address <span className="optional-label">Optional</span><input name="email" type="email" placeholder="you@example.com" autoComplete="email" /></label>
      <label>What are you looking for?<select name="topic" defaultValue="Laptop enquiry"><option>Laptop enquiry</option><option>MacBook or Chromebook</option><option>Accessories or gaming gear</option><option>Store visit</option><option>Other question</option></select></label>
      <label>Your message<textarea name="message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us a little about what you need..." /></label>
      <div className="form-submit-row"><button className="button button-primary" type="submit">Preview enquiry <Send size={17} /></button><span>Message delivery will be connected in the backend phase.</span></div>
      {submitted && <div className="form-preview-notice" role="status"><Info size={18} /><span>This is currently a front-end preview. Your message has not been sent or stored. Please call the store directly using the number on this page.</span></div>}
    </form>
  );
}
