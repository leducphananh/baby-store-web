import { supabase } from '@/lib/supabase'

const PREFIX = 'REC-'
const PAD = 3

/**
 * Suggest the next `REC-NNN` code for a new receipt. Best-effort only — the
 * user can edit it, and the `receipt_number` UNIQUE constraint (+ `23505`
 * handling) is the real guard against collisions. Relies on zero-padded
 * 3-digit numbering so plain string ordering finds the highest.
 */
export async function getNextReceiptNumber(): Promise<string> {
  const { data, error } = await supabase
    .from('import_receipts')
    .select('receipt_number')
    .ilike('receipt_number', `${PREFIX}%`)
    .order('receipt_number', { ascending: false })
    .limit(1)

  if (error) throw error

  const last = data?.[0]?.receipt_number ?? ''
  const match = last.match(/^REC-(\d+)$/)
  const next = match ? Number(match[1]) + 1 : 1
  return `${PREFIX}${String(next).padStart(PAD, '0')}`
}
