# Mr LapShop — Version 1.3

## Delivered in this pass

- Customer YouTube video section is independent of the admin dashboard.
- Add individual YouTube video/Shorts links in `src/config/customer-video-reviews.ts`.
- YouTube Shorts links automatically use portrait card framing unless the owner overrides the format.
- Supported YouTube URL formats: `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`, `youtube.com/embed/...` and `youtube.com/live/...`.
- Uses YouTube's privacy-enhanced `youtube-nocookie.com` embed host.
- No videos or reviews are fabricated. The section shows a ready state until the owner adds real customer videos.
- The owner's YouTube channel is linked as a separate social destination.
- Consolidated the phone and WhatsApp contact data into one number: `0328 1133770`. The website displays the number once and gives separate Call and WhatsApp actions.
- Added social icons in the utility strip above the main header, plus the footer and contact page.
- Added vector brand marks for Apple, HP, Dell, Lenovo, ASUS and Google Chrome/Chromebook identification using the `simple-icons` package.
- Added an interactive Google Maps iframe CTA near the bottom of the homepage using the coordinates resolved from the shop's supplied Maps share link. The Get Directions link continues to use the owner's original Maps short link.
- Standardised subtle card shadows and hover lift, with `prefers-reduced-motion` support.
- Added unit coverage for YouTube URL parsing.

## Important note about brand marks

The icons are from the Simple Icons open icon collection, not a claim of official sponsorship or endorsement by the hardware/social brands. Brand names and marks remain the property of their respective owners. For formal partner marketing, replace these marks with brand-supplied assets and follow the relevant brand guidelines.

## How to add customer videos (without the dashboard)

Edit `src/config/customer-video-reviews.ts` and add one object per individual video:

```ts
export const customerVideoReviews: CustomerVideoReview[] = [
  {
    youtubeUrl: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
    // title: "Customer shares their Mr LapShop experience", // Optional
    caption: "A short, accurate description. Add only with the customer's permission.",
    format: "landscape",
  },
  {
    youtubeUrl: "https://www.youtube.com/shorts/YOUR_SHORTS_ID",
    // title: "A customer collecting their new laptop", // Optional
    format: "portrait",
  },
];
```

Replace the example IDs with real video URLs. The only required field is `youtubeUrl`; `title`, `caption` and `format` are optional. Do not add a YouTube channel URL as an entry; use one video URL per item. Videos must be public or unlisted and have embedding enabled. This file is intentionally separate from admin routes, backend and dashboard data.

## Verification status

- TypeScript/TSX transpile syntax scan: passed for 28 TS/TSX files with no syntax diagnostics.
- YouTube URL parser: ten targeted cases passed using a standalone Node check (watch URL, short URL, Shorts/embed, invalid URL and privacy-enhanced embed output).
- `npm install`, lint, Next.js build and browser checks: not run successfully in the build environment because the npm registry request timed out. Run these on the owner's Windows machine after extracting the ZIP.
- The Google Maps iframe should be checked in the local browser. If Google does not render the no-key search embed in the browser, the owner should supply the Google Maps **Share → Embed a map** iframe URL; this can be placed in `src/config/store.ts`.

## Still not implemented in Version 1.3

Version 1.3 is a polished storefront/frontend pass. It does not include the production database, admin dashboard, live cart, checkout, customer review submission/moderation, order tracking, promo-code engine, giveaway management, customer notifications, payment processing or live inventory. These require the selected backend and the owner inputs in `VERSION-1.3-OWNER-CHECKLIST.md`.
