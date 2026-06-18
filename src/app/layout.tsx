import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./globals.css";

import { StoreProvider } from "@/store/StoreProvider";
import { BootstrapThemeSync } from "@/components/ui/BootstrapThemeSync";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ColAI",
    template: "%s · ColAI",
  },
  description: "Sales tools and reports for Mavrogenis.",
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
    <html lang="en" className={outfit.className} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark light" />
        <script dangerouslySetInnerHTML={{ __html: runtimeInitScript }} />
      </head>
      <body>
        <StoreProvider>
          <BootstrapThemeSync />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
