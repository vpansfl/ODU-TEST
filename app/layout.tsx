import type { Metadata, Viewport } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";

// 제목용 극장 간판 느낌 글꼴
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Movie Log",
  description: "영화 감상 기록장",
};

export const viewport: Viewport = {
  themeColor: "#15110f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={bebasNeue.variable}>
      <body>{children}</body>
    </html>
  );
}
