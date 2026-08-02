import type { Client, RepairOrder, RepairStatus } from '../types'

export const statusMeta: Record<RepairStatus, { tone: string; label: string }> = {
  Recibido: { tone: 'slate', label: 'Recibido' },
  'En diagnóstico': { tone: 'blue', label: 'En diagnóstico' },
  'Esperando repuestos': { tone: 'amber', label: 'Esperando repuestos' },
  'En reparación': { tone: 'purple', label: 'En reparación' },
  Reparado: { tone: 'teal', label: 'Reparado' },
  'Listo para entregar': { tone: 'indigo', label: 'Listo para entregar' },
  Entregado: { tone: 'green', label: 'Entregado' },
  Cancelado: { tone: 'rose', label: 'Cancelado' },
}

export const repairStatuses = Object.keys(statusMeta) as RepairStatus[]

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
}

export function formatDate(value?: string, options: Intl.DateTimeFormatOptions = {}) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric', ...options,
  }).format(new Date(value))
}

export function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

export function getPaid(order: RepairOrder) {
  return order.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

export function getBalance(order: RepairOrder) {
  return Math.max(order.estimatedTotal - getPaid(order), 0)
}

export function getPaymentMeta(order: RepairOrder) {
  const paid = getPaid(order)
  const balance = getBalance(order)
  if (balance === 0) return { label: 'Pagado', tone: 'green', detail: 'Pago completo' }
  if (paid > 0) return { label: 'Abono realizado', tone: 'amber', detail: `Abono: ${formatCurrency(paid)}` }
  return { label: 'Pendiente de pago', tone: 'rose', detail: 'Sin abonos registrados' }
}

export function getClient(entities: Client[], clientId: string) {
  return entities.find((client) => client.id === clientId)
}

export function orderMatchesSearch(order: RepairOrder, client: Client | undefined, query: string) {
  const normalized = query.trim().toLocaleLowerCase('es')
  if (!normalized) return true
  return [
    order.orderNumber,
    client?.fullName,
    client?.document,
    client?.phone,
    order.device.brand,
    order.device.model,
  ].some((value) => value?.toLocaleLowerCase('es').includes(normalized))
}

export function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function id() {
  return crypto.randomUUID()
}

export function normalizeDocument(document: string) {
  return document.replace(/[^a-zA-Z0-9]/g, '').toLocaleLowerCase('es')
}
