import type { Metadata } from "next";
import "./globals.css";
import { PLOTORA_STYLES, THEME_SCRIPT } from "@/theme";

export const metadata: Metadata = {
  title: "Plotora | Map-First Land and Property Platform",
  description: "Discover land and properties through an interactive map-first platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {PLOTORA_STYLES.map((href) => <link key={href} rel="stylesheet" href={href} />)}
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
