import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Samdania Talimul Islam Madrasah",
  description: "Official website of Samdania Talimul Islam Madrasah.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
