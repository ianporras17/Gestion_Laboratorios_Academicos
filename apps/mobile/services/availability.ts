import { api } from './api';
import { 
  CalendarSlot, 
  Resource, 
  AvailabilitySubscription, 
  PublishChangelog, 
  Notification, 
  AvailabilityStats,
  CalendarFilter,
  ResourceFilter,
  NotificationFilter,
  CalendarSlotForm,
  ResourceStateChange,
  SubscriptionForm
} from '@/types/availability';

/**
 * Servicios API para el módulo de Publicación de Disponibilidad y Recursos
 * Basados en los endpoints de la API
 */

// =========================
// 1. CALENDARIO Y DISPONIBILIDAD
// =========================

export const CalendarAPI = {
  list: (filter: CalendarFilter = {}) => 
    api.get<CalendarSlot[]>('/availability/calendar', { params: filter }).then(r => r.data),
  
  create: (slot: CalendarSlotForm) => 
    api.post<CalendarSlot>('/availability/calendar', slot).then(r => r.data),
  
  update: (id: number, slot: Partial<CalendarSlotForm>) => 
    api.put<CalendarSlot>(`/availability/calendar/${id}`, slot).then(r => r.data),
  
  delete: (id: number) => 
    api.delete(`/availability/calendar/${id}`),
};

// =========================
// 2. RECURSOS Y CATÁLOGO
// =========================

export const ResourcesAPI = {
  list: (filter: ResourceFilter = {}) => 
    api.get<Resource[]>('/availability/resources', { params: filter }).then(r => r.data),
  
  get: (id: number) => 
    api.get<Resource>(`/availability/resources/${id}`).then(r => r.data),
  
  changeState: (id: number, change: ResourceStateChange) => 
    api.put<Resource>(`/availability/resources/${id}/state`, change).then(r => r.data),
};

// =========================
// 3. SUSCRIPCIONES
// =========================

export const SubscriptionsAPI = {
  list: (userId: number) => 
    api.get<AvailabilitySubscription[]>(`/availability/subscriptions?user_id=${userId}`).then(r => r.data),
  
  create: (subscription: SubscriptionForm) => 
    api.post<AvailabilitySubscription>('/availability/subscriptions', subscription).then(r => r.data),
  
  delete: (id: number) => 
    api.delete(`/availability/subscriptions/${id}`),
};

// =========================
// 4. BITÁCORA DE CAMBIOS
// =========================

export const ChangelogAPI = {
  list: (labId?: number, resourceId?: number, limit = 100) => 
    api.get<PublishChangelog[]>('/availability/changelog', { 
      params: { lab_id: labId, resource_id: resourceId, limit } 
    }).then(r => r.data),
};

// =========================
// 5. NOTIFICACIONES
// =========================

export const NotificationsAPI = {
  list: (filter: NotificationFilter) => 
    api.get<Notification[]>('/availability/notifications', { params: filter }).then(r => r.data),
  
  markAsRead: (id: number) => 
    api.put<Notification>(`/availability/notifications/${id}/read`).then(r => r.data),
};

// =========================
// 6. ESTADÍSTICAS
// =========================

export const StatsAPI = {
  get: (labId?: number, startDate?: string, endDate?: string) => 
    api.get<AvailabilityStats>('/availability/stats', { 
      params: { lab_id: labId, start_date: startDate, end_date: endDate } 
    }).then(r => r.data),
};

// =========================
// 7. VALIDACIONES
// =========================

