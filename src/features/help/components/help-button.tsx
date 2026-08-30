import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { BookOpen, CircleHelp, Compass, RotateCcw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ROUTES } from '@/routes/route-paths'
import { QUICK_START_TOUR } from '@/features/help/config/tours'
import { useTourStore } from '@/features/help/hooks/use-tour-store'
import { resolveActiveTour } from '@/features/help/utils/resolve-active-tour'
import type { Tour } from '@/features/help/types/tour'

/**
 * Floating "Trợ giúp" entry point, mounted once in `AppShell` — fixed
 * bottom-right, available on every authenticated screen (it's simply never
 * mounted on `/login`, which renders outside `AppShell`). Opens a small
 * menu rather than starting a tour directly, per the Help menu spec.
 */
export function HelpButton() {
  const location = useLocation()
  const navigate = useNavigate()
  const startTour = useTourStore((state) => state.start)

  const [open, setOpen] = useState(false)
  const [contextualTour, setContextualTour] = useState<Tour | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Recomputed fresh on every open, not memoized from render — the
      // Create/Edit Product dialog can open/close without a route change,
      // and this must reflect the real DOM at the moment the menu opens
      // (see `resolve-active-tour.ts`).
      setContextualTour(resolveActiveTour(location.pathname))
    }
  }

  function runTour(tour: Tour) {
    setOpen(false)
    startTour(tour)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          className="fixed right-5 bottom-5 z-40 size-12 rounded-full shadow-lg shadow-primary/20"
          aria-label="Trợ giúp"
          title="Trợ giúp"
        >
          <CircleHelp className="size-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" side="top" className="w-64 p-2">
        <div className="flex flex-col">
          <Button
            type="button"
            variant="ghost"
            className="justify-start"
            disabled={!contextualTour}
            onClick={() => contextualTour && runTour(contextualTour)}
          >
            <Compass />
            Hướng dẫn màn hình này
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="justify-start"
            onClick={() => runTour(QUICK_START_TOUR)}
          >
            <Sparkles />
            Bắt đầu nhanh
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="justify-start"
            onClick={() => {
              setOpen(false)
              navigate(ROUTES.help)
            }}
          >
            <BookOpen />
            Hướng dẫn sử dụng
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="justify-start"
            onClick={() => {
              setOpen(false)
              navigate(`${ROUTES.help}#tours`)
            }}
          >
            <RotateCcw />
            Xem lại hướng dẫn
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
