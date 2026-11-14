import { Phone } from "lucide-react";
import { siWhatsapp } from "simple-icons";
import { store } from "@/config/store";

export function WhatsAppFloat() {
  return (
    <a
      className="whatsapp-float"
      href={store.contact.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with Mr LapShop on WhatsApp at ${store.contact.displayNumber}`}
      title="Chat with Mr LapShop on WhatsApp"
    >
      <svg className="whatsapp-float-logo" viewBox="0 0 24 24" aria-hidden="true">
        <path d={siWhatsapp.path} fill="currentColor" />
      </svg>
      <span className="whatsapp-float-phone" aria-hidden="true"><Phone size={13} strokeWidth={3} /></span>
    </a>
  );
}
