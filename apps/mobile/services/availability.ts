import { api } from './api';
import type { Lab } from '../types/lab';
import type { CalendarBlock, Resource, AvailabilityHistory } from '../types/availability';

// ----------------------------- API helpers -----------------------------
export const LabsAPI = {
  list: () => api.get<Lab[]>("/labs").then(r => r.data),
};

export const CalendarAPI = {
  range: (labId: number, from: string, to: string) => 
    api.get<CalendarBlock[]>("/availability/calendar", { 
      params: { labId, from, to } 
    }).then(r => r.data),
  upsert: (labId: number, block: Partial<CalendarBlock>) => 
    block.id 
      ? api.put(`/availability/calendar/${block.id}`, block) 
      : api.post(`/availability/calendar`, { ...block, lab_id: labId }),
  remove: (id: number) => api.delete(`/availability/calendar/${id}`),
};

export const ResourcesAPI = {
  list: (labId: number, type?: Resource["type"], query?: string) => 
    api.get<Resource[]>("/availability/resources", { 
      params: { labId, type, q: query } 
    }).then(r => r.data),
  setStatus: (id: number, status: Resource["status"]) => 
    api.patch(`/availability/resources/${id}/status`, { status }),
  subscribe: (labId: number, resourceId?: number) => 
    api.post(`/availability/subscriptions`, { 
      lab_id: labId, 
      resource_id: resourceId 
    }),
  unsubscribe: (labId: number, resourceId?: number) => 
    api.delete(`/availability/subscriptions`, { 
      data: { lab_id: labId, resource_id: resourceId } 
    }),
};

export const HistoryAPI = {
  list: (labId: number, entity?: string) => 
    api.get<AvailabilityHistory[]>(`/availability/history`, { 
      params: { labId, entity } 
    }).then(r => r.data),
};
