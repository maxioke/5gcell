import type { RepairOrder, RepairStatus } from '../types'
import { getPaymentMeta, statusMeta } from '../lib/formatters'

export function StatusBadge({ status }: { status: RepairStatus }) {
  const meta = statusMeta[status]
  return <span className={`badge badge--${meta.tone}`}><span className="badge__dot" />{meta.label}</span>
}

export function PaymentBadge({ order }: { order: RepairOrder }) {
  const meta = getPaymentMeta(order)
  return <span className={`badge badge--${meta.tone}`}><span className="badge__dot" />{meta.label}</span>
}
