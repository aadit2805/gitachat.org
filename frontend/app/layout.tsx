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
  title: "GitaChat",
  description: "Ask a question. Receive guidance from the Bhagavad Gita.",
  metadataBase: new URL("https://gitachat.org"),
  openGraph: {
    title: "GitaChat",
    description: "Ask a question. Receive guidance from the Bhagavad Gita.",
    url: "https://gitachat.org",
    siteName: "GitaChat",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitaChat",
    description: "Ask a question. Receive guidance from the Bhagavad Gita.",
  },
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#1a1410" },
  ],
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
