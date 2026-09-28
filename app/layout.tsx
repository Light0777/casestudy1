import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { COMPANY } from "./data";

const inter = Inter({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-sans" });
const luxe = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-luxe" });

export const metadata: Metadata = {
  title: `${COMPANY} | Building Construction & Engineering`,
  description:
    "Premium building construction and engineering company delivering residential, commercial and industrial projects with precision and advanced technology.",
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${luxe.variable}`}>
      <body>{props.children}</body>
    </html>
  );
}
