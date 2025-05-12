"use client"

import { PiggyBank, Settings, Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { useAuth } from "@/src/context/AuthContext"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface FinanceHeaderProps {
  activeView: string
  isSidebarCollapsed: boolean
  setIsSidebarCollapsed: (collapsed: boolean) => void
  setActiveView: (view: string) => void
}

export function FinanceHeader({ activeView, isSidebarCollapsed, setIsSidebarCollapsed, setActiveView }: FinanceHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  const getTitle = () => {
    switch (activeView) {
      case "dashboard":
        return "Dashboard"
      case "expenses":
        return "Expense Management"
      case "income":
        return "Income Tracking"
      case "budgeting":
        return "Budget Planning"
      case "savings":
        return "Savings Goals"
      default:
        return "Settings"
    }
  }

  return (
    <header className={`fixed top-0 right-0 z-10 flex h-[100px] items-center gap-4 border-b border-[#e2e8f0] dark:border-[#4e4e4e] bg-[#f9f9f9] dark:bg-[#131313] px-4 sm:px-6 transition-all duration-300 ${isSidebarCollapsed ? 'left-[80px]' : 'left-[320px]'}`}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-gray-900 dark:text-white"
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      >
        <Menu className="h-6 w-6" />
      </Button>
      <div className="hidden md:block">
        <h1 className="ml-[24px] text-[28px] font-medium text-gray-900 dark:text-white">{getTitle()}</h1>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <div className="rounded-[16px] border border-[#e2e8f0] dark:border-[#4e4e4e] p-[12px] flex items-center gap-[12px] h-[56px] w-[56px] bg-[#f9f9f9] dark:bg-[#131313]">
          <ModeToggle />
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-[#e2e8f0] dark:border-[#4e4e4e]"  onClick={() => setActiveView('settings')}>
            <AvatarImage src={user?.profilePicture?.url || "/assets/profile-placeholder.png"} alt={user?.fullname || "User"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.fullname?.split(" ").map((n) => n[0]).join("") || "U"}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-[20px] font-400 tracking-tight text-gray-900 dark:text-white">
            {user?.fullname || "Username"}
          </h1>
        </div>
      </div>
    </header>
  )
}

