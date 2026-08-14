import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import ServerWakeupBanner from "@/components/ServerWakeupBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Typeform — Build beautiful forms that people love to fill",
  description:
    "Create conversational forms, surveys, and quizzes. Collect data and grow your business with Typeform — the world's best online form builder.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          <ServerWakeupBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
