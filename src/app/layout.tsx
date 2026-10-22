import type { Metadata, Viewport } from "next";
import "@/styles/tokens.css";
import "./globals.css";
import { bricolage, figtree } from "./fonts";
import { HouseholdProvider } from "@/components/HouseholdProvider";

const description = "On mange quoi ce soir ?";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Kaddy", template: "%s · Kaddy" },
  description,
  applicationName: "Kaddy",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Kaddy", statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Kaddy",
    title: "Kaddy",
    description,
    images: [{ url: "/kaddy-og.jpg", width: 1200, height: 630, alt: "Kaddy" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kaddy",
    description,
    images: ["/kaddy-og.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#F9D86E", // = --kd-sun, same as site.webmanifest
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${bricolage.variable} ${figtree.variable}`}>
      <body>
        <HouseholdProvider>{children}</HouseholdProvider>
      </body>
    </html>
  );
}
