import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { NavList } from '@/components/layout/nav-list'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/hooks/use-ui-store'

/**
 * Persistent desktop sidebar (`lg:` and up — see `responsive-design`).
 * Hidden below that breakpoint in favor of the drawer in `Header`. Collapse
 * state is shared/persisted via `useUiStore` (see `zustand`).
 */
function Sidebar() {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r bg-background transition-[width] duration-200 lg:flex',
        isCollapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!isCollapsed && (
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">
            Baby Store Management
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <NavList collapsed={isCollapsed} />
      </div>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          size="icon"
          className="w-full"
          onClick={toggleSidebar}
          aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
        >
          {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>
    </aside>
  )
}

export { Sidebar }
