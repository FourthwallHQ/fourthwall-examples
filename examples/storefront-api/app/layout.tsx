import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fourthwall · Link in bio",
  description: "Link-in-bio page that embeds a Fourthwall shop via the Storefront API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-muted font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
