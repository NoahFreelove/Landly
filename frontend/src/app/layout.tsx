import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import { StyletronRegistry } from "@/lib/styletron";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landly — Modern Living, Simplified",
  description: "Your modern apartment management experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-surface-page text-gray-900">
        <StyletronRegistry>
          <AuthProvider>{children}</AuthProvider>
        </StyletronRegistry>
      </body>
    </html>
  );
}
