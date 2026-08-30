import { create } from 'zustand'

import type { Tour } from '@/features/help/types/tour'

/**
 * Ephemeral, client-only tour-playback state — NOT persisted (see
 * `zustand`): if the page reloads mid-tour, the tour should simply not be
 * running anymore, same as closing any other transient overlay. Long-term
 * "has this tour been seen before" tracking is a separate, localStorage-
 * backed concern (`use-tour-completion.ts`), kept out of this store on
 * purpose so playback state and persisted history don't get tangled.
 */
type TourStoreState = {
  activeTour: Tour | null
  stepIndex: number
  isOpen: boolean
  start: (tour: Tour) => void
  next: () => void
  prev: () => void
  /** Jump directly to a step index — used by the missing-target skip logic in `tour-overlay.tsx`. */
  goTo: (index: number) => void
  close: () => void
}

export const useTourStore = create<TourStoreState>((set, get) => ({
  activeTour: null,
  stepIndex: 0,
  isOpen: false,

  start: (tour) => {
    if (tour.steps.length === 0) return
    set({ activeTour: tour, stepIndex: 0, isOpen: true })
  },

  next: () => {
    const { activeTour, stepIndex } = get()
    if (!activeTour) return
    if (stepIndex + 1 >= activeTour.steps.length) {
      set({ isOpen: false, activeTour: null, stepIndex: 0 })
      return
    }
    set({ stepIndex: stepIndex + 1 })
  },

  prev: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),

  goTo: (index) => {
    const { activeTour } = get()
    if (!activeTour) return
    if (index < 0 || index >= activeTour.steps.length) {
      set({ isOpen: false, activeTour: null, stepIndex: 0 })
      return
    }
    set({ stepIndex: index })
  },

  close: () => set({ isOpen: false, activeTour: null, stepIndex: 0 }),
}))
