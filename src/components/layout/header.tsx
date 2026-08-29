import { useState } from 'react'
import { Bell, LogOut, Menu, UserCircle } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NavList } from '@/components/layout/nav-list'
import { NAV_ITEMS } from '@/components/layout/nav-items'
import { useProfile } from '@/features/auth/hooks/use-profile'
import { useSignOut } from '@/features/auth/hooks/use-sign-out'
import { useAuth } from '@/providers/auth-provider'
import { ROUTES } from '@/routes/route-paths'

const PROFILE_ROLE_LABEL: Record<'owner' | 'staff', string> = {
  owner: 'Chủ cửa hàng',
  staff: 'Nhân viên',
}

function usePageTitle(): string {
  const { pathname } = useLocation()
  return NAV_ITEMS.find((item) => (item.end ? pathname === item.path : pathname.startsWith(item.path)))
    ?.label ?? 'Baby Wale'
}

/**
 * Top bar: mobile nav trigger (drawer, `lg:hidden`) + page title + the
 * authenticated user with a logout action (task 11). Owns its own drawer
 * open state locally — nothing else needs to read it (see `zustand` skill:
 * don't reach for global state to avoid one level of prop drilling that
 * doesn't even exist here).
 *
 * The bell links to the real "Cảnh báo" route rather than being decorative —
 * there's no notification/badge-count backend yet, so it's just navigation,
 * not a fake feature (see CLAUDE.md: presentation changes only, no invented
 * functionality).
 */
function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const pageTitle = usePageTitle()
  const auth = useAuth()
  const { data: profile } = useProfile(auth.user?.id)
  const signOut = useSignOut()

  const displayName = profile?.fullName || auth.user?.email || 'Người dùng'
  const roleLabel = profile?.role ? PROFILE_ROLE_LABEL[profile.role] : null

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Mở menu điều hướng">
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="flex-row items-center gap-2 border-b border-sidebar-border">
            <img
              src="/branding/favicon.png"
              alt=""
              className="size-7 shrink-0 rounded-full object-cover"
            />
            <SheetTitle className="text-sidebar-foreground">Baby Wale</SheetTitle>
          </SheetHeader>
          <div className="p-3">
            <NavList onNavigate={() => setIsMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <h1 className="truncate text-sm font-bold text-foreground">{pageTitle}</h1>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" asChild aria-label="Xem cảnh báo">
          <Link to={ROUTES.alerts}>
            <Bell className="size-5" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <UserCircle className="size-5" aria-hidden="true" />
              <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="truncate text-sm font-medium">{displayName}</span>
                {roleLabel && <span className="text-xs font-normal text-muted-foreground">{roleLabel}</span>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              <LogOut />
              {signOut.isPending ? 'Đang đăng xuất...' : 'Đăng xuất'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

export { Header }
