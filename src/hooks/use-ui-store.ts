import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Client-only UI state — NOT server data (see `zustand`). Currently just
 * the desktop sidebar's collapsed/expanded preference, persisted to
 * localStorage so it survives a reload. The mobile/tablet drawer's
 * open/closed state is NOT here — it's ephemeral and local to the header
 * that owns it (see `components/layout/header.tsx`), since nothing else
 * needs to read or share it.
 */
type UiState = {
  isSidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    }),
    { name: 'baby-store-ui' },
  ),
)
