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
      appointment_notes: {
        Row: {
          appointment_id: string
          conteudo: string
          created_at: string
          id: string
          patient_id: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          conteudo: string
          created_at?: string
          id?: string
          patient_id: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          conteudo?: string
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_notes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_notes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancelada_em: string | null
          cancelada_por: string | null
          comissao_percent: number
          created_at: string
          duracao_minutos: number
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          patient_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          primeira_consulta: boolean
          professional_id: string
          realizada_em: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          taxa_agendamento_centavos: number
          updated_at: string
          valor_centavos: number
          valor_consulta_centavos: number
          valor_plataforma_centavos: number
          valor_profissional_centavos: number
          video_provider: string
          video_url: string | null
        }
        Insert: {
          cancelada_em?: string | null
          cancelada_por?: string | null
          comissao_percent?: number
          created_at?: string
          duracao_minutos?: number
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          patient_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primeira_consulta?: boolean
          professional_id: string
          realizada_em?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          taxa_agendamento_centavos?: number
          updated_at?: string
          valor_centavos?: number
          valor_consulta_centavos?: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
          video_provider?: string
          video_url?: string | null
        }
        Update: {
          cancelada_em?: string | null
          cancelada_por?: string | null
          comissao_percent?: number
          created_at?: string
          duracao_minutos?: number
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          patient_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          primeira_consulta?: boolean
          professional_id?: string
          realizada_em?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          taxa_agendamento_centavos?: number
          updated_at?: string
          valor_centavos?: number
          valor_consulta_centavos?: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
          video_provider?: string
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
      avaliacoes: {
        Row: {
          appointment_id: string
          comentario: string | null
          created_at: string
          id: string
          nota: number
          patient_id: string
          professional_id: string
          publica: boolean
          updated_at: string
        }
        Insert: {
          appointment_id: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          patient_id: string
          professional_id: string
          publica?: boolean
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          patient_id?: string
          professional_id?: string
          publica?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos_profissionais: {
        Row: {
          aceite_ip: string | null
          aceito_em: string
          created_at: string
          documento: string
          id: string
          nome_assinatura: string
          professional_id: string
          updated_at: string
          user_agent: string | null
          versao: string
        }
        Insert: {
          aceite_ip?: string | null
          aceito_em?: string
          created_at?: string
          documento: string
          id?: string
          nome_assinatura: string
          professional_id: string
          updated_at?: string
          user_agent?: string | null
          versao: string
        }
        Update: {
          aceite_ip?: string | null
          aceito_em?: string
          created_at?: string
          documento?: string
          id?: string
          nome_assinatura?: string
          professional_id?: string
          updated_at?: string
          user_agent?: string | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_profissionais_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      livro_compras: {
        Row: {
          clicado_em: string | null
          comprado_em: string | null
          created_at: string
          email: string | null
          hotmart_transacao: string | null
          id: string
          origem: string
          payload: Json | null
          status: string
          updated_at: string
          user_id: string | null
          valor_centavos: number | null
        }
        Insert: {
          clicado_em?: string | null
          comprado_em?: string | null
          created_at?: string
          email?: string | null
          hotmart_transacao?: string | null
          id?: string
          origem?: string
          payload?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
          valor_centavos?: number | null
        }
        Update: {
          clicado_em?: string | null
          comprado_em?: string | null
          created_at?: string
          email?: string | null
          hotmart_transacao?: string | null
          id?: string
          origem?: string
          payload?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
          valor_centavos?: number | null
        }
        Relationships: []
      }
      mercadopago_contas: {
        Row: {
          access_token: string
          created_at: string
          expira_em: string | null
          mp_user_id: string
          professional_id: string
          public_key: string | null
          refresh_token: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expira_em?: string | null
          mp_user_id: string
          professional_id: string
          public_key?: string | null
          refresh_token?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expira_em?: string | null
          mp_user_id?: string
          professional_id?: string
          public_key?: string | null
          refresh_token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mercadopago_contas_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
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
      patient_clinical_records: {
        Row: {
          created_at: string
          diagnostico: string | null
          evolucao: string | null
          historico: string | null
          id: string
          informacoes_relevantes: string | null
          observacoes: string | null
          patient_id: string
          professional_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostico?: string | null
          evolucao?: string | null
          historico?: string | null
          id?: string
          informacoes_relevantes?: string | null
          observacoes?: string | null
          patient_id: string
          professional_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostico?: string | null
          evolucao?: string | null
          historico?: string | null
          id?: string
          informacoes_relevantes?: string | null
          observacoes?: string | null
          patient_id?: string
          professional_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_clinical_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
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
          appointment_id: string | null
          comissao_percent: number
          created_at: string
          id: string
          observacao: string | null
          pago_em: string | null
          pago_por: string | null
          payment_id: string | null
          previsto_para: string | null
          professional_id: string
          status: Database["public"]["Enums"]["payout_status"]
          valor_bruto_centavos: number
          valor_centavos: number
          valor_plataforma_centavos: number
        }
        Insert: {
          appointment_id?: string | null
          comissao_percent?: number
          created_at?: string
          id?: string
          observacao?: string | null
          pago_em?: string | null
          pago_por?: string | null
          payment_id?: string | null
          previsto_para?: string | null
          professional_id: string
          status?: Database["public"]["Enums"]["payout_status"]
          valor_bruto_centavos?: number
          valor_centavos: number
          valor_plataforma_centavos?: number
        }
        Update: {
          appointment_id?: string | null
          comissao_percent?: number
          created_at?: string
          id?: string
          observacao?: string | null
          pago_em?: string | null
          pago_por?: string | null
          payment_id?: string | null
          previsto_para?: string | null
          professional_id?: string
          status?: Database["public"]["Enums"]["payout_status"]
          valor_bruto_centavos?: number
          valor_centavos?: number
          valor_plataforma_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
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
      professional_documents: {
        Row: {
          caminho: string
          created_at: string
          id: string
          nome_arquivo: string
          observacao_admin: string | null
          professional_id: string
          status: Database["public"]["Enums"]["doc_status"]
          tipo: string
          updated_at: string
        }
        Insert: {
          caminho: string
          created_at?: string
          id?: string
          nome_arquivo: string
          observacao_admin?: string | null
          professional_id: string
          status?: Database["public"]["Enums"]["doc_status"]
          tipo: string
          updated_at?: string
        }
        Update: {
          caminho?: string
          created_at?: string
          id?: string
          nome_arquivo?: string
          observacao_admin?: string | null
          professional_id?: string
          status?: Database["public"]["Enums"]["doc_status"]
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
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
      professional_status_history: {
        Row: {
          alterado_por: string | null
          created_at: string
          id: string
          observacao: string | null
          professional_id: string
          requer_correcao: boolean
          status_anterior: string | null
          status_novo: string
        }
        Insert: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          professional_id: string
          requer_correcao?: boolean
          status_anterior?: string | null
          status_novo: string
        }
        Update: {
          alterado_por?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          professional_id?: string
          requer_correcao?: boolean
          status_anterior?: string | null
          status_novo?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_status_history_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
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
          cidade: string | null
          comissao_percent: number
          created_at: string
          cursos: string[]
          destaque: string | null
          email_contato: string | null
          especializacoes: string[]
          experiencia_anos: number
          experiencia_toc: string | null
          formacao: string[]
          foto_url: string | null
          genero: string | null
          graduacao: string | null
          id: string
          idiomas: string[]
          instituicao: string | null
          mp_user_id: string | null
          mp_vinculado_em: string | null
          nome: string
          observacao_admin: string | null
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          requer_correcao: boolean
          slot_minutos: number
          slug: string
          status: Database["public"]["Enums"]["prof_status"]
          telefone: string | null
          uf: string
          updated_at: string
          user_id: string | null
          validado_em: string | null
          validado_por: string | null
          valor_centavos: number
        }
        Insert: {
          abordagem?: string | null
          apresentacao?: string | null
          areas?: string[]
          cidade?: string | null
          comissao_percent?: number
          created_at?: string
          cursos?: string[]
          destaque?: string | null
          email_contato?: string | null
          especializacoes?: string[]
          experiencia_anos?: number
          experiencia_toc?: string | null
          formacao?: string[]
          foto_url?: string | null
          genero?: string | null
          graduacao?: string | null
          id?: string
          idiomas?: string[]
          instituicao?: string | null
          mp_user_id?: string | null
          mp_vinculado_em?: string | null
          nome: string
          observacao_admin?: string | null
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          requer_correcao?: boolean
          slot_minutos?: number
          slug: string
          status?: Database["public"]["Enums"]["prof_status"]
          telefone?: string | null
          uf: string
          updated_at?: string
          user_id?: string | null
          validado_em?: string | null
          validado_por?: string | null
          valor_centavos?: number
        }
        Update: {
          abordagem?: string | null
          apresentacao?: string | null
          areas?: string[]
          cidade?: string | null
          comissao_percent?: number
          created_at?: string
          cursos?: string[]
          destaque?: string | null
          email_contato?: string | null
          especializacoes?: string[]
          experiencia_anos?: number
          experiencia_toc?: string | null
          formacao?: string[]
          foto_url?: string | null
          genero?: string | null
          graduacao?: string | null
          id?: string
          idiomas?: string[]
          instituicao?: string | null
          mp_user_id?: string | null
          mp_vinculado_em?: string | null
          nome?: string
          observacao_admin?: string | null
          profissao?: Database["public"]["Enums"]["profissao"]
          registro?: string
          requer_correcao?: boolean
          slot_minutos?: number
          slug?: string
          status?: Database["public"]["Enums"]["prof_status"]
          telefone?: string | null
          uf?: string
          updated_at?: string
          user_id?: string | null
          validado_em?: string | null
          validado_por?: string | null
          valor_centavos?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          codigo_anonimo: string | null
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
          codigo_anonimo?: string | null
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
          codigo_anonimo?: string | null
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
      avaliacoes_publicas: {
        Row: {
          comentario: string | null
          created_at: string | null
          id: string | null
          nota: number | null
          professional_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string | null
          id?: string | null
          nota?: number | null
          professional_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string | null
          id?: string | null
          nota?: number | null
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      avaliacoes_resumo: {
        Args: { _professional_id: string }
        Returns: {
          media: number
          total: number
        }[]
      }
      concluir_consultas_vencidas: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      slots_disponiveis: {
        Args: { _dias: number; _slug: string }
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
      doc_status: "enviado" | "aprovado" | "recusado"
      payment_status:
        | "pendente"
        | "aprovado"
        | "recusado"
        | "estornado"
        | "cancelado"
      payout_status: "pendente" | "processando" | "pago" | "falhou"
      prof_status: "pendente" | "aprovado" | "suspenso" | "rejeitado"
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
      doc_status: ["enviado", "aprovado", "recusado"],
      payment_status: [
        "pendente",
        "aprovado",
        "recusado",
        "estornado",
        "cancelado",
      ],
      payout_status: ["pendente", "processando", "pago", "falhou"],
      prof_status: ["pendente", "aprovado", "suspenso", "rejeitado"],
      profissao: ["psicologo", "psiquiatra"],
    },
  },
} as const
