import { api } from './api';
import type { Lab, Contact, Equipment, Consumable, Policy, Schedule, ScheduleException, History } from '../types/lab';

// ----------------------------- API helpers -----------------------------
export const LabsAPI = {
  list: (query?: string) => 
    api.get<Lab[]>('/labs', { params: { query } }).then(r => r.data),
  get: (id: number) => 
    api.get<Lab>(`/labs/${id}`).then(r => r.data),
  create: (payload: Partial<Lab>) => 
    api.post<Lab>('/labs', payload).then(r => r.data),
  update: (id: number, payload: Partial<Lab>) => 
    api.put<Lab>(`/labs/${id}`, payload).then(r => r.data),
};

export const ContactsAPI = {
  list: (labId: number) => 
    api.get<Contact[]>(`/labs/${labId}/contacts`).then(r => r.data),
  upsert: (labId: number, contact: Partial<Contact>) => 
    contact.id
      ? api.put(`/labs/${labId}/contacts/${contact.id}`, contact)
      : api.post(`/labs/${labId}/contacts`, contact),
  remove: (labId: number, id: number) => 
    api.delete(`/labs/${labId}/contacts/${id}`),
};

export const EquipmentAPI = {
  list: (labId: number) => 
    api.get<Equipment[]>(`/labs/${labId}/equipment`).then(r => r.data),
  upsert: (labId: number, equipment: Partial<Equipment>) => 
    equipment.id
      ? api.put(`/labs/${labId}/equipment/${equipment.id}`, equipment)
      : api.post(`/labs/${labId}/equipment`, equipment),
  remove: (labId: number, id: number) => 
    api.delete(`/labs/${labId}/equipment/${id}`),
};

export const ConsumablesAPI = {
  list: (labId: number) => 
    api.get<Consumable[]>(`/labs/${labId}/consumables`).then(r => r.data),
  upsert: (labId: number, consumable: Partial<Consumable>) => 
    consumable.id
      ? api.put(`/labs/${labId}/consumables/${consumable.id}`, consumable)
      : api.post(`/labs/${labId}/consumables`, consumable),
  remove: (labId: number, id: number) => 
    api.delete(`/labs/${labId}/consumables/${id}`),
};

export const PoliciesAPI = {
  list: (labId: number) => 
    api.get<Policy[]>(`/labs/${labId}/policies`).then(r => r.data),
  upsert: (labId: number, policy: Partial<Policy>) => 
    policy.id
      ? api.put(`/labs/${labId}/policies/${policy.id}`, policy)
      : api.post(`/labs/${labId}/policies`, policy),
  remove: (labId: number, id: number) => 
    api.delete(`/labs/${labId}/policies/${id}`),
};

export const ScheduleAPI = {
  list: (labId: number) => 
    api.get<Schedule[]>(`/labs/${labId}/schedule`).then(r => r.data),
  upsert: (labId: number, schedule: Partial<Schedule>) => 
    schedule.id
      ? api.put(`/labs/${labId}/schedule/${schedule.id}`, schedule)
      : api.post(`/labs/${labId}/schedule`, schedule),
  remove: (labId: number, id: number) => 
    api.delete(`/labs/${labId}/schedule/${id}`),
};

export const ExceptionsAPI = {
  list: (labId: number) => 
    api.get<ScheduleException[]>(`/labs/${labId}/schedule/exceptions`).then(r => r.data),
  upsert: (labId: number, exception: Partial<ScheduleException>) => 
    exception.id
      ? api.put(`/labs/${labId}/schedule/exceptions/${exception.id}`, exception)
      : api.post(`/labs/${labId}/schedule/exceptions`, exception),
  remove: (labId: number, id: number) => 
    api.delete(`/labs/${labId}/schedule/exceptions/${id}`),
};

export const HistoryAPI = {
  list: (labId: number) => 
    api.get<History[]>(`/labs/${labId}/history`, { params: { limit: 100 } }).then(r => r.data),
};
