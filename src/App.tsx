import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bell,
  Check,
  ChevronRight,
  CircleAlert,
  Compass,
  Download,
  Home,
  Info,
  LoaderCircle,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Menu,
  MessageCircleWarning,
  Navigation,
  Phone,
  Plus,
  Radio,
  Route,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  UserRound,
  Users,
  Wifi,
  WifiOff,
  X
} from 'lucide-react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap
} from 'react-leaflet'
import L from 'leaflet'
import { DEFAULT_CENTER, demoEvents, emergencyNumbers, reportCategories } from './data'
import { getContacts, getLocalReports, saveContacts, saveLocalReports } from './storage'
import type { ReportCategory, RiskLevel, SafetyEvent, Tab, TrustedContact } from './types'

type Coordinates = [number, number]

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const riskColors: Record<RiskLevel, string> = {
  baixo: '#267568',
  moderado: '#df8c2b',
  elevado: '#cc4a3f'
}

const markerIcon = L.divIcon({
  className: 'destination-marker',
  html: '<div><span></span></div>',
  iconSize: [30, 38],
  iconAnchor: [15, 36]
})

function RecenterMap({ center }: { center: Coordinates }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 14), { duration: 0.8 })
  }, [center, map])
  return null
}

function Brand() {
  return (
    <div className="brand" aria-label="Sinaliza Cidadã">
      <div className="brand-mark"><Radio size={22} strokeWidth={2.8} /></div>
      <div>
        <strong>Sinaliza</strong>
        <span>Cidadã</span>
      </div>
    </div>
  )
}

function StatusPill({ online }: { online: boolean }) {
  return (
    <div className={`status-pill ${online ? '' : 'offline'}`}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      {online ? 'Atualizado agora' : 'Modo offline'}
    </div>
  )
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`risk-badge ${level}`}>{level === 'baixo' ? 'atenção baixa' : `atenção ${level}`}</span>
}

