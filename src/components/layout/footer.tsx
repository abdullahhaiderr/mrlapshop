import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, Phone, MessageCircle, ArrowUpRight } from "lucide-react";
import { store } from "@/config/store";
import { SocialLinks } from "@/components/brand/social-links";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand-column">
          <Link href="/" aria-label="Mr LapShop home" className="footer-logo-link">
            <Image src="/images/mr-lapshop-logo.webp" alt="Mr LapShop" width={480} height={187} className="footer-logo" />
          </Link>
          <p className="footer-brand-copy">{store.tagline} Shop new, used and open-box laptops, accessories and expert repair services in Rawalpindi and Islamabad.</p>
          <div className="footer-single-contact">
            <span>Phone & WhatsApp</span>
            <strong>{store.contact.displayNumber}</strong>
            <div>
              <a href={store.contact.phoneHref}><Phone size={14} /> Call</a>
              <a href={store.contact.whatsappHref} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
            </div>
          </div>
          <SocialLinks className="footer-social-links" />
        </div>

        <div className="footer-link-column">
          <h3>Explore</h3>
          <Link href="/shop">All laptops</Link>
          <Link href="/shop?category=macbook">Apple MacBooks</Link>
          <Link href="/shop?category=hp">HP laptops</Link>
          <Link href="/shop?category=dell">Dell laptops</Link>
          <Link href="/shop?category=lenovo">Lenovo laptops</Link>
          <Link href="/shop?category=asus">ASUS laptops</Link>
          <Link href="/shop?category=chromebook">Chromebooks</Link>
          <Link href="/shop?category=accessories">Accessories</Link>
        </div>

        <div className="footer-link-column">
          <h3>Mr LapShop</h3>
          <Link href="/about">About the store</Link>
          <Link href="/contact">Contact us</Link>
          <Link href="/#brands">Browse brands</Link>
          <Link href="/#services">Repairs & upgrades</Link>
          <Link href="/#customer-reviews">Customer videos</Link>
        </div>

        <div className="footer-contact-column">
          <h3>Visit our store</h3>
          <p><MapPin size={17} /> <span>{store.address.full}</span></p>
          <p><Clock3 size={17} /> <span>{store.hours.summary}</span></p>
          <a className="footer-map-link" href={store.address.mapsUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={15} /></a>
        </div>
      </div>
      <div className="container footer-payment-row"><span>Payment & pickup options</span>{store.paymentMethods.map((method) => <span key={method}>{method}</span>)}</div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Mr LapShop. All rights reserved.</p>
        <p>{store.tagline}</p>
      </div>
    </footer>
  );
}
