/**
 * Tipos para el módulo de Publicación de Disponibilidad y Recursos
 * Basados en las tablas SQL del sistema
 */

export type CalendarSlot = {
  id: number;
  lab_id: number;
  resource_id?: number;
  starts_at: string;           // TIMESTAMP
  ends_at: string;             // TIMESTAMP
  status: 'DISPONIBLE' | 'BLOQUEADO' | 'RESERVADO' | 'MANTENIMIENTO' | 'EXCLUSIVO';
  reason?: string;             // motivo del bloqueo/reserva
  created_by?: number;
  created_at: string;
  // Campos de join
  lab_name?: string;
  resource_name?: string;
  resource_type?: string;
  created_by_name?: string;
};

export type Resource = {
  id: number;
  lab_id: number;
  type: 'EQUIPMENT' | 'CONSUMABLE' | 'SOFTWARE';
  name: string;
  inventory_code?: string;      // código de inventario (obligatorio para equipos)
  state: 'DISPONIBLE' | 'RESERVADO' | 'EN_MANTENIMIENTO' | 'INACTIVO';
  location?: string;
  last_maintenance?: string;    // fecha de último mantenimiento (YYYY-MM-DD)
  tech_sheet?: string;          // ficha técnica
  description?: string;
  unit?: string;                // unidad de medida (para consumibles)
  qty_available?: number;       // cantidad actual (para consumibles)
  reorder_point?: number;       // punto de reorden (para consumibles)
  created_at: string;
  updated_at: string;
  // Campos de join
  lab_name?: string;
  lab_location?: string;
  photos?: string[];            // URLs de fotos
};

export type ResourcePhoto = {
  id: number;
  resource_id: number;
  url: string;
  caption?: string;
};

export type AvailabilitySubscription = {
  id: number;
  user_id: number;
  lab_id?: number;
  resource_id?: number;
  created_at: string;
  // Campos de join
  lab_name?: string;
  resource_name?: string;
  resource_type?: string;
};

export type PublishChangelog = {
  id: number;
  actor_user_id?: number;
  lab_id?: number;
  resource_id?: number;
  field_name: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  // Campos de join
  actor_name?: string;
  lab_name?: string;
  resource_name?: string;
};

export type Notification = {
  id: number;
  user_id: number;
  topic: string;                // tipo de notificación
  subject: string;              // asunto
  body: string;                 // contenido
  channel: 'EMAIL' | 'INTERNA';
  sent_at: string;
  read_at?: string;
};

export type AvailabilityStats = {
  total_slots: number;
  available_slots: number;
  reserved_slots: number;
  blocked_slots: number;
  maintenance_slots: number;
  exclusive_slots: number;
};

// Tipos para filtros y búsquedas
export type CalendarFilter = {
  lab_id?: number;
  resource_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
};

export type ResourceFilter = {
  lab_id?: number;
  type?: string;
  state?: string;
  search?: string;
};

export type NotificationFilter = {
  user_id: number;
  limit?: number;
};

// Tipos para formularios
export type CalendarSlotForm = {
  lab_id: number;
  resource_id?: number;
  starts_at: string;
  ends_at: string;
  status: CalendarSlot['status'];
  reason?: string;
  created_by?: number;
};

export type ResourceStateChange = {
  state: Resource['state'];
  reason?: string;
  user_id: number;
};

export type SubscriptionForm = {
  user_id: number;
  lab_id?: number;
  resource_id?: number;
};

// Tipos para vistas del calendario
export type CalendarView = 'week' | 'month' | 'day';

export type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: CalendarSlot['status'];
  resource?: string;
  lab?: string;
  reason?: string;
};

// Tipos para notificaciones push
export type PushNotification = {
  title: string;
  body: string;
  data?: Record<string, any>;
  userId: number;
};

// Tipos para reportes
export type AvailabilityReport = {
  period: string;
  lab_id?: number;
  resource_id?: number;
  stats: AvailabilityStats;
  trends: {
    date: string;
    available: number;
    reserved: number;
    blocked: number;
  }[];
};
