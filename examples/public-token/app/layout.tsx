import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fourthwall · Public Token Example",
  description: "OAuth public-token integration example",
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
