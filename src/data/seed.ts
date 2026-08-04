import type { Client, RepairOrder, WorkshopData } from '../types'

const now = new Date()

function at(daysAgo: number, hour: number, minute = 0) {
  const date = new Date(now)
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const clients: Client[] = [
  { id: 'cli-1', fullName: 'Catalina Gómez', document: '1.032.547.810', phone: '300 482 7619', address: 'Cra. 48 # 10-28', observations: 'Prefiere confirmación por WhatsApp.', createdAt: at(28, 10), updatedAt: at(0, 9) },
  { id: 'cli-2', fullName: 'Juan David Martínez', document: '1.018.745.292', phone: '315 681 2470', address: 'Calle 12 # 43-18', createdAt: at(22, 11), updatedAt: at(2, 17) },
  { id: 'cli-3', fullName: 'Laura Rojas', document: '1.024.715.837', phone: '301 492 1663', observations: 'Autoriza diagnóstico antes de cualquier reparación.', createdAt: at(12, 15), updatedAt: at(0, 10) },
  { id: 'cli-4', fullName: 'Andrés Torres', document: '71.822.094', phone: '310 811 6042', address: 'Calle 30 # 77-05', createdAt: at(9, 9), updatedAt: at(1, 14) },
  { id: 'cli-5', fullName: 'Valentina Pérez', document: '1.151.987.214', phone: '302 110 5298', createdAt: at(7, 12), updatedAt: at(3, 16) },
  { id: 'cli-6', fullName: 'Diego Ramírez', document: '98.701.642', phone: '316 947 2201', createdAt: at(4, 11), updatedAt: at(0, 13) },
  { id: 'cli-7', fullName: 'Sofía Castro', document: '1.012.659.304', phone: '312 386 4741', createdAt: at(0, 9), updatedAt: at(0, 9) },
  { id: 'cli-8', fullName: 'Felipe Mora', document: '1.045.330.926', phone: '300 913 0477', createdAt: at(18, 16), updatedAt: at(10, 11) },
]

const order = (input: Omit<RepairOrder, 'movements' | 'notes'> & { movements?: RepairOrder['movements']; notes?: RepairOrder['notes'] }): RepairOrder => ({
  ...input,
  movements: input.movements ?? [{ id: `${input.id}-mov-1`, description: 'Se creó la orden de servicio', createdAt: input.receivedAt, actor: 'Sistema' }],
  notes: input.notes ?? [],
})

const orders: RepairOrder[] = [
  order({
    id: 'ord-1', orderNumber: 'ORD-000001', clientId: 'cli-1', receivedAt: at(0, 9, 10), updatedAt: at(0, 15, 20),
    device: { brand: 'Samsung', model: 'Galaxy A54', color: 'Violeta', imei: '352904118630772', accessories: ['SIM', 'Funda'] },
    reportedProblem: 'No enciende después de una caída. El equipo vibra al conectarlo.', diagnosis: 'Daño en línea de alimentación principal. Requiere trabajo de microelectrónica.', partsUsed: 'IC de carga PMIC', technician: 'ALEX R.', status: 'En reparación', estimatedTotal: 280000,
    payments: [{ id: 'pay-1', amount: 100000, method: 'Transferencia', createdAt: at(0, 9, 15) }],
    movements: [
      { id: 'ord-1-mov-1', description: 'Se creó la orden de servicio', createdAt: at(0, 9, 10), actor: 'Recepción' },
      { id: 'ord-1-mov-2', description: 'Se registró un abono de $100.000', createdAt: at(0, 9, 15), actor: 'Recepción' },
      { id: 'ord-1-mov-3', description: 'Estado actualizado: Recibido → En reparación', createdAt: at(0, 15, 20), actor: 'ALEX R.' },
    ],
    notes: [{ id: 'note-1', text: 'Cliente solicitó ser contactada antes de hacer el cambio del IC.', createdAt: at(0, 11, 30) }],
  }),
  order({
    id: 'ord-2', orderNumber: 'ORD-000002', clientId: 'cli-2', receivedAt: at(2, 10), updatedAt: at(0, 16),
    device: { brand: 'Apple', model: 'iPhone 13', color: 'Medianoche', imei: '356204918374011', accessories: ['Funda', 'Cable USB-C'] },
    reportedProblem: 'La pantalla parpadea y presenta líneas verticales.', diagnosis: 'Falso contacto en conector de pantalla.', workPerformed: 'Microsoldadura y calibración de pantalla.', partsUsed: 'Flex de pantalla', technician: 'Laura G.', status: 'Listo para entregar', estimatedTotal: 450000,
    payments: [{ id: 'pay-2', amount: 450000, method: 'Tarjeta', createdAt: at(0, 16) }],
    movements: [
      { id: 'ord-2-mov-1', description: 'Se creó la orden de servicio', createdAt: at(2, 10), actor: 'Recepción' },
      { id: 'ord-2-mov-2', description: 'Estado actualizado: En reparación → Listo para entregar', createdAt: at(0, 15, 30), actor: 'Laura G.' },
      { id: 'ord-2-mov-3', description: 'Se registró un pago de $450.000', createdAt: at(0, 16), actor: 'Recepción' },
    ],
  }),
  order({
    id: 'ord-3', orderNumber: 'ORD-000003', clientId: 'cli-3', receivedAt: at(0, 10, 25), updatedAt: at(0, 10, 25),
    device: { brand: 'Xiaomi', model: 'Redmi Note 12', color: 'Azul hielo', accessories: ['SIM'] },
    reportedProblem: 'No reconoce la red móvil ni el chip SIM.', technician: 'ALEX R.', status: 'En diagnóstico', estimatedTotal: 180000, payments: [],
  }),
  order({
    id: 'ord-4', orderNumber: 'ORD-000004', clientId: 'cli-4', receivedAt: at(1, 13), updatedAt: at(1, 14, 45),
    device: { brand: 'Motorola', model: 'Moto G84', color: 'Azul', serialNumber: 'ZY22H4VYJS', accessories: ['Funda'] },
    reportedProblem: 'La cámara principal no enfoca y se reinicia al abrirla.', diagnosis: 'Módulo de cámara con corto interno.', technician: 'Laura G.', status: 'Esperando repuestos', estimatedTotal: 320000,
    payments: [{ id: 'pay-4', amount: 80000, method: 'Efectivo', createdAt: at(1, 13, 10) }],
  }),
  order({
    id: 'ord-5', orderNumber: 'ORD-000005', clientId: 'cli-5', receivedAt: at(5, 12), updatedAt: at(3, 16), deliveredAt: at(3, 16),
    device: { brand: 'Apple', model: 'iPhone 11', color: 'Blanco', imei: '358823105447219', accessories: [] },
    reportedProblem: 'Batería se descarga muy rápido.', diagnosis: 'Capacidad de batería al 72%.', workPerformed: 'Cambio de batería y prueba de consumo.', partsUsed: 'Batería iPhone 11', technician: 'ALEX R.', status: 'Entregado', estimatedTotal: 260000,
    payments: [{ id: 'pay-5', amount: 260000, method: 'Efectivo', createdAt: at(3, 16) }],
    movements: [
      { id: 'ord-5-mov-1', description: 'Se creó la orden de servicio', createdAt: at(5, 12), actor: 'Recepción' },
      { id: 'ord-5-mov-2', description: 'Equipo entregado al cliente', createdAt: at(3, 16), actor: 'Recepción' },
    ],
  }),
  order({
    id: 'ord-6', orderNumber: 'ORD-000006', clientId: 'cli-6', receivedAt: at(0, 12, 40), updatedAt: at(0, 13, 30),
    device: { brand: 'Samsung', model: 'Galaxy S21 FE', color: 'Grafito', accessories: ['SIM', 'Funda'] },
    reportedProblem: 'No carga de forma estable.', diagnosis: 'Conector USB-C sulfatado.', workPerformed: 'Limpieza ultrasónica y cambio de conector.', technician: 'Laura G.', status: 'Reparado', estimatedTotal: 210000,
    payments: [],
  }),
  order({
    id: 'ord-7', orderNumber: 'ORD-000007', clientId: 'cli-7', receivedAt: at(0, 9, 45), updatedAt: at(0, 9, 45),
    device: { brand: 'Huawei', model: 'P30 Lite', color: 'Negro', accessories: ['Cargador'] },
    reportedProblem: 'Se mojó y no enciende.', technician: 'ALEX R.', status: 'Recibido', estimatedTotal: 0, payments: [],
  }),
  order({
    id: 'ord-8', orderNumber: 'ORD-000008', clientId: 'cli-8', receivedAt: at(10, 10), updatedAt: at(10, 11),
    device: { brand: 'Oppo', model: 'Reno 8', color: 'Dorado', accessories: [] },
    reportedProblem: 'Pantalla rota por golpe.', diagnosis: 'Módulo completo con daño físico.', technician: 'Laura G.', status: 'Cancelado', estimatedTotal: 340000, payments: [],
  }),
]

export function getSeedData(): WorkshopData {
  return {
    clients: structuredClone(clients),
    orders: structuredClone(orders),
    settings: {
      workshopName: '5G CELL COMUNICACIONES',
      workshopShortName: '5G CELL',
      phone: '3502636682',
      address: 'Calle 14 #5-18 (Local 2047)',
      nextOrderSequence: 9,
    },
  }
}
