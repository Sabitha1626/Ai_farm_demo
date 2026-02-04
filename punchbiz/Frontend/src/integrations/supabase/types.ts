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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      attendance_records: {
        Row: {
          biometric_id: string | null
          biometric_type: string | null
          check_in: string
          check_out: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          staff_id: string
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          biometric_id?: string | null
          biometric_type?: string | null
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          staff_id: string
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          biometric_id?: string | null
          biometric_type?: string | null
          check_in?: string
          check_out?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          staff_id?: string
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      breeding_events: {
        Row: {
          cow_id: string
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          event_type: string
          id: string
          is_reminder_sent: boolean | null
          notes: string | null
          reminder_date: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cow_id: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          event_type: string
          id?: string
          is_reminder_sent?: boolean | null
          notes?: string | null
          reminder_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cow_id?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_reminder_sent?: boolean | null
          notes?: string | null
          reminder_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "breeding_events_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      cows: {
        Row: {
          breed: string | null
          created_at: string
          date_of_birth: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          status: string | null
          tag_number: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          status?: string | null
          tag_number: string
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          breed?: string | null
          created_at?: string
          date_of_birth?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          status?: string | null
          tag_number?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      health_records: {
        Row: {
          cost: number | null
          cow_id: string
          created_at: string
          diagnosis: string | null
          follow_up_date: string | null
          id: string
          medications: string | null
          notes: string | null
          record_date: string
          record_type: string
          treatment: string | null
          updated_at: string
          user_id: string
          veterinarian: string | null
        }
        Insert: {
          cost?: number | null
          cow_id: string
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          record_date?: string
          record_type: string
          treatment?: string | null
          updated_at?: string
          user_id: string
          veterinarian?: string | null
        }
        Update: {
          cost?: number | null
          cow_id?: string
          created_at?: string
          diagnosis?: string | null
          follow_up_date?: string | null
          id?: string
          medications?: string | null
          notes?: string | null
          record_date?: string
          record_type?: string
          treatment?: string | null
          updated_at?: string
          user_id?: string
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
        ]
      }
      heat_alerts: {
        Row: {
          alert_type: string | null
          cow_id: string
          created_at: string
          heat_record_id: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          optimal_breeding_end: string | null
          optimal_breeding_start: string | null
          sensor_reading: number | null
          sensor_type: string | null
          severity: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type?: string | null
          cow_id: string
          created_at?: string
          heat_record_id?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          optimal_breeding_end?: string | null
          optimal_breeding_start?: string | null
          sensor_reading?: number | null
          sensor_type?: string | null
          severity?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string | null
          cow_id?: string
          created_at?: string
          heat_record_id?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          optimal_breeding_end?: string | null
          optimal_breeding_start?: string | null
          sensor_reading?: number | null
          sensor_type?: string | null
          severity?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heat_alerts_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "heat_alerts_heat_record_id_fkey"
            columns: ["heat_record_id"]
            isOneToOne: false
            referencedRelation: "heat_records"
            referencedColumns: ["id"]
          },
        ]
      }
      heat_records: {
        Row: {
          ai_confidence: number | null
          cow_id: string
          created_at: string
          detected_at: string
          id: string
          insemination_date: string | null
          intensity: string | null
          is_inseminated: boolean | null
          notes: string | null
          sensor_reading: number | null
          sensor_type: string | null
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          cow_id: string
          created_at?: string
          detected_at?: string
          id?: string
          insemination_date?: string | null
          intensity?: string | null
          is_inseminated?: boolean | null
          notes?: string | null
          sensor_reading?: number | null
          sensor_type?: string | null
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          cow_id?: string
          created_at?: string
          detected_at?: string
          id?: string
          insemination_date?: string | null
          intensity?: string | null
          is_inseminated?: boolean | null
          notes?: string | null
          sensor_reading?: number | null
          sensor_type?: string | null
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "heat_records_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
        ]
      }
      milk_production: {
        Row: {
          cow_id: string
          created_at: string
          fat_percentage: number | null
          id: string
          is_automatic: boolean | null
          notes: string | null
          protein_percentage: number | null
          quality_grade: string | null
          quantity_liters: number
          recorded_at: string
          sensor_id: string | null
          user_id: string
        }
        Insert: {
          cow_id: string
          created_at?: string
          fat_percentage?: number | null
          id?: string
          is_automatic?: boolean | null
          notes?: string | null
          protein_percentage?: number | null
          quality_grade?: string | null
          quantity_liters: number
          recorded_at?: string
          sensor_id?: string | null
          user_id: string
        }
        Update: {
          cow_id?: string
          created_at?: string
          fat_percentage?: number | null
          id?: string
          is_automatic?: boolean | null
          notes?: string | null
          protein_percentage?: number | null
          quality_grade?: string | null
          quantity_liters?: number
          recorded_at?: string
          sensor_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milk_production_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          farm_name: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          farm_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          farm_name?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh_key: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh_key: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh_key?: string
          user_id?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          absent_reason: string | null
          absent_since: string | null
          biometric_id: string | null
          biometric_type: string | null
          created_at: string
          id: string
          is_absent: boolean
          name: string
          phone: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          absent_reason?: string | null
          absent_since?: string | null
          biometric_id?: string | null
          biometric_type?: string | null
          created_at?: string
          id?: string
          is_absent?: boolean
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          absent_reason?: string | null
          absent_since?: string | null
          biometric_id?: string | null
          biometric_type?: string | null
          created_at?: string
          id?: string
          is_absent?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_purchased: boolean | null
          month: number
          name: string
          notes: string | null
          quantity: number | null
          unit: string | null
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          month: number
          name: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean | null
          month?: number
          name?: string
          notes?: string | null
          quantity?: number | null
          unit?: string | null
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      weight_sensor_readings: {
        Row: {
          cow_id: string
          created_at: string
          id: string
          is_automatic: boolean | null
          recorded_at: string
          sensor_id: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          cow_id: string
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          recorded_at?: string
          sensor_id?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          cow_id?: string
          created_at?: string
          id?: string
          is_automatic?: boolean | null
          recorded_at?: string
          sensor_id?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_sensor_readings_cow_id_fkey"
            columns: ["cow_id"]
            isOneToOne: false
            referencedRelation: "cows"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export const Constants = {
  public: {
    Enums: {},
  },
} as const
