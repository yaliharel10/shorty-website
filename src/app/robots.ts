import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/browse", "/films/", "/people/", "/subscription", "/help", "/privacy", "/terms"],
        disallow: ["/admin", "/api/", "/account", "/test", "/demo", "/reset-password"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
