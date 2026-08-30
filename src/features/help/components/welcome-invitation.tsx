import { useEffect } from 'react'
import { toast } from 'sonner'

import { QUICK_START_TOUR } from '@/features/help/config/tours'
import { useTourStore } from '@/features/help/hooks/use-tour-store'

const STORAGE_KEY = 'baby-wale.help.welcome.seen'

function markSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true')
  } catch {
    // Storage disabled — nothing to persist, the invitation just won't
    // reliably stay dismissed, which is a harmless degradation here.
  }
}

/**
 * A subtle, one-time invitation to try "Bắt đầu nhanh" — shown once ever per
 * browser, not on every login (see this feature's first-time-experience
 * requirement: never auto-launch a long tour, never block the app).
 * Reuses the existing toast system (`sonner`) instead of a new banner
 * component. Renders nothing itself — it only ever calls `toast(...)`.
 */
export function WelcomeInvitation() {
  const startTour = useTourStore((state) => state.start)

  useEffect(() => {
    let alreadySeen = true
    try {
      alreadySeen = localStorage.getItem(STORAGE_KEY) === 'true'
    } catch {
      // Storage unavailable — `alreadySeen` keeps its safe default (`true`),
      // so this invitation just won't show rather than showing repeatedly.
    }
    if (alreadySeen) return

    // A short delay so this doesn't compete with the page's own initial
    // loading state right as the app shell mounts.
    const timer = window.setTimeout(() => {
      toast('Chào mừng bạn đến Baby Wale', {
        description: 'Bạn có muốn xem hướng dẫn nhanh để bắt đầu sử dụng hệ thống không?',
        duration: 20000,
        action: {
          label: 'Bắt đầu hướng dẫn',
          onClick: () => {
            markSeen()
            startTour(QUICK_START_TOUR)
          },
        },
        cancel: { label: 'Để sau', onClick: markSeen },
        onDismiss: markSeen,
      })
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [startTour])

  return null
}
