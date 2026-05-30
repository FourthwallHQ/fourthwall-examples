import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fourthwall · Streaming Alerts Example",
  description: "On-stream alerts for Fourthwall orders and tips — the code companion to the Alerts guide.",
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
