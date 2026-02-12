import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
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
  openGraph: {
    title: "Prontio - Gestão de Consultório Médico",
    description:
      "Sistema de gestão para consultório médico. Gerencie pacientes, agendamentos, prontuários e muito mais.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
