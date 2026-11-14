"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Menu, Search, X, Phone, ChevronDown, Laptop, Headphones, Wrench, Heart, ShoppingBag, ShoppingCart, UserRound, MessageCircle, Cpu, Monitor, Gamepad2, Keyboard, Sparkles } from "lucide-react";
import { navigation, store } from "@/config/store";
import { BrandMark } from "@/components/brand/brand-mark";
import { useStorefront } from "@/components/providers/storefront-provider";

const menuGroups = [
  {
    title: "Shop by brand",
    links: [
      { label: "Apple MacBooks", href: "/shop?category=macbook", icon: Laptop, brand: "Apple" },
      { label: "HP laptops", href: "/shop?category=hp", icon: Laptop, brand: "HP" },
      { label: "Dell laptops", href: "/shop?category=dell", icon: Laptop, brand: "Dell" },
      { label: "Lenovo laptops", href: "/shop?category=lenovo", icon: Laptop, brand: "Lenovo" },
      { label: "ASUS laptops", href: "/shop?category=asus", icon: Laptop, brand: "ASUS" },
      { label: "Chromebooks", href: "/shop?category=chromebook", icon: Monitor, brand: "Chromebook" },
    ],
  },
  {
    title: "Explore laptops",
    links: [
      { label: "All laptops", href: "/shop", icon: Laptop },
      { label: "Business laptops", href: "/shop?category=business", icon: Cpu },
      { label: "Gaming laptops", href: "/shop?category=gaming", icon: Gamepad2 },
      { label: "New laptops", href: "/shop?condition=new", icon: Sparkles },
      { label: "Used laptops", href: "/shop?condition=used", icon: Laptop },
      { label: "Open-box laptops", href: "/shop?condition=open-box", icon: BadgeIcon },
    ],
  },
  {
    title: "Accessories & support",
    links: [
      { label: "Headphones & headsets", href: "/shop?category=headphones", icon: Headphones },
      { label: "Microphones", href: "/shop?category=microphones", icon: Sparkles },
      { label: "Keyboards & mice", href: "/shop?category=keyboards", icon: Keyboard },
      { label: "Gaming consoles", href: "/shop?category=consoles", icon: Gamepad2 },
      { label: "Repairs & upgrades", href: "/#services", icon: Wrench },
      { label: "Contact the shop", href: "/contact", icon: Phone },
    ],
  },
];

