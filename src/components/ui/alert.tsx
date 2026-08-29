import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Tinted background + icon per variant (see the branding brief's "ALERT /
 * MESSAGE" style). Icon/text color is a darker shade of the base semantic
 * color, not the raw `--success`/`--warning`/`--destructive` token used for
 * solid badges/buttons: those mid-tone brand hex values read fine as a
 * *fill* with white text, but as *text on a near-white tinted background*
 * they fall short of WCAG AA (~2:1) — the darker shade here reads clearly
 * while keeping the same tinted-pill look.
 */
const alertVariants = cva(
  'relative grid w-full grid-cols-[0_1fr] items-start gap-x-3 gap-y-1 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[auto_1fr] [&>svg]:size-4 [&>svg]:translate-y-0.5',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground [&>svg]:text-foreground',
        success: 'border-success/20 bg-success/10 text-[#15803D] [&>svg]:text-[#15803D]',
        warning: 'border-warning/30 bg-warning/10 text-[#B45309] [&>svg]:text-[#B45309]',
        destructive: 'border-destructive/20 bg-destructive/10 text-[#B91C1C] [&>svg]:text-[#B91C1C]',
        info: 'border-accent/25 bg-info/25 text-primary [&>svg]:text-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 min-h-4 font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn('col-start-2 text-sm [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
