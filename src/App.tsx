import Login from "./pages/Login";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  ArrowLeft, ArrowUpRight, Bell, CalendarDays, CheckCircle2, ChevronRight, CircleAlert,
  ClipboardList, CreditCard, Download, History, LayoutDashboard, MapPin,
  Menu, MessageSquareText, Moon, MoreHorizontal, NotebookPen, PackageSearch, Phone,
  Plus, Printer, ReceiptText, RefreshCcw, Save, Search, Settings2, ShieldCheck,
  Smartphone, Sun, Trash2, UserRoundPlus, Users, WalletCards, Wrench, X, Lock, Grid3X3
} from 'lucide-react'
import { Brand } from './components/Brand'
import { PaymentBadge, StatusBadge } from './components/Badges'
import { Dialog } from './components/Dialog'
import { useWorkshop } from './hooks/useWorkshop'
import {
  formatCurrency, formatDate, formatDateTime, getBalance, getClient, getPaid, initials,
  orderMatchesSearch, repairStatuses, statusMeta,
} from './lib/formatters'
import type { Client, Device, NewClientInput, NewOrderInput, PaymentMethod, RepairOrder, RepairStatus, WorkshopData } from './types'
import './App.css'
import { supabase } from "./lib/supabase";

type View = 'dashboard' | 'orders' | 'clients' | 'new-order'
type Toast = { message: string; tone: 'success' | 'error' } | null
type OrderFilter = 'Todas' | 'Activas' | 'Por entregar' | 'Entregadas'

type OrderDraft = {
  customerMode: 'existing' | 'new'
  selectedClientId: string
  fullName: string
  document: string
  phone: string
  address: string
  observations: string
  brand: string
  model: string
  color: string
  imei: string
  serialNumber: string
  accessCode: string
  accessories: string[]
  reportedProblem: string
  diagnosis: string
  workPerformed: string
  partsUsed: string
  technician: string
  status: RepairStatus
  estimatedTotal: string
  initialPayment: string
  paymentMethod: PaymentMethod
}

const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'orders', label: 'Órdenes', icon: ClipboardList },
  { id: 'clients', label: 'Clientes', icon: Users },
]

const defaultDraft: OrderDraft = {
  customerMode: 'existing', selectedClientId: '', fullName: '', document: '', phone: '', address: '', observations: '',
  brand: '', model: '', color: '', imei: '', serialNumber: '', accessCode: '', accessories: [],
  reportedProblem: '', diagnosis: '', workPerformed: '', partsUsed: '', technician: '', status: 'Recibido',
  estimatedTotal: '', initialPayment: '', paymentMethod: 'Efectivo',
}

/* ==========================================================================
   COMPONENTE: Selector de Patrón Gráfico (Grilla 3x3)
   ========================================================================== */
