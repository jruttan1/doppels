"use client"

import type React from "react"
import Link from "next/link"
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
  LayoutDashboard,
  Network,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Search,
} from "lucide-react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/network", label: "Network", icon: Network },
  { href: "/dashboard/simulations", label: "Simulations", icon: MessageSquare },
]

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
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
            <span className="font-bold font-mono">Doppel</span>
          </Link>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 lg:h-16 flex items-center px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono">Doppel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                  style={{ fontFamily: '"Google Sans Flex", sans-serif' }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                  {item.label === "Simulations" && (
                    <Badge className="ml-auto bg-green-500/10 text-green-500 text-xs">3</Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User menu */}
          <div className="px-3 py-4 border-t border-border">
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="w-full lg:w-auto flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/diverse-avatars.png" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 lg:hidden text-left">
                    <p className="text-sm font-medium">Your Name</p>
                    <p className="text-xs text-muted-foreground">name@example.com</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
      <main className="lg:pl-64 pt-14 lg:pt-0">
        <div className="hidden lg:flex items-center justify-between px-8 h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search connections, simulations..." className="pl-9 w-80 bg-secondary/50 border-0" />
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/diverse-avatars.png" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
