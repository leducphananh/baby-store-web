// Auto-generated Supabase database types.
//
// Generated from the `baby-store-management` Supabase project schema
// (project ref: jtkmycvkthciiskwptqv) via the Supabase MCP
// `generate_typescript_types` tool.
//
// Do NOT hand-edit this file. Regenerate it whenever the database schema
// changes (new tables/columns/functions), and re-run `yarn typecheck` /
// `yarn build` afterwards to catch any code that needs updating.
//
// Regeneration (once the Supabase CLI is set up locally):
//   supabase gen types typescript --project-id jtkmycvkthciiskwptqv > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      import_receipt_items: {
        Row: {
          expiration_date: string | null
          id: string
          import_receipt_id: string | null
          lot_number: string | null
          manufacture_date: string | null
          product_id: string | null
          purchase_price: number
          quantity: number
        }
        Insert: {
          expiration_date?: string | null
          id?: string
          import_receipt_id?: string | null
          lot_number?: string | null
          manufacture_date?: string | null
          product_id?: string | null
          purchase_price?: number
          quantity: number
        }
        Update: {
          expiration_date?: string | null
          id?: string
          import_receipt_id?: string | null
          lot_number?: string | null
          manufacture_date?: string | null
          product_id?: string | null
          purchase_price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_receipt_items_import_receipt_id_fkey"
            columns: ["import_receipt_id"]
            isOneToOne: false
            referencedRelation: "import_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_overview"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "import_receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      import_receipts: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          created_by: string | null
          id: string
          import_date: string
          notes: string | null
          receipt_number: string
          status: string
          supplier_id: string | null
          total_cost: number
          updated_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          import_date?: string
          notes?: string | null
          receipt_number: string
          status?: string
          supplier_id?: string | null
          total_cost?: number
          updated_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          import_date?: string
          notes?: string | null
          receipt_number?: string
          status?: string
          supplier_id?: string | null
          total_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_receipts_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_receipts_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          batch_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          note: string | null
          product_id: string | null
          quantity: number
          reference_id: string | null
          reference_type: string
          type: string
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          product_id?: string | null
          quantity: number
          reference_id?: string | null
          reference_type: string
          type: string
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          product_id?: string | null
          quantity?: number
          reference_id?: string | null
          reference_type?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_overview"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_batches: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          order_item_id: string | null
          quantity: number
          unit_cost: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          order_item_id?: string | null
          quantity: number
          unit_cost: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          order_item_id?: string | null
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_item_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "product_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_batches_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          discount: number
          id: string
          line_total: number
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          discount?: number
          id?: string
          line_total: number
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          discount?: number
          id?: string
          line_total?: number
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_overview"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          id: string
          note: string | null
          order_id: string | null
          paid_at: string | null
          payment_method: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          note?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          note: string | null
          order_date: string
          order_number: string
          payment_status: string
          status: string
          subtotal: number
          total: number
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          note?: string | null
          order_date?: string
          order_number: string
          payment_status?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          note?: string | null
          order_date?: string
          order_number?: string
          payment_status?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_batches: {
        Row: {
          created_at: string | null
          expiration_date: string | null
          id: string
          import_item_id: string | null
          initial_quantity: number
          lot_number: string | null
          manufacture_date: string | null
          product_id: string | null
          purchase_price: number
          remaining_quantity: number
        }
        Insert: {
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          import_item_id?: string | null
          initial_quantity: number
          lot_number?: string | null
          manufacture_date?: string | null
          product_id?: string | null
          purchase_price?: number
          remaining_quantity: number
        }
        Update: {
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          import_item_id?: string | null
          initial_quantity?: number
          lot_number?: string | null
          manufacture_date?: string | null
          product_id?: string | null
          purchase_price?: number
          remaining_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_import_item_id_fkey"
            columns: ["import_item_id"]
            isOneToOne: true
            referencedRelation: "import_receipt_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_overview"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string | null
          id: string
          is_primary: boolean | null
          product_id: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          product_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_overview"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category_id: string | null
          created_at: string | null
          default_purchase_price: number
          description: string | null
          distributor: string | null
          id: string
          manufacturer: string | null
          minimum_stock: number
          name: string
          origin_country: string | null
          selling_price: number
          shopee_price: number | null
          sku: string
          source_description: string | null
          status: string
          tiktok_price: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          default_purchase_price?: number
          description?: string | null
          distributor?: string | null
          id?: string
          manufacturer?: string | null
          minimum_stock?: number
          name: string
          origin_country?: string | null
          selling_price?: number
          shopee_price?: number | null
          sku: string
          source_description?: string | null
          status?: string
          tiktok_price?: number | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string | null
          default_purchase_price?: number
          description?: string | null
          distributor?: string | null
          id?: string
          manufacturer?: string | null
          minimum_stock?: number
          name?: string
          origin_country?: string | null
          selling_price?: number
          shopee_price?: number | null
          sku?: string
          source_description?: string | null
          status?: string
          tiktok_price?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      purchase_invoice_files: {
        Row: {
          created_at: string | null
          created_by: string | null
          file_name: string
          file_size: number | null
          id: string
          mime_type: string | null
          purchase_invoice_id: string | null
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          purchase_invoice_id?: string | null
          storage_path: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          purchase_invoice_id?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_files_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_files_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          import_receipt_id: string | null
          invoice_date: string
          invoice_number: string
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          import_receipt_id?: string | null
          invoice_date: string
          invoice_number: string
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          import_receipt_id?: string | null
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoices_import_receipt_id_fkey"
            columns: ["import_receipt_id"]
            isOneToOne: false
            referencedRelation: "import_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: string
          tax_code: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
          tax_code?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
          tax_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      product_inventory_overview: {
        Row: {
          barcode: string | null
          batch_count: number | null
          category_id: string | null
          category_name: string | null
          expiry_status: string | null
          minimum_stock: number | null
          name: string | null
          nearest_expiration: string | null
          product_id: string | null
          product_status: string | null
          sku: string | null
          stock_quantity: number | null
          stock_status: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_import_receipt_item: {
        Args: {
          p_expiration_date?: string
          p_lot_number?: string
          p_manufacture_date?: string
          p_product_id: string
          p_purchase_price: number
          p_quantity: number
          p_receipt_id: string
        }
        Returns: string
      }
      adjust_inventory: {
        Args: {
          p_adj_quantity: number
          p_adj_type: string
          p_batch_id: string
          p_note: string
          p_ref_id: string
        }
        Returns: undefined
      }
      cancel_order: { Args: { p_order_id: string }; Returns: undefined }
      complete_order: { Args: { p_order_id: string }; Returns: undefined }
      confirm_import_receipt: {
        Args: { p_receipt_id: string }
        Returns: undefined
      }
      delete_import_receipt_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      recalc_import_receipt_total: {
        Args: { p_receipt_id: string }
        Returns: undefined
      }
      update_import_receipt_item: {
        Args: {
          p_expiration_date?: string
          p_item_id: string
          p_lot_number?: string
          p_manufacture_date?: string
          p_purchase_price: number
          p_quantity: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