export const AvailabilityValidations = {
  validateCalendarSlot: (slot: Partial<CalendarSlotForm>) => {
    const errors: string[] = [];
    
    if (!slot.lab_id) errors.push('El laboratorio es requerido');
    if (!slot.starts_at) errors.push('La fecha de inicio es requerida');
    if (!slot.ends_at) errors.push('La fecha de fin es requerida');
    if (!slot.status) errors.push('El estado es requerido');
    
    if (slot.starts_at && slot.ends_at) {
      const start = new Date(slot.starts_at);
      const end = new Date(slot.ends_at);
      if (end <= start) {
        errors.push('La fecha de fin debe ser posterior a la de inicio');
      }
    }
    
    const validStatuses = ['DISPONIBLE', 'BLOQUEADO', 'RESERVADO', 'MANTENIMIENTO', 'EXCLUSIVO'];
    if (slot.status && !validStatuses.includes(slot.status)) {
      errors.push('Estado inválido');
    }
    
    return errors;
  },
  
  validateResourceStateChange: (change: Partial<ResourceStateChange>) => {
    const errors: string[] = [];
    
    if (!change.state) errors.push('El estado es requerido');
    
    const validStates = ['DISPONIBLE', 'RESERVADO', 'EN_MANTENIMIENTO', 'INACTIVO'];
    if (change.state && !validStates.includes(change.state)) {
      errors.push('Estado inválido');
    }
    
    if (!change.user_id) errors.push('El usuario es requerido');
    
    return errors;
  },
  
  validateSubscription: (subscription: Partial<SubscriptionForm>) => {
    const errors: string[] = [];
    
    if (!subscription.user_id) errors.push('El usuario es requerido');
    if (!subscription.lab_id && !subscription.resource_id) {
      errors.push('Debe especificar un laboratorio o un recurso');
    }
    
    return errors;
  },
};

// =========================
// 8. UTILIDADES
// =========================

export const AvailabilityUtils = {
  // Obtener color según el estado
  getStatusColor: (status: CalendarSlot['status'] | Resource['state']) => {
    const colors = {
      'DISPONIBLE': '#4CAF50',      // Verde
      'RESERVADO': '#FF9800',       // Naranja
      'BLOQUEADO': '#F44336',       // Rojo
      'MANTENIMIENTO': '#9C27B0',   // Púrpura
      'EXCLUSIVO': '#2196F3',       // Azul
      'INACTIVO': '#9E9E9E',        // Gris
      'EN_MANTENIMIENTO': '#9C27B0' // Púrpura
    };
    return colors[status] || '#9E9E9E';
  },
  
  // Obtener texto del estado
  getStatusText: (status: CalendarSlot['status'] | Resource['state']) => {
    const texts = {
      'DISPONIBLE': 'Disponible',
      'RESERVADO': 'Reservado',
      'BLOQUEADO': 'Bloqueado',
      'MANTENIMIENTO': 'Mantenimiento',
      'EXCLUSIVO': 'Exclusivo',
      'INACTIVO': 'Inactivo',
      'EN_MANTENIMIENTO': 'En Mantenimiento'
    };
    return texts[status] || status;
  },
  
  // Formatear fecha para el calendario
  formatCalendarDate: (date: string | Date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  },
  
  // Formatear hora para el calendario
  formatCalendarTime: (date: string | Date) => {
    const d = new Date(date);
    return d.toTimeString().split(' ')[0].substring(0, 5);
  },
  
  // Verificar si un slot está disponible
  isAvailable: (slot: CalendarSlot) => {
    return slot.status === 'DISPONIBLE';
  },
  
  // Verificar si un recurso está disponible
  isResourceAvailable: (resource: Resource) => {
    return resource.state === 'DISPONIBLE';
  },
  
  // Calcular duración de un slot en horas
  getSlotDuration: (slot: CalendarSlot) => {
    const start = new Date(slot.starts_at);
    const end = new Date(slot.ends_at);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  },
  
  // Verificar si un recurso necesita reabastecimiento
  needsReorder: (resource: Resource) => {
    if (resource.type !== 'CONSUMABLE') return false;
    return (resource.qty_available || 0) <= (resource.reorder_point || 0);
  },
  
  // Generar mensaje de notificación
  generateNotificationMessage: (type: string, data: any) => {
    switch (type) {
      case 'resource_available':
        return `El recurso "${data.resource_name}" está ahora disponible en ${data.lab_name}`;
      case 'slot_available':
        return `Se liberó un espacio en ${data.lab_name} para ${data.resource_name || 'uso general'}`;
      case 'maintenance_completed':
        return `El mantenimiento de "${data.resource_name}" ha sido completado`;
      default:
        return 'Nueva notificación disponible';
    }
  },
};
