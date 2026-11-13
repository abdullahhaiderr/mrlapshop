import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return <main className="not-found-page"><div className="not-found-card card-depth"><Image src="/images/mr-lapshop-logo.webp" alt="Mr LapShop" width={360} height={140} /><span className="eyebrow">404 · PAGE NOT FOUND</span><h1>This page took a wrong turn.</h1><p>The page you are looking for may have moved or may not exist yet.</p><Link className="button button-primary" href="/">Back to homepage</Link></div></main>;
}
