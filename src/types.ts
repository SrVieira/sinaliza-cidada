export type RiskLevel = 'baixo' | 'moderado' | 'elevado'

export type ReportCategory =
  | 'Iluminação precária'
  | 'Assédio ou abordagem'
  | 'Roubo ou furto'
  | 'Via bloqueada'
  | 'Alagamento'
  | 'Movimentação suspeita'

export interface SafetyEvent {
  id: string
  category: ReportCategory
  title: string
  detail: string
  lat: number
  lng: number
  level: RiskLevel
  source: 'Demonstração' | 'Comunidade' | 'Órgão público' | 'Imprensa verificada'
  ageMinutes: number
  confidence: 'baixa' | 'moderada' | 'alta'
  confirmations: number
}

export interface TrustedContact {
  id: string
  name: string
  phone: string
}

export interface EmergencyService {
  number: string
  label: string
  note: string
}

export type Tab = 'inicio' | 'mapa' | 'relatar' | 'emergencia' | 'perfil'
