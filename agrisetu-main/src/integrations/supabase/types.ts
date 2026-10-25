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
      availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_available: boolean
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          availability: boolean
          created_at: string
          id: string
          image_url: string | null
          name: string
          owner_id: string
          price: number
          updated_at: string
        }
        Insert: {
          availability?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          owner_id: string
          price: number
          updated_at?: string
        }
        Update: {
          availability?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booker_id: string
          booking_date: string | null
          booking_type: string
          created_at: string
          id: string
          item_id: string | null
          item_name: string
          price: number | null
          provider_id: string | null
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          booker_id: string
          booking_date?: string | null
          booking_type: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_name: string
          price?: number | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          booker_id?: string
          booking_date?: string | null
          booking_type?: string
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string
          price?: number | null
          provider_id?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string
          author_name: string
          created_at: string
          id: string
          image_url: string | null
          text: string
        }
        Insert: {
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          image_url?: string | null
          text: string
        }
        Update: {
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          image_url?: string | null
          text?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          author_name: string
          created_at: string
          id: string
          post_id: string
          text: string
        }
        Insert: {
          author_id: string
          author_name: string
          created_at?: string
          id?: string
          post_id: string
          text: string
        }
        Update: {
          author_id?: string
          author_name?: string
          created_at?: string
          id?: string
          post_id?: string
          text?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_requests: {
        Row: {
          amount: number
          created_at: string
          duration: number
          id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          duration: number
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          duration?: number
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      labor_profiles: {
        Row: {
          availability: boolean
          created_at: string
          id: string
          name: string
          provider_id: string
          skill: string
          updated_at: string
          wage: number
        }
        Insert: {
          availability?: boolean
          created_at?: string
          id?: string
          name: string
          provider_id: string
          skill: string
          updated_at?: string
          wage: number
        }
        Update: {
          availability?: boolean
          created_at?: string
          id?: string
          name?: string
          provider_id?: string
          skill?: string
          updated_at?: string
          wage?: number
        }
        Relationships: []
      }
      labor_groups: {
        Row: {
          availability: boolean
          created_at: string
          group_name: string
          id: string
          price: number
          provider_id: string
          updated_at: string
          workers: number
        }
        Insert: {
          availability?: boolean
          created_at?: string
          group_name: string
          id?: string
          price: number
          provider_id: string
          updated_at?: string
          workers: number
        }
        Update: {
          availability?: boolean
          created_at?: string
          group_name?: string
          id?: string
          price?: number
          provider_id?: string
          updated_at?: string
          workers?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          booking_id: string
          comment: string
          created_at: string
          id: string
          provider_id: string
          rating: number
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          reviewer_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          display_name?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          display_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_role: {
        Args: {
          requested_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role:
        | "customer"
        | "machinery_provider"
        | "labor"
        | "group_leader"
        | "finance_provider"
      booking_status: "pending" | "confirmed" | "completed" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "customer",
        "machinery_provider",
        "labor",
        "group_leader",
        "finance_provider",
      ],
      booking_status: ["pending", "confirmed", "completed", "rejected"],
    },
  },
} as const
