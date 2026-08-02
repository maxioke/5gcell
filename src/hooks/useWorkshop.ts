import { useEffect, useState } from 'react'
import { getSeedData } from '../data/seed'
import { id, normalizeDocument } from '../lib/formatters'
import type { Client, NewClientInput, NewOrderInput, PaymentMethod, RepairOrder, RepairStatus, WorkshopData } from '../types'

const STORAGE_KEY = 'microlab-workshop-data-v1'

function loadData(): WorkshopData {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as WorkshopData
  } catch {
    // A fresh, valid demo is safer than leaving the interface unusable after corrupt local data.
  }
  return getSeedData()
}

function now() {
  return new Date().toISOString()
}

export function useWorkshop() {
  const [data, setData] = useState<WorkshopData>(() => loadData())

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  function createClient(input: NewClientInput): { client?: Client; error?: string } {
    const document = input.document.trim()
    const exists = data.clients.some((client) => normalizeDocument(client.document) === normalizeDocument(document))
    if (exists) return { error: 'Ya existe un cliente con este número de documento.' }
    const timestamp = now()
    const client: Client = { id: id(), fullName: input.fullName.trim(), document, phone: input.phone.trim(), address: input.address?.trim(), observations: input.observations?.trim(), createdAt: timestamp, updatedAt: timestamp }
    setData((current) => ({ ...current, clients: [client, ...current.clients] }))
    return { client }
  }

  function updateClient(clientId: string, input: NewClientInput): { error?: string } {
    const document = input.document.trim()
    const exists = data.clients.some((client) => client.id !== clientId && normalizeDocument(client.document) === normalizeDocument(document))
    if (exists) return { error: 'Ese documento ya está registrado en otro cliente.' }
    setData((current) => ({
      ...current,
      clients: current.clients.map((client) => client.id === clientId ? { ...client, ...input, fullName: input.fullName.trim(), document, phone: input.phone.trim(), updatedAt: now() } : client),
    }))
    return {}
  }

  function removeClient(clientId: string): { error?: string } {
    if (data.orders.some((order) => order.clientId === clientId)) return { error: 'No puedes eliminar un cliente que tiene órdenes registradas.' }
    setData((current) => ({ ...current, clients: current.clients.filter((client) => client.id !== clientId) }))
    return {}
  }

  function createOrder(input: NewOrderInput): { order?: RepairOrder; error?: string } {
    let clientId = input.clientId
    let newClient: Client | undefined
    if (!clientId) {
      if (!input.client) return { error: 'Selecciona o registra un cliente para continuar.' }
      const duplicate = data.clients.some((client) => normalizeDocument(client.document) === normalizeDocument(input.client!.document))
      if (duplicate) return { error: 'Ya existe un cliente con este documento. Selecciónalo en la lista.' }
      const timestamp = now()
      newClient = { id: id(), fullName: input.client.fullName.trim(), document: input.client.document.trim(), phone: input.client.phone.trim(), address: input.client.address?.trim(), observations: input.client.observations?.trim(), createdAt: timestamp, updatedAt: timestamp }
      clientId = newClient.id
    }
    const timestamp = now()
    const sequence = data.settings.nextOrderSequence
    const orderNumber = `ORD-${String(sequence).padStart(6, '0')}`
    const order: RepairOrder = {
      id: id(), orderNumber, clientId, device: input.device, receivedAt: timestamp, updatedAt: timestamp,
      reportedProblem: input.reportedProblem.trim(), diagnosis: input.diagnosis?.trim(), workPerformed: input.workPerformed?.trim(), partsUsed: input.partsUsed?.trim(), technician: input.technician?.trim(), status: input.status, estimatedTotal: input.estimatedTotal,
      payments: input.initialPayment > 0 ? [{ id: id(), amount: input.initialPayment, method: input.paymentMethod, createdAt: timestamp }] : [], notes: [],
      movements: [
        { id: id(), description: 'Se creó la orden de servicio', createdAt: timestamp, actor: 'Sistema' },
        ...(input.initialPayment > 0 ? [{ id: id(), description: `Se registró un abono inicial de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(input.initialPayment)}`, createdAt: timestamp, actor: 'Sistema' }] : []),
      ],
    }
    setData((current) => ({
      ...current,
      clients: newClient ? [newClient, ...current.clients] : current.clients,
      orders: [order, ...current.orders],
      settings: { ...current.settings, nextOrderSequence: current.settings.nextOrderSequence + 1 },
    }))
    return { order }
  }

  function updateOrder(orderId: string, changes: Partial<Pick<RepairOrder, 'reportedProblem' | 'diagnosis' | 'workPerformed' | 'partsUsed' | 'technician' | 'estimatedTotal' | 'device'>>): void {
    const timestamp = now()
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId ? {
        ...order, ...changes, updatedAt: timestamp,
        movements: [{ id: id(), description: 'Se actualizaron los detalles técnicos de la orden', createdAt: timestamp, actor: 'Recepción' }, ...order.movements],
      } : order),
    }))
  }

  function changeStatus(
    orderId: string,
    status: RepairStatus,
    actor = 'Recepción',
  ) {
    const timestamp = now()
  
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => {
        if (order.id !== orderId || order.status === status) {
          return order
        }
  
        return {
          ...order,
          status,
          updatedAt: timestamp,
          deliveredAt: status === 'Entregado'
            ? timestamp
            : order.deliveredAt,
          movements: [
            {
              id: id(),
              description: `Estado actualizado: ${order.status} → ${status}`,
              createdAt: timestamp,
              actor,
            },
            ...order.movements,
          ],
        }
      }),
    }))
  }

  function addPayment(orderId: string, amount: number, method: PaymentMethod) {
    const timestamp = now()
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId ? {
        ...order, updatedAt: timestamp,
        payments: [...order.payments, { id: id(), amount, method, createdAt: timestamp }],
        movements: [{ id: id(), description: `Se registró un pago de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)}`, createdAt: timestamp, actor: 'Recepción' }, ...order.movements],
      } : order),
    }))
  }

  function addNote(orderId: string, text: string) {
    const timestamp = now()
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => order.id === orderId ? {
        ...order, updatedAt: timestamp,
        notes: [{ id: id(), text: text.trim(), createdAt: timestamp }, ...order.notes],
        movements: [{ id: id(), description: 'Se agregó una nota interna', createdAt: timestamp, actor: 'Recepción' }, ...order.movements],
      } : order),
    }))
  }

  function resetDemo() {
    setData(getSeedData())
  }

  return { data, createClient, updateClient, removeClient, createOrder, updateOrder, changeStatus, addPayment, addNote, resetDemo }
}
