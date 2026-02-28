import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landly — Citizen Housing Portal",
  description: "Your AI-powered apartment management experience. Compliance is comfort.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-surface-page text-zinc-100">
        {children}
      </body>
    </html>
  );
}
