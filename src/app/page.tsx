import { HomePage } from "@/components/home/home-page";
import { getPublicCatalogue } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export default async function Page() {
  const catalogue = await getPublicCatalogue();
  return <HomePage catalogue={catalogue} />;
}
