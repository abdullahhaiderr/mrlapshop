import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl, serializeJsonLd } from "@/lib/seo";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

describe("canonical SEO helpers", () => {
  it("uses the official Mr LapShop domain when the site URL is not configured", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("https://mrlapshop.pk");
  });

  it("removes trailing slashes from a configured site URL", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://mrlapshop.pk///";
    expect(getSiteUrl()).toBe("https://mrlapshop.pk");
  });

  it("escapes HTML-sensitive characters in structured data", () => {
    const serialized = serializeJsonLd({ headline: "</script><script>alert(1)</script>" });
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script\\u003e");
  });
});
