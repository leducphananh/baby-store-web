import type { ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Shared confirmation dialog for destructive/important actions — every
 * delete flow in the app uses this instead of a bare `confirm()` or a
 * one-off dialog (see `accessibility`, CLAUDE.md §8: "destructive actions
 * always require confirmation that clearly identifies the affected
 * entity"). `description` is where the caller names the specific entity
 * (e.g. category name), not this component's job.
 */
function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  isConfirming = false,
  variant = 'default',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  isConfirming?: boolean
  variant?: 'default' | 'destructive'
}) {
  return (
    <AlertDialog
      open={open}
      // Phase 9.8 (Debt B): while the confirmed action is in flight, ignore
      // Escape / overlay-click / close requests. The Cancel button is already
      // disabled and the Action button preventDefaults its own auto-close, so
      // this is the last dismissal path left — closing here would wrongly
      // imply the operation (cancel order, confirm import, delete, ...) was
      // called off, when the server request is still running and authoritative.
      onOpenChange={(next) => {
        if (isConfirming) return
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            onClick={(event) => {
              // AlertDialogAction closes the dialog by default on click;
              // for an async confirm we control closing via `open` from the
              // caller instead (stays open while the mutation is pending).
              event.preventDefault()
              onConfirm()
            }}
            className={cn(variant === 'destructive' && buttonVariants({ variant: 'destructive' }))}
          >
            {isConfirming ? 'Đang xử lý...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ConfirmDialog }
