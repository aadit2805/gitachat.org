import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "GitaChat - Ask a Question, Receive Guidance from the Bhagavad Gita",
  description: "Ask a question and receive wisdom from the Bhagavad Gita. GitaChat provides personalized guidance based on ancient spiritual teachings to help you find answers to life's questions.",
  metadataBase: new URL("https://gitachat.org"),
  keywords: ["Bhagavad Gita", "spiritual guidance", "wisdom", "Krishna", "philosophy", "life questions", "spirituality"],
  authors: [{ name: "GitaChat" }],
  openGraph: {
    title: "GitaChat - Wisdom from the Bhagavad Gita",
    description: "Ask a question and receive wisdom from the Bhagavad Gita. Find guidance based on ancient spiritual teachings.",
    url: "https://gitachat.org",
    siteName: "GitaChat",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitaChat - Wisdom from the Bhagavad Gita",
    description: "Ask a question and receive wisdom from the Bhagavad Gita. Find guidance based on ancient spiritual teachings.",
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${cormorant.variable} ${dmSans.variable} font-serif`}>
          <header className="fixed right-6 top-6 z-50 flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/history"
                className="font-sans text-sm text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                History
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
