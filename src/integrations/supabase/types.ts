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
      appointments: {
        Row: {
          cancelada_em: string | null
          cancelada_por: string | null
          created_at: string
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          patient_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          primeira_consulta: boolean
          professional_id: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          valor_centavos: number
          valor_plataforma_centavos: number
          valor_profissional_centavos: number
          video_url: string | null
        }
        Insert: {
          cancelada_em?: string | null
          cancelada_por?: string | null
          created_at?: string
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          patient_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primeira_consulta?: boolean
          professional_id: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          valor_centavos?: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
          video_url?: string | null
        }
        Update: {
          cancelada_em?: string | null
          cancelada_por?: string | null
          created_at?: string
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          patient_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primeira_consulta?: boolean
          professional_id?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          valor_centavos?: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_blocks: {
        Row: {
          created_at: string
          fim: string
          id: string
          inicio: string
          motivo: string | null
          professional_id: string
        }
        Insert: {
          created_at?: string
          fim: string
          id?: string
          inicio: string
          motivo?: string | null
          professional_id: string
        }
        Update: {
          created_at?: string
          fim?: string
          id?: string
          inicio?: string
          motivo?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_rules: {
        Row: {
          created_at: string
          hora_fim: string
          hora_inicio: string
          id: string
          professional_id: string
          weekday: number
        }
        Insert: {
          created_at?: string
          hora_fim: string
          hora_inicio: string
          id?: string
          professional_id: string
          weekday: number
        }
        Update: {
          created_at?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          professional_id?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          agendada_para: string
          appointment_id: string | null
          canal: string
          corpo: string
          created_at: string
          enviada_em: string | null
          id: string
          lida_em: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          agendada_para?: string
          appointment_id?: string | null
          canal?: string
          corpo: string
          created_at?: string
          enviada_em?: string | null
          id?: string
          lida_em?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          agendada_para?: string
          appointment_id?: string | null
          canal?: string
          corpo?: string
          created_at?: string
          enviada_em?: string | null
          id?: string
          lida_em?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          appointment_id: string
          created_at: string
          erro: string | null
          id: string
          metodo: string
          patient_id: string
          professional_id: string
          provider: string
          provider_ref: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          valor_centavos: number
          valor_plataforma_centavos: number
          valor_profissional_centavos: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          erro?: string | null
          id?: string
          metodo?: string
          patient_id: string
          professional_id: string
          provider?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          valor_centavos: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          erro?: string | null
          id?: string
          metodo?: string
          patient_id?: string
          professional_id?: string
          provider?: string
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          valor_centavos?: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          created_at: string
          id: string
          pago_em: string | null
          payment_id: string | null
          previsto_para: string | null
          professional_id: string
          status: Database["public"]["Enums"]["payout_status"]
          valor_centavos: number
        }
        Insert: {
          created_at?: string
          id?: string
          pago_em?: string | null
          payment_id?: string | null
          previsto_para?: string | null
          professional_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          valor_centavos: number
        }
        Update: {
          created_at?: string
          id?: string
          pago_em?: string | null
          payment_id?: string | null
          previsto_para?: string | null
          professional_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          chave: string
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      professional_payout_details: {
        Row: {
          agencia: string | null
          banco: string | null
          chave_pix: string | null
          conta: string | null
          documento: string | null
          professional_id: string
          tipo_conta: string | null
          updated_at: string
        }
        Insert: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string | null
          conta?: string | null
          documento?: string | null
          professional_id: string
          tipo_conta?: string | null
          updated_at?: string
        }
        Update: {
          agencia?: string | null
          banco?: string | null
          chave_pix?: string | null
          conta?: string | null
          documento?: string | null
          professional_id?: string
          tipo_conta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_payout_details_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          abordagem: string | null
          apresentacao: string | null
          areas: string[]
          comissao_percent: number
          created_at: string
          especializacoes: string[]
          experiencia_anos: number
          experiencia_toc: string | null
          formacao: string[]
          foto_url: string | null
          genero: string | null
          id: string
          idiomas: string[]
          nome: string
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          slot_minutos: number
          slug: string
          status: Database["public"]["Enums"]["prof_status"]
          uf: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abordagem?: string | null
          apresentacao?: string | null
          areas?: string[]
          comissao_percent?: number
          created_at?: string
          especializacoes?: string[]
          experiencia_anos?: number
          experiencia_toc?: string | null
          formacao?: string[]
          foto_url?: string | null
          genero?: string | null
          id?: string
          idiomas?: string[]
          nome: string
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          slot_minutos?: number
          slug: string
          status?: Database["public"]["Enums"]["prof_status"]
          uf: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abordagem?: string | null
          apresentacao?: string | null
          areas?: string[]
          comissao_percent?: number
          created_at?: string
          especializacoes?: string[]
          experiencia_anos?: number
          experiencia_toc?: string | null
          formacao?: string[]
          foto_url?: string | null
          genero?: string | null
          id?: string
          idiomas?: string[]
          nome?: string
          profissao?: Database["public"]["Enums"]["profissao"]
          registro?: string
          slot_minutos?: number
          slug?: string
          status?: Database["public"]["Enums"]["prof_status"]
          uf?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          data_nascimento: string | null
          email: string | null
          foto_url: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          foto_url?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      horarios_ocupados: {
        Args: { _ate: string; _de: string; _professional_id: string }
        Returns: {
          fim: string
          inicio: string
        }[]
      }
      owns_professional: {
        Args: { _professional_id: string }
        Returns: boolean
      }
      slots_disponiveis: {
        Args: { _dias?: number; _slug: string }
        Returns: {
          fim: string
          inicio: string
        }[]
      }
    }
    Enums: {
      app_role: "paciente" | "profissional" | "admin"
      appointment_status:
        | "aguardando_pagamento"
        | "confirmada"
        | "realizada"
        | "cancelada"
        | "remarcada"
        | "nao_compareceu"
      payment_status:
        | "pendente"
        | "aprovado"
        | "recusado"
        | "estornado"
        | "cancelado"
      payout_status: "pendente" | "processando" | "pago" | "falhou"
      prof_status: "pendente" | "aprovado" | "suspenso"
      profissao: "psicologo" | "psiquiatra"
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
      app_role: ["paciente", "profissional", "admin"],
      appointment_status: [
        "aguardando_pagamento",
        "confirmada",
        "realizada",
        "cancelada",
        "remarcada",
        "nao_compareceu",
      ],
      payment_status: [
        "pendente",
        "aprovado",
        "recusado",
        "estornado",
        "cancelado",
      ],
      payout_status: ["pendente", "processando", "pago", "falhou"],
      prof_status: ["pendente", "aprovado", "suspenso"],
      profissao: ["psicologo", "psiquiatra"],
    },
  },
} as const
