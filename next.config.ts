import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Hot reload tetap jalan saat dibuka lewat 127.0.0.1 / IP jaringan lokal (mis. tes di HP). Hanya untuk dev.
  allowedDevOrigins: ["127.0.0.1", "192.168.*.*", "10.*.*.*"],
  // Alamat lama Tanya AI (diganti nama jadi Tanya Dea)
  async redirects() {
    return [{ source: "/tanya-ai", destination: "/tanya-dea", permanent: true }];
  },
};

export default nextConfig;
