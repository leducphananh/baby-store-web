/**
 * Domain types for the in-app Help & Guided Tour system. A `Tour` is a
 * config-driven sequence of steps — content lives in
 * `features/help/config/tours.ts`, not scattered across page components
 * (see that file's own doc comment).
 */

export type TourStep = {
  /**
   * Matches a `data-tour="<id>"` attribute somewhere in the DOM. Omit for a
   * centered, non-targeted informational step (used by the Quick Start
   * workflow, which spans multiple routes and has no single on-screen
   * element to point at).
   */
  target?: string
  title: string
  description: string
  /** Optional in-card navigation, e.g. "Đi tới Nhập hàng" — never a destructive action (see `tour-overlay.tsx`). */
  action?: { label: string; to: string }
}

export type Tour = {
  id: string
  /** Shown in the Help menu / Help Center, e.g. "Danh sách sản phẩm". */
  title: string
  steps: TourStep[]
}
