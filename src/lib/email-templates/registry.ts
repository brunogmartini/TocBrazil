import type { ComponentType } from 'react'

import { template as consultaConfirmada } from './consulta-confirmada'
import { template as lembreteConsulta } from './lembrete-consulta'
import { template as documentoVencendo } from './documento-vencendo'
import { template as novoCadastroProfissional } from './novo-cadastro-profissional'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'consulta-confirmada': consultaConfirmada,
  'lembrete-consulta': lembreteConsulta,
  'documento-vencendo': documentoVencendo,
  'novo-cadastro-profissional': novoCadastroProfissional,
}
