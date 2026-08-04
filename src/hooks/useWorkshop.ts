import { useEffect, useState } from 'react'
import { getSeedData } from '../data/seed'
import { id, normalizeDocument } from '../lib/formatters'
import type { Client, NewClientInput, NewOrderInput, PaymentMethod, RepairOrder, RepairStatus, WorkshopData } from '../types'
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
const STORAGE_KEY = '5gcell-workshop-data-v1'

function loadData(): WorkshopData {
  return {
    clients: [],
    orders: [],
    settings: {
      nextOrderSequence: 1,
    },
  } as WorkshopData
}

function now() {
  return new Date().toISOString()
}

export function useWorkshop() {
  const { user } = useAuth();
  const [data, setData] = useState<WorkshopData>(() => loadData())

  //useEffect(() => {
   // window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
 // }, [data])
  useEffect(() => {
    if (!user) return;
  
    const loadWorkshop = async () => {
      try {
        const { data: clients, error: clientsError } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id);
  
        if (clientsError) throw clientsError;
  
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id);
  
        if (ordersError) throw ordersError;
        const { data: settings, error: settingsError } = await supabase
  .from("settings")
  .select("*")
  .eq("user_id", user.id)
  .single();

if (settingsError && settingsError.code !== "PGRST116") {
  throw settingsError;
}
        console.log("CLIENTES CARGADOS:", clients);
  
        setData((current) => ({
          ...current,
        
          clients: (clients ?? []).map((client: any) => ({
            id: client.id,
            fullName: client.full_name,
            document: client.document,
            phone: client.phone,
            address: client.address,
            observations: client.observations,
            createdAt: client.created_at,
            updatedAt: client.updated_at,
          })),
        
          orders: (orders ?? []).map((order: any) => ({
            id: order.id,
            orderNumber: order.order_number,
            clientId: order.client_id,
            device: order.device,
            receivedAt: order.received_at,
            updatedAt: order.updated_at,
            deliveredAt: order.delivered_at,
            reportedProblem: order.reported_problem,
            diagnosis: order.diagnosis,
            workPerformed: order.work_performed,
            partsUsed: order.parts_used,
            technician: order.technician,
            status: order.status,
            estimatedTotal: Number(order.estimated_total ?? 0),
            payments: order.payments ?? [],
            notes: order.notes ?? [],
            movements: order.movements ?? [],
          })),
        
          settings: {
            ...current.settings,
            nextOrderSequence: settings?.next_order_sequence ?? 1,
            workshopName: settings?.workshop_name ?? "5G CELL COMUNICACIONES",
            workshopShortName: settings?.workshop_short_name ?? "5G CELL",
            phone: settings?.phone ?? "",
            address: settings?.address ?? "",
          },
        }));
      
      } catch (err) {
        console.error("Error cargando datos:", err);
      }
    };
  
    loadWorkshop();
  }, [user]);


  async function createClient(
    input: NewClientInput
  ): Promise<{ client?: Client; error?: string }> {
  
    if (!user) return { error: "Usuario no autenticado." };
  
    const document = input.document.trim();
  
    const exists = data.clients.some(
      (client) =>
        normalizeDocument(client.document) ===
        normalizeDocument(document)
    );
  
    if (exists)
      return {
        error: "Ya existe un cliente con este número de documento.",
      };
  
    const timestamp = now();
  
    const client: Client = {
      id: crypto.randomUUID(),
      fullName: input.fullName.trim(),
      document,
      phone: input.phone.trim(),
      address: input.address?.trim(),
      observations: input.observations?.trim(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  
    const { error } = await supabase
  .from("clients")
  .insert({
    id: client.id,
    user_id: user.id,
    full_name: client.fullName,
    document: client.document,
    phone: client.phone,
    address: client.address,
    observations: client.observations,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  });
  const { data: verify } = await supabase
  .from("clients")
  .select("*")
  .eq("id", client.id);

console.log("CLIENTE GUARDADO:", verify);

if (error) {
  console.error(error);
  return { error: error.message };
}

setData((current) => ({
  ...current,
  clients: [client, ...current.clients],
}));

return { client };
  }

  async function updateClient(
    clientId: string,
    input: NewClientInput
  ): Promise<{ error?: string }> {
  
    if (!user) return { error: "Usuario no autenticado." };
  
    const document = input.document.trim();
  
    const exists = data.clients.some(
      (client) =>
        client.id !== clientId &&
        normalizeDocument(client.document) === normalizeDocument(document)
    );
  
    if (exists) {
      return {
        error: "Ese documento ya está registrado en otro cliente.",
      };
    }
  
    const updatedAt = now();
  
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: input.fullName.trim(),
        document,
        phone: input.phone.trim(),
        address: input.address?.trim(),
        observations: input.observations?.trim(),
        updated_at: updatedAt,
      })
      .eq("id", clientId)
      .eq("user_id", user.id);
  
    if (error) {
      console.error(error);
      return { error: error.message };
    }
  
    if (user) {
      supabase
        .from("clients")
        .update({
          full_name: input.fullName.trim(),
          document,
          phone: input.phone.trim(),
          address: input.address?.trim(),
          observations: input.observations?.trim(),
          updated_at: now(),
        })
        .eq("id", clientId)
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error(error);
        });
    }
    
    setData((current) => ({
      ...current,
      clients: current.clients.map((client) =>
        client.id === clientId
          ? {
              ...client,
              ...input,
              fullName: input.fullName.trim(),
              document,
              phone: input.phone.trim(),
              updatedAt: now(),
            }
          : client
      ),
    }));
  
    return {};
  }
  async function removeClient(
    clientId: string
  ): Promise<{ error?: string }> {
  
    if (!user) {
      return { error: "Usuario no autenticado." };
    }
  
    if (data.orders.some((order) => order.clientId === clientId)) {
      return {
        error: "No puedes eliminar un cliente que tiene órdenes registradas.",
      };
    }
  
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", clientId)
      .eq("user_id", user.id);
  
    if (error) {
      console.error(error);
      return { error: error.message };
    }
  
    if (user) {
      supabase
        .from("clients")
        .delete()
        .eq("id", clientId)
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error(error);
        });
    }
    
    setData((current) => ({
      ...current,
      clients: current.clients.filter((client) => client.id !== clientId),
    }));
  
    return {};
  }

  async function createOrder(
    input: NewOrderInput
  ): Promise<{ order?: RepairOrder; error?: string }> {
  
    if (!user) {
      return { error: "Usuario no autenticado." };
    }
  
    let clientId = input.clientId;
    let newClient: Client | undefined;
  
    if (!clientId) {
  
      if (!input.client) {
        return { error: "Selecciona o registra un cliente." };
      }
  
      const duplicate = data.clients.some(
        (client) =>
          normalizeDocument(client.document) ===
          normalizeDocument(input.client!.document)
      );
  
      if (duplicate) {
        return {
          error:
            "Ya existe un cliente con este documento.",
        };
      }
  
      const clientTime = now();
  
      newClient = {
        id: crypto.randomUUID(),
        fullName: input.client.fullName.trim(),
        document: input.client.document.trim(),
        phone: input.client.phone.trim(),
        address: input.client.address?.trim(),
        observations: input.client.observations?.trim(),
        createdAt: clientTime,
        updatedAt: clientTime,
      };
  
      const { error: clientError } = await supabase
        .from("clients")
        .insert({
          id: newClient.id,
          user_id: user.id,
          full_name: newClient.fullName,
          document: newClient.document,
          phone: newClient.phone,
          address: newClient.address,
          observations: newClient.observations,
          created_at: newClient.createdAt,
          updated_at: newClient.updatedAt,
        });
  
      if (clientError) {
        console.error(clientError);
        return { error: clientError.message };
      }
  
      clientId = newClient.id;
    }
  
    const timestamp = now();
  
    const sequence = data.settings.nextOrderSequence;
  
    const orderNumber =
      `ORD-${String(sequence).padStart(6, "0")}`;
  
    const payments =
      input.initialPayment > 0
        ? [
            {
              id: crypto.randomUUID(),
              amount: input.initialPayment,
              method: input.paymentMethod,
              createdAt: timestamp,
            },
          ]
        : [];
  
    const movements = [
      {
        id: crypto.randomUUID(),
        description: "Se creó la orden de servicio",
        createdAt: timestamp,
        actor: "Sistema",
      },
      ...(input.initialPayment > 0
        ? [
            {
              id: crypto.randomUUID(),
              description: `Se registró un abono inicial de ${new Intl.NumberFormat(
                "es-CO",
                {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                }
              ).format(input.initialPayment)}`,
              createdAt: timestamp,
              actor: "Sistema",
            },
          ]
        : []),
    ];
  
    const order: RepairOrder = {
      id: crypto.randomUUID(),
      orderNumber,
      clientId,
      device: input.device,
      reportedProblem: input.reportedProblem.trim(),
      diagnosis: input.diagnosis?.trim(),
      workPerformed: input.workPerformed?.trim(),
      partsUsed: input.partsUsed?.trim(),
      technician: input.technician?.trim(),
      status: input.status,
      estimatedTotal: input.estimatedTotal,
      receivedAt: timestamp,
      updatedAt: timestamp,
      payments,
      notes: [],
      movements,
    };
  
    const { error } = await supabase
      .from("orders")
      .insert({
        id: order.id,
        user_id: user.id,
        client_id: order.clientId,
        order_number: order.orderNumber,
        device: order.device,
        reported_problem: order.reportedProblem,
        diagnosis: order.diagnosis,
        work_performed: order.workPerformed,
        parts_used: order.partsUsed,
        technician: order.technician,
        status: order.status,
        estimated_total: order.estimatedTotal,
        received_at: order.receivedAt,
        updated_at: order.updatedAt,
        delivered_at: order.deliveredAt,
        payments: order.payments,
        notes: order.notes,
        movements: order.movements,
      });
  
    if (error) {
      console.error(error);
      return { error: error.message };
    }
    await supabase
  .from("settings")
  .update({
    next_order_sequence: sequence + 1,
  })
  .eq("user_id", user.id);
    
  
    setData((current) => ({
      ...current,
      clients: newClient
        ? [newClient, ...current.clients]
        : current.clients,
      orders: [order, ...current.orders],
      settings: {
        ...current.settings,
        nextOrderSequence:
          current.settings.nextOrderSequence + 1,
      },
    }));
  
    return { order };
  }

  function updateOrder(orderId: string, changes: Partial<Pick<RepairOrder, 'reportedProblem' | 'diagnosis' | 'workPerformed' | 'partsUsed' | 'technician' | 'estimatedTotal' | 'device'>>): void {
    const timestamp = now()
    if (user) {
      supabase
        .from("orders")
        .update({
          device: changes.device,
          reported_problem: changes.reportedProblem,
          diagnosis: changes.diagnosis,
          work_performed: changes.workPerformed,
          parts_used: changes.partsUsed,
          technician: changes.technician,
          estimated_total: changes.estimatedTotal,
          updated_at: timestamp,
        })
        .eq("id", orderId)
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error(error);
        });
    }
    
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              ...changes,
              updatedAt: timestamp,
              movements: [
                {
                  id: id(),
                  description: "Se actualizaron los detalles técnicos de la orden",
                  createdAt: timestamp,
                  actor: "Recepción",
                },
                ...order.movements,
              ],
            }
          : order
      ),
    }));
  }

  function changeStatus(
    orderId: string,
    status: RepairStatus,
    actor = 'Recepción',
  ) {
    const timestamp = now()
  
    if (user) {
      const currentOrder = data.orders.find((o) => o.id === orderId);
    
      if (currentOrder) {
        const updatedMovements = [
          {
            id: id(),
            description: `Estado actualizado: ${currentOrder.status} → ${status}`,
            createdAt: timestamp,
            actor,
          },
          ...currentOrder.movements,
        ];
    
        supabase
          .from("orders")
          .update({
            status,
            updated_at: timestamp,
            delivered_at: status === "Entregado" ? timestamp : currentOrder.deliveredAt,
            movements: updatedMovements,
          })
          .eq("id", orderId)
          .eq("user_id", user.id)
          .then(({ error }) => {
            if (error) console.error(error);
          });
      }
    }
    
    setData((current) => ({
      ...current,
      orders: current.orders.map((order) => {
        if (order.id !== orderId || order.status === status) {
          return order;
        }
    
        return {
          ...order,
          status,
          updatedAt: timestamp,
          deliveredAt:
            status === "Entregado"
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
        };
      }),
    }));
  }

  function addPayment(orderId: string, amount: number, method: PaymentMethod) {
    const timestamp = now()
    const currentOrder = data.orders.find((o) => o.id === orderId);

if (currentOrder && user) {
  const payment = {
    id: id(),
    amount,
    method,
    createdAt: timestamp,
  };

  const movement = {
    id: id(),
    description: `Se registró un pago de ${new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount)}`,
    createdAt: timestamp,
    actor: "Recepción",
  };

  const updatedPayments = [...currentOrder.payments, payment];
  const updatedMovements = [movement, ...currentOrder.movements];

  supabase
    .from("orders")
    .update({
      payments: updatedPayments,
      movements: updatedMovements,
      updated_at: timestamp,
    })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .then(({ error }) => {
      if (error) console.error(error);
    });
}

setData((current) => ({
  ...current,
  orders: current.orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          updatedAt: timestamp,
          payments: [
            ...order.payments,
            {
              id: id(),
              amount,
              method,
              createdAt: timestamp,
            },
          ],
          movements: [
            {
              id: id(),
              description: `Se registró un pago de ${new Intl.NumberFormat(
                "es-CO",
                {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                }
              ).format(amount)}`,
              createdAt: timestamp,
              actor: "Recepción",
            },
            ...order.movements,
          ],
        }
      : order
  ),
}));
  }

  function addNote(orderId: string, text: string) {
    const timestamp = now()
    const currentOrder = data.orders.find((o) => o.id === orderId);

if (currentOrder && user) {
  const note = {
    id: id(),
    text: text.trim(),
    createdAt: timestamp,
  };

  const movement = {
    id: id(),
    description: "Se agregó una nota interna",
    createdAt: timestamp,
    actor: "Recepción",
  };

  const updatedNotes = [note, ...currentOrder.notes];
  const updatedMovements = [movement, ...currentOrder.movements];

  supabase
    .from("orders")
    .update({
      notes: updatedNotes,
      movements: updatedMovements,
      updated_at: timestamp,
    })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .then(({ error }) => {
      if (error) console.error(error);
    });
}

setData((current) => ({
  ...current,
  orders: current.orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          updatedAt: timestamp,
          notes: [
            {
              id: id(),
              text: text.trim(),
              createdAt: timestamp,
            },
            ...order.notes,
          ],
          movements: [
            {
              id: id(),
              description: "Se agregó una nota interna",
              createdAt: timestamp,
              actor: "Recepción",
            },
            ...order.movements,
          ],
        }
      : order
  ),
}));
  }

  function resetDemo() {
    setData(getSeedData())
  }

  return { data, createClient, updateClient, removeClient, createOrder, updateOrder, changeStatus, addPayment, addNote, resetDemo }
}
