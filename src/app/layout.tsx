import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { CursorGlow } from "@/components/layout/CursorGlow";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kiyo — Sri Lanka's Smartest Shopping Assistant",
  description:
    "Chat with Kiyo to find gifts, cakes, flowers, and more delivered across Sri Lanka.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0812",
};

// Runs before paint to apply the saved theme — avoids a flash of the wrong
// theme on load. Defaults to dark when nothing is stored yet.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("kiyo-theme");if(t==="light"){document.documentElement.classList.add("light");}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body suppressHydrationWarning>
        <TooltipProvider delayDuration={200}>
          <CursorGlow />
          <ErrorBoundary>
            <AppShell>{children}</AppShell>
          </ErrorBoundary>
          <Analytics />
        </TooltipProvider>
      </body>
    </html>
  );
}
