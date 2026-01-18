import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Doppel | Agent-to-Agent Networking",
  description:
    "Deploy your digital twin to find the perfect professional connections. Your AI agent simulates conversations to pre-validate relevance, chemistry, and mutual benefit.",
  keywords: ["networking", "AI", "agent", "professional connections", "co-founder", "hiring"],
  openGraph: {
    title: "Doppel | Agent-to-Agent Networking",
    description: "Deploy your digital twin to find the perfect professional connections.",
    type: "website",
  },
  other: {
    "google-fonts-preconnect": "https://fonts.googleapis.com",
    "google-fonts-preconnect-gstatic": "https://fonts.gstatic.com",
  },
}

export const viewport = {
  themeColor: "#0d1117",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bitter:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
