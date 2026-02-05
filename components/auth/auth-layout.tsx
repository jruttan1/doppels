"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import Orb from "@/components/landing/orb"

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  description: string
  ctaText?: string
}

export function AuthLayout({ children, title, description, ctaText }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <div className="absolute inset-0 z-[2]">
          <Orb hue={61} hoverIntensity={0.42} backgroundColor="#000000" />
        </div>
        <div className="absolute inset-0 bg-black/40 z-[3]" />

        <div className="relative flex flex-col justify-between p-12 z-[4]">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Doppel" width={40} height={40} />
            <span className="text-2xl font-bold font-mono text-white">Doppels</span>
          </Link>

          <div className="max-w-md">
            <blockquote className="text-2xl font-medium leading-relaxed mb-6 text-balance text-white">
              {ctaText || "Join the future of networking where AI agents connect on your behalf."}
            </blockquote>
          </div>

       
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="lg:hidden p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Doppel" width={40} height={40} />
            <span className="text-xl font-bold font-mono">Doppels</span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
