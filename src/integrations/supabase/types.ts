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
      appointment_messages: {
        Row: {
          appointment_id: string
          autor_id: string
          autor_papel: string
          corpo: string
          created_at: string
          id: string
          lida_em: string | null
        }
        Insert: {
          appointment_id: string
          autor_id: string
          autor_papel: string
          corpo: string
          created_at?: string
          id?: string
          lida_em?: string | null
        }
        Update: {
          appointment_id?: string
          autor_id?: string
          autor_papel?: string
          corpo?: string
          created_at?: string
          id?: string
          lida_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointment_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
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
      appointment_series: {
        Row: {
          ativa: boolean
          created_at: string
          faixa_horario: string
          frequencia: string
          id: string
          patient_id: string
          professional_id: string
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          faixa_horario: string
          frequencia: string
          id?: string
          patient_id: string
          professional_id: string
        }
        Update: {
          ativa?: boolean
          created_at?: string
          faixa_horario?: string
          frequencia?: string
          id?: string
          patient_id?: string
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_series_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          amount_captured_centavos: number
          asaas_payment_id_a: string | null
          asaas_payment_id_b: string | null
          auth_expires_at: string | null
          auth_status_a: string | null
          auth_status_b: string | null
          authorized_at: string | null
          cancelada_em: string | null
          cancelada_por: string | null
          comissao_percent: number
          confirmado_em: string | null
          confirmado_realizado_por: string | null
          created_at: string
          duracao_minutos: number
          fim: string
          id: string
          inicio: string
          link_acesso: string | null
          observacoes: string | null
          outcome: string | null
          patient_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_amount_centavos: number
          primeira_consulta: boolean
          professional_amount_centavos: number
          professional_id: string
          realizada_em: string | null
          remarcada_de: string | null
          reserva_expira_em: string | null
          series_id: string | null
          settled_at: string | null
          settlement_status: string
          status: Database["public"]["Enums"]["appointment_status"]
          taxa_agendamento_centavos: number
          taxa_plataforma_centavos: number
          updated_at: string
          valor_centavos: number
          valor_consulta_centavos: number
          valor_plataforma_centavos: number
          valor_profissional_centavos: number
          video_provider: string
          video_url: string | null
        }
        Insert: {
          amount_captured_centavos?: number
          asaas_payment_id_a?: string | null
          asaas_payment_id_b?: string | null
          auth_expires_at?: string | null
          auth_status_a?: string | null
          auth_status_b?: string | null
          authorized_at?: string | null
          cancelada_em?: string | null
          cancelada_por?: string | null
          comissao_percent?: number
          confirmado_em?: string | null
          confirmado_realizado_por?: string | null
          created_at?: string
          duracao_minutos?: number
          fim: string
          id?: string
          inicio: string
          link_acesso?: string | null
          observacoes?: string | null
          outcome?: string | null
          patient_id: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_amount_centavos?: number
          primeira_consulta?: boolean
          professional_amount_centavos?: number
          professional_id: string
          realizada_em?: string | null
          remarcada_de?: string | null
          reserva_expira_em?: string | null
          series_id?: string | null
          settled_at?: string | null
          settlement_status?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          taxa_agendamento_centavos?: number
          taxa_plataforma_centavos?: number
          updated_at?: string
          valor_centavos?: number
          valor_consulta_centavos?: number
          valor_plataforma_centavos?: number
          valor_profissional_centavos?: number
          video_provider?: string
          video_url?: string | null
        }
        Update: {
          amount_captured_centavos?: number
          asaas_payment_id_a?: string | null
          asaas_payment_id_b?: string | null
          auth_expires_at?: string | null
          auth_status_a?: string | null
          auth_status_b?: string | null
          authorized_at?: string | null
          cancelada_em?: string | null
          cancelada_por?: string | null
          comissao_percent?: number
          confirmado_em?: string | null
          confirmado_realizado_por?: string | null
          created_at?: string
          duracao_minutos?: number
          fim?: string
          id?: string
          inicio?: string
          link_acesso?: string | null
          observacoes?: string | null
          outcome?: string | null
          patient_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_amount_centavos?: number
          primeira_consulta?: boolean
          professional_amount_centavos?: number
          professional_id?: string
          realizada_em?: string | null
          remarcada_de?: string | null
          reserva_expira_em?: string | null
          series_id?: string | null
          settled_at?: string | null
          settlement_status?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          taxa_agendamento_centavos?: number
          taxa_plataforma_centavos?: number
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
          {
            foreignKeyName: "appointments_remarcada_de_fkey"
            columns: ["remarcada_de"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "appointment_series"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_customers: {
        Row: {
          asaas_customer_id: string
          created_at: string
          environment: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          asaas_customer_id: string
          created_at?: string
          environment?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          asaas_customer_id?: string
          created_at?: string
          environment?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      asaas_payment_authorizations: {
        Row: {
          amount_centavos: number
          appointment_id: string
          authorized_at: string | null
          canceled_at: string | null
          captured_at: string | null
          created_at: string
          environment: string
          expires_at: string | null
          failure_code: string | null
          id: string
          idempotency_key: string
          platform_amount_centavos: number
          portion: string
          professional_amount_centavos: number
          provider_payment_id: string
          provider_status: string | null
          refunded_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_centavos: number
          appointment_id: string
          authorized_at?: string | null
          canceled_at?: string | null
          captured_at?: string | null
          created_at?: string
          environment?: string
          expires_at?: string | null
          failure_code?: string | null
          id?: string
          idempotency_key: string
          platform_amount_centavos: number
          portion: string
          professional_amount_centavos: number
          provider_payment_id: string
          provider_status?: string | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_centavos?: number
          appointment_id?: string
          authorized_at?: string | null
          canceled_at?: string | null
          captured_at?: string | null
          created_at?: string
          environment?: string
          expires_at?: string | null
          failure_code?: string | null
          id?: string
          idempotency_key?: string
          platform_amount_centavos?: number
          portion?: string
          professional_amount_centavos?: number
          provider_payment_id?: string
          provider_status?: string | null
          refunded_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asaas_payment_authorizations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_professional_accounts: {
        Row: {
          api_key_ciphertext: string | null
          asaas_account_id: string | null
          created_at: string
          environment: string
          failure_code: string | null
          professional_id: string
          status: string
          updated_at: string
          wallet_id: string | null
        }
        Insert: {
          api_key_ciphertext?: string | null
          asaas_account_id?: string | null
          created_at?: string
          environment?: string
          failure_code?: string | null
          professional_id: string
          status?: string
          updated_at?: string
          wallet_id?: string | null
        }
        Update: {
          api_key_ciphertext?: string | null
          asaas_account_id?: string | null
          created_at?: string
          environment?: string
          failure_code?: string | null
          professional_id?: string
          status?: string
          updated_at?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asaas_professional_accounts_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      asaas_sandbox_test_runs: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          failure_code: string | null
          id: string
          label: string
          last_action: string
          payment_id_a: string | null
          payment_id_b: string | null
          platform_a_centavos: number
          platform_b_centavos: number
          status_a: string | null
          status_b: string | null
          subaccount_id: string | null
          total_centavos: number
          updated_at: string
          wallet_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          failure_code?: string | null
          id?: string
          label: string
          last_action?: string
          payment_id_a?: string | null
          payment_id_b?: string | null
          platform_a_centavos?: number
          platform_b_centavos?: number
          status_a?: string | null
          status_b?: string | null
          subaccount_id?: string | null
          total_centavos?: number
          updated_at?: string
          wallet_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          failure_code?: string | null
          id?: string
          label?: string
          last_action?: string
          payment_id_a?: string | null
          payment_id_b?: string | null
          platform_a_centavos?: number
          platform_b_centavos?: number
          status_a?: string | null
          status_b?: string | null
          subaccount_id?: string | null
          total_centavos?: number
          updated_at?: string
          wallet_id?: string | null
        }
        Relationships: []
      }
      asaas_webhook_events: {
        Row: {
          environment: string
          error_message: string | null
          event_id: string
          event_type: string
          failure_code: string | null
          id: string
          processed_at: string | null
          provider_payment_id: string | null
          received_at: string
          status: string
        }
        Insert: {
          environment: string
          error_message?: string | null
          event_id: string
          event_type: string
          failure_code?: string | null
          id?: string
          processed_at?: string | null
          provider_payment_id?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          environment?: string
          error_message?: string | null
          event_id?: string
          event_type?: string
          failure_code?: string | null
          id?: string
          processed_at?: string | null
          provider_payment_id?: string | null
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          ip: string | null
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          ip?: string | null
          metadata?: Json
        }
        Relationships: []
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
          clareza: number | null
          comentario: string | null
          cordialidade: number | null
          created_at: string
          id: string
          moderacao: string
          nota: number
          patient_id: string
          pontualidade: number | null
          professional_id: string
          publica: boolean
          updated_at: string
        }
        Insert: {
          appointment_id: string
          clareza?: number | null
          comentario?: string | null
          cordialidade?: number | null
          created_at?: string
          id?: string
          moderacao?: string
          nota: number
          patient_id: string
          pontualidade?: number | null
          professional_id: string
          publica?: boolean
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          clareza?: number | null
          comentario?: string | null
          cordialidade?: number | null
          created_at?: string
          id?: string
          moderacao?: string
          nota?: number
          patient_id?: string
          pontualidade?: number | null
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
      avisos_disponibilidade: {
        Row: {
          consentimento_em: string
          created_at: string
          email: string
          id: string
          politica_versao: string
        }
        Insert: {
          consentimento_em?: string
          created_at?: string
          email: string
          id?: string
          politica_versao?: string
        }
        Update: {
          consentimento_em?: string
          created_at?: string
          email?: string
          id?: string
          politica_versao?: string
        }
        Relationships: []
      }
      continuity_requests: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          iniciativa_paciente: boolean
          manifestacao_em: string
          pago_em: string | null
          patient_id: string
          professional_id: string
          provider_ref: string | null
          status: string
          valor_centavos: number
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          iniciativa_paciente: boolean
          manifestacao_em: string
          pago_em?: string | null
          patient_id: string
          professional_id: string
          provider_ref?: string | null
          status?: string
          valor_centavos: number
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          iniciativa_paciente?: boolean
          manifestacao_em?: string
          pago_em?: string | null
          patient_id?: string
          professional_id?: string
          provider_ref?: string | null
          status?: string
          valor_centavos?: number
        }
        Relationships: [
          {
            foreignKeyName: "continuity_requests_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "continuity_requests_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_documents: {
        Row: {
          active: boolean
          contract_version: string
          created_at: string
          display_name: string
          display_order: number
          document_key: string
          id: string
          required_before_acceptance: boolean
          sha256: string
          storage_path: string
        }
        Insert: {
          active?: boolean
          contract_version: string
          created_at?: string
          display_name: string
          display_order?: number
          document_key: string
          id?: string
          required_before_acceptance?: boolean
          sha256: string
          storage_path: string
        }
        Update: {
          active?: boolean
          contract_version?: string
          created_at?: string
          display_name?: string
          display_order?: number
          document_key?: string
          id?: string
          required_before_acceptance?: boolean
          sha256?: string
          storage_path?: string
        }
        Relationships: []
      }
      contrato_versoes: {
        Row: {
          arquivo_sha256: string
          ativo: boolean
          caminho: string
          created_at: string
          id: string
          modo_assinatura: string
          provedor: string | null
          publicado_em: string
          titulo: string
          versao: string
        }
        Insert: {
          arquivo_sha256: string
          ativo?: boolean
          caminho: string
          created_at?: string
          id?: string
          modo_assinatura?: string
          provedor?: string | null
          publicado_em?: string
          titulo: string
          versao: string
        }
        Update: {
          arquivo_sha256?: string
          ativo?: boolean
          caminho?: string
          created_at?: string
          id?: string
          modo_assinatura?: string
          provedor?: string | null
          publicado_em?: string
          titulo?: string
          versao?: string
        }
        Relationships: []
      }
      contratos_profissionais: {
        Row: {
          aceite_ip: string | null
          aceito_em: string
          arquivo_sha256: string | null
          contrato_versao_id: string | null
          created_at: string
          crp: string | null
          crp_uf: string | null
          documento: string
          geolocalizacao_aproximada: Json | null
          id: string
          identificador_dispositivo: string | null
          modo_assinatura: string
          nome_assinatura: string
          professional_id: string
          provedor: string | null
          provedor_evidencia: Json | null
          provedor_referencia: string | null
          status_assinatura: string
          texto_aceite: string | null
          updated_at: string
          user_agent: string | null
          versao: string
        }
        Insert: {
          aceite_ip?: string | null
          aceito_em?: string
          arquivo_sha256?: string | null
          contrato_versao_id?: string | null
          created_at?: string
          crp?: string | null
          crp_uf?: string | null
          documento: string
          geolocalizacao_aproximada?: Json | null
          id?: string
          identificador_dispositivo?: string | null
          modo_assinatura?: string
          nome_assinatura: string
          professional_id: string
          provedor?: string | null
          provedor_evidencia?: Json | null
          provedor_referencia?: string | null
          status_assinatura?: string
          texto_aceite?: string | null
          updated_at?: string
          user_agent?: string | null
          versao: string
        }
        Update: {
          aceite_ip?: string | null
          aceito_em?: string
          arquivo_sha256?: string | null
          contrato_versao_id?: string | null
          created_at?: string
          crp?: string | null
          crp_uf?: string | null
          documento?: string
          geolocalizacao_aproximada?: Json | null
          id?: string
          identificador_dispositivo?: string | null
          modo_assinatura?: string
          nome_assinatura?: string
          professional_id?: string
          provedor?: string | null
          provedor_evidencia?: Json | null
          provedor_referencia?: string | null
          status_assinatura?: string
          texto_aceite?: string | null
          updated_at?: string
          user_agent?: string | null
          versao?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratos_profissionais_contrato_versao_id_fkey"
            columns: ["contrato_versao_id"]
            isOneToOne: false
            referencedRelation: "contrato_versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_profissionais_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      deteccoes_anticontato: {
        Row: {
          acao: string
          appointment_id: string | null
          ator_id: string
          contexto: string
          id: string
          ocorrido_em: string
          padrao_tipo: string
          professional_id: string | null
        }
        Insert: {
          acao: string
          appointment_id?: string | null
          ator_id: string
          contexto: string
          id?: string
          ocorrido_em?: string
          padrao_tipo: string
          professional_id?: string | null
        }
        Update: {
          acao?: string
          appointment_id?: string | null
          ator_id?: string
          contexto?: string
          id?: string
          ocorrido_em?: string
          padrao_tipo?: string
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deteccoes_anticontato_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deteccoes_anticontato_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_acceptances: {
        Row: {
          accepted_at: string
          annex_hashes: Json
          contract_sha256: string
          contract_version: string
          created_at: string
          declarations: Json
          evidence_sha256: string
          geo_city: string | null
          geo_country: string | null
          geo_region: string | null
          id: string
          ip: unknown
          professional_id: string
          scroll_completed_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          annex_hashes: Json
          contract_sha256: string
          contract_version: string
          created_at?: string
          declarations: Json
          evidence_sha256: string
          geo_city?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          ip?: unknown
          professional_id: string
          scroll_completed_at: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          annex_hashes?: Json
          contract_sha256?: string
          contract_version?: string
          created_at?: string
          declarations?: Json
          evidence_sha256?: string
          geo_city?: string | null
          geo_country?: string | null
          geo_region?: string | null
          id?: string
          ip?: unknown
          professional_id?: string
          scroll_completed_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_acceptances_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      document_accesses: {
        Row: {
          accessed_at: string
          contract_version: string
          document_key: string
          document_sha256: string
          id: string
          ip: unknown
          professional_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          contract_version: string
          document_key: string
          document_sha256: string
          id?: string
          ip?: unknown
          professional_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          contract_version?: string
          document_key?: string
          document_sha256?: string
          id?: string
          ip?: unknown
          professional_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_accesses_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_auditoria: {
        Row: {
          appointment_id: string | null
          ator: string | null
          ator_papel: string | null
          id: string
          metadados: Json
          ocorrido_em: string
          professional_id: string | null
          tipo: string
        }
        Insert: {
          appointment_id?: string | null
          ator?: string | null
          ator_papel?: string | null
          id?: string
          metadados?: Json
          ocorrido_em?: string
          professional_id?: string | null
          tipo: string
        }
        Update: {
          appointment_id?: string | null
          ator?: string | null
          ator_papel?: string | null
          id?: string
          metadados?: Json
          ocorrido_em?: string
          professional_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_auditoria_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_auditoria_professional_id_fkey"
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
      post_consultation_surveys: {
        Row: {
          appointment_id: string
          id: string
          patient_id: string
          professional_id: string
          responded_at: string
          resposta: string
        }
        Insert: {
          appointment_id: string
          id?: string
          patient_id: string
          professional_id: string
          responded_at?: string
          resposta: string
        }
        Update: {
          appointment_id?: string
          id?: string
          patient_id?: string
          professional_id?: string
          responded_at?: string
          resposta?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_consultation_surveys_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_consultation_surveys_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
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
          abordagens_publicas: string[]
          apolice_numero: string | null
          apolice_seguro_url: string | null
          apolice_validade: string | null
          apresentacao: string | null
          areas: string[]
          biografia_publica: string | null
          cadastro_conferido_em: string | null
          cadastro_conferido_por: string | null
          certidao_conselho_url: string | null
          certidao_validade: string | null
          cidade: string | null
          cnpj: string | null
          comissao_percent: number
          cpf: string | null
          created_at: string
          cursos: string[]
          destaque: string | null
          documentos_formacao_urls: string[]
          email_contato: string | null
          especializacoes: string[]
          experiencia_anos: number
          experiencia_toc: string | null
          ferramenta_instrucoes: string | null
          ferramenta_provedor: string | null
          ferramenta_url_sala: string | null
          formacao: string[]
          formacoes_publicas: Json
          foto_caminho: string | null
          foto_moderada_em: string | null
          foto_moderada_por: string | null
          foto_observacao: string | null
          foto_status: string
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
          perfil_bloqueios_contato: number
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          requer_correcao: boolean
          rqe: string | null
          seguradora_nome: string | null
          slot_minutos: number
          slug: string
          status: Database["public"]["Enums"]["prof_status"]
          telefone: string | null
          temas_toc_publicos: string[]
          timezone: string
          uf: string
          updated_at: string
          user_id: string | null
          validado_em: string | null
          validado_por: string | null
          valor_centavos: number
          valor_liquido_centavos: number | null
          verificado_em_doc: string | null
        }
        Insert: {
          abordagem?: string | null
          abordagens_publicas?: string[]
          apolice_numero?: string | null
          apolice_seguro_url?: string | null
          apolice_validade?: string | null
          apresentacao?: string | null
          areas?: string[]
          biografia_publica?: string | null
          cadastro_conferido_em?: string | null
          cadastro_conferido_por?: string | null
          certidao_conselho_url?: string | null
          certidao_validade?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_percent?: number
          cpf?: string | null
          created_at?: string
          cursos?: string[]
          destaque?: string | null
          documentos_formacao_urls?: string[]
          email_contato?: string | null
          especializacoes?: string[]
          experiencia_anos?: number
          experiencia_toc?: string | null
          ferramenta_instrucoes?: string | null
          ferramenta_provedor?: string | null
          ferramenta_url_sala?: string | null
          formacao?: string[]
          formacoes_publicas?: Json
          foto_caminho?: string | null
          foto_moderada_em?: string | null
          foto_moderada_por?: string | null
          foto_observacao?: string | null
          foto_status?: string
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
          perfil_bloqueios_contato?: number
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          requer_correcao?: boolean
          rqe?: string | null
          seguradora_nome?: string | null
          slot_minutos?: number
          slug: string
          status?: Database["public"]["Enums"]["prof_status"]
          telefone?: string | null
          temas_toc_publicos?: string[]
          timezone?: string
          uf: string
          updated_at?: string
          user_id?: string | null
          validado_em?: string | null
          validado_por?: string | null
          valor_centavos?: number
          valor_liquido_centavos?: number | null
          verificado_em_doc?: string | null
        }
        Update: {
          abordagem?: string | null
          abordagens_publicas?: string[]
          apolice_numero?: string | null
          apolice_seguro_url?: string | null
          apolice_validade?: string | null
          apresentacao?: string | null
          areas?: string[]
          biografia_publica?: string | null
          cadastro_conferido_em?: string | null
          cadastro_conferido_por?: string | null
          certidao_conselho_url?: string | null
          certidao_validade?: string | null
          cidade?: string | null
          cnpj?: string | null
          comissao_percent?: number
          cpf?: string | null
          created_at?: string
          cursos?: string[]
          destaque?: string | null
          documentos_formacao_urls?: string[]
          email_contato?: string | null
          especializacoes?: string[]
          experiencia_anos?: number
          experiencia_toc?: string | null
          ferramenta_instrucoes?: string | null
          ferramenta_provedor?: string | null
          ferramenta_url_sala?: string | null
          formacao?: string[]
          formacoes_publicas?: Json
          foto_caminho?: string | null
          foto_moderada_em?: string | null
          foto_moderada_por?: string | null
          foto_observacao?: string | null
          foto_status?: string
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
          perfil_bloqueios_contato?: number
          profissao?: Database["public"]["Enums"]["profissao"]
          registro?: string
          requer_correcao?: boolean
          rqe?: string | null
          seguradora_nome?: string | null
          slot_minutos?: number
          slug?: string
          status?: Database["public"]["Enums"]["prof_status"]
          telefone?: string | null
          temas_toc_publicos?: string[]
          timezone?: string
          uf?: string
          updated_at?: string
          user_id?: string | null
          validado_em?: string | null
          validado_por?: string | null
          valor_centavos?: number
          valor_liquido_centavos?: number | null
          verificado_em_doc?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cidade: string | null
          codigo_anonimo: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_telefone: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          email: string | null
          foto_url: string | null
          id: string
          nome: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          codigo_anonimo?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          foto_url?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          codigo_anonimo?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_telefone?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tentativas_login_gestor: {
        Row: {
          created_at: string
          id: string
          identificador_hash: string
          sucesso: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          identificador_hash: string
          sucesso?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          identificador_hash?: string
          sucesso?: boolean
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
      contato_emergencia_paciente: {
        Args: { _patient_id: string }
        Returns: {
          nome: string
          telefone: string
        }[]
      }
      cron_token_valido: {
        Args: { _nome: string; _token: string }
        Returns: boolean
      }
      expirar_reservas_vencidas: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      indicadores_profissionais: {
        Args: never
        Returns: {
          alerta_cancelamento: boolean
          alerta_retorno: boolean
          cancelamentos_tardios: number
          continuidades: number
          deteccoes: number
          nao_comparecimentos: number
          nome: string
          pacientes_primeira_consulta: number
          pacientes_retorno: number
          professional_id: string
          taxa_retorno: number
        }[]
      }
      meus_pacientes_agendados: {
        Args: never
        Returns: {
          codigo_anonimo: string
          id: string
          nome: string
        }[]
      }
      perfil_pronto_para_publicar: {
        Args: { _professional_id: string }
        Returns: boolean
      }
      professional_contract_ready: {
        Args: { _professional_id: string }
        Returns: boolean
      }
      professional_tem_contrato_ativo_aceito: {
        Args: { _professional_id: string }
        Returns: boolean
      }
      profissionais_das_minhas_consultas: {
        Args: never
        Returns: {
          ferramenta_instrucoes: string
          ferramenta_provedor: string
          id: string
          nome: string
          profissao: Database["public"]["Enums"]["profissao"]
          registro: string
          slug: string
        }[]
      }
      proximos_horarios: {
        Args: { _dias: number; _limite: number }
        Returns: {
          inicio: string
          slug: string
        }[]
      }
      registrar_deteccao_anticontato: {
        Args: {
          _acao: string
          _appointment_id: string
          _contexto: string
          _padrao_tipo: string
          _professional_id: string
        }
        Returns: undefined
      }
      relatorio_metadados: {
        Args: { _ate: string; _de: string }
        Returns: {
          canceladas_paciente: number
          canceladas_profissional: number
          expiradas: number
          nao_comparecimentos: number
          nome: string
          professional_id: string
          realizadas: number
          taxas_centavos: number
        }[]
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
        | "expirado"
      doc_status: "enviado" | "aprovado" | "recusado"
      payment_status:
        | "pendente"
        | "aprovado"
        | "recusado"
        | "estornado"
        | "cancelado"
      payout_status: "pendente" | "processando" | "pago" | "falhou"
      prof_status:
        | "pendente"
        | "aprovado"
        | "suspenso"
        | "rejeitado"
        | "descredenciado"
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
        "expirado",
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
      prof_status: [
        "pendente",
        "aprovado",
        "suspenso",
        "rejeitado",
        "descredenciado",
      ],
      profissao: ["psicologo", "psiquiatra"],
    },
  },
} as const
