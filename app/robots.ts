import type { MetadataRoute } from "next";

const SITE = "https://www.lawyard.org";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private and transactional areas.
        disallow: ["/admin", "/dashboard", "/api/", "/checkout", "/cart", "/login", "/signup"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
