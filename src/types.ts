export type RepairStatus =
  | 'Recibido'
  | 'En diagnóstico'
  | 'Esperando repuestos'
  | 'En reparación'
  | 'Reparado'
  | 'Listo para entregar'
  | 'Entregado'
  | 'Cancelado'

export type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'

export interface Client {
  id: string
  fullName: string
  document: string
  phone: string
  address?: string
  observations?: string
  createdAt: string
  updatedAt: string
}

export interface Device {
  brand: string
  model: string
  color?: string
  imei?: string
  serialNumber?: string
  accessCode?: string
  accessories: string[]
}

export interface Payment {
  id: string
  amount: number
  method: PaymentMethod
  createdAt: string
}

export interface InternalNote {
  id: string
  text: string
  createdAt: string
}

export interface Movement {
  id: string
  description: string
  createdAt: string
  actor: string
}

export interface RepairOrder {
  id: string
  orderNumber: string
  clientId: string
  device: Device
  receivedAt: string
  updatedAt: string
  deliveredAt?: string
  reportedProblem: string
  diagnosis?: string
  workPerformed?: string
  partsUsed?: string
  technician?: string
  status: RepairStatus
  estimatedTotal: number
  payments: Payment[]
  notes: InternalNote[]
  movements: Movement[]
}

export interface WorkshopSettings {
  workshopName: string
  workshopShortName: string
  phone: string
  address: string
  nextOrderSequence: number
}

export interface WorkshopData {
  clients: Client[]
  orders: RepairOrder[]
  settings: WorkshopSettings
}

export interface NewClientInput {
  fullName: string
  document: string
  phone: string
  address?: string
  observations?: string
}

export interface NewOrderInput {
  clientId?: string
  client?: NewClientInput
  device: Device
  reportedProblem: string
  diagnosis?: string
  workPerformed?: string
  partsUsed?: string
  technician?: string
  status: RepairStatus
  estimatedTotal: number
  initialPayment: number
  paymentMethod: PaymentMethod
}
