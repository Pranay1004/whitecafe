import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://whitecafe.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "IIST Cafeteria — Book Your Meal Online | Trivandrum",
    template: "%s | IIST Cafeteria",
  },
  description:
    "Order food online from IIST Trivandrum cafeteria. Browse the full menu — veg, non-veg, rice, noodles, parota and more. Book your slot, skip the queue. Fast & paperless.",
  keywords: [
    "IIST cafeteria",
    "IIST Trivandrum food",
    "IIST canteen menu",
    "cafeteria booking",
    "IIST meal booking",
    "college canteen trivandrum",
    "online food ordering IIST",
    "IIST Thiruvananthapuram",
  ],
  authors: [{ name: "IIST Trivandrum" }],
  creator: "IIST Trivandrum",
  publisher: "IIST Trivandrum",
  category: "Food & Restaurant",

  // ── Open Graph ───────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: BASE_URL,
    siteName: "IIST Cafeteria",
    title: "IIST Cafeteria — Skip the Queue, Book Online",
    description:
      "Browse the full menu and pre-book your meal at IIST Trivandrum cafeteria. Veg & Non-Veg options, real prices, QR code pickup.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "IIST Cafeteria Menu & Booking",
      },
    ],
  },

  // ── Twitter / X Card ─────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "IIST Cafeteria — Book Your Meal Online",
    description:
      "Pre-order food at IIST Trivandrum cafeteria. Full menu, real prices, skip the queue with QR code.",
    images: [`${BASE_URL}/og-image.png`],
  },

  // ── Canonical & Indexing ─────────────────────────────────────────────────────
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// ── Viewport (must be separate from metadata in Next.js 14+) ─────────────────
export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ── JSON-LD Structured Data (Restaurant schema) ───────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  name: "IIST Cafeteria",
  alternateName: "IIST Trivandrum Canteen",
  url: BASE_URL,
  description:
    "The cafeteria of the Indian Institute of Space Science and Technology, Trivandrum. Serving fresh veg and non-veg meals daily.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "IIST Campus, Valiamala",
    addressLocality: "Thiruvananthapuram",
    addressRegion: "Kerala",
    postalCode: "695547",
    addressCountry: "IN",
  },
  servesCuisine: ["South Indian", "Indian", "Chinese"],
  priceRange: "₹8 – ₹100",
  hasMenu: `${BASE_URL}/menu`,
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Preconnect to Google Fonts CDN */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
