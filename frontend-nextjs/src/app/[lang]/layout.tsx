import Providers from "@/app/providers";
import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Chaos - Recruitment drives, without the chaos",
  description: "Chaos is a recruitment platform for student societies. Built by UNSW DevSoc.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  const { lang } = await params;
  
  return (
    <html lang={lang}>
      <body>
        <Providers>{children}</Providers>        
      </body>
    </html>
  );
}
