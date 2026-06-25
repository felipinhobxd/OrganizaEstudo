import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToasterProvider } from "@/components/providers/ToasterProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "OrganizaEstudo",
    template: "%s | OrganizaEstudo"
  },
  description: "A plataforma definitiva para organizar seus estudos com eficiência e estilo.",
  keywords: ["estudos", "organização", "notion", "estudante", "turmas", "aprendizado"],
  authors: [{ name: "OrganizaEstudo Team" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://organizaestudo.vercel.app",
    siteName: "OrganizaEstudo",
    title: "OrganizaEstudo - Organize seus Estudos",
    description: "Crie turmas, organize conteúdos e gerencie materiais de forma profissional.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OrganizaEstudo"
      }
    ]
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
