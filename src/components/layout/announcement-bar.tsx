import { MapPin, Clock3 } from "lucide-react";
import Link from "next/link";
import { store } from "@/config/store";
import { SocialLinks } from "@/components/brand/social-links";

export function AnnouncementBar() {
  return (
    <div className="announcement-bar">
      <div className="container announcement-inner">
        <p><span className="announcement-dot" /> Your next laptop. Expert care. One local team.</p>
        <div className="announcement-meta">
          <span><Clock3 size={13} aria-hidden="true" /> {store.hours.summary}</span>
          <Link href={store.address.mapsUrl} target="_blank" rel="noreferrer"><MapPin size={13} aria-hidden="true" /> Find our store</Link>
          <SocialLinks className="announcement-social" iconOnly />
        </div>
      </div>
    </div>
  );
}
