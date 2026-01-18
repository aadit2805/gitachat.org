import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Nav } from "./components/Nav";
import { Providers } from "./providers";
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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
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
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "hsl(28, 85%, 52%)",
          colorBackground: "hsl(35, 30%, 95%)",
          colorInputBackground: "hsl(35, 25%, 98%)",
          colorInputText: "hsl(25, 30%, 20%)",
          colorText: "hsl(25, 30%, 20%)",
          colorTextSecondary: "hsl(25, 15%, 45%)",
          colorDanger: "hsl(0, 60%, 50%)",
          borderRadius: "0.5rem",
          fontFamily: "var(--font-sans)",
        },
        elements: {
          formButtonPrimary:
            "bg-[hsl(28,85%,52%)] hover:bg-[hsl(28,85%,47%)] text-white font-medium",
          card: "bg-[hsl(35,30%,95%)] border border-[hsl(35,20%,88%)] shadow-xl",
          headerTitle: "text-[hsl(25,30%,20%)] text-xl font-medium",
          headerSubtitle: "text-[hsl(25,15%,45%)]",
          socialButtonsBlockButton:
            "bg-[hsl(35,25%,98%)] border-[hsl(35,20%,85%)] text-[hsl(25,30%,20%)] hover:bg-[hsl(35,25%,93%)]",
          socialButtonsBlockButtonText: "text-[hsl(25,30%,20%)] font-normal",
          dividerLine: "bg-[hsl(35,20%,85%)]",
          dividerText: "text-[hsl(25,15%,55%)]",
          formFieldLabel: "text-[hsl(25,25%,30%)]",
          formFieldInput:
            "bg-[hsl(35,25%,98%)] border-[hsl(35,20%,85%)] text-[hsl(25,30%,20%)] focus:border-[hsl(28,85%,52%)] focus:ring-[hsl(28,85%,52%)]",
          footerActionLink: "text-[hsl(28,85%,45%)] hover:text-[hsl(28,85%,40%)]",
          identityPreview: "bg-[hsl(35,25%,98%)] border-[hsl(35,20%,85%)]",
          identityPreviewText: "text-[hsl(25,30%,20%)]",
          identityPreviewEditButton: "text-[hsl(28,85%,45%)]",
          userButtonPopoverCard: "bg-[hsl(35,30%,95%)] border-[hsl(35,20%,88%)]",
          userButtonPopoverActionButton: "text-[hsl(25,30%,20%)] hover:bg-[hsl(35,25%,90%)]",
          userButtonPopoverActionButtonText: "text-[hsl(25,30%,20%)]",
          userButtonPopoverActionButtonIcon: "text-[hsl(25,15%,45%)]",
          userButtonPopoverFooter: "border-t-[hsl(35,20%,88%)]",
          userPreviewMainIdentifier: "text-[hsl(25,30%,20%)]",
          userPreviewSecondaryIdentifier: "text-[hsl(25,15%,45%)]",
        },
      }}
    >
      <html lang="en">
        <body className={`${cormorant.variable} ${dmSans.variable} font-serif`}>
          <Nav />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
