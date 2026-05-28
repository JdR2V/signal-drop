import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import HackerBackground from "@/components/HackerBackground";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "signal.drop",
  description: "Self-destructing encrypted messages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${mono.className} bg-[#0a0a0f] text-white`}>
        <HackerBackground />
        {children}
      </body>
    </html>
  );
}
