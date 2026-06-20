import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "IIST Cafeteria | Book Your Meal",
  description:
    "IIST Trivandrum Cafeteria Booking System — Book meals, view menus, and manage orders with ease.",
  keywords: ["IIST", "cafeteria", "booking", "meal", "trivandrum"],
  authors: [{ name: "IIST Trivandrum" }],
  openGraph: {
    title: "IIST Cafeteria Booking System",
    description: "Book your meals at IIST Trivandrum cafeteria — fast, simple, paperless.",
    type: "website",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
