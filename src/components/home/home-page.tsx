import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Laptop,
  Monitor, MapPin, Clock3, Phone, Wrench, HardDrive,
  MonitorCog, BatteryCharging, PackageCheck, ChevronDown,
} from "lucide-react";
import { store } from "@/config/store";
import type { CatalogueSnapshot } from "@/lib/catalogue";
import { ProductCard } from "@/components/product/product-card";
import { BrandMark } from "@/components/brand/brand-mark";
import { LatestArrivalsMarquee } from "@/components/home/latest-arrivals-marquee";
import { HeroLaptopCarousel } from "@/components/home/hero-laptop-carousel";

const discoveryCards = [
  {
    eyebrow: "CHOOSE A MAKER",
    title: "Shop by brand",
    description: "Apple, HP, Dell, Lenovo, ASUS and more.",
    image: "/images/laptop-01.webp",
    href: "/shop",
    action: "Explore brands",
    tone: "discovery-yellow",
  },
  {
    eyebrow: "FIND YOUR FIT",
    title: "Shop by condition",
    description: "Compare new, used and open-box devices.",
    image: "/images/laptop-05.webp",
    href: "/shop",
    action: "Compare conditions",
    tone: "discovery-blue",
  },
  {
    eyebrow: "BUILD YOUR SETUP",
    title: "Shop accessories",
    description: "Headphones, mics, keyboards, mice and consoles.",
    image: "/images/laptop-03.webp",
    href: "/shop?category=accessories",
    action: "Browse accessories",
    tone: "discovery-dark",
  },
  {
    eyebrow: "NEED A HAND?",
    title: "Repairs & upgrades",
    description: "Get help with repairs, SSD/RAM upgrades and setup.",
    image: "/images/laptop-04.webp",
    href: "/#services",
    action: "Explore services",
    tone: "discovery-light",
  },
];

const serviceIcons = [Wrench, HardDrive, Monitor, MonitorCog, Laptop, BatteryCharging];

const setupSteps = [
  { number: "01", title: "System setup", text: "Operating system installation and configuration." },
  { number: "02", title: "Drivers & updates", text: "Drivers and essential system updates installed." },
  { number: "03", title: "Requested software", text: "Software setup based on the customer's request." },
  { number: "04", title: "Ready for handover", text: "A prepared laptop for collection or delivery." },
];

const faqs = [
  { question: "Which laptop conditions are available?", answer: "Mr LapShop lists new, used and open-box laptops. The exact condition of each unit is shown on its product listing." },
  { question: "Does every laptop have the same warranty?", answer: "No. Warranty details are set separately for each product and will be displayed with that unit's listing." },
  { question: "Can I visit the shop before buying?", answer: "Yes. Visit Lower ground shop #32, Techno City 2, 6th Road, Satellite Town, Rawalpindi." },
  { question: "Can you upgrade or repair my laptop?", answer: "The shop offers laptop and MacBook repair, SSD and RAM upgrades, screen and battery replacement, motherboard repair, OS installation and maintenance services. Contact the team to discuss your device." },
];

const brandTiles = [
  { name: "Apple", label: "Apple", href: "/shop?category=macbook" },
  { name: "HP", label: "HP", href: "/shop?category=hp" },
  { name: "Dell", label: "Dell", href: "/shop?category=dell" },
  { name: "Lenovo", label: "Lenovo", href: "/shop?category=lenovo" },
  { name: "ASUS", label: "ASUS", href: "/shop?category=asus" },
  { name: "Chromebook", label: "Chromebooks", href: "/shop?category=chromebook" },
];

