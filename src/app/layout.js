import { Inter } from "next/font/google";
import "./globals.css";
import NotificationManager from "../components/NotificationManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MPCPL - Enterprise Chat",
  description: "Real-time communication for modern businesses",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MPCPL Chat",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0ea5e9",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-slate-950 overflow-hidden`}>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(14,165,233,0.15),transparent_50%)] pointer-events-none" />
        <NotificationManager />
        {children}
      </body>
    </html>
  );
}
