import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 영화 검색 결과의 TMDB 포스터 이미지 허용
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
};

export default nextConfig;
