import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./rota.css";
import "./report.css";
import "./auth.css";
import "./mobile.css";
import "./evolution.css";
import {PwaUpdater} from '../components/pwa-updater';
import {APP_RELEASE} from '../lib/release';


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1714" },
  ],
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark')}else if(t==='light'){document.documentElement.setAttribute('data-theme','light')}else{document.documentElement.removeAttribute('data-theme')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable} antialiased`}>{children}<PwaUpdater/></body>
    </html>
  );
}
