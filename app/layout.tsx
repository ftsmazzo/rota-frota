import type { Metadata, Viewport } from "next";
import "./rota.css";
import "./report.css";
import "./auth.css";
import "./mobile.css";
import "./evolution.css";
import {PwaUpdater} from '../components/pwa-updater';
import {APP_RELEASE} from '../lib/release';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#173d32",
};

export const metadata: Metadata = {
  title: "Rota | Sua frota, em boas mãos",
  description: "Vistorias e controle da frota interna. Uma rotina mais simples, um histórico mais claro.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Rota" },
  other: {'rota-release': APP_RELEASE},
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}<PwaUpdater/></body>
    </html>
  );
}



