import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MaxLife Academy | Personal Finance Reinvented — Tim Bao, Ph.D.",
  description:
    "Tim Bao, Ph.D. — Science-based wealth strategy: Self-Owned Bank, tax-free retirement, college funding, family legacy. Book a free consultation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
