import type { SafetyEvent } from './types'

export const DEFAULT_CENTER: [number, number] = [-2.4431, -54.7083]

export const demoEvents: SafetyEvent[] = [
  {
    id: 'demo-1',
    category: 'Iluminação precária',
    title: 'Trecho com baixa iluminação',
    detail: 'Relatos recorrentes no período noturno. Prefira a avenida principal.',
    lat: -2.4378,
    lng: -54.7102,
    level: 'moderado',
    source: 'Demonstração',
    ageMinutes: 48,
    confidence: 'moderada',
    confirmations: 4
  },
  {
    id: 'demo-2',
    category: 'Via bloqueada',
    title: 'Via parcialmente bloqueada',
    detail: 'Trânsito lento e desvio temporário sinalizado por moradores.',
    lat: -2.4487,
    lng: -54.7032,
    level: 'baixo',
    source: 'Demonstração',
    ageMinutes: 22,
    confidence: 'baixa',
    confirmations: 2
  },
  {
    id: 'demo-3',
    category: 'Roubo ou furto',
    title: 'Atenção ampliada à noite',
    detail: 'Sinal histórico demonstrativo, sem ocorrência ativa confirmada.',
    lat: -2.4528,
    lng: -54.7154,
    level: 'elevado',
    source: 'Demonstração',
    ageMinutes: 190,
    confidence: 'moderada',
    confirmations: 5
  },
  {
    id: 'demo-4',
    category: 'Alagamento',
    title: 'Ponto sujeito a alagamento',
    detail: 'Evite o trecho durante chuva intensa.',
    lat: -2.4319,
    lng: -54.6991,
    level: 'moderado',
    source: 'Demonstração',
    ageMinutes: 75,
    confidence: 'alta',
    confirmations: 9
  }
]

export const emergencyNumbers = [
  { number: '190', label: 'Polícia Militar', note: 'Crime em andamento ou risco imediato' },
  { number: '192', label: 'SAMU', note: 'Urgência e emergência médica' },
  { number: '193', label: 'Bombeiros', note: 'Incêndio, acidente e resgate' },
  { number: '199', label: 'Defesa Civil', note: 'Enchente, deslizamento e desastre' },
  { number: '180', label: 'Atendimento à Mulher', note: 'Orientação e denúncia de violência' },
  { number: '191', label: 'Polícia Rodoviária Federal', note: 'Emergências em rodovias federais' }
]

export const reportCategories = [
  'Iluminação precária',
  'Assédio ou abordagem',
  'Roubo ou furto',
  'Via bloqueada',
  'Alagamento',
  'Movimentação suspeita'
] as const
