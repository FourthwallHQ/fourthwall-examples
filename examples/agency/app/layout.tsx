import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Greenroom · Agency console",
  description:
    "An agency console for the Fourthwall Channel API — one channel.* credential operating a fleet of subaccount shops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-muted font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
