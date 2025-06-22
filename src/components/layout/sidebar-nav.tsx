"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  Clock,
  History,
  BarChart3,
  FileText,
  CreditCard,
  Settings,
  Shield,
  Home,
} from "lucide-react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Statistics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
]

const settingsItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin Panel", icon: Shield },
]

export function SidebarNav() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Icons.logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-lg font-semibold">Time Warp</span>
        </div>
      </SidebarHeader>

      <SidebarMenu className="flex-1">
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className="font-headline"
              >
                <a>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarMenu>
        <Separator className="my-2" />
        {settingsItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                className="font-headline"
              >
                <a>
                  <item.icon />
                  <span>{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>

      <SidebarFooter>
        <div className="rounded-lg border p-4 text-center pixel-border" style={{'--clip-size': '8px'} as React.CSSProperties}>
          <h3 className="font-headline text-md font-semibold">Upgrade to Pro</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Unlock more features and get dedicated support.
          </p>
          <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
            Upgrade
          </Button>
        </div>
      </SidebarFooter>
    </>
  )
}
