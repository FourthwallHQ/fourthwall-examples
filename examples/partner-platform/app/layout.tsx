import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Linkstand · product-first links admin",
  description:
    "A link-in-bio admin where every row is a real Fourthwall product. Browse blank products, upload artwork, and preview live — shop-less — then publish to provision a shop behind the scenes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
