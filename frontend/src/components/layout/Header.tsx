import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Moon, Search, Sun, UserCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useNotifications } from '@/hooks/use-notifications'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Header() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)
  const navigate = useNavigate()
  const { unreadCount } = useNotifications()

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function handleToggleNav() {
    toggleSidebar()
    setMobileNavOpen(true)
  }

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b px-4 backdrop-blur-sm">
      <Button variant="ghost" size="icon" onClick={handleToggleNav} aria-label="Toggle sidebar">
        <Menu className="size-4" />
      </Button>

      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input placeholder="Search..." className="focus-visible:border-primary rounded-full pl-9" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
          onClick={() => navigate('/dashboard/notifications')}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="bg-destructive border-background absolute top-1.5 right-1.5 flex size-2 rounded-full border">
              <span className="bg-destructive absolute inline-flex size-full animate-ping rounded-full opacity-75" />
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="ring-primary/20 size-7 ring-2">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user ? initials(user.name) : <UserCircle className="size-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{user?.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{user?.name}</span>
                <span className="text-muted-foreground text-xs font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/company-profile')}>Settings</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
