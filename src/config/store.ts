export const store = {
  name: "Mr LapShop",
  tagline: "Your next laptop. Expert care. One local team.",
  market: "Pakistan",
  currency: "PKR",
  contact: {
    displayNumber: "0328 1133770",
    phoneHref: "tel:+923281133770",
    whatsappHref: "https://wa.me/923281133770",
  },
  address: {
    line1: "Lower ground shop #32, Techno City 2",
    line2: "6th Road, Satellite Town, Rawalpindi 46300",
    full: "Lower ground shop #32, Techno City 2, 6th Road, Satellite Town, Rawalpindi 46300",
    mapsUrl: "https://maps.app.goo.gl/So8aYqcgUgcJqAuVA",
    // Coordinates resolve from the shop's own Google Maps share link.
    mapEmbedUrl: "https://maps.google.com/maps?q=33.6417334%2C73.0780136&z=16&output=embed",
  },
  hours: {
    summary: "11:00 AM – 9:00 PM, every day except Friday",
    rows: [
      { day: "Monday – Thursday", time: "11:00 AM – 9:00 PM" },
      { day: "Friday", time: "Closed" },
      { day: "Saturday – Sunday", time: "11:00 AM – 9:00 PM" },
    ],
  },
  email: "mrlapshop@gmail.com",
  socialLinks: [
    { label: "YouTube", href: "https://www.youtube.com/@MuhammadUsman-lc5vh" },
    { label: "Instagram", href: "https://www.instagram.com/mr.lapshop/" },
    { label: "TikTok", href: "https://www.tiktok.com/@mr.lapshop1" },
  ] as const,
  paymentMethods: ["JazzCash", "Easypaisa", "UBL Bank Transfer"],
  fulfillmentMethods: ["Home Delivery", "Shop Pickup"],
  orderPolicy: {
    status: "full-payment-before-confirmation",
    paymentRequiredPercent: 100,
    note: "The customer submits an order request. The shop confirms availability and final charges by phone or WhatsApp, then verifies full payment before confirming or processing the order.",
  },
  cancellationPolicy: {
    status: "draft-pending-owner-confirmation",
    discussedFeeRangePkr: [1000, 1500],
    note: "The owner intends to assist with cancellations and returns, with a possible small cancellation fee. Exact eligibility, amount, timing and refund terms are not final.",
  },
  productConditions: ["New", "Used", "Open Box"] as const,
  services: [
    { title: "Laptop & MacBook repair", text: "Technical diagnosis and repair support for laptops and MacBooks." },
    { title: "SSD & RAM upgrades", text: "Upgrade storage and memory to suit your device and workload." },
    { title: "Screen & battery replacement", text: "Replacement support for damaged displays and worn batteries." },
    { title: "Motherboard repair", text: "Hardware troubleshooting and motherboard-level repair support." },
    { title: "Windows & macOS setup", text: "Operating-system installation, setup and configuration." },
    { title: "Pre-delivery setup & maintenance", text: "Purchased laptops can be prepared with drivers, updates and requested setup before handover, alongside routine maintenance." },
  ],
} as const;

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Shop laptops", href: "/shop" },
  { label: "Brands", href: "/#brands" },
  { label: "Accessories", href: "/shop?category=accessories" },
  { label: "Repairs & upgrades", href: "/#services" },
  { label: "Contact", href: "/contact" },
] as const;

export const catalogueCategories = [
  { label: "All laptops", slug: "laptops", group: "Laptops" },
  { label: "Apple MacBooks", slug: "macbook", group: "Laptops" },
  { label: "HP laptops", slug: "hp", group: "Laptops" },
  { label: "Dell laptops", slug: "dell", group: "Laptops" },
  { label: "Lenovo laptops", slug: "lenovo", group: "Laptops" },
  { label: "ASUS laptops", slug: "asus", group: "Laptops" },
  { label: "Chromebooks", slug: "chromebook", group: "Laptops" },
  { label: "Gaming laptops", slug: "gaming", group: "Laptops" },
  { label: "Business laptops", slug: "business", group: "Laptops" },
  { label: "Headphones", slug: "headphones", group: "Accessories" },
  { label: "Microphones", slug: "microphones", group: "Accessories" },
  { label: "Keyboards", slug: "keyboards", group: "Accessories" },
  { label: "Mice", slug: "mice", group: "Accessories" },
  { label: "Gaming consoles", slug: "consoles", group: "Accessories" },
  { label: "Other accessories", slug: "accessories", group: "Accessories" },
] as const;
