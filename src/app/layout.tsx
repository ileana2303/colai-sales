import type { Metadata, Viewport } from "next";
import { Outfit, Geist } from "next/font/google";

import "./globals.css";

import { QueryProvider } from "@/providers/QueryProvider";
import { BootstrapThemeSync } from "@/components/ui/BootstrapThemeSync";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mavrogenis",
    template: "%s · Mavrogenis",
  },
  description: "Mavrogenis login portal.",
  icons: {
    icon: [{ url: "/favicon.ico" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const runtimeInitScript = `(() => {
  try {
    const themeKey = "colai_theme";
    const stored = localStorage.getItem(themeKey);
    const theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

    document.documentElement.setAttribute("data-bs-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");

    const color = theme === "dark" ? "#0b1220" : "#ffffff";
    document.documentElement.style.backgroundColor = color;
  } catch {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(outfit.className, "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: runtimeInitScript }} />
      </head>
      <body>
        <QueryProvider>
          <BootstrapThemeSync />
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
