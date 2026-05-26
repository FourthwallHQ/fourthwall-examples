import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Account Settings · Example",
  description: "An example app built with @fourthwall-examples/ui",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-muted font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
