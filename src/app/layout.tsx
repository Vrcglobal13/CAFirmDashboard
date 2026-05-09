import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CA Firm OS",
  description: "Multi-tenant operating system for Chartered Accountant firms"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
