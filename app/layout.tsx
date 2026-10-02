import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import type { Viewport } from "next";
import { RegisterSW } from "@/components/register-sw";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Atbit", template: "%s | Atbit" },
  description: "AI-powered personal budget tracker with voice logging.",
  applicationName: "Atbit",
  icons: { icon: "/favicon.ico", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Atbit", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#0f766e" };

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const jar = await cookies();
  const cls = [
    jakarta.variable,
    "antialiased",
    jar.get("pref_dark")?.value === "1" && "dark",
    jar.get("pref_large")?.value === "1" && "text-large",
    jar.get("pref_motion")?.value === "1" && "reduce-motion",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <html lang="en" className={cls}>
      <body className="min-h-screen font-sans">{children}<RegisterSW /></body>
    </html>
  );
}
