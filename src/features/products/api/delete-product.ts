import { supabase } from '@/lib/supabase'

/**
 * Hard-delete a product. Only succeeds for a product with no business
 * history: `order_items`, `import_receipt_items`, `product_batches` and
 * `inventory_transactions` all reference `products` with `ON DELETE
 * RESTRICT`, so Postgres rejects the delete (code `23503`) once any of
 * those exist — which is the correct outcome, not a bug (CLAUDE.md §11,
 * `domain-driven-frontend`). The caller offers "Ngừng kinh doanh"
 * (archive) as the alternative; `getProductErrorMessage` turns `23503`
 * into that guidance. `product_images` rows cascade-delete with the product.
 */
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
