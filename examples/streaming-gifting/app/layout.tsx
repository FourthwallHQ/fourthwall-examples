import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fourthwall · Streaming Gifting Example",
  description:
    "Turn Fourthwall purchases into on-stream giveaways — the code companion to the Gifting guide.",
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
