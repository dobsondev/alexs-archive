import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { KindleEmailProvider } from "./_contexts/KindleEmailContext";

export const metadata: Metadata = {
  title: "Alexs Archive",
  description: "eBook storage solution",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SessionProvider>
      <KindleEmailProvider>
        <html lang="en" className={`${GeistSans.variable}`}>
          <body className="bg-slate-950 text-white">
            {children}
          </body>
        </html>
      </KindleEmailProvider>
    </SessionProvider>
  );
}
