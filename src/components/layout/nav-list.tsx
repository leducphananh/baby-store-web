import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'

/**
 * Renders the app's navigation links. Shared by the desktop `Sidebar` and
 * the mobile/tablet drawer in `Header` — one list, two presentations (see
 * `reusable-components`). Both hosts are the dark `bg-sidebar` surface
 * (brand layout reference), so this always assumes a dark background —
 * light inactive text, filled `sidebar-accent` pill for the active route.
 */
function NavList({
  collapsed = false,
  onNavigate,
}: {
  /** Icon-only, no labels — desktop sidebar collapsed state only. */
  collapsed?: boolean
  /** Called after a link is activated — used to close the mobile drawer. */
  onNavigate?: () => void
}) {
  return (
    <nav aria-label="Điều hướng chính" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-sidebar-muted-foreground transition-colors',
              'hover:bg-white/10 hover:text-sidebar-foreground',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent',
              collapsed && 'justify-center px-2',
            )
          }
        >
          <item.icon className="size-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

export { NavList }
