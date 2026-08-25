import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind class names, resolving conflicting utility classes
 * (e.g. `cn('p-2', condition && 'p-4')` keeps only `p-4`).
 * Standard shadcn/ui helper — used by every UI primitive in `components/ui`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
