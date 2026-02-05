"use client"

import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Settings,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { ConnectionsSimulationsSidebar } from "./connections-simulations-sidebar"

// Navigation removed - everything is on one page now
const navItems: { href: string; label: string; icon: any }[] = []

interface UserData {
  name: string | null
  email: string | null
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [userData, setUserData] = useState<UserData>({ name: null, email: null })

  const supabase = createClient()

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      // Get user profile from users table
      const { data: profile } = await supabase
        .from("users")
        .select("name, email")
        .eq("id", user.id)
        .single()

      setUserData({
        name: profile?.name || null,
        email: profile?.email || user.email || null,
      })
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }, [supabase])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return "?"
  }

  const displayName = userData.name || "Set up your profile"
  const displayEmail = userData.email || ""

  return (
    <div className="h-screen bg-background overflow-hidden">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="h-full px-4 -ml-4 opacity-70 hover:opacity-100 transition-opacity cursor-pointer flex items-center" 
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Doppel" width={35} height={35} />
            <span className="font-bold font-serif">Doppels</span>
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-full lg:w-96 max-w-[100vw] border-r border-border bg-card transition-transform lg:translate-x-0 shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Logo */}
          <div className="h-12 flex-shrink-0 flex items-center px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-1.5">
              <Image src="/logo.svg" alt="Doppel" width={35} height={35} />
              <span className="text-lg font-bold font-serif">Doppels</span>
            </Link>
          </div>

          {/* Connections & Simulations - all breakpoints, scrollable on mobile */}
          <div className="flex flex-1 flex-col min-h-0 overflow-hidden border-b border-border">
            <ConnectionsSimulationsSidebar />
          </div>

          {/* User menu - hidden on desktop, shown on mobile */}
          <div className="flex-shrink-0 px-3 py-4 border-t border-border lg:hidden">
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getInitials(userData.name, userData.email)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{displayEmail}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings?tab=profile" onClick={() => setUserMenuOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={() => {
                    setUserMenuOpen(false)
                    handleLogout()
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main 
        className="pt-14 lg:pt-0 lg:pl-96 h-screen flex flex-col overflow-hidden min-w-0"
      >
        <div className="hidden lg:flex items-center justify-end px-6 h-12 border-b border-border bg-card/50 backdrop-blur-sm shrink-0 z-20">
          <div className="flex items-center gap-4">
            <DropdownMenu open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>{getInitials(userData.name, userData.email)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings?tab=profile" onClick={() => setDesktopMenuOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" onClick={() => setDesktopMenuOpen(false)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive" 
                  onClick={() => {
                    setDesktopMenuOpen(false)
                    handleLogout()
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}
