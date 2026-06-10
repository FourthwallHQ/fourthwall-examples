import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fourthwall · MCP Agent Example",
  description: "A Claude shop assistant driving the Fourthwall MCP server",
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
