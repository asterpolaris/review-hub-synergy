export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          created_at: string
          google_business_account_id: string | null
          google_place_id: string | null
          id: string
          location: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          google_business_account_id?: string | null
          google_place_id?: string | null
          id?: string
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          google_business_account_id?: string | null
          google_place_id?: string | null
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cached_metrics: {
        Row: {
          cached_at: string
          id: string
          metrics: Json
          period: string
          user_id: string
        }
        Insert: {
          cached_at?: string
          id?: string
          metrics: Json
          period: string
          user_id: string
        }
        Update: {
          cached_at?: string
          id?: string
          metrics?: Json
          period?: string
          user_id?: string
        }
        Relationships: []
      }
      cached_reviews: {
        Row: {
          business_id: string
          cached_at: string
          google_review_id: string
          id: string
          review_data: Json
        }
        Insert: {
          business_id: string
          cached_at?: string
          google_review_id: string
          id?: string
          review_data: Json
        }
        Update: {
          business_id?: string
          cached_at?: string
          google_review_id?: string
          id?: string
          review_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "cached_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      google_auth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_history: {
        Row: {
          change_type: string
          changed_by: string | null
          created_at: string
          current_state: Json | null
          id: string
          order_id: string
          order_items: Json
          previous_state: Json | null
          status: string
          total_price: number
        }
        Insert: {
          change_type?: string
          changed_by?: string | null
          created_at?: string
          current_state?: Json | null
          id?: string
          order_id: string
          order_items: Json
          previous_state?: Json | null
          status: string
          total_price: number
        }
        Update: {
          change_type?: string
          changed_by?: string | null
          created_at?: string
          current_state?: Json | null
          id?: string
          order_id?: string
          order_items?: Json
          previous_state?: Json | null
          status?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          archived: boolean | null
          created_at: string
          email: string
          id: string
          name: string
          order_items: Json
          phone_number: string
          status: string
          total_price: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string
          email: string
          id?: string
          name: string
          order_items: Json
          phone_number: string
          status?: string
          total_price: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          order_items?: Json
          phone_number?: string
          status?: string
          total_price?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string | null
          cogs: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_new: boolean | null
          is_sale: boolean | null
          name: string
          price: number
          stock: number
          type_id: string | null
          updated_at: string
          visible: boolean | null
        }
        Insert: {
          brand_id?: string | null
          cogs?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_new?: boolean | null
          is_sale?: boolean | null
          name: string
          price: number
          stock?: number
          type_id?: string | null
          updated_at?: string
          visible?: boolean | null
        }
        Update: {
          brand_id?: string | null
          cogs?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_new?: boolean | null
          is_sale?: boolean | null
          name?: string
          price?: number
          stock?: number
          type_id?: string | null
          updated_at?: string
          visible?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "vape_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      vape_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reviews: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reviews_batch: {
        Args: {
          access_token: string
          location_names: string[]
        }
        Returns: Json
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
