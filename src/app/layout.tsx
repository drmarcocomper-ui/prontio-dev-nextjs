import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { getTheme } from "@/lib/theme.server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Prontio - Gestão de Consultório Médico",
    template: "%s | Prontio",
  },
  description:
    "Sistema de gestão para consultório médico. Gerencie pacientes, agendamentos, prontuários e muito mais.",
  robots: { index: false, follow: false },
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prontio",
  },
  openGraph: {
    title: "Prontio - Gestão de Consultório Médico",
    description:
      "Sistema de gestão para consultório médico. Gerencie pacientes, agendamentos, prontuários e muito mais.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        data-theme={theme}
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <div className="print:hidden">
          <Toaster richColors position="top-right" />
        </div>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
