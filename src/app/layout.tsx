import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "XL Notes",
  description: "Domain-restricted study-notes portal for the XLRI batch.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint: applies a saved dark override (default is light for
// everyone) and polyfills Promise.withResolvers for pdf.js on older browsers.
const BOOT = `
(function(){
  try {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.dataset.theme = 'light';
    }
  } catch (e) {}
  if (typeof Promise.withResolvers !== 'function') {
    Promise.withResolvers = function () {
      var a, b, p = new Promise(function (res, rej) { a = res; b = rej; });
      return { promise: p, resolve: a, reject: b };
    };
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
