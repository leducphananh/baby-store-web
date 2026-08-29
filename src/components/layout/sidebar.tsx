import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { NavList } from '@/components/layout/nav-list';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/hooks/use-ui-store';
import { cn } from '@/lib/utils';

/**
 * Persistent desktop sidebar (`lg:` and up — see `responsive-design`). Dark
 * navy surface (`bg-sidebar`) per the Baby Wale brand layout reference —
 * deliberately its own token group rather than reusing `--primary`, so the
 * sidebar can be retheimed independently of primary buttons elsewhere.
 * Hidden below `lg` in favor of the drawer in `Header` (which uses the same
 * dark surface — see `NavList`). Collapse state is shared/persisted via
 * `useUiStore` (see `zustand`).
 */
function Sidebar() {
  const isCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex',
        isCollapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <img
          src="/branding/favicon.png"
          alt="Baby Wale"
          className="size-8 shrink-0 rounded-full object-cover"
        />
        {!isCollapsed && (
          <span className="truncate font-sans text-base font-extrabold tracking-tight">
            Baby Wale
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <NavList collapsed={isCollapsed} />
      </div>

      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="icon"
          className="w-full text-sidebar-foreground hover:bg-white/10 hover:text-sidebar-foreground"
          onClick={toggleSidebar}
          aria-label={
            isCollapsed
              ? 'Mở rộng thanh điều hướng'
              : 'Thu gọn thanh điều hướng'
          }
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}

export { Sidebar };
