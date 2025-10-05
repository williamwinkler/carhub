import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../lib/auth-context";
import Provider from "./_trpc/Provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CarHub - Find Your Perfect Car",
    template: "%s | CarHub",
  },
  description:
    "Discover, search, and manage your car listings with CarHub. Find the perfect vehicle from thousands of listings.",
  keywords: [
    "cars",
    "vehicles",
    "auto",
    "marketplace",
    "buy cars",
    "sell cars",
  ],
  authors: [{ name: "CarHub Team" }],
  creator: "CarHub",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "http://localhost:3000",
    title: "CarHub - Find Your Perfect Car",
    description:
      "Discover, search, and manage your car listings with CarHub. Find the perfect vehicle from thousands of listings.",
    siteName: "CarHub",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CarHub - Car Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarHub - Find Your Perfect Car",
    description: "Discover, search, and manage your car listings with CarHub.",
    images: ["/og-image.jpg"],
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800`}
      >
        <Provider>
          <AuthProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
            <Toaster
              position="bottom-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#1e293b",
                  color: "#f1f5f9",
                  border: "1px solid #475569",
                },
              }}
            />
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