function BottomNavigation({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  const items: Array<{ tab: Tab; label: string; icon: typeof Home }> = [
    { tab: 'inicio', label: 'Início', icon: Home },
    { tab: 'mapa', label: 'Mapa', icon: MapIcon },
    { tab: 'relatar', label: 'Relatar', icon: Plus },
    { tab: 'emergencia', label: 'Ajuda', icon: Phone },
    { tab: 'perfil', label: 'Perfil', icon: UserRound }
  ]

  return (
    <nav className="bottom-nav" aria-label="Navegação principal">
      <span className="nav-section-label">Menu principal</span>
      {items.map(({ tab, label, icon: Icon }) => (
        <button key={tab} className={active === tab ? 'active' : ''} onClick={() => onChange(tab)}>
          <Icon size={21} />
          <span>{label}</span>
        </button>
      ))}
      <div className="sidebar-note">
        <Shield size={18} />
        <span><strong>Projeto comunitário</strong><small>Dados transparentes e responsáveis</small></span>
      </div>
    </nav>
  )
}

function SafetyMap({
  events,
  center,
  userLocation,
  destination,
  routePoints,
  selectedEvent,
  onSelectEvent
}: {
  events: SafetyEvent[]
  center: Coordinates
  userLocation: Coordinates | null
  destination: Coordinates | null
  routePoints: Coordinates[]
  selectedEvent: string | null
  onSelectEvent: (id: string) => void
}) {
  const [tilesReady, setTilesReady] = useState(false)
  const [tileFailed, setTileFailed] = useState(false)

  return (
    <>
      <MapContainer center={center} zoom={14} zoomControl={false} className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            loading: () => setTilesReady(false),
            load: () => { setTilesReady(true); setTileFailed(false) },
            tileerror: () => setTileFailed(true)
          }}
        />
        <RecenterMap center={center} />
        {events.map((event) => (
          <CircleMarker
            key={event.id}
            center={[event.lat, event.lng]}
            radius={selectedEvent === event.id ? 13 : 9}
            pathOptions={{
              color: '#fff',
              weight: 3,
              fillColor: riskColors[event.level],
              fillOpacity: 0.95
            }}
            eventHandlers={{ click: () => onSelectEvent(event.id) }}
          >
            <Popup>
              <div className="map-popup">
                <RiskBadge level={event.level} />
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
                <small>{event.source} · confiança {event.confidence}</small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        {userLocation && (
          <>
            <Circle center={userLocation} radius={110} pathOptions={{ color: '#16695d', fillOpacity: 0.08, weight: 1 }} />
            <CircleMarker center={userLocation} radius={8} pathOptions={{ color: '#fff', weight: 4, fillColor: '#16695d', fillOpacity: 1 }} />
          </>
        )}
        {destination && <Marker position={destination} icon={markerIcon} />}
        {routePoints.length > 1 && (
          <Polyline positions={routePoints} pathOptions={{ color: '#102e2a', weight: 6, opacity: 0.82, lineCap: 'round' }} />
        )}
      </MapContainer>
      {!tilesReady && (
        <div className={`map-tile-status ${tileFailed ? 'failed' : ''}`}>
          {tileFailed ? <WifiOff size={18} /> : <LoaderCircle size={18} className="spin" />}
          <span>{tileFailed ? 'Não foi possível carregar o mapa. Verifique sua conexão.' : 'Carregando o mapa…'}</span>
        </div>
      )}
    </>
  )
}

function HomeView({
  events,
  online,
  userLocation,
  setTab,
  openSos
}: {
  events: SafetyEvent[]
  online: boolean
  userLocation: Coordinates | null
  setTab: (tab: Tab) => void
  openSos: () => void
}) {
  const recent = events.slice(0, 3)
  return (
    <main className="view home-view">
      <section className="hero-card">
        <div className="hero-topline">
          <StatusPill online={online} />
          <span className="demo-label">MVP · dados demonstrativos</span>
        </div>
        <p className="eyebrow">Situação ao seu redor</p>
        <h1>Informação para chegar melhor.</h1>
        <p className="hero-copy">
          A região apresenta <strong>atenção moderada</strong> neste momento. Consulte os sinais antes de sair.
        </p>
        <button className="location-row" onClick={() => setTab('mapa')}>
          <span className="location-icon"><LocateFixed size={19} /></span>
          <span>
            <small>Sua localização</small>
            <strong>{userLocation ? 'Ver minha posição no mapa' : 'Abrir mapa e permitir localização'}</strong>
          </span>
          <ChevronRight size={19} />
        </button>
      </section>

      <section className="quick-grid" aria-label="Ações rápidas">
        <button className="quick-action route-action" onClick={() => setTab('mapa')}>
          <span><Route size={23} /></span>
          <div><strong>Planejar rota</strong><small>Compare o caminho</small></div>
          <ChevronRight size={18} />
        </button>
        <button className="quick-action report-action" onClick={() => setTab('relatar')}>
          <span><MessageCircleWarning size={23} /></span>
          <div><strong>Fazer relato</strong><small>Ajude sua região</small></div>
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div><p className="eyebrow">Sinais recentes</p><h2>Perto de você</h2></div>
          <button className="text-button" onClick={() => setTab('mapa')}>Ver mapa</button>
        </div>
        <div className="signal-list">
          {recent.map((event) => (
            <button key={event.id} className="signal-card" onClick={() => setTab('mapa')}>
              <span className="signal-dot" style={{ background: riskColors[event.level] }} />
              <div>
                <div className="signal-meta"><RiskBadge level={event.level} /><span>{event.ageMinutes} min</span></div>
                <strong>{event.title}</strong>
                <p>{event.detail}</p>
                <small>{event.confirmations} confirmações · {event.source}</small>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      </section>

      <section className="community-note">
        <div><Users size={24} /></div>
        <p><strong>Segurança se constrói em conjunto.</strong> Relatos são agregados, expiram com o tempo e nunca identificam publicamente quem enviou.</p>
      </section>

      <button className="floating-sos" onClick={openSos} aria-label="Abrir central SOS">
        <ShieldAlert size={23} />
        <span>SOS</span>
      </button>
    </main>
  )
}

function MapView({
  events,
  userLocation,
  isLocating,
  locationAttempted,
  locate,
  showToast
}: {
  events: SafetyEvent[]
  userLocation: Coordinates | null
  isLocating: boolean
  locationAttempted: boolean
  locate: () => void
  showToast: (message: string) => void
}) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [destination, setDestination] = useState<Coordinates | null>(null)
  const [destinationName, setDestinationName] = useState('')
  const [routePoints, setRoutePoints] = useState<Coordinates[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [filter, setFilter] = useState<'todos' | RiskLevel>('todos')
  const mapCenter = userLocation ?? DEFAULT_CENTER
  const waitingForLocation = !userLocation && (!locationAttempted || isLocating)

  useEffect(() => {
    if (!userLocation && !locationAttempted && !isLocating) {
      locate()
    }
  }, [isLocating, locate, locationAttempted, userLocation])

  const visibleEvents = useMemo(
    () => (filter === 'todos' ? events : events.filter((event) => event.level === filter)),
    [events, filter]
  )

  async function searchDestination(event: React.FormEvent) {
    event.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`)
      const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>
      if (!results[0]) throw new Error('Destino não encontrado')
      const target: Coordinates = [Number(results[0].lat), Number(results[0].lon)]
      setDestination(target)
      setDestinationName(results[0].display_name.split(',').slice(0, 3).join(','))
      const origin = userLocation ?? DEFAULT_CENTER
      const routeResponse = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${target[1]},${target[0]}?overview=full&geometries=geojson`)
      const routeData = await routeResponse.json() as { routes?: Array<{ geometry: { coordinates: [number, number][] } }> }
      const points = routeData.routes?.[0]?.geometry.coordinates.map(([lng, lat]) => [lat, lng] as Coordinates)
      setRoutePoints(points?.length ? points : [origin, target])
      showToast('Rota analisada com sinais disponíveis')
    } catch {
      showToast('Não foi possível localizar esse destino agora')
    } finally {
      setSearching(false)
    }
  }

  return (
    <main className="view map-view">
      <div className="map-stage">
        {waitingForLocation ? (
          <div className="map-location-gate">
            <span><LoaderCircle size={29} className="spin" /></span>
            <p className="eyebrow">Preparando seu mapa</p>
            <h2>Encontrando sua localização…</h2>
            <p>Usamos a posição somente para centralizar o mapa e ela não é publicada.</p>
          </div>
        ) : (
          <>
            <SafetyMap
              events={visibleEvents}
              center={destination ?? mapCenter}
              userLocation={userLocation}
              destination={destination}
              routePoints={routePoints}
              selectedEvent={selectedEvent}
              onSelectEvent={setSelectedEvent}
            />
            <form className="map-search" onSubmit={searchDestination}>
              <Search size={19} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Para onde você vai?" aria-label="Destino" />
              <button type="submit" disabled={searching}>{searching ? '...' : <Navigation size={18} />}</button>
            </form>
            <button className="locate-map" onClick={locate} aria-label="Usar minha localização"><LocateFixed size={21} /></button>
            <div className="map-filters">
              {(['todos', 'baixo', 'moderado', 'elevado'] as const).map((item) => (
                <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                  {item === 'todos' ? 'Todos' : item}
                </button>
              ))}
            </div>
            <div className="map-legend"><span><i className="low" />Baixa</span><span><i className="medium" />Moderada</span><span><i className="high" />Elevada</span></div>
          </>
        )}
      </div>

      <section className="route-summary">
        <div className="route-grabber" />
        {destination ? (
          <>
            <div className="route-title">
              <span className="route-icon"><Route size={22} /></span>
              <div><p className="eyebrow">Análise contextual</p><h2>{destinationName}</h2></div>
              <RiskBadge level="moderado" />
            </div>
            <div className="route-stats">
              <div><strong>{routePoints.length > 1 ? 'Rota encontrada' : 'Linha direta'}</strong><span>trajeto sugerido</span></div>
              <div><strong>{visibleEvents.length}</strong><span>sinais no mapa</span></div>
              <div><strong>Moderada</strong><span>confiança</span></div>
            </div>
            <div className="caution-box"><TriangleAlert size={20} /><p>Consulte o mapa durante o percurso. Os dados apoiam sua decisão, mas não garantem a segurança da rota.</p></div>
          </>
        ) : (
          <div className="empty-route">
            <span><Compass size={26} /></span>
            <div><h2>Planeje antes de sair</h2><p>Busque um destino para comparar o caminho com os sinais disponíveis.</p></div>
          </div>
        )}
      </section>
    </main>
  )
}

function ReportView({
  userLocation,
  locate,
  onSubmit
}: {
  userLocation: Coordinates | null
  locate: () => void
  onSubmit: (event: SafetyEvent) => void
}) {
  const [category, setCategory] = useState<ReportCategory | null>(null)
  const [detail, setDetail] = useState('')
  const [level, setLevel] = useState<RiskLevel>('moderado')
  const [sent, setSent] = useState(false)

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!category) return
    const [lat, lng] = userLocation ?? DEFAULT_CENTER
    onSubmit({
      id: `local-${Date.now()}`,
      category,
      title: category,
      detail: detail.trim() || 'Relato comunitário sem descrição adicional.',
      lat,
      lng,
      level,
      source: 'Comunidade',
      ageMinutes: 0,
      confidence: 'baixa',
      confirmations: 1
    })
    setSent(true)
  }

  if (sent) {
    return (
      <main className="view centered-state">
        <div className="success-mark"><Check size={34} /></div>
        <p className="eyebrow">Relato recebido</p>
        <h1>Obrigado por sinalizar.</h1>
        <p>Ele foi salvo neste dispositivo como relato não verificado. Na versão pública, passará por moderação e agregação antes de aparecer para outras pessoas.</p>
        <button className="primary-button" onClick={() => { setSent(false); setCategory(null); setDetail('') }}>Fazer outro relato</button>
      </main>
    )
  }

  return (
    <main className="view report-view">
      <div className="page-intro">
        <p className="eyebrow">Colabore com cuidado</p>
        <h1>O que você percebeu?</h1>
        <p>Não informe nomes, placas, rostos ou endereços residenciais. Em emergência, ligue 190.</p>
      </div>
      <form onSubmit={submit}>
        <div className="category-grid">
          {reportCategories.map((item) => (
            <button type="button" key={item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>
              <span>{item === 'Alagamento' ? '≈' : item === 'Iluminação precária' ? '✦' : item === 'Via bloqueada' ? '—' : '!'}</span>
              {item}
              {category === item && <Check size={17} />}
            </button>
          ))}
        </div>

        <label className="field-label">Nível de atenção percebido</label>
        <div className="segmented-control">
          {(['baixo', 'moderado', 'elevado'] as const).map((item) => (
            <button type="button" key={item} className={level === item ? 'active' : ''} onClick={() => setLevel(item)}>{item}</button>
          ))}
        </div>

        <label className="field-label" htmlFor="detail">Descreva brevemente <span>opcional</span></label>
        <textarea id="detail" value={detail} onChange={(event) => setDetail(event.target.value.slice(0, 240))} placeholder="Ex.: poste apagado próximo ao ponto de ônibus" rows={4} />
        <div className="char-count">{detail.length}/240</div>

        <button type="button" className="location-picker" onClick={locate}>
          <MapPin size={20} />
          <span><small>Local do relato</small><strong>{userLocation ? 'Localização aproximada atual' : 'Usar minha localização'}</strong></span>
          <ChevronRight size={18} />
        </button>

        <div className="privacy-inline"><Shield size={19} /><p>Seu nome e sua localização exata não serão exibidos publicamente.</p></div>
        <button className="primary-button" type="submit" disabled={!category}>Enviar relato</button>
      </form>
    </main>
  )
}

function EmergencyView({
  userLocation,
  locate,
  contacts,
  openSos,
  shareLocation
}: {
  userLocation: Coordinates | null
  locate: () => void
  contacts: TrustedContact[]
  openSos: () => void
  shareLocation: () => void
}) {
  return (
    <main className="view emergency-view">
      <section className="emergency-hero">
        <p className="eyebrow">Ajuda imediata</p>
        <h1>Você não está só.</h1>
        <p>Em risco agora, procure um lugar movimentado e acione o serviço adequado.</p>
        <button className="sos-button" onClick={openSos}>
          <span><ShieldAlert size={31} /></span>
          <div><strong>ABRIR SOS</strong><small>Ligar ou compartilhar localização</small></div>
          <ChevronRight size={22} />
        </button>
      </section>

      <section className="section-block emergency-section">
        <div className="section-heading"><div><p className="eyebrow">Serviços oficiais</p><h2>Números de emergência</h2></div></div>
        <div className="phone-list">
          {emergencyNumbers.map((service) => (
            <a key={service.number} href={`tel:${service.number}`} className="phone-card">
              <span className="phone-number">{service.number}</span>
              <div><strong>{service.label}</strong><small>{service.note}</small></div>
              <span className="call-icon"><Phone size={18} /></span>
            </a>
          ))}
        </div>
      </section>

      <section className="trusted-card">
        <div className="trusted-icon"><Users size={23} /></div>
        <div><strong>Contatos de confiança</strong><p>{contacts.length ? `${contacts.length} contato(s) preparado(s)` : 'Adicione contatos no seu perfil'}</p></div>
        <ChevronRight size={19} />
      </section>

      <button className="share-button" onClick={userLocation ? shareLocation : locate}>
        <Navigation size={19} />
        {userLocation ? 'Compartilhar localização agora' : 'Ativar minha localização'}
      </button>
    </main>
  )
}

function ProfileView({
  contacts,
  setContacts,
  canInstall,
  install,
  clearData,
  showToast
}: {
  contacts: TrustedContact[]
  setContacts: (contacts: TrustedContact[]) => void
  canInstall: boolean
  install: () => void
  clearData: () => void
  showToast: (message: string) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  function addContact(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || !phone.trim()) return
    setContacts([...contacts, { id: String(Date.now()), name: name.trim(), phone: phone.replace(/[^0-9+]/g, '') }])
    setName('')
    setPhone('')
    showToast('Contato salvo somente neste dispositivo')
  }

  return (
    <main className="view profile-view">
      <div className="page-intro">
        <p className="eyebrow">Seu espaço</p>
        <h1>Preferências e privacidade</h1>
        <p>O MVP mantém seus contatos e relatos apenas neste navegador.</p>
      </div>

      <section className="profile-card">
        <div className="section-heading"><div><p className="eyebrow">Rede de apoio</p><h2>Contatos de confiança</h2></div></div>
        {contacts.length > 0 && (
          <div className="contact-list">
            {contacts.map((contact) => (
              <div className="contact-row" key={contact.id}>
                <span>{contact.name.slice(0, 1).toUpperCase()}</span>
                <div><strong>{contact.name}</strong><small>{contact.phone}</small></div>
                <button onClick={() => setContacts(contacts.filter((item) => item.id !== contact.id))} aria-label={`Remover ${contact.name}`}><X size={17} /></button>
              </div>
            ))}
          </div>
        )}
        <form className="contact-form" onSubmit={addContact}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome" aria-label="Nome do contato" />
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone com DDD" inputMode="tel" aria-label="Telefone do contato" />
          <button type="submit"><Plus size={18} /> Adicionar</button>
        </form>
      </section>

      <section className="settings-list">
        {canInstall && <button onClick={install}><span><Download size={20} /></span><div><strong>Instalar aplicativo</strong><small>Use como um app no seu celular</small></div><ChevronRight size={18} /></button>}
        <button onClick={() => showToast('Alertas serão ativados após a integração do servidor')}><span><Bell size={20} /></span><div><strong>Alertas de região</strong><small>Em preparação para o piloto</small></div><ChevronRight size={18} /></button>
        <button onClick={() => showToast('Seus dados ficam localmente neste MVP')}><span><Shield size={20} /></span><div><strong>Privacidade</strong><small>Localização somente com sua permissão</small></div><ChevronRight size={18} /></button>
        <button onClick={clearData}><span><Settings size={20} /></span><div><strong>Limpar dados locais</strong><small>Remove relatos e contatos deste aparelho</small></div><ChevronRight size={18} /></button>
      </section>

      <section className="method-card">
        <Info size={21} />
        <div><strong>Como interpretamos risco</strong><p>Fonte, recência, distância e confirmações ajudam a organizar sinais. “Atenção baixa” nunca significa garantia de segurança.</p></div>
      </section>
      <p className="version-note">Sinaliza Cidadã · MVP 0.1 · projeto sem fins lucrativos</p>
    </main>
  )
}

function SosModal({
  close,
  userLocation,
  locate,
  shareLocation,
  contacts
}: {
  close: () => void
  userLocation: Coordinates | null
  locate: () => void
  shareLocation: () => void
  contacts: TrustedContact[]
}) {
  const [holding, setHolding] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)

  function stop() {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (tickRef.current) window.clearInterval(tickRef.current)
    timerRef.current = null
    tickRef.current = null
    setHolding(false)
    setProgress(0)
  }

  function start() {
    setHolding(true)
    const started = Date.now()
    tickRef.current = window.setInterval(() => setProgress(Math.min(100, ((Date.now() - started) / 1800) * 100)), 40)
    timerRef.current = window.setTimeout(() => {
      stop()
      window.location.href = 'tel:190'
    }, 1800)
  }

  useEffect(() => stop, [])

  const smsRecipients = contacts.map((contact) => contact.phone).join(',')
  const mapLink = userLocation ? `https://www.google.com/maps?q=${userLocation[0]},${userLocation[1]}` : ''

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Central SOS">
      <div className="sos-modal">
        <button className="modal-close" onClick={close} aria-label="Fechar"><X size={21} /></button>
        <div className="sos-shield"><ShieldAlert size={34} /></div>
        <p className="eyebrow">Central SOS</p>
        <h2>Você está em perigo agora?</h2>
        <p>Mantenha pressionado para ligar para a Polícia Militar. Use apenas em uma emergência real.</p>
        <button
          className={`hold-button ${holding ? 'holding' : ''}`}
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          style={{ '--hold-progress': `${progress}%` } as React.CSSProperties}
        >
          <Phone size={25} />
          <span><strong>Segure para ligar 190</strong><small>mantenha por 2 segundos</small></span>
        </button>
        <div className="sos-options">
          <button onClick={userLocation ? shareLocation : locate}><Navigation size={20} /><span><strong>{userLocation ? 'Compartilhar localização' : 'Ativar localização'}</strong><small>com sua rede de apoio</small></span></button>
          {smsRecipients && (
            <a href={`sms:${smsRecipients}?body=${encodeURIComponent(`Preciso de ajuda. Minha localização: ${mapLink}`)}`}><Users size={20} /><span><strong>Enviar SMS aos contatos</strong><small>{contacts.length} contato(s)</small></span></a>
          )}
          <a href="tel:192"><CircleAlert size={20} /><span><strong>Emergência médica</strong><small>ligar para o SAMU 192</small></span></a>
        </div>
        <div className="sos-warning"><TriangleAlert size={18} /><span>O Sinaliza não substitui nem aciona automaticamente os serviços públicos.</span></div>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('inicio')
  const [online, setOnline] = useState(navigator.onLine)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationAttempted, setLocationAttempted] = useState(false)
  const [localReports, setLocalReports] = useState<SafetyEvent[]>(getLocalReports)
  const [contacts, setContactsState] = useState<TrustedContact[]>(getContacts)
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [toast, setToast] = useState('')
  const [sosOpen, setSosOpen] = useState(false)

  const events = useMemo(() => [...localReports, ...demoEvents], [localReports])

  useEffect(() => {
    const onOnline = () => setOnline(true)
    const onOffline = () => setOnline(false)
    const onInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('beforeinstallprompt', onInstall)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeinstallprompt', onInstall)
    }
  }, [])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationAttempted(true)
      showToast('Geolocalização não disponível neste aparelho')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setLocationAttempted(true)
        setIsLocating(false)
        showToast('Localização aproximada atualizada')
      },
      () => {
        setLocationAttempted(true)
        setIsLocating(false)
        showToast('Permita o acesso à localização nas configurações do navegador')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  function addReport(event: SafetyEvent) {
    const next = [event, ...localReports]
    setLocalReports(next)
    saveLocalReports(next)
  }

  function setContacts(next: TrustedContact[]) {
    setContactsState(next)
    saveContacts(next)
  }

  async function shareLocation() {
    if (!userLocation) {
      locate()
      return
    }
    const url = `https://www.google.com/maps?q=${userLocation[0]},${userLocation[1]}`
    const payload = { title: 'Minha localização', text: 'Estou compartilhando minha localização pelo Sinaliza Cidadã.', url }
    try {
      if (navigator.share) await navigator.share(payload)
      else {
        await navigator.clipboard.writeText(`${payload.text} ${url}`)
        showToast('Localização copiada para compartilhar')
      }
    } catch {
      // O usuário pode cancelar o compartilhamento sem que isso seja um erro.
    }
  }

  async function install() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') showToast('Sinaliza instalado com sucesso')
    setInstallPrompt(null)
  }

  function clearData() {
    setLocalReports([])
    setContacts([])
    saveLocalReports([])
    showToast('Dados locais removidos')
  }

  const tabTitles: Record<Tab, string> = {
    inicio: 'Visão geral',
    mapa: 'Mapa de atenção',
    relatar: 'Novo relato',
    emergencia: 'Central de ajuda',
    perfil: 'Preferências'
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Brand />
        <div className="desktop-page-title">
          <span>Central comunitária</span>
          <strong>{tabTitles[tab]}</strong>
        </div>
        <div className="top-actions">
          <span className="desktop-online"><i /> Sistema operacional</span>
          {installPrompt && <button className="install-mini" onClick={install}><Download size={17} /><span>Instalar</span></button>}
          <button className="icon-button" onClick={() => setTab('perfil')} aria-label="Abrir configurações"><Menu size={21} /></button>
        </div>
      </header>

      {tab === 'inicio' && <HomeView events={events} online={online} userLocation={userLocation} setTab={setTab} openSos={() => setSosOpen(true)} />}
      {tab === 'mapa' && <MapView events={events} userLocation={userLocation} isLocating={isLocating} locationAttempted={locationAttempted} locate={locate} showToast={showToast} />}
      {tab === 'relatar' && <ReportView userLocation={userLocation} locate={locate} onSubmit={addReport} />}
      {tab === 'emergencia' && <EmergencyView userLocation={userLocation} locate={locate} contacts={contacts} openSos={() => setSosOpen(true)} shareLocation={shareLocation} />}
      {tab === 'perfil' && <ProfileView contacts={contacts} setContacts={setContacts} canInstall={Boolean(installPrompt)} install={install} clearData={clearData} showToast={showToast} />}

      <BottomNavigation active={tab} onChange={setTab} />
      {sosOpen && <SosModal close={() => setSosOpen(false)} userLocation={userLocation} locate={locate} shareLocation={shareLocation} contacts={contacts} />}
      {toast && <div className="toast"><Sparkles size={17} />{toast}</div>}
    </div>
  )
}
