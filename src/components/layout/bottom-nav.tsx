"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  History,
  BarChart3,
  FileText,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 border-t border-primary/20 backdrop-blur-sm">
      <div className="grid h-16 grid-cols-5 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-2 text-center group transition-colors duration-300",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6 mb-1 transition-transform group-hover:scale-110", isActive && "text-primary drop-shadow-[0_0_5px_hsl(var(--primary))]")} />
              <span className="text-[10px] font-headline tracking-wider uppercase">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
