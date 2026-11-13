import { siInstagram, siTiktok, siYoutube } from "simple-icons";
import type { SimpleIcon } from "simple-icons";
import { store } from "@/config/store";

type SocialIconName = "Instagram" | "TikTok" | "YouTube";

const socialIcons: Record<SocialIconName, SimpleIcon> = {
  Instagram: siInstagram,
  TikTok: siTiktok,
  YouTube: siYoutube,
};

export function SocialIcon({ name, size = 18 }: { name: SocialIconName; size?: number }) {
  const icon = socialIcons[name];
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size}>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

export function SocialLinks({ className = "", iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  return (
    <div className={className} role="group" aria-label="Mr LapShop social media">
      {store.socialLinks.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Mr LapShop on ${item.label}`}
          title={item.label}
        >
          <SocialIcon name={item.label} size={iconOnly ? 17 : 16} />
          {!iconOnly && <span>{item.label}</span>}
        </a>
      ))}
    </div>
  );
}
