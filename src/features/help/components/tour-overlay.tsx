import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useTourCompletion } from '@/features/help/hooks/use-tour-completion'
import { useTourStore } from '@/features/help/hooks/use-tour-store'

const CARD_WIDTH = 340
const VIEWPORT_MARGIN = 16
const HIGHLIGHT_PADDING = 4

/**
 * Renders the active tour (see `useTourStore`) as a full-screen spotlight:
 * the surrounding page dims, the current step's `data-tour` target gets a
 * highlighted ring, and an explanatory card sits next to it with
 * Next/Previous/Skip/Finish. A step with no `target` (Quick Start) just
 * shows the card centered over a plain dim, with an optional "go here"
 * navigation link instead.
 *
 * Mounted once, near the root (`app-shell.tsx`) — not per-page — so it
 * portals over everything regardless of which route is active.
 *
 * Safety (see CLAUDE.md §11, this feature's own "never break business
 * screens" requirement): if a step's target isn't in the DOM (hidden by a
 * filter, empty table, responsive layout, a future change), that step is
 * skipped automatically rather than leaving the user stuck behind an
 * overlay — tours never crash the underlying page.
 */
export function TourOverlay() {
  const { activeTour, stepIndex, isOpen, next, prev, goTo, close } = useTourStore()
  const { markCompleted } = useTourCompletion()
  const navigate = useNavigate()

  const step = activeTour?.steps[stepIndex] ?? null
  const [measuredRect, setMeasuredRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // The card's real height varies with each step's description length (one
  // line vs. four) — a fixed guess here previously caused the card to
  // overlap the very target it was pointing at whenever a step's text ran
  // longer than the guess (see `cardPosition` below). Measured after each
  // step's card actually renders, before the browser paints, so
  // `cardPosition` always positions against the real box, not an estimate.
  const [cardHeight, setCardHeight] = useState(220)
  useLayoutEffect(() => {
    const height = cardRef.current?.offsetHeight
    if (height) setCardHeight(height)
  }, [step])

  const targetId = step?.target
  // Derived, not stored: a stale `measuredRect` from a previous (targeted)
  // step can never leak into a no-target (Quick Start) step's render this
  // way, and the effect below never needs to synchronously reset it either.
  const rect = targetId ? measuredRect : null

  // Locate the current step's target; skip forward if it's missing.
  useEffect(() => {
    if (!isOpen || !targetId) return

    const el = document.querySelector<HTMLElement>(`[data-tour="${targetId}"]`)
    if (!el) {
      goTo(stepIndex + 1)
      return
    }

    // `'nearest'`, not `'center'`: a target that's already fully visible
    // (e.g. a dialog's sticky footer button, which sits outside any
    // scrollable ancestor — only the dialog's own middle section scrolls,
    // see `product-form-dialog.tsx`) has no scrollable container able to
    // "center" it, so a browser can fall back to scrolling the outer
    // page/window itself trying to satisfy that request — visibly breaking
    // the still-open dialog's layout once the tour closes. `'nearest'` is a
    // no-op for anything already on-screen and still scrolls a genuinely
    // offscreen target (e.g. a lower form section) the minimum needed.
    el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    // Let the smooth scroll settle before measuring, so the ring/card land
    // on the target's final position instead of a mid-scroll one.
    const timer = window.setTimeout(() => setMeasuredRect(el.getBoundingClientRect()), 260)
    return () => window.clearTimeout(timer)
  }, [isOpen, targetId, stepIndex, goTo])

  // Keep the highlight aligned to its target across resize/scroll.
  useEffect(() => {
    if (!isOpen || !targetId) return
    function reposition() {
      const el = document.querySelector<HTMLElement>(`[data-tour="${targetId}"]`)
      if (el) setMeasuredRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', reposition)
    // Capture phase: catches scrolling inside `<main>` (the app shell's own
    // scroll container — see `app-shell.tsx`), not just the window.
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [isOpen, targetId])

  // Escape closes; a light focus trap keeps keyboard focus inside the card
  // while a tour is running (the page underneath is visually blocked, but
  // Tab order isn't automatically — see `accessibility`).
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    function onFocusIn(event: FocusEvent) {
      const target = event.target
      if (cardRef.current && cardRef.current.contains(target as Node)) return
      // A native Dialog underneath (e.g. the `product-form` tour, which runs
      // while `ProductFormDialog` is open) runs its own Radix focus trap.
      // Don't fight it — pulling focus back into the card here while Radix
      // simultaneously pulls it back into its own content creates an
      // infinite focus/focusin ping-pong (stack overflow). The card stays
      // fully usable by pointer either way, and Escape always closes the tour.
      if (target instanceof Element && target.closest('[data-slot="dialog-content"]')) return
      cardRef.current?.querySelector<HTMLElement>('button')?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)
    cardRef.current?.querySelector<HTMLElement>('[data-tour-primary-action]')?.focus()
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [isOpen, stepIndex, close])

  const cardPosition = useMemo((): { top: number; left: number } | null => {
    if (typeof window === 'undefined') return null
    const vw = window.innerWidth
    const vh = window.innerHeight

    if (!rect) {
      return { top: vh / 2 - cardHeight / 2, left: vw / 2 - CARD_WIDTH / 2 }
    }

    const margin = 12
    const spaceBelow = vh - rect.bottom
    const spaceAbove = rect.top

    let top: number
    if (spaceBelow >= cardHeight + margin) {
      top = rect.bottom + margin
    } else if (spaceAbove >= cardHeight + margin) {
      top = rect.top - cardHeight - margin
    } else {
      // Neither side has room for the card without overlapping the
      // highlighted target (e.g. a tall form section filling most of the
      // dialog) — anchor to whichever edge has more room instead of a
      // guess that risks sitting on top of what's being highlighted.
      top = spaceBelow >= spaceAbove ? vh - cardHeight - VIEWPORT_MARGIN : VIEWPORT_MARGIN
    }
    top = Math.min(Math.max(top, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, vh - cardHeight - VIEWPORT_MARGIN))

    const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), vw - CARD_WIDTH - VIEWPORT_MARGIN)
    return { top, left }
  }, [rect, cardHeight])

  const handleFinish = useCallback(() => {
    if (activeTour) markCompleted(activeTour.id)
    close()
  }, [activeTour, markCompleted, close])

  if (!isOpen || !activeTour || !step) return null

  const isFirstStep = stepIndex === 0
  const isLastStep = stepIndex === activeTour.steps.length - 1
  const top = rect ? rect.top - HIGHLIGHT_PADDING : 0
  const left = rect ? rect.left - HIGHLIGHT_PADDING : 0
  const width = rect ? rect.width + HIGHLIGHT_PADDING * 2 : 0
  const height = rect ? rect.height + HIGHLIGHT_PADDING * 2 : 0

  return createPortal(
    // `pointer-events-auto` is required, not decorative: while a Radix
    // `Dialog` is open it sets `document.body { pointer-events: none }` and
    // re-enables only its own `DialogContent` via inline style — this
    // overlay is a sibling body child too (portaled here, not into the
    // dialog), so without this override it would silently inherit
    // `pointer-events: none` and every click (Tiếp theo/Quay lại/Đóng)
    // would fall through to whatever Dialog content sits underneath it
    // (see `product-form` tour, which runs while `ProductFormDialog` is open).
    <div
      className="fixed inset-0 z-[100] pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      data-tour-overlay
    >
      {rect ? (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/60" style={{ height: Math.max(0, top) }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/60" style={{ top: top + height }} />
          <div
            className="absolute bg-black/60"
            style={{ top, left: 0, width: Math.max(0, left), height }}
          />
          <div className="absolute bg-black/60" style={{ top, left: left + width, right: 0, height }} />
          <div
            className="pointer-events-none absolute rounded-md ring-2 ring-primary"
            style={{ top, left, width, height }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/60" />
      )}

      <div
        ref={cardRef}
        className="absolute w-[340px] max-w-[calc(100vw-2rem)] rounded-lg border bg-card p-4 text-card-foreground shadow-lg"
        style={cardPosition ?? undefined}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">
            {stepIndex + 1} / {activeTour.steps.length}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Đóng hướng dẫn"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <h3 className="mt-1 text-sm font-semibold text-foreground">{step.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>

        {step.action && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              const to = step.action?.to
              close()
              if (to) navigate(to)
            }}
          >
            {step.action.label}
          </Button>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={close}>
            Bỏ qua
          </Button>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button type="button" variant="outline" size="sm" onClick={prev}>
                Quay lại
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              data-tour-primary-action
              onClick={isLastStep ? handleFinish : next}
            >
              {isLastStep ? 'Hoàn tất' : 'Tiếp theo'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
