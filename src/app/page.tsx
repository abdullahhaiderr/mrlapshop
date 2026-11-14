import { HomePage } from "@/components/home/home-page";
import { getPublicCatalogue } from "@/lib/catalogue";
import { getPublicVideoTestimonials } from "@/lib/testimonials";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laptops, Accessories & Repairs in Rawalpindi",
  description: "Shop new, used and open-box laptops, accessories and expert laptop repairs at Mr LapShop, Techno City 2, Rawalpindi. Serving Rawalpindi and Islamabad.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const [catalogue, testimonials] = await Promise.all([
    getPublicCatalogue(),
    getPublicVideoTestimonials(),
  ]);
  return <HomePage catalogue={catalogue} testimonials={testimonials} />;
}
