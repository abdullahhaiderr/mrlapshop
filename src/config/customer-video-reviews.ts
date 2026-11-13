/**
 * Customer video testimonials are intentionally independent of the admin dashboard.
 * Paste each real YouTube video or Shorts URL below. Do not add a channel URL here;
 * each entry must point to one individual video.
 *
 * Example:
 * {
 *   youtubeUrl: "https://www.youtube.com/watch?v=VIDEO_ID",
 *   // title: "Customer shares their laptop buying experience", // Optional
 *   caption: "A short note about the customer's experience.",
 *   format: "landscape", // Use "portrait" for YouTube Shorts.
 * }
 */
export type CustomerVideoReview = {
  youtubeUrl: string;
  title?: string;
  caption?: string;
  format?: "landscape" | "portrait";
};

export const customerVideoReviews: CustomerVideoReview[] = [
  {
    youtubeUrl: "https://www.youtube.com/shorts/W6DuRH8R5VY",
    title: "Customer video 01",
    format: "portrait",
  },
  {
    youtubeUrl: "https://www.youtube.com/shorts/pJD_msTOEm0",
    title: "Customer video 02",
    format: "portrait",
  },
  {
    youtubeUrl: "https://www.youtube.com/shorts/Hc4XS4sdFB0",
    title: "Customer video 03",
    format: "portrait",
  },
  {
    youtubeUrl: "https://www.youtube.com/shorts/6b28CkpNRJI",
    title: "Customer video 04",
    format: "portrait",
  },
];