export function HomePage({ catalogue }: { catalogue: CatalogueSnapshot }) {
  const featuredProducts = (catalogue.products.filter((product) => product.featured).length ? catalogue.products.filter((product) => product.featured) : catalogue.products).slice(0, 8);
  const isLiveCatalogue = catalogue.mode === "live";
  const latestArrivals = isLiveCatalogue ? catalogue.products : [];
  const beastProducts = isLiveCatalogue ? catalogue.products.filter((product) => product.performancePick && (product.stock ?? 0) > 0).slice(0, 4) : [];

  return (
    <main>
      <section className="hero-section">
        <div className="hero-orbit hero-orbit-one" />
        <div className="hero-orbit hero-orbit-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow eyebrow-on-dark"><span className="eyebrow-line" /> YOUR LOCAL TECH DESTINATION</span>
            <h1>Find the right tech. Get <em>the right support.</em></h1>
            <p>Explore new, used and open-box laptops, shop everyday tech accessories, or get expert repair and upgrade support in Rawalpindi and Islamabad.</p>
            <div className="hero-actions">
              <Link href="/shop" className="button button-primary">Explore the catalogue <ArrowRight size={18} /></Link>
              <Link href={store.contact.whatsappHref} target="_blank" rel="noreferrer" className="button button-ghost-light">Talk to our team <ArrowUpRight size={17} /></Link>
            </div>
            <div className="hero-caption"><span className="hero-caption-dot" /> Lower Ground Shop #32 · Techno City 2 · Rawalpindi</div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual-glow" />
            <HeroLaptopCarousel />
            <div className="hero-floating-card hero-floating-top"><span className="floating-icon"><Laptop size={17} /></span><span><strong>Find your next laptop</strong><small>Explore leading brands</small></span></div>
            <div className="hero-floating-card hero-floating-bottom"><span className="floating-icon floating-icon-yellow"><Wrench size={17} /></span><span><strong>Care beyond the sale</strong><small>Repairs, upgrades & setup</small></span></div>
            <div className="hero-spark hero-spark-one">✦</div>
            <div className="hero-spark hero-spark-two">✧</div>
          </div>
        </div>
        <div className="container hero-bottom-row"><span>MR LAPSHOP</span><span className="hero-bottom-rule" /><span>NEW · USED · OPEN BOX · ACCESSORIES · REPAIRS</span></div>
      </section>

      <section className="trust-strip" aria-label="Mr LapShop services and shopping options">
        <div className="container trust-strip-grid">
          <div><PackageCheck size={20} /><span><strong>Three product conditions</strong><small>New · Used · Open Box</small></span></div>
          <div><Wrench size={20} /><span><strong>Technical support</strong><small>Repairs & upgrades</small></span></div>
          <div><MonitorCog size={20} /><span><strong>Device preparation</strong><small>OS, drivers & setup</small></span></div>
          <div><MapPin size={20} /><span><strong>Visit our shop</strong><small>Satellite Town, Rawalpindi</small></span></div>
        </div>
      </section>

      <section className="section-block discovery-section">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div><span className="eyebrow">SHOP YOUR WAY</span><h2>Find your next <em>device.</em></h2><p>Start with a brand, condition, accessory or service.</p></div>
            <Link className="text-link" href="/shop">View the catalogue <ArrowUpRight size={17} /></Link>
          </div>
          <div className="discovery-grid">
            {discoveryCards.map((card) => (
              <Link className={`discovery-card card-depth ${card.tone}`} href={card.href} key={card.title}>
                <div className="discovery-copy"><span>{card.eyebrow}</span><h3>{card.title}</h3><p>{card.description}</p><strong>{card.action} <ArrowUpRight size={15} /></strong></div>
                <div className="discovery-image"><Image src={card.image} alt="Illustrative product category placeholder" fill sizes="(max-width: 700px) 45vw, 20vw" /></div>
              </Link>
            ))}
          </div>
          <div className="condition-shortcuts"><span>Shop by condition</span>{store.productConditions.map((condition) => <Link href={`/shop?condition=${condition.toLowerCase().replaceAll(" ", "-")}`} key={condition}>{condition}<ArrowUpRight size={13} /></Link>)}</div>
        </div>
      </section>

      <section className="section-block featured-section">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div><span className="eyebrow">EXPLORE THE RANGE</span><h2>Featured <em>laptops.</em></h2><p>{isLiveCatalogue ? "Explore products currently published by Mr LapShop, with the latest listed prices and availability." : catalogue.mode === "empty" ? "The live catalogue is connected. New products will appear here as the shop publishes them." : "Browse the storefront preview. Real products will appear here once the shop publishes verified inventory."}</p></div>
            <Link className="text-link" href="/shop">View all laptops <ArrowUpRight size={17} /></Link>
          </div>
          {catalogue.mode === "preview" && <div className="sample-notice"><BadgeCheck size={17} /><span>{catalogue.connectionWarning ? "The live catalogue could not be reached. The clearly labelled sample preview is shown instead." : "Sample catalogue only. Images are illustrative; exact models, configurations, price, stock and warranty must be confirmed by the shop."}</span></div>}
          {featuredProducts.length > 0 ? <div className="product-grid product-grid-enhanced">{featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-results"><h3>No featured products yet</h3><p>The shop has not published any featured products. Please check the full catalogue or visit again soon.</p><Link href="/shop" className="button button-dark">Browse the catalogue <ArrowRight size={17}/></Link></div>}
        </div>
      </section>

      <LatestArrivalsMarquee products={latestArrivals} />

      <section className="section-block beast-collection-section" aria-labelledby="beast-collection-title">
        <div className="container">
          <div className="section-heading section-heading-row beast-collection-heading">
            <div><span className="eyebrow eyebrow-on-dark">BUILT FOR MORE</span><h2 id="beast-collection-title">The <em>Beast Collection.</em></h2><p>Upgraded and high-performance laptops selected by the Mr LapShop team for demanding work, creative tasks and gaming.</p></div>
            <Link className="text-link" href="/shop">Explore performance laptops <ArrowUpRight size={17} /></Link>
          </div>
          {beastProducts.length ? <div className="product-grid product-grid-enhanced beast-product-grid">{beastProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="beast-empty"><span className="beast-empty-mark"><Laptop size={24}/></span><div><strong>Power picks are being curated.</strong><p>The owner can select any published, in-stock high-performance or upgraded laptop in the product editor to feature it here.</p></div><Link href="/shop">View all laptops <ArrowRight size={15}/></Link></div>}
        </div>
      </section>

      <section className="section-block brand-section" id="brands">
        <div className="container brand-section-grid">
          <div className="brand-section-copy"><span className="eyebrow">BRANDS & DEVICE TYPES</span><h2>One shop. <em>Plenty of choice.</em></h2><p>Browse Apple MacBooks, HP, Dell, Lenovo, ASUS and Chromebooks. The product catalogue can be expanded as the shop adds more brands and individual units.</p><Link href="/shop" className="button button-dark">Explore all listings <ArrowRight size={17} /></Link></div>
          <div className="brand-tiles">{brandTiles.map((brand, index) => <Link href={brand.href} className={`brand-tile card-depth brand-tile-${index % 4}`} key={brand.name}><span className="brand-tile-logo"><BrandMark name={brand.name} size={34} /></span><strong>{brand.label}</strong><small>Browse {brand.label}</small><ArrowUpRight size={15} /></Link>)}</div>
        </div>
      </section>

      <section className="section-block service-section" id="services">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div><span className="eyebrow">MORE THAN A LAPTOP STORE</span><h2>Support for your <em>whole setup.</em></h2><p>From hardware repairs to upgrades and operating-system setup, get practical technical support.</p></div>
            <Link className="text-link" href="/contact">Ask about a service <ArrowUpRight size={17} /></Link>
          </div>
          <div className="service-grid">{store.services.map((service, index) => { const Icon = serviceIcons[index] ?? Wrench; return <article className="service-card card-depth" key={service.title}><span className="service-icon"><Icon size={22} /></span><div><h3>{service.title}</h3><p>{service.text}</p></div></article>; })}</div>
          <div className="service-footnote">Service availability, parts, diagnosis and repair estimates are confirmed by the shop for each device.</div>
        </div>
      </section>

      <section className="section-block setup-section">
        <div className="container setup-panel">
          <div className="setup-panel-heading"><span className="eyebrow eyebrow-on-dark">READY FOR YOUR FIRST DAY</span><h2>A little more care <em>before handover.</em></h2><p>When a customer purchases a laptop, the shop can prepare the system with drivers, updates and requested software before it is handed over.</p><Link href={store.contact.whatsappHref} target="_blank" rel="noreferrer" className="button button-primary">Ask about laptop setup <ArrowRight size={17} /></Link></div>
          <div className="setup-steps">{setupSteps.map((step) => <div className="setup-step card-depth" key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div><BadgeCheck size={19} /></div>)}</div>
        </div>
      </section>


      <section className="section-block faq-section">
        <div className="container faq-layout">
          <div className="faq-intro"><span className="eyebrow">NEED TO KNOW</span><h2>Questions before <em>you shop?</em></h2><p>Some details depend on the exact laptop or service. Contact the shop for unit-specific information.</p><Link className="text-link" href="/contact">Ask another question <ArrowUpRight size={16} /></Link></div>
          <div className="faq-list">{faqs.map((item, index) => <details className="faq-item" key={item.question} open={index === 0}><summary>{item.question}<ChevronDown size={18} /></summary><p>{item.answer}</p></details>)}</div>
        </div>
      </section>

      <section className="final-cta-section">
        <div className="container final-cta-inner"><div><span className="eyebrow">YOUR NEXT TECH UPGRADE</span><h2>Find it at <em>Mr LapShop.</em></h2><p>Browse laptops and accessories or talk to the team about repairs and upgrades.</p></div><div className="final-cta-actions"><Link href="/shop" className="button button-dark">Shop the catalogue <ArrowRight size={18} /></Link><Link href={store.contact.whatsappHref} target="_blank" rel="noreferrer" className="final-cta-link">WhatsApp the shop <ArrowUpRight size={17} /></Link></div></div>
      </section>
      <section className="section-block store-section" id="visit-store">
        <div className="container store-map-cta card-depth">
          <div className="store-card-copy">
            <span className="eyebrow">VISIT OUR RAWALPINDI STORE</span>
            <h2>Come in, <em>see it for yourself.</em></h2>
            <p>Visit Mr LapShop at Techno City 2. Explore available devices, discuss upgrades or get help with a repair.</p>
            <div className="store-detail"><MapPin size={19} /><span>{store.address.full}</span></div>
            <div className="store-detail"><Clock3 size={19} /><span>{store.hours.summary}</span></div>
            <div className="store-actions">
              <Link className="button button-primary" href={store.address.mapsUrl} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={17} /></Link>
              <a className="store-phone-link" href={store.contact.phoneHref}><Phone size={17} /> {store.contact.displayNumber}</a>
            </div>
          </div>
          <div className="store-map-frame">
            <iframe
              src={store.address.mapEmbedUrl}
              title="Google Map showing Mr LapShop in Techno City 2, Rawalpindi"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="store-map-label"><MapPin size={15} /><span><strong>Mr LapShop</strong><small>Techno City 2 · 6th Road · Rawalpindi</small></span></div>
          </div>
        </div>
      </section>
    </main>
  );
}
