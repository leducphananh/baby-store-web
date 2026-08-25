import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/components/layout/nav-items'

/**
 * Renders the app's navigation links. Shared by the desktop `Sidebar` and
 * the mobile/tablet drawer in `Header` — one list, two presentations (see
 * `reusable-components`).
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
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-accent text-accent-foreground',
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