function BadgeIcon({ size = 18 }: { size?: number }) {
  return <Sparkles size={size} />;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasScrolled, setHasScrolled] = useState(false);
  const isHomePage = pathname === "/";

  useEffect(() => {
    const updateScrollState = () => setHasScrolled(window.scrollY > 12);
    const initialFrame = window.requestAnimationFrame(updateScrollState);
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", updateScrollState);
    };
  }, [pathname]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const shopCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearch] = useState("");

  function openShopMenu() {
    if (shopCloseTimer.current) {
      window.clearTimeout(shopCloseTimer.current);
      shopCloseTimer.current = null;
    }
    setShopOpen(true);
  }

  function scheduleShopMenuClose() {
    if (shopCloseTimer.current) window.clearTimeout(shopCloseTimer.current);
    shopCloseTimer.current = window.setTimeout(() => {
      setShopOpen(false);
      shopCloseTimer.current = null;
    }, 260);
  }
  useEffect(() => () => {
    if (shopCloseTimer.current) window.clearTimeout(shopCloseTimer.current);
  }, []);

  const { enquiryIds, wishlistIds, cartItems } = useStorefront();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/shop?search=${encodeURIComponent(value)}` : "/shop");
    setMobileOpen(false);
    setShopOpen(false);
  }

  function closeMenu() {
    setShopOpen(false);
    setMobileOpen(false);
  }

  return (
    <header
      className={`site-header ${isHomePage ? (hasScrolled ? "site-header--home-scrolled" : "site-header--home-transparent") : "site-header--glass"}`}
    >
      <div className="container header-main">
        <Link href="/" className="brand-lockup" aria-label="Mr LapShop home" onClick={closeMenu}>
          <Image src="/images/mr-lapshop-logo.webp" alt="Mr LapShop" width={420} height={164} priority className="brand-logo" />
        </Link>

        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <div className="nav-dropdown" onMouseEnter={openShopMenu} onMouseLeave={scheduleShopMenuClose}>
            <button className="nav-dropdown-trigger" type="button" aria-expanded={shopOpen} onClick={() => setShopOpen((open) => !open)}>
              Shop <ChevronDown size={15} aria-hidden="true" />
            </button>
            {shopOpen && (
              <div className="mega-menu mega-menu-expanded" onMouseEnter={openShopMenu} onMouseLeave={scheduleShopMenuClose}>
                <div className="mega-menu-intro">
                  <span className="eyebrow">THE MR LAPSHOP CATALOGUE</span>
                  <h3>Shop your way.</h3>
                  <p>Find a laptop by brand or condition, explore accessories, or get help with repairs and upgrades.</p>
                  <Link className="text-link" href="/shop" onClick={closeMenu}>View all products <span aria-hidden="true">→</span></Link>
                  <div className="mega-menu-callout"><span><Wrench size={16} /></span><p><strong>Need technical help?</strong><small>Repairs, upgrades and setup.</small><Link href="/#services" onClick={closeMenu}>Explore services <span>↗</span></Link></p></div>
                </div>
                <div className="mega-menu-catalog">
                  {menuGroups.map((group) => (
                    <div className="mega-menu-group" key={group.title}>
                      <h4>{group.title}</h4>
                      {group.links.map((item) => {
                        const Icon = item.icon;
                        return <Link href={item.href} key={item.label} onClick={closeMenu}>{"brand" in item && item.brand ? <BrandMark name={item.brand} size={18} /> : <Icon size={16} />}{item.label}<span>↗</span></Link>;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <Link href="/#services">Services</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>

        <div className="header-actions">
          <form className="header-search" onSubmit={handleSearch} role="search">
            <Search size={17} aria-hidden="true" />
            <input aria-label="Search laptops and accessories" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products" />
            <button type="submit" aria-label="Submit search"><span>Enter</span></button>
          </form>
          <Link className="header-icon-link" href="/wishlist" aria-label={`Wishlist${wishlistIds.length ? `, ${wishlistIds.length} saved` : ""}`} title="Wishlist">
            <Heart size={18} aria-hidden="true" />
            {wishlistIds.length > 0 && <span className="header-icon-count">{wishlistIds.length}</span>}
          </Link>
          <Link className="header-icon-link" href="/enquiry" aria-label={`Enquiry list${enquiryIds.length ? `, ${enquiryIds.length} selected` : ""}`} title="Enquiry list"><MessageCircle size={17} aria-hidden="true" />{enquiryIds.length > 0 && <span className="header-icon-count">{enquiryIds.length}</span>}</Link>
          <Link className="header-icon-link header-bag-link" href="/cart" aria-label={`Shopping cart${cartItems.length ? `, ${cartItems.length} product types` : ""}`} title="Shopping cart"><ShoppingCart size={18} aria-hidden="true" />{cartItems.length > 0 && <span className="header-icon-count">{cartItems.length}</span>}</Link>
          <Link className="header-icon-link" href="/account" aria-label="Customer account" title="My account"><UserRound size={17} aria-hidden="true" /></Link>
          <a className="header-phone" href={store.contact.phoneHref} aria-label={`Call ${store.contact.displayNumber}`}><Phone size={17} aria-hidden="true" /></a>
          <button className="mobile-menu-toggle" type="button" onClick={() => setMobileOpen((open) => !open)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mobile-nav-panel">
          <form className="mobile-search" onSubmit={handleSearch} role="search"><Search size={18} aria-hidden="true" /><input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search laptops and accessories" /><button type="submit">Search</button></form>
          {navigation.map((item) => <Link key={item.href} href={item.href} onClick={closeMenu}>{item.label}<span aria-hidden="true">→</span></Link>)}
          <div className="mobile-menu-categories"><strong>Popular categories</strong>{menuGroups.flatMap((group) => group.links).slice(0, 10).map((item) => <Link key={item.label} href={item.href} onClick={closeMenu}>{item.label}<span>↗</span></Link>)}</div>
          <div className="mobile-saved-links"><Link href="/wishlist" onClick={closeMenu}><Heart size={16}/> Wishlist ({wishlistIds.length})</Link><Link href="/enquiry" onClick={closeMenu}><MessageCircle size={16}/> Enquiry list ({enquiryIds.length})</Link><Link href="/cart" onClick={closeMenu}><ShoppingBag size={16}/> Cart ({cartItems.length})</Link><Link href="/account" onClick={closeMenu}><UserRound size={16}/> My account</Link></div>
          <a className="mobile-call" href="/contact"><Phone size={17} /> Phone & WhatsApp · {store.contact.displayNumber}</a>
        </div>
      )}
    </header>
  );
}