function PatternSelector({ value, onChange }: { value: string; onChange: (pattern: string) => void }) {
  const [sequence, setSequence] = useState<number[]>(() => {
    if (!value) return []
    const clean = value.replace('Patrón: ', '')
    return clean.split(' → ').map(Number).filter(Boolean)
  })

  const handlePointClick = (point: number) => {
    let newSeq: number[]
    if (sequence.includes(point)) {
      newSeq = sequence.filter((p) => p !== point)
    } else {
      newSeq = [...sequence, point]
    }
    setSequence(newSeq)
    onChange(newSeq.length > 0 ? `Patrón: ${newSeq.join(' → ')}` : '')
  }

  const handleReset = () => {
    setSequence([])
    onChange('')
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/60 p-4 w-full col-span-full">
      <div className="flex items-center justify-between w-full text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Secuencia: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{sequence.join(' → ') || 'Toca los puntos'}</span>
        </span>
        {sequence.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-red-500 hover:text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-cyan-500/20 shadow-sm">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((point) => {
          const isSelected = sequence.includes(point)
          const orderNum = sequence.indexOf(point) + 1

          return (
            <button
              key={point}
              type="button"
              onClick={() => handlePointClick(point)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-slate-400 dark:bg-slate-500'}`} />
              {isSelected && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 dark:bg-white text-[9px] font-bold text-white dark:text-slate-950 shadow">
                  {orderNum}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth();

  const workshop = useWorkshop()
  const { data } = workshop
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => window.localStorage.getItem('5G CELL COMUNICACIONES-theme') !== 'light')
  const [globalQuery, setGlobalQuery] = useState('')
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null)
  const [activeClientId, setActiveClientId] = useState<string | null>(null)
  const [clientForm, setClientForm] = useState<{ mode: 'new' | 'edit'; client?: Client } | null>(null)
  const [receiptOrderId, setReceiptOrderId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light'
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    window.localStorage.setItem('5G CELL COMUNICACIONES-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const activeOrder = data.orders.find((order) => order.id === activeOrderId)
  const activeClient = data.clients.find((client) => client.id === activeClientId)
  const receiptOrder = data.orders.find((order) => order.id === receiptOrderId)

  const globalOrders = useMemo(
    () => data.orders.filter((order) => orderMatchesSearch(order, getClient(data.clients, order.clientId), globalQuery)).slice(0, 5),
    [data.clients, data.orders, globalQuery],
  )
  const globalClients = useMemo(() => {
    const query = globalQuery.trim().toLocaleLowerCase('es')
    if (!query) return []
    return data.clients.filter((client) => [client.fullName, client.document, client.phone].some((value) => value.toLocaleLowerCase('es').includes(query))).slice(0, 3)
  }, [data.clients, globalQuery])

  if (loading) {
    return <div className="flex h-screen items-center justify-center font-medium text-slate-600 dark:text-slate-400">Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';
  const userInitials = initials(userName);

  function notify(message: string, tone: NonNullable<Toast>['tone'] = 'success') {
    setToast({ message, tone })
  }

  function openOrder(orderId: string) {
    setActiveClientId(null)
    setActiveOrderId(orderId)
    setGlobalQuery('')
  }

  function openClient(clientId: string) {
    setActiveOrderId(null)
    setActiveClientId(clientId)
    setGlobalQuery('')
  }

  function navigate(next: View) {
    setView(next)
    setSidebarOpen(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="mobile-scrim" aria-label="Cerrar navegación" type="button" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__top">
          <Brand />

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="button button--ghost"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
            
            <button
              className="sidebar__close icon-button"
              aria-label="Cerrar menú"
              type="button"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={19} />
            </button>
          </div>
        </div>

        <div className="workspace-chip"><span className="workspace-chip__pulse" />Taller principal</div>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          <p className="nav-label">Operación</p>
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${view === id ? 'nav-item--active' : ''}`} type="button" onClick={() => navigate(id)}>
              <Icon size={18} /><span>{label}</span>{id === 'orders' && <span className="nav-item__count">{data.orders.filter((order) => !['Entregado', 'Cancelado'].includes(order.status)).length}</span>}
            </button>
          ))}
          <button className={`nav-item ${view === 'new-order' ? 'nav-item--active' : ''}`} type="button" onClick={() => navigate('new-order')}>
            <Plus size={18} /><span>Nueva orden</span>
          </button>
        </nav>
        <div className="sidebar__bottom">
          <div className="support-card">
            <span className="support-card__icon"><ShieldCheck size={17} /></span>
            <div><strong>Datos protegidos</strong><span>Guardado local activo</span></div>
          </div>
          <button className="profile-control" type="button" onClick={() => notify(`Sesión activa: ${userName}`)}>
            <span className="avatar avatar--small">{userInitials}</span>
            <span><strong>{userName}</strong><small>Administrador</small></span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="menu-button icon-button" aria-label="Abrir menú" type="button" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div className="global-search">
            <Search size={18} />
            <input aria-label="Buscar globalmente" value={globalQuery} onChange={(event) => setGlobalQuery(event.target.value)} placeholder="Buscar por orden, cliente, teléfono o equipo..." />
            {globalQuery && (
              <div className="search-popover">
                <div className="search-popover__header"><span>Resultados</span><kbd>ESC</kbd></div>
                {globalOrders.length > 0 && <>
                  <p className="search-section-label">Órdenes</p>
                  {globalOrders.map((order) => {
                    const client = getClient(data.clients, order.clientId)
                    return <button key={order.id} className="search-result" type="button" onClick={() => openOrder(order.id)}><span className="search-result__icon"><Smartphone size={16} /></span><span><strong>{order.orderNumber}</strong><small>{client?.fullName} · {order.device.brand} {order.device.model}</small></span><ChevronRight size={16} /></button>
                  })}
                </>}
                {globalClients.length > 0 && <>
                  <p className="search-section-label">Clientes</p>
                  {globalClients.map((client) => <button key={client.id} className="search-result" type="button" onClick={() => openClient(client.id)}><span className="avatar avatar--small">{initials(client.fullName)}</span><span><strong>{client.fullName}</strong><small>{client.document} · {client.phone}</small></span><ChevronRight size={16} /></button>)}
                </>}
                {globalOrders.length === 0 && globalClients.length === 0 && <div className="search-empty">No encontramos coincidencias para “{globalQuery}”.</div>}
              </div>
            )}
          </div>
          <div className="topbar__actions">
            <button className="icon-button" aria-label={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'} type="button" onClick={() => setDarkMode((value) => !value)}>{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="icon-button notification-button" aria-label="Notificaciones" type="button" onClick={() => notify('No tienes notificaciones nuevas.')}><Bell size={18} /><span /></button>
            <span className="avatar topbar-avatar">{userInitials}</span>
          </div>
        </header>

        <div className="page-container">
          {view === 'dashboard' && <DashboardPage userName={userName} orders={data.orders} clients={data.clients} onOpenOrder={openOrder} onNewOrder={() => navigate('new-order')} onChangeStatus={(id, status) => { workshop.changeStatus(id, status); notify('Estado de la orden actualizado.') }} />}
          {view === 'orders' && <OrdersPage orders={data.orders} clients={data.clients} onOpenOrder={openOrder} onNewOrder={() => navigate('new-order')} onChangeStatus={(id, status) => { workshop.changeStatus(id, status); notify('Estado actualizado correctamente.') }} />}
          {view === 'clients' && <ClientsPage clients={data.clients} orders={data.orders} onNewClient={() => setClientForm({ mode: 'new' })} onOpenClient={openClient} />}
          {view === 'new-order' && <NewOrderPage clients={data.clients} onBack={() => navigate('orders')} 
          onCreate={async (input) => {
            const result = await workshop.createOrder(input)
          
            if (result.error) return result.error
          
            if (result.order) {
              setActiveOrderId(result.order.id)
              setView("orders")
              notify(`${result.order.orderNumber} fue creada correctamente.`)
            }
          
            return undefined
          }} />}
        </div>
      </main>

      {activeOrder && <OrderDetailDialog key={activeOrder.id} order={activeOrder} client={getClient(data.clients, activeOrder.clientId)} onClose={() => setActiveOrderId(null)} onChangeStatus={(status) => { workshop.changeStatus(activeOrder.id, status); notify('Estado de la orden actualizado.') }} onUpdate={(changes) => { workshop.updateOrder(activeOrder.id, changes); notify('Detalles técnicos guardados.') }} onAddPayment={(amount, method) => { workshop.addPayment(activeOrder.id, amount, method); notify('Pago registrado correctamente.') }} onAddNote={(text) => { workshop.addNote(activeOrder.id, text); notify('Nota interna agregada.') }} onShowReceipt={() => setReceiptOrderId(activeOrder.id)} />}
      {activeClient && <ClientDetailDialog client={activeClient} orders={data.orders.filter((order) => order.clientId === activeClient.id)} onClose={() => setActiveClientId(null)} onEdit={() => { setActiveClientId(null); setClientForm({ mode: 'edit', client: activeClient }) }} onDelete={async () => {
        const result = await workshop.removeClient(activeClient.id);

        if (result.error) {
          notify(result.error, "error");
        } else {
          setActiveClientId(null);
          notify("Cliente eliminado.");
        }
      }} onOpenOrder={openOrder} />}
      {clientForm && <ClientFormDialog key={clientForm.client?.id ?? 'new-client'} client={clientForm.client} onClose={() => setClientForm(null)} onSave={async (form) => {
        return clientForm.mode === "new"
          ? await workshop.createClient(form)
          : await workshop.updateClient(clientForm.client!.id, form)
      }} onSaved={() => { setClientForm(null); notify(clientForm.mode === 'new' ? 'Cliente creado correctamente.' : 'Cliente actualizado correctamente.') }} />}
      {receiptOrder && <ReceiptDialog order={receiptOrder} client={getClient(data.clients, receiptOrder.clientId)} settings={data.settings} onClose={() => setReceiptOrderId(null)} />}
      {toast && <div className={`toast toast--${toast.tone}`} role="status">{toast.tone === 'success' ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}<span>{toast.message}</span><button type="button" aria-label="Cerrar mensaje" onClick={() => setToast(null)}><X size={16} /></button></div>}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-heading__description">{description}</p></div>{action}</div>
}

function DashboardPage({ userName, orders, clients, onOpenOrder, onNewOrder, onChangeStatus }: { userName: string; orders: RepairOrder[]; clients: Client[]; onOpenOrder: (id: string) => void; onNewOrder: () => void; onChangeStatus: (id: string, status: RepairStatus) => void }) {
  const stats = useMemo(() => {
    const today = new Date().toDateString()
    const active = orders.filter((order) => !['Entregado', 'Cancelado'].includes(order.status))
    const inProcess = orders.filter((order) => ['En diagnóstico', 'Esperando repuestos', 'En reparación'].includes(order.status))
    return {
      today: orders.filter((order) => new Date(order.receivedAt).toDateString() === today).length,
      pending: active.length,
      repaired: orders.filter((order) => ['Reparado', 'Listo para entregar'].includes(order.status)).length,
      delivered: orders.filter((order) => order.status === 'Entregado').length,
      receivable: active.reduce((sum, order) => sum + getBalance(order), 0),
      collected: orders.reduce((sum, order) => sum + getPaid(order), 0),
      inProcess: inProcess.length,
    }
  }, [orders])
  const latest = [...orders].sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt)).slice(0, 6)
  const stateDistribution = repairStatuses.filter((status) => status !== 'Cancelado').map((status) => ({ status, count: orders.filter((order) => order.status === status).length })).filter((entry) => entry.count > 0)

  return <>
    <PageHeading eyebrow="Operación · hoy" title={`Buen día, ${userName}`} description="Este es el pulso de tu taller en tiempo real." action={<button className="button button--primary" type="button" onClick={onNewOrder}><Plus size={18} />Nueva orden</button>} />
    <section className="metric-grid metric-grid--top">
      <MetricCard icon={<ClipboardList size={19} />} iconTone="blue" label="Equipos ingresados hoy" value={String(stats.today).padStart(2, '0')} help="Órdenes recibidas" />
      <MetricCard icon={<ClockBadge />} iconTone="amber" label="Equipos pendientes" value={String(stats.pending).padStart(2, '0')} help="Requieren seguimiento" />
      <MetricCard icon={<Wrench size={19} />} iconTone="purple" label="Reparaciones en proceso" value={String(stats.inProcess).padStart(2, '0')} help="Diagnóstico y reparación" />
      <MetricCard icon={<CheckCircle2 size={19} />} iconTone="green" label="Equipos reparados" value={String(stats.repaired).padStart(2, '0')} help="Listos para entregar" />
    </section>
    <section className="dashboard-mini-metrics" aria-label="Indicadores financieros y entregas">
      <article className="mini-metric"><span className="mini-metric__icon mini-metric__icon--green"><CheckCircle2 size={17} /></span><span><small>Equipos entregados</small><strong>{String(stats.delivered).padStart(2, '0')}</strong></span><p>Órdenes finalizadas</p></article>
      <article className="mini-metric"><span className="mini-metric__icon mini-metric__icon--rose"><WalletCards size={17} /></span><span><small>Total pendiente por cobrar</small><strong>{formatCurrency(stats.receivable)}</strong></span><p>Órdenes activas</p></article>
      <article className="mini-metric"><span className="mini-metric__icon mini-metric__icon--blue"><CreditCard size={17} /></span><span><small>Total cobrado</small><strong>{formatCurrency(stats.collected)}</strong></span><p>Abonos y pagos</p></article>
    </section>
    <section className="dashboard-split">
      <article className="card revenue-card">
        <div className="card__heading"><div><p className="eyebrow">Finanzas</p><h2>Resumen de cobros</h2></div><button className="text-button" type="button" onClick={() => onNewOrder()}>Ver detalle <ArrowUpRight size={15} /></button></div>
        <div className="revenue-grid">
          <div className="revenue-amount"><span>Por cobrar</span><strong>{formatCurrency(stats.receivable)}</strong><small><span className="positive-dot" />Saldo de órdenes activas</small></div>
          <div className="revenue-amount revenue-amount--muted"><span>Total cobrado</span><strong>{formatCurrency(stats.collected)}</strong><small>Abonos y pagos registrados</small></div>
        </div>
        <div className="revenue-progress"><span style={{ width: `${stats.collected + stats.receivable === 0 ? 0 : (stats.collected / (stats.collected + stats.receivable)) * 100}%` }} /></div>
        <div className="revenue-legend"><span><i className="legend-dot legend-dot--green" />Cobrado</span><span><i className="legend-dot legend-dot--slate" />Pendiente</span></div>
      </article>
      <article className="card workflow-card">
        <div className="card__heading"><div><p className="eyebrow">Flujo de trabajo</p><h2>Órdenes por estado</h2></div><PackageSearch size={20} className="muted-icon" /></div>
        <div className="workflow-list">
          {stateDistribution.map(({ status, count }) => <div className="workflow-row" key={status}><span className={`workflow-dot workflow-dot--${statusMeta[status].tone}`} /><span>{status}</span><strong>{count}</strong><div className="workflow-row__track"><i style={{ width: `${Math.max((count / Math.max(orders.length, 1)) * 100, 8)}%` }} /></div></div>)}
        </div>
      </article>
    </section>
    <section className="card table-card">
      <div className="card__heading card__heading--table"><div><p className="eyebrow">Actividad reciente</p><h2>Últimos equipos ingresados</h2></div><button className="text-button" type="button" onClick={() => onNewOrder()}>Crear orden <ChevronRight size={16} /></button></div>
      <OrdersTable orders={latest} clients={clients} onOpenOrder={onOpenOrder} onChangeStatus={onChangeStatus} compact />
    </section>
  </>
}

function ClockBadge() {
  return <CalendarDays size={19} />
}

function MetricCard({ icon, iconTone, label, value, help }: { icon: React.ReactNode; iconTone: string; label: string; value: string; help: string }) {
  return <article className="metric-card"><div className={`metric-card__icon metric-card__icon--${iconTone}`}>{icon}</div><span className="metric-card__label">{label}</span><strong>{value}</strong><small>{help}</small></article>
}

function OrdersPage({ orders, clients, onOpenOrder, onNewOrder, onChangeStatus }: { orders: RepairOrder[]; clients: Client[]; onOpenOrder: (id: string) => void; onNewOrder: () => void; onChangeStatus: (id: string, status: RepairStatus) => void }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<OrderFilter>('Todas')
  const filteredOrders = useMemo(() => orders.filter((order) => {
    const matchesSearch = orderMatchesSearch(order, getClient(clients, order.clientId), query)
    const matchesFilter = filter === 'Todas' || (filter === 'Activas' && !['Entregado', 'Cancelado'].includes(order.status)) || (filter === 'Por entregar' && ['Reparado', 'Listo para entregar'].includes(order.status)) || (filter === 'Entregadas' && order.status === 'Entregado')
    return matchesSearch && matchesFilter
  }).sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), [clients, filter, orders, query])

  return <>
    <PageHeading eyebrow="Gestión de servicio" title="Órdenes de reparación" description="Controla el estado, los pagos y el avance de cada equipo." action={<button className="button button--primary" type="button" onClick={onNewOrder}><Plus size={18} />Nueva orden</button>} />
    <section className="orders-toolbar">
      <div className="filter-tabs" role="tablist" aria-label="Filtrar órdenes">{(['Todas', 'Activas', 'Por entregar', 'Entregadas'] as OrderFilter[]).map((item) => <button role="tab" aria-selected={filter === item} className={filter === item ? 'filter-tab filter-tab--active' : 'filter-tab'} key={item} type="button" onClick={() => setFilter(item)}>{item}{item === 'Todas' && <span>{orders.length}</span>}</button>)}</div>
      <label className="inline-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar orden, cliente o equipo" /></label>
    </section>
    <section className="card table-card orders-table-card">
      <div className="table-info"><span>{filteredOrders.length} {filteredOrders.length === 1 ? 'orden encontrada' : 'órdenes encontradas'}</span><span className="table-info__hint">Actualizado ahora</span></div>
      <OrdersTable orders={filteredOrders} clients={clients} onOpenOrder={onOpenOrder} onChangeStatus={onChangeStatus} />
      {filteredOrders.length === 0 && <EmptyState title="No hay órdenes con estos filtros" detail="Prueba con otra búsqueda o registra una nueva orden." icon={<PackageSearch size={25} />} />}
    </section>
  </>
}

function OrdersTable({ orders, clients, onOpenOrder, onChangeStatus, compact = false }: { orders: RepairOrder[]; clients: Client[]; onOpenOrder: (id: string) => void; onChangeStatus: (id: string, status: RepairStatus) => void; compact?: boolean }) {
  return <div className="responsive-table-wrap"><table className="orders-table"><thead><tr><th>Orden</th><th>Cliente / equipo</th><th className="hide-on-small">Ingreso</th><th>Estado</th><th className="hide-on-mobile">Pago</th><th><span className="sr-only">Acciones</span></th></tr></thead><tbody>
    {orders.map((order) => {
      const client = getClient(clients, order.clientId)
      return <tr key={order.id} className="order-row" tabIndex={0} onClick={() => onOpenOrder(order.id)} onKeyDown={(event) => { if (event.key === 'Enter') onOpenOrder(order.id) }}>
        <td><strong className="order-number">{order.orderNumber}</strong><span className="order-tech">{order.technician || 'Sin asignar'}</span></td>
        <td><div className="device-cell"><span className="device-icon"><Smartphone size={18} /></span><span><strong>{client?.fullName ?? 'Cliente eliminado'}</strong><small>{order.device.brand} {order.device.model}{order.device.color ? ` · ${order.device.color}` : ''}</small></span></div></td>
        <td className="hide-on-small"><span className="date-cell">{formatDate(order.receivedAt, { day: '2-digit', month: 'short' })}</span></td>
        <td><div className="status-select-wrap"><StatusBadge status={order.status} /><select aria-label={`Cambiar estado de ${order.orderNumber}`} value={order.status} onClick={(event) => event.stopPropagation()} onChange={(event) => { event.stopPropagation(); onChangeStatus(order.id, event.target.value as RepairStatus) }}>{repairStatuses.map((status) => <option key={status}>{status}</option>)}</select></div></td>
        <td className="hide-on-mobile"><div className="payment-cell"><PaymentBadge order={order} /><small>{compact ? getBalance(order) === 0 ? formatCurrency(getPaid(order)) : `Saldo ${formatCurrency(getBalance(order))}` : `${formatCurrency(getPaid(order))} / ${formatCurrency(order.estimatedTotal)}`}</small></div></td>
        <td><button className="row-action icon-button" aria-label={`Ver ${order.orderNumber}`} type="button" onClick={(event) => { event.stopPropagation(); onOpenOrder(order.id) }}><ChevronRight size={18} /></button></td>
      </tr>
    })}
  </tbody></table></div>
}

function NewOrderPage({ clients, onBack, onCreate }: { clients: Client[]; onBack: () => void; onCreate: (input: NewOrderInput) => Promise<string | undefined> }) {
  const [draft, setDraft] = useState<OrderDraft>(defaultDraft)
  const [lockMode, setLockMode] = useState<'pin' | 'pattern'>('pin')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const total = Number(draft.estimatedTotal) || 0
  const deposit = Number(draft.initialPayment) || 0
  const accessories = ['Cargador', 'SIM', 'Memoria', 'Funda', 'Cable USB']

  function patch<K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function toggleAccessory(accessory: string) {
    patch('accessories', draft.accessories.includes(accessory) ? draft.accessories.filter((item) => item !== accessory) : [...draft.accessories, accessory])
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (draft.customerMode === 'existing' && !draft.selectedClientId) return setError('Selecciona el cliente al que pertenece el equipo.')
    if (draft.customerMode === 'new' && (!draft.fullName.trim() || !draft.document.trim() || !draft.phone.trim())) return setError('Completa nombre, documento y teléfono del cliente.')
    if (!draft.brand.trim() || !draft.model.trim()) return setError('Indica la marca y el modelo del equipo.')
    if (!draft.reportedProblem.trim()) return setError('Describe el problema reportado por el cliente.')
    if (total < 0 || deposit < 0 || deposit > total) return setError('Revisa los valores: el abono no puede superar el valor total.')
    setSaving(true)
    const device: Device = { brand: draft.brand.trim(), model: draft.model.trim(), color: draft.color.trim(), imei: draft.imei.trim(), serialNumber: draft.serialNumber.trim(), accessCode: draft.accessCode.trim(), accessories: draft.accessories }
    const message = await onCreate({
      clientId: draft.customerMode === 'existing' ? draft.selectedClientId : undefined,
      client: draft.customerMode === 'new' ? { fullName: draft.fullName, document: draft.document, phone: draft.phone, address: draft.address, observations: draft.observations } : undefined,
      device, reportedProblem: draft.reportedProblem, diagnosis: draft.diagnosis, workPerformed: draft.workPerformed, partsUsed: draft.partsUsed, technician: draft.technician, status: draft.status, estimatedTotal: total, initialPayment: deposit, paymentMethod: draft.paymentMethod,
    })
    if (message) { setError(message); setSaving(false) }
  }

  return <>
    <div className="back-header"><button className="back-button" type="button" onClick={onBack}><ArrowLeft size={17} />Volver a órdenes</button></div>
    <PageHeading eyebrow="Nueva recepción" title="Registrar equipo" description="Completa la información esencial. El número de orden se asignará automáticamente." />
    <form className="order-form-layout" onSubmit={submit}>
      <div className="order-form-main">
        <section className="form-card"><div className="form-card__heading"><span className="form-step">01</span><div><h2>Cliente</h2><p>Relaciona el equipo con un cliente existente o registra uno nuevo.</p></div></div>
          <div className="segmented-control"><button className={draft.customerMode === 'existing' ? 'segmented-control__active' : ''} type="button" onClick={() => patch('customerMode', 'existing')}><Users size={16} />Cliente existente</button><button className={draft.customerMode === 'new' ? 'segmented-control__active' : ''} type="button" onClick={() => patch('customerMode', 'new')}><UserRoundPlus size={16} />Nuevo cliente</button></div>
          {draft.customerMode === 'existing' ? <label className="field field--full"><span>Buscar cliente <b>*</b></span><select value={draft.selectedClientId} onChange={(event) => patch('selectedClientId', event.target.value)}><option value="">Selecciona un cliente...</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.fullName} · {client.document}</option>)}</select></label> : <div className="form-grid form-grid--three"><Field label="Nombre completo" required value={draft.fullName} onChange={(value) => patch('fullName', value)} placeholder="Ej. Daniela Ruiz" /><Field label="Documento" required value={draft.document} onChange={(value) => patch('document', value)} placeholder="Número de cédula" /><Field label="Teléfono" required value={draft.phone} onChange={(value) => patch('phone', value)} placeholder="300 000 0000" /><Field label="Dirección" value={draft.address} onChange={(value) => patch('address', value)} placeholder="Opcional" /><Field label="Observaciones del cliente" value={draft.observations} onChange={(value) => patch('observations', value)} placeholder="Opcional" className="field--span-2" /></div>}
        </section>
        <section className="form-card"><div className="form-card__heading"><span className="form-step">02</span><div><h2>Equipo</h2><p>Registra los datos que ayudan a identificarlo con precisión.</p></div></div>
          <div className="form-grid form-grid--three">
            <Field label="Marca" required value={draft.brand} onChange={(value) => patch('brand', value)} placeholder="Ej. Samsung" />
            <Field label="Modelo" required value={draft.model} onChange={(value) => patch('model', value)} placeholder="Ej. Galaxy A54" />
            <Field label="Color" value={draft.color} onChange={(value) => patch('color', value)} placeholder="Opcional" />
            <Field label="IMEI" value={draft.imei} onChange={(value) => patch('imei', value)} placeholder="Opcional" />
            <Field label="Número de serie" value={draft.serialNumber} onChange={(value) => patch('serialNumber', value)} placeholder="Opcional" />
            
            {/* Campo Dinámico de Seguridad: PIN / Clave o Patrón Gráfico */}
            <div className="field col-span-full">
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Seguridad del equipo</span>
              <div className="segmented-control mb-3">
                <button
                  type="button"
                  className={lockMode === 'pin' ? 'segmented-control__active' : ''}
                  onClick={() => { setLockMode('pin'); patch('accessCode', '') }}
                >
                  <Lock size={15} /> PIN / Clave
                </button>
                <button
                  type="button"
                  className={lockMode === 'pattern' ? 'segmented-control__active' : ''}
                  onClick={() => { setLockMode('pattern'); patch('accessCode', '') }}
                >
                  <Grid3X3 size={15} /> Patrón Gráfico
                </button>
              </div>

              {lockMode === 'pin' ? (
                <input
                  type="text"
                  value={draft.accessCode}
                  onChange={(e) => patch('accessCode', e.target.value)}
                  placeholder="Ej: 1234 o Contraseña"
                />
              ) : (
                <PatternSelector
                  value={draft.accessCode}
                  onChange={(val) => patch('accessCode', val)}
                />
              )}
            </div>
          </div>

          <fieldset className="accessory-field"><legend>Accesorios recibidos</legend><div className="accessory-options">{accessories.map((accessory) => <label className={draft.accessories.includes(accessory) ? 'accessory-option accessory-option--selected' : 'accessory-option'} key={accessory}><input type="checkbox" checked={draft.accessories.includes(accessory)} onChange={() => toggleAccessory(accessory)} /><span>{accessory}</span></label>)}</div></fieldset>
        </section>
        <section className="form-card"><div className="form-card__heading"><span className="form-step">03</span><div><h2>Servicio y presupuesto</h2><p>Define el estado inicial y la información técnica disponible.</p></div></div>
          <div className="form-grid form-grid--three"><label className="field"><span>Estado inicial</span><select value={draft.status} onChange={(event) => patch('status', event.target.value as RepairStatus)}>{repairStatuses.map((status) => <option key={status}>{status}</option>)}</select></label><Field label="Técnico responsable" value={draft.technician} onChange={(value) => patch('technician', value)} placeholder="Asignar técnico" /><Field label="Valor estimado" value={draft.estimatedTotal} onChange={(value) => patch('estimatedTotal', value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" /></div>
          <label className="field field--full"><span>Problema reportado <b>*</b></span><textarea value={draft.reportedProblem} onChange={(event) => patch('reportedProblem', event.target.value)} placeholder="Describe lo que reporta el cliente..." rows={3} /></label>
          <div className="form-grid form-grid--two"><label className="field"><span>Diagnóstico técnico</span><textarea value={draft.diagnosis} onChange={(event) => patch('diagnosis', event.target.value)} placeholder="Opcional, puede completarse después" rows={3} /></label><label className="field"><span>Repuestos utilizados</span><textarea value={draft.partsUsed} onChange={(event) => patch('partsUsed', event.target.value)} placeholder="Opcional, puede completarse después" rows={3} /></label></div>
        </section>
      </div>
      <aside className="order-summary-card"><div className="order-summary-card__top"><span className="summary-icon"><ReceiptText size={20} /></span><div><p>Resumen de recepción</p><h2>Nueva orden</h2></div></div><div className="order-number-preview">ORD-<span>PRÓXIMA</span></div><div className="summary-device"><span className="device-icon"><Smartphone size={19} /></span><span><strong>{draft.brand || 'Marca'} {draft.model || 'y modelo'}</strong><small>{draft.customerMode === 'existing' ? clients.find((client) => client.id === draft.selectedClientId)?.fullName || 'Cliente por seleccionar' : draft.fullName || 'Cliente nuevo'}</small></span></div><div className="payment-form"><div className="payment-form__title"><CreditCard size={17} /><span>Pago inicial</span></div><Field label="Abono recibido" value={draft.initialPayment} onChange={(value) => patch('initialPayment', value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" /><label className="field"><span>Método de pago</span><select value={draft.paymentMethod} onChange={(event) => patch('paymentMethod', event.target.value as PaymentMethod)}>{(['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'] as PaymentMethod[]).map((method) => <option key={method}>{method}</option>)}</select></label></div><div className="summary-totals"><div><span>Valor total</span><strong>{formatCurrency(total)}</strong></div><div><span>Saldo pendiente</span><strong className={total - deposit > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}>{formatCurrency(Math.max(total - deposit, 0))}</strong></div></div>{error && <p className="form-error"><CircleAlert size={16} />{error}</p>}<button className="button button--primary button--wide" type="submit" disabled={saving}>{saving ? 'Guardando...' : <><Save size={18} />Crear orden</>}</button><p className="order-summary-card__hint"><ShieldCheck size={14} />Se generará el comprobante de recepción.</p></aside>
    </form>
  </>
}

function Field({ label, required, value, onChange, placeholder, className = '', type = 'text', inputMode }: { label: string; required?: boolean; value: string; onChange: (value: string) => void; placeholder: string; className?: string; type?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'] }) {
  const fieldId = `field-${label.replaceAll(' ', '-').toLowerCase()}`
  return <label className={`field ${className}`} htmlFor={fieldId}><span>{label}{required && <b> *</b>}</span><input id={fieldId} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} inputMode={inputMode} /></label>
}

function ClientsPage({ clients, orders, onNewClient, onOpenClient }: { clients: Client[]; orders: RepairOrder[]; onNewClient: () => void; onOpenClient: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const filtered = clients.filter((client) => [client.fullName, client.document, client.phone].some((value) => value.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))))
  return <>
    <PageHeading eyebrow="Base de clientes" title="Clientes" description="Consulta datos de contacto e historial de reparaciones en un solo lugar." action={<button className="button button--primary" type="button" onClick={onNewClient}><UserRoundPlus size={18} />Nuevo cliente</button>} />
    <section className="clients-overview"><article className="client-stat"><span className="client-stat__icon"><Users size={18} /></span><div><strong>{clients.length}</strong><span>Clientes registrados</span></div></article><article className="client-stat"><span className="client-stat__icon client-stat__icon--blue"><ClipboardList size={18} /></span><div><strong>{orders.length}</strong><span>Órdenes históricas</span></div></article><label className="inline-search inline-search--clients"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, documento o teléfono" /></label></section>
    <section className="card table-card clients-table-card"><div className="table-info"><span>{filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}</span><span className="table-info__hint">Haz clic para ver el historial</span></div><div className="responsive-table-wrap"><table className="clients-table"><thead><tr><th>Cliente</th><th className="hide-on-small">Documento</th><th>Contacto</th><th className="hide-on-mobile">Órdenes</th><th><span className="sr-only">Abrir</span></th></tr></thead><tbody>{filtered.map((client) => { const count = orders.filter((order) => order.clientId === client.id).length; return <tr tabIndex={0} key={client.id} onClick={() => onOpenClient(client.id)} onKeyDown={(event) => { if (event.key === 'Enter') onOpenClient(client.id) }}><td><div className="client-cell"><span className="avatar">{initials(client.fullName)}</span><span><strong>{client.fullName}</strong><small>Desde {formatDate(client.createdAt, { month: 'short', year: 'numeric' })}</small></span></div></td><td className="hide-on-small">{client.document}</td><td><span className="contact-cell"><strong>{client.phone}</strong>{client.address && <small>{client.address}</small>}</span></td><td className="hide-on-mobile"><span className="order-count">{count} {count === 1 ? 'orden' : 'órdenes'}</span></td><td><button className="row-action icon-button" type="button" aria-label={`Abrir ${client.fullName}`} onClick={(event) => { event.stopPropagation(); onOpenClient(client.id) }}><ChevronRight size={18} /></button></td></tr> })}</tbody></table></div>{filtered.length === 0 && <EmptyState title="No hay clientes coincidentes" detail="Prueba una búsqueda diferente o registra un nuevo cliente." icon={<Users size={25} />} />}</section>
  </>
}

function ClientFormDialog({ client, onClose, onSave, onSaved }: { client?: Client; onClose: () => void; onSave: (form: NewClientInput) => Promise<{ error?: string }>; onSaved: () => void }) {
  const [form, setForm] = useState<NewClientInput>(() => ({ fullName: client?.fullName ?? '', document: client?.document ?? '', phone: client?.phone ?? '', address: client?.address ?? '', observations: client?.observations ?? '' }))
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!form.fullName.trim() || !form.document.trim() || !form.phone.trim()) { setError('Nombre, documento y teléfono son obligatorios.'); return } const result = await onSave(form); if (result.error) setError(result.error); else onSaved() }
  return <Dialog title={client ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}><form className="dialog-form" onSubmit={submit}><p className="dialog-intro">{client ? 'Actualiza la información de contacto y las observaciones internas.' : 'Crea una ficha de cliente para usarla en tus órdenes de reparación.'}</p><Field label="Nombre completo" required value={form.fullName} onChange={(value) => setForm((state) => ({ ...state, fullName: value }))} placeholder="Nombre y apellidos" /><Field label="Número de documento" required value={form.document} onChange={(value) => setForm((state) => ({ ...state, document: value }))} placeholder="Cédula o documento" /><Field label="Teléfono" required value={form.phone} onChange={(value) => setForm((state) => ({ ...state, phone: value }))} placeholder="300 000 0000" /><Field label="Dirección" value={form.address ?? ''} onChange={(value) => setForm((state) => ({ ...state, address: value }))} placeholder="Opcional" /><label className="field"><span>Observaciones</span><textarea value={form.observations ?? ''} onChange={(event) => setForm((state) => ({ ...state, observations: event.target.value }))} placeholder="Notas sobre el cliente (opcional)" rows={3} /></label>{error && <p className="form-error"><CircleAlert size={16} />{error}</p>}<div className="dialog-actions"><button className="button button--ghost" type="button" onClick={onClose}>Cancelar</button><button className="button button--primary" type="submit"><Save size={17} />{client ? 'Guardar cambios' : 'Crear cliente'}</button></div></form></Dialog>
}

function ClientDetailDialog({ client, orders, onClose, onEdit, onDelete, onOpenOrder }: { client: Client; orders: RepairOrder[]; onClose: () => void; onEdit: () => void; onDelete: () => void; onOpenOrder: (id: string) => void }) {
  function confirmDelete() { if (window.confirm(`¿Eliminar a ${client.fullName}? Esta acción no se puede deshacer.`)) onDelete() }
  return <Dialog title="Ficha de cliente" onClose={onClose} wide><div className="client-detail"><div className="client-detail__hero"><span className="avatar avatar--large">{initials(client.fullName)}</span><div><p className="eyebrow">Cliente registrado</p><h3>{client.fullName}</h3><p>{client.document}</p></div><div className="client-detail__actions"><button className="button button--ghost" type="button" onClick={onEdit}><Settings2 size={16} />Editar</button><button className="icon-button danger-button" aria-label="Eliminar cliente" type="button" onClick={confirmDelete}><Trash2 size={17} /></button></div></div><div className="client-contact-grid"><div><Phone size={16} /><span><small>Teléfono</small><strong>{client.phone}</strong></span></div><div><MapPin size={16} /><span><small>Dirección</small><strong>{client.address || 'No registrada'}</strong></span></div><div><CalendarDays size={16} /><span><small>Cliente desde</small><strong>{formatDate(client.createdAt)}</strong></span></div></div>{client.observations && <div className="client-observation"><NotebookPen size={17} /><span><strong>Observaciones</strong>{client.observations}</span></div>}<div className="detail-section-heading"><div><p className="eyebrow">Historial completo</p><h3>Reparaciones del cliente</h3></div><span className="history-count">{orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}</span></div>{orders.length > 0 ? <div className="client-orders">{orders.sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt)).map((order) => <button className="client-order" type="button" key={order.id} onClick={() => onOpenOrder(order.id)}><span className="device-icon"><Smartphone size={18} /></span><span className="client-order__main"><strong>{order.orderNumber} · {order.device.brand} {order.device.model}</strong><small>{formatDate(order.receivedAt)} · {order.reportedProblem}</small></span><StatusBadge status={order.status} /><ChevronRight size={17} /></button>)}</div> : <EmptyState title="Aún no hay reparaciones" detail="Las órdenes de este cliente aparecerán aquí." icon={<Wrench size={22} />} />}</div></Dialog>
}

function OrderDetailDialog({ order, client, onClose, onChangeStatus, onUpdate, onAddPayment, onAddNote, onShowReceipt }: { order: RepairOrder; client?: Client; onClose: () => void; onChangeStatus: (status: RepairStatus) => void; onUpdate: (changes: Partial<Pick<RepairOrder, 'reportedProblem' | 'diagnosis' | 'workPerformed' | 'partsUsed' | 'technician' | 'estimatedTotal' | 'device'>>) => void; onAddPayment: (amount: number, method: PaymentMethod) => void; onAddNote: (text: string) => void; onShowReceipt: () => void }) {
  const [tab, setTab] = useState<'summary' | 'payments' | 'notes' | 'history'>('summary')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState(() => ({ reportedProblem: order.reportedProblem, diagnosis: order.diagnosis ?? '', workPerformed: order.workPerformed ?? '', partsUsed: order.partsUsed ?? '', technician: order.technician ?? '', estimatedTotal: String(order.estimatedTotal) }))
  const [payment, setPayment] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('Efectivo')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const balance = getBalance(order)

  function saveDetails() { onUpdate({ reportedProblem: editForm.reportedProblem, diagnosis: editForm.diagnosis, workPerformed: editForm.workPerformed, partsUsed: editForm.partsUsed, technician: editForm.technician, estimatedTotal: Number(editForm.estimatedTotal) || 0 }); setEditing(false) }
  function savePayment(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const amount = Number(payment); if (!amount || amount <= 0 || amount > balance) { setError(`El pago debe estar entre $1 y ${formatCurrency(balance)}.`); return } onAddPayment(amount, method); setPayment(''); setError('') }
  function saveNote(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!note.trim()) return; onAddNote(note); setNote('') }

  return <Dialog title={order.orderNumber} onClose={onClose} wide className="order-dialog"><div className="order-detail-header"><div><div className="order-detail-header__subtitle"><StatusBadge status={order.status} /><span>Recibida {formatDate(order.receivedAt)}</span></div><h3>{order.device.brand} {order.device.model}</h3><p>{client?.fullName ?? 'Cliente no disponible'} · {client?.phone ?? 'Sin teléfono'}</p></div><div className="order-detail-header__actions"><button className="button button--ghost" type="button" onClick={onShowReceipt}><ReceiptText size={17} />Comprobante</button><label className="order-status-control"><span>Estado</span><select value={order.status} onChange={(event) => onChangeStatus(event.target.value as RepairStatus)}>{repairStatuses.map((status) => <option key={status}>{status}</option>)}</select></label></div></div><div className="detail-tabs" role="tablist"><button type="button" role="tab" aria-selected={tab === 'summary'} className={tab === 'summary' ? 'detail-tab detail-tab--active' : 'detail-tab'} onClick={() => setTab('summary')}>Resumen</button><button type="button" role="tab" aria-selected={tab === 'payments'} className={tab === 'payments' ? 'detail-tab detail-tab--active' : 'detail-tab'} onClick={() => setTab('payments')}>Pagos <span>{order.payments.length}</span></button><button type="button" role="tab" aria-selected={tab === 'notes'} className={tab === 'notes' ? 'detail-tab detail-tab--active' : 'detail-tab'} onClick={() => setTab('notes')}>Notas <span>{order.notes.length}</span></button><button type="button" role="tab" aria-selected={tab === 'history'} className={tab === 'history' ? 'detail-tab detail-tab--active' : 'detail-tab'} onClick={() => setTab('history')}>Historial</button></div>
    {tab === 'summary' && <div className="order-detail-content"><div className="order-detail-grid"><section><div className="detail-block"><div className="detail-block__heading"><h4>Información del equipo</h4><Smartphone size={18} /></div><dl className="info-list"><div><dt>Marca y modelo</dt><dd>{order.device.brand} {order.device.model}</dd></div><div><dt>Color</dt><dd>{order.device.color || 'No registrado'}</dd></div><div><dt>IMEI</dt><dd>{order.device.imei || 'No registrado'}</dd></div><div><dt>Código / Patrón</dt><dd className="font-semibold text-cyan-600 dark:text-cyan-400">{order.device.accessCode || 'No registrado'}</dd></div><div><dt>Accesorios</dt><dd>{order.device.accessories.length ? order.device.accessories.join(', ') : 'Sin accesorios'}</dd></div></dl></div><div className="detail-block"><div className="detail-block__heading"><h4>Información de servicio</h4><button className="text-button" type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Cancelar' : 'Editar'} {editing ? <X size={15} /> : <Settings2 size={15} />}</button></div>{editing ? <div className="technical-edit"><label className="field"><span>Problema reportado</span><textarea value={editForm.reportedProblem} onChange={(event) => setEditForm((state) => ({ ...state, reportedProblem: event.target.value }))} rows={2} /></label><label className="field"><span>Diagnóstico técnico</span><textarea value={editForm.diagnosis} onChange={(event) => setEditForm((state) => ({ ...state, diagnosis: event.target.value }))} rows={2} /></label><label className="field"><span>Trabajo realizado</span><textarea value={editForm.workPerformed} onChange={(event) => setEditForm((state) => ({ ...state, workPerformed: event.target.value }))} rows={2} /></label><label className="field"><span>Repuestos utilizados</span><textarea value={editForm.partsUsed} onChange={(event) => setEditForm((state) => ({ ...state, partsUsed: event.target.value }))} rows={2} /></label><div className="form-grid form-grid--two"><Field label="Técnico" value={editForm.technician} onChange={(value) => setEditForm((state) => ({ ...state, technician: value }))} placeholder="Técnico" /><Field label="Valor total" value={editForm.estimatedTotal} onChange={(value) => setEditForm((state) => ({ ...state, estimatedTotal: value.replace(/[^0-9]/g, '') }))} placeholder="0" inputMode="numeric" /></div><button className="button button--primary" type="button" onClick={saveDetails}><Save size={16} />Guardar detalles</button></div> : <div className="service-detail"><div><span>Problema reportado</span><p>{order.reportedProblem}</p></div><div><span>Diagnóstico</span><p>{order.diagnosis || 'Aún no registrado'}</p></div><div><span>Trabajo realizado</span><p>{order.workPerformed || 'Aún no registrado'}</p></div><div><span>Repuestos</span><p>{order.partsUsed || 'Aún no registrado'}</p></div><div className="service-detail__bottom"><span>Técnico: <strong>{order.technician || 'Sin asignar'}</strong></span><span>Última edición: <strong>{formatDateTime(order.updatedAt)}</strong></span></div></div>}</div></section><aside><div className="detail-block financial-summary"><div className="detail-block__heading"><h4>Estado del pago</h4><WalletCards size={18} /></div><PaymentBadge order={order} /><div className="financial-summary__values"><div><span>Valor total</span><strong>{formatCurrency(order.estimatedTotal)}</strong></div><div><span>Abonos</span><strong className="text-emerald-500 dark:text-emerald-400">{formatCurrency(getPaid(order))}</strong></div><div><span>Saldo pendiente</span><strong className={balance > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'}>{formatCurrency(balance)}</strong></div></div><button className="button button--soft button--wide" type="button" onClick={() => setTab('payments')}><CreditCard size={17} />Registrar pago</button></div><div className="detail-block client-mini-card"><div className="detail-block__heading"><h4>Cliente</h4><Users size={17} /></div><span className="avatar">{client ? initials(client.fullName) : '--'}</span><div><strong>{client?.fullName || 'No disponible'}</strong><span>{client?.document || 'Sin documento'}</span><span>{client?.phone || 'Sin teléfono'}</span></div></div></aside></div></div>}
    {tab === 'payments' && <div className="order-detail-content payment-tab"><div className="payment-tab__summary"><PaymentBadge order={order} /><h4>{balance === 0 ? 'La orden está completamente pagada' : `Faltan ${formatCurrency(balance)} por cobrar`}</h4><p>Registra cada abono para mantener el saldo actualizado automáticamente.</p></div>{balance > 0 && <form className="add-payment-form" onSubmit={savePayment}><Field label="Valor del pago" value={payment} onChange={setPayment} placeholder="0" inputMode="numeric" /><label className="field"><span>Método</span><select value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>{(['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'] as PaymentMethod[]).map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button--primary" type="submit"><Plus size={17} />Agregar abono</button></form>}{error && <p className="form-error"><CircleAlert size={16} />{error}</p>}<div className="payment-history"><h4>Historial de pagos</h4>{order.payments.length ? order.payments.slice().reverse().map((item) => <div className="payment-history__row" key={item.id}><span className="payment-history__icon"><CreditCard size={16} /></span><span><strong>{formatCurrency(item.amount)}</strong><small>{item.method} · {formatDateTime(item.createdAt)}</small></span><CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400" /></div>) : <EmptyState title="Aún no hay pagos" detail="Registra un abono cuando recibas el primer pago." icon={<WalletCards size={22} />} />}</div></div>}
    {tab === 'notes' && <div className="order-detail-content notes-tab"><div className="private-note-label"><ShieldCheck size={17} /><span><strong>Notas privadas</strong>Solo son visibles para el equipo del taller.</span></div><form className="note-form" onSubmit={saveNote}><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Agrega una nota interna sobre esta reparación..." rows={3} /><button className="button button--primary" type="submit" disabled={!note.trim()}><MessageSquareText size={17} />Guardar nota</button></form><div className="notes-list">{order.notes.length ? order.notes.map((item) => <article className="note-item" key={item.id}><span className="note-item__icon"><NotebookPen size={16} /></span><div><p>{item.text}</p><small>{formatDateTime(item.createdAt)} · Recepción</small></div></article>) : <EmptyState title="No hay notas internas" detail="Las notas del equipo aparecerán en este espacio privado." icon={<NotebookPen size={22} />} />}</div></div>}
    {tab === 'history' && <div className="order-detail-content history-tab"><div className="history-intro"><History size={19} /><div><h4>Historial de movimientos</h4><p>Cada acción relevante queda registrada con fecha y hora.</p></div></div><div className="timeline">{order.movements.map((movement, index) => <div className="timeline-item" key={movement.id}><span className={index === 0 ? 'timeline-item__dot timeline-item__dot--current' : 'timeline-item__dot'} /><div><strong>{movement.description}</strong><small>{formatDateTime(movement.createdAt)} · {movement.actor}</small></div></div>)}</div><div className="order-dates"><span><CalendarDays size={15} />Ingreso: {formatDateTime(order.receivedAt)}</span><span><RefreshCcw size={15} />Modificación: {formatDateTime(order.updatedAt)}</span>{order.deliveredAt && <span><CheckCircle2 size={15} />Entrega: {formatDateTime(order.deliveredAt)}</span>}</div></div>}
  </Dialog>
}

function ReceiptDialog({ order, client, settings, onClose }: { order: RepairOrder; client?: Client; settings: WorkshopData['settings']; onClose: () => void }) {
  const balance = getBalance(order)
  function printReceipt() { window.print() }
  return <Dialog title="Comprobante de recepción" onClose={onClose} wide className="receipt-dialog" backdropClassName="receipt-backdrop"><div className="receipt-actions no-print"><button className="button button--ghost" type="button" onClick={printReceipt}><Printer size={17} />Imprimir</button><button className="button button--primary" type="button" onClick={printReceipt}><Download size={17} />Guardar PDF</button></div><article className="receipt-print"><header className="receipt-print__header"><div><Brand /><p>{settings.address} · {settings.phone}</p></div><div className="receipt-order"><span>ORDEN DE SERVICIO</span><strong>{order.orderNumber}</strong><small>Fecha: {formatDate(order.receivedAt)}</small></div></header><div className="receipt-print__rule" /><section className="receipt-grid"><div><h4>Datos del cliente</h4><p><strong>{client?.fullName || 'No disponible'}</strong></p><p>Documento: {client?.document || '—'}</p><p>Teléfono: {client?.phone || '—'}</p><p>Dirección: {client?.address || '—'}</p></div><div><h4>Equipo recibido</h4><p><strong>{order.device.brand} {order.device.model}</strong>{order.device.color ? ` · ${order.device.color}` : ''}</p><p>IMEI: {order.device.imei || 'No registrado'}</p><p>Serie: {order.device.serialNumber || 'No registrado'}</p><p>Clave / Patrón: {order.device.accessCode || 'No registrado'}</p><p>Accesorios: {order.device.accessories.length ? order.device.accessories.join(', ') : 'Ninguno'}</p></div></section><section className="receipt-problem"><h4>Problema reportado</h4><p>{order.reportedProblem}</p></section><section className="receipt-financial"><div><span>Valor estimado</span><strong>{formatCurrency(order.estimatedTotal)}</strong></div><div><span>Abono realizado</span><strong>{formatCurrency(getPaid(order))}</strong></div><div><span>Saldo pendiente</span><strong>{formatCurrency(balance)}</strong></div><div><span>Estado</span><StatusBadge status={order.status} /></div></section><section className="receipt-terms"><h4>Condiciones de recepción</h4><p>El taller no se hace responsable por información o accesorios no registrados en este comprobante. El diagnóstico puede modificar el valor inicialmente estimado previa autorización del cliente.</p></section><footer className="receipt-signatures"><div><span>Firma del cliente</span></div><div><span>Firma del técnico</span></div></footer></article><p className="receipt-help no-print"><CircleAlert size={15} />Para descargar el PDF, elige “Guardar como PDF” en la ventana de impresión del navegador.</p></Dialog>
}

function EmptyState({ title, detail, icon }: { title: string; detail: string; icon: React.ReactNode }) {
  return <div className="empty-state"><span>{icon}</span><div><strong>{title}</strong><p>{detail}</p></div></div>
}

export default App