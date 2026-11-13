# Mr LapShop design system

## Direction

A neat, product-first technology store: clean white and soft-neutral catalogue surfaces, deep navy hero/footer, and a single yellow accent taken from the supplied mascot logo. The reference site's structure and generous spacing inform the layout, but its text, images, prices and branding are not reused.

## Brand assets

The owner supplied a transparent 1697×660 PNG logo. It is included as `public/images/mr-lapshop-logo.png`; the site uses an optimised WebP copy on the light header and navy footer. The favicon and Apple touch icon are temporary editable SVG placeholders and can be replaced by the owner later.

## Colour tokens

| Token | Value | Use |
|---|---|---|
| `--yellow-500` | `#FFE600` | Primary buttons, emphasis, highlights |
| `--yellow-600` | `#F2D600` | Button hover |
| `--yellow-100` | `#FFF9CC` | Soft badges and icon surfaces |
| `--yellow-50` | `#FFFDF0` | Subtle tinted panels |
| `--ink-950` | `#070D1F` | Hero and footer |
| `--ink-900` | `#0B1530` | Primary text and dark buttons |
| `--ink-800` | `#10264C` | Secondary navy surfaces |
| `--slate-600` | `#4B5568` | Body copy |
| `--line` | `#E5E8EF` | Borders |
| `--surface-2` | `#F5F6FA` | Neutral section background |
| `--blue-500` | `#0BB1FC` | Focus and restrained info accents |

Yellow is used as a background/fill, not small text on white. Text on yellow uses dark navy.

## Typography and spacing

- Display: Sora (400–800)
- Text: DM Sans (400–700)
- Base spacing: 4 px
- Main container: 1240 px max, 16–24 px mobile gutters
- Buttons/cards: 9–13 px radius; large panels: 16–20 px radius
- Body copy: 12–16 px depending on component, readable contrast and line height

## Layout rules

- Sticky primary header with slim utility strip, compact navigation, search and a grouped multi-column shop mega menu. The utility strip carries YouTube, Instagram and TikTok links; the same social links appear in the footer and contact page.
- Hero is the primary navy brand moment; product content remains on light surfaces.
- Homepage follows a retail discovery journey: hero → factual trust strip → shop discovery cards → featured product cards → brands → services → laptop preparation steps → customer stories/reviews area → store visit → FAQs → CTA.
- Discovery cards help shoppers start by brand, condition, accessories or support. Keep navigation groups editable from store/catalogue configuration as the backend arrives.
- Product cards use a neutral image surface, condition badge, sample marker, brand mark, clean product name, concise spec chips, unit-specific warranty note, truthful price/availability status and a prominent WhatsApp enquiry action. The current stage uses enquiry because sample records do not have real prices or inventory; do not imply checkout is live.
- Customer video testimonials are sourced from individual YouTube URLs in `src/config/customer-video-reviews.ts`, deliberately outside the admin dashboard. No fake videos, reviews, names, star ratings or review counts are shown. Written verified-purchase reviews and admin approval are a separate future backend feature.
- Store support and service sections must use only confirmed owner-provided details. Do not claim nationwide delivery, free delivery, official licences, fixed warranty periods or other unconfirmed promises.
- Footer repeats the full logo only on navy, shows the phone/WhatsApp number once with two separate actions, and includes social icons. The homepage utility strip also has social icons. The store-location CTA uses the owner-provided map pin and links to the original directions URL.
- Cards share a light shadow and restrained hover lift for a subtle 3D feel. Motion is disabled under `prefers-reduced-motion`.

## Content integrity

All six product pictures and current product listings are placeholders. No real prices, stock, discounts, ratings, written reviews, warranty terms or customer claims are shown. Use only owner-approved catalogue data once the owner-selected backend is connected. Brand marks are sourced from the Simple Icons collection and are not a claim of manufacturer endorsement.

## Version 1.7 polish

- Header: translucent white glass treatment (not an opaque white bar) with a soft white gradient, backdrop blur/saturation, fine white border and restrained shadow. Keep the existing sticky position, logo, nav links, mega menu, actions and mobile navigation. Maintain strong contrast and a readable fallback where `backdrop-filter` is unsupported.
- Preserve the homepage services section, its copy, layout and cards; it is a previously approved section and is not part of the catalogue-integration redesign.
- Product cards show live price and stock only for published database records. Preview products retain an explicit sample label and must never look orderable.
- Product detail pages use the owner-uploaded product gallery and database fields. Live products without photos use a neutral laptop-outline placeholder; never reuse a sample product photo as if it showed the live unit. Do not infer specifications or warranty claims from images.
- Customer order tracking uses status-only progress; do not invent status timestamps or delivery estimates.
