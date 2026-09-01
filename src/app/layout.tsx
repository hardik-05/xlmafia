import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "XLRI Notes Portal",
  description: "Domain-restricted study-notes portal for XLRI.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint: applies the saved / system theme and polyfills
// Promise.withResolvers for pdf.js on older browsers.
const BOOT = `
(function(){
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
