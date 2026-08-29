import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaxLens | Understand tax communications before you act",
  description:
    "An independent prototype that turns confusing Income Tax communications into clear, guided next steps.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
