import { Outlet } from 'react-router-dom'

import { Sidebar, SidebarNavContent } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useUIStore } from '@/stores/ui-store'

export function AppLayout() {
  const mobileNavOpen = useUIStore((s) => s.mobileNavOpen)
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen)

  return (
    <div className="bg-background flex h-svh w-full overflow-hidden">
      <Sidebar />

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="bg-sidebar text-sidebar-foreground w-72 gap-0 p-0 [&_button]:text-sidebar-foreground">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <SidebarNavContent />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
