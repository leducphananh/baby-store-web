-- Migration: S12 Best Sellers
-- Purpose: Create a public-safe RPC to list best-selling products.
-- This function aggregates order_items from completed website orders
-- and returns the product details for the storefront.

-- Since storefront only has 'anon' access, it cannot read orders or order_items.
-- A SECURITY DEFINER function safely exposes just the public product data.

CREATE OR REPLACE FUNCTION list_storefront_best_sellers(p_limit int DEFAULT 10)
RETURNS TABLE (
  product_id uuid,
  slug text,
  name text,
  brand text,
  unit text,
  selling_price numeric,
  in_stock boolean,
  category_id uuid,
  category_slug text,
  category_name text,
  total_sold bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_products AS (
    SELECT 
      oi.product_id,
      SUM(oi.quantity) as total_sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    -- Only count confirmed/completed orders from the website
    WHERE o.source = 'website' AND o.status IN ('completed', 'processing')
    GROUP BY oi.product_id
    ORDER BY total_sold DESC
    LIMIT p_limit
  )
  SELECT 
    rp.product_id,
    p.slug,
    p.name,
    p.brand,
    p.unit,
    p.selling_price,
    -- Same stock rule as list_storefront_products
    (COALESCE((SELECT SUM(pb.quantity) FROM product_batches pb WHERE pb.product_id = p.id AND pb.expiration_date > CURRENT_DATE), 0) > 0) AS in_stock,
    c.id AS category_id,
    c.slug AS category_slug,
    c.name AS category_name,
    rp.total_sold
  FROM ranked_products rp
  JOIN products p ON p.id = rp.product_id
  LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.status = 'active' AND p.is_web_visible = true
  ORDER BY rp.total_sold DESC;
END;
$$;

-- Grant access to anon
GRANT EXECUTE ON FUNCTION list_storefront_best_sellers(int) TO anon;
