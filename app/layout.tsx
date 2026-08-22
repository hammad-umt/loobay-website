import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loobay — Where Sports Connect",
  description:
    "Find local games, discover players, build teams, recruit teammates and trade sports gear with Loobay.",
  keywords: [
    "Loobay",
    "local sports",
    "find games",
    "sports teams",
    "player recruitment",
    "sports marketplace",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
