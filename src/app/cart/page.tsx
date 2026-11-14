import { CartContent } from "@/components/cart/cart-content";
import { getPublicCatalogue } from "@/lib/catalogue";

export const metadata = { title: "Shopping cart | Mr LapShop", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const catalogue = await getPublicCatalogue();
  return <CartContent catalogueProducts={catalogue.products} />;
}
