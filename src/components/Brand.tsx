import { Cpu } from 'lucide-react'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="5G CELL COMUNICACIONES Reparaciones">
      <span className="brand__mark"><Cpu size={19} strokeWidth={2.4} /></span>
      {!compact && <span className="brand__wordmark">MICRO<span>LAB</span></span>}
    </div>
  )
}
