import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronRight, CircleDot } from 'lucide-react'

import { NAV, isNavGroup, type NavLeaf, type NavGroup } from '@/config/nav'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { cn } from '@/lib/utils'

function usePermitted() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  return (permission?: string | string[]) => !permission || hasPermission(permission)
}

function NavLeafLink({ item, indent = false }: { item: NavLeaf; indent?: boolean }) {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)

  return (
    <NavLink
      to={item.path}
      onClick={() => setMobileNavOpen(false)}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors',
          indent ? 'pl-8' : 'pl-2.5',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
        )
      }
    >
      {indent && <CircleDot className="size-1.5 shrink-0" />}
      <span className="truncate">{item.label}</span>
    </NavLink>
  )
}

function NavGroupBlock({ group }: { group: NavGroup }) {
  const location = useLocation()
  const permitted = usePermitted()
  const containsActive = group.items.some((i) => location.pathname.startsWith(i.path))
  const [open, setOpen] = useState(containsActive)
  const Icon = group.icon

  const visibleItems = group.items.filter((i) => permitted(i.permission))
  if (visibleItems.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-sidebar-foreground/90 hover:bg-sidebar-accent/60"
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open && (
        <div className="mt-0.5 flex flex-col gap-0.5">
          {visibleItems.map((item) => (
            <NavLeafLink key={item.path} item={item} indent />
          ))}
        </div>
      )}
    </div>
  )
}

function NavSectionBlock({ section }: { section: (typeof NAV)[number] }) {
  const location = useLocation()
  const permitted = usePermitted()
  const Icon = section.icon

  const containsActive = section.children.some((c) =>
    isNavGroup(c) ? c.items.some((i) => location.pathname.startsWith(i.path)) : location.pathname.startsWith(c.path)
  )
  const [open, setOpen] = useState(containsActive || section.label === 'Dashboard')

  if (!permitted(section.permission)) return null

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs font-semibold tracking-wide text-sidebar-foreground/60 uppercase hover:text-sidebar-foreground"
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">{section.label}</span>
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 pb-1">
          {section.children.map((child) =>
            isNavGroup(child) ? (
              <NavGroupBlock key={child.label} group={child} />
            ) : permitted(child.permission) ? (
              <NavLeafLink key={child.path} item={child} />
            ) : null
          )}
        </div>
      )}
    </div>
  )
}

export function SidebarNavContent() {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
          T
        </div>
        <span className="truncate text-sm font-semibold">Tyre Management</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
        {NAV.map((section) => (
          <NavSectionBlock key={section.label} section={section} />
        ))}
      </nav>
    </>
  )
}

export function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'bg-sidebar text-sidebar-foreground border-sidebar-border hidden shrink-0 flex-col border-r transition-all duration-200 md:flex',
        collapsed ? 'w-0 overflow-hidden md:w-0' : 'w-72'
      )}
    >
      <SidebarNavContent />
    </aside>
  )
}
