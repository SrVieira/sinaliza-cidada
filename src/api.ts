import type { ReportCategory, RiskLevel, SafetyEvent } from './types'

const configuredUrl = import.meta.env.VITE_API_URL?.trim()
export const API_URL = (configuredUrl || (import.meta.env.DEV ? 'http://localhost:3333' : '')).replace(/\/$/, '')
export const isApiConfigured = Boolean(API_URL)

const categoryLabels: Record<string, ReportCategory> = {
  lighting: 'Iluminação precária',
  harassment: 'Assédio ou abordagem',
  theft: 'Roubo ou furto',
  road_block: 'Via bloqueada',
  flood: 'Alagamento',
  suspicious_activity: 'Movimentação suspeita',
  violence: 'Assédio ou abordagem',
  other: 'Movimentação suspeita'
}

const sourceLabels = {
  community: 'Comunidade',
  official: 'Órgão público',
  news: 'Imprensa verificada'
} as const

interface ApiReport {
  id: string
  category: string
  title: string
  description: string
  severity: number
  confidence: number
  location: { lat: number; lng: number }
  source: { kind: keyof typeof sourceLabels; name: string; url: string | null }
  occurredAt: string
  confirmations: number
}

interface EmergencyServiceResponse {
  services: Array<{
    id: string
    name: string
    phone: string
    shortCode: string | null
    description: string | null
  }>
}

interface RiskResponse {
  context: {
    level: 'insufficient_data' | 'low' | 'moderate' | 'elevated'
    score: number
    dataQuality: 'insufficient' | 'limited' | 'reasonable' | 'strong'
    signalCount: number
    message: string
  }
}

async function apiFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  if (!API_URL) throw new Error('API não configurada')
  const response = await fetch(`${API_URL}${path}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`API respondeu com status ${response.status}`)
  return response.json() as Promise<T>
}

export async function fetchNearbyReports(lat: number, lng: number, signal?: AbortSignal): Promise<SafetyEvent[]> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: '5000', sinceHours: '720' })
  const response = await apiFetch<{ reports: ApiReport[] }>(`/v1/reports/nearby?${params}`, signal)
  const now = Date.now()

  return response.reports.map((report) => ({
    id: report.id,
    category: categoryLabels[report.category] ?? 'Movimentação suspeita',
    title: report.title,
    detail: report.description,
    lat: report.location.lat,
    lng: report.location.lng,
    level: (report.severity === 1 ? 'baixo' : report.severity === 2 ? 'moderado' : 'elevado') as RiskLevel,
    source: sourceLabels[report.source.kind],
    ageMinutes: Math.max(0, Math.round((now - new Date(report.occurredAt).getTime()) / 60_000)),
    confidence: report.confidence === 1 ? 'baixa' : report.confidence === 2 ? 'moderada' : 'alta',
    confirmations: report.confirmations
  }))
}

export async function fetchEmergencyServices(signal?: AbortSignal) {
  const response = await apiFetch<EmergencyServiceResponse>('/v1/emergency-services', signal)
  return response.services.map((service) => ({
    number: service.shortCode ?? service.phone,
    label: service.name,
    note: service.description ?? 'Serviço público de emergência'
  }))
}

export async function fetchRiskContext(lat: number, lng: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: '2000' })
  const response = await apiFetch<RiskResponse>(`/v1/risk/context?${params}`, signal)
  const levels: Record<RiskResponse['context']['level'], RiskLevel | null> = {
    insufficient_data: null,
    low: 'baixo',
    moderate: 'moderado',
    elevated: 'elevado'
  }
  return { ...response.context, level: levels[response.context.level] }
}
