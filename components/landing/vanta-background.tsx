"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"

declare global {
  interface Window {
    VANTA: any
    THREE: any
  }
}

export function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null)
  const vantaEffect = useRef<any>(null)
  const [threeLoaded, setThreeLoaded] = useState(false)
  const [vantaLoaded, setVantaLoaded] = useState(false)

  const initVanta = () => {
    if (!vantaRef.current) return

    // Check if VANTA.NET exists
    if (!window.VANTA || !window.VANTA.NET) {
      console.warn("VANTA.NET not available yet")
      return
    }

    // Check if THREE is available
    if (!window.THREE) {
      console.warn("THREE.js not available yet")
      return
    }

    // Clean up existing effect
    if (vantaEffect.current) {
      try {
        vantaEffect.current.destroy()
      } catch (e) {
        // Ignore cleanup errors
      }
      vantaEffect.current = null
    }

    // Initialize Vanta effect
    try {
      vantaEffect.current = window.VANTA.NET({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0x4a4a78, 
        backgroundColor: 0x0,
        points: 9.0,
        maxDistance: 34.0,
        spacing: 20.0,
      })
    } catch (error) {
      console.error("Error initializing Vanta:", error)
    }
  }

  useEffect(() => {
    if (threeLoaded && vantaLoaded) {
      // Add a small delay to ensure scripts are fully initialized
      const timer = setTimeout(() => {
        initVanta()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [threeLoaded, vantaLoaded])

  useEffect(() => {
    return () => {
      if (vantaEffect.current) {
        try {
          vantaEffect.current.destroy()
        } catch (e) {
          // Ignore cleanup errors
        }
        vantaEffect.current = null
      }
    }
  }, [])

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // Ensure THREE is on window
          if (typeof window !== "undefined" && !window.THREE) {
            // @ts-ignore
            window.THREE = window.THREE || {}
          }
          setThreeLoaded(true)
        }}
        onError={() => {
          console.error("Failed to load Three.js")
        }}
      />
      {threeLoaded && (
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js"
          strategy="afterInteractive"
          onLoad={() => {
            setVantaLoaded(true)
          }}
          onError={() => {
            console.error("Failed to load Vanta.js")
          }}
        />
      )}
      <div ref={vantaRef} className="fixed inset-0 z-0" />
    </>
  )
}
