import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    return [
      {
        // Restrict which sites can embed the DUI checkpoints page in an iframe
        source: "/dui-checkpoints",
        headers: [
          {
            key: "Content-Security-Policy",
            // Allow only self and the production locator page host
            value:
              "frame-ancestors 'self' https://themeehanlawfirm.com https://www.themeehanlawfirm.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
