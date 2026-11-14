import { store } from "@/config/store";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://mrlapshop.vercel.app").replace(/\/+$/, "");
}

/** Safely serialize JSON-LD so user-controlled text cannot terminate its script element. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function getStoreStructuredData() {
  const siteUrl = getSiteUrl();
  const logo = `${siteUrl}/images/mr-lapshop-logo.webp`;
  const sameAs = store.socialLinks.map((item) => item.href);
  const address = {
    "@type": "PostalAddress",
    streetAddress: `${store.address.line1}, ${store.address.line2}`,
    addressLocality: "Rawalpindi",
    addressRegion: "Punjab",
    postalCode: "46300",
    addressCountry: "PK",
  };
  const openingHoursSpecification = [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "https://schema.org/Monday",
        "https://schema.org/Tuesday",
        "https://schema.org/Wednesday",
        "https://schema.org/Thursday",
        "https://schema.org/Saturday",
        "https://schema.org/Sunday",
      ],
      opens: "11:00",
      closes: "21:00",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: store.name,
        url: siteUrl,
        logo: { "@type": "ImageObject", url: logo },
        email: store.email,
        telephone: "+923281133770",
        sameAs,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+923281133770",
          contactType: "customer service",
          areaServed: ["Rawalpindi", "Islamabad", "PK"],
          availableLanguage: ["English", "Urdu"],
        },
      },
      {
        "@type": "Store",
        "@id": `${siteUrl}/#local-store`,
        name: store.name,
        url: siteUrl,
        image: `${siteUrl}/opengraph-image`,
        logo,
        description: "New, used and open-box laptops, accessories, laptop repairs and upgrades in Rawalpindi and Islamabad.",
        telephone: "+923281133770",
        email: store.email,
        address,
        geo: {
          "@type": "GeoCoordinates",
          latitude: 33.6417334,
          longitude: 73.0780136,
        },
        openingHoursSpecification,
        sameAs,
        areaServed: [
          { "@type": "City", name: "Rawalpindi" },
          { "@type": "City", name: "Islamabad" },
        ],
        parentOrganization: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: store.name,
        url: siteUrl,
        inLanguage: "en-PK",
        publisher: { "@id": `${siteUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/shop?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
