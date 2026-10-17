import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import { CartProvider } from "@/components/cart-context";
import { LanguageProvider } from "@/components/language-context";
import { SiteShell } from "@/components/site-shell";
import { ThemeProvider } from "@/components/theme-context";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700", "900"],
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "H B C Achar Shop | স্বাদের ঐতিহ্য",
  description:
    "HBCA Achar Shop provides premium Bangladeshi pickles, balachao, combo packs, and fast local delivery.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-transparent text-slate-900">
        <ThemeProvider>
          <LanguageProvider>
            <CartProvider>
              <SiteShell>{children}</SiteShell>
            </CartProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
