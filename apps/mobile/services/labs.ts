import { api } from './api';
import { 
  Lab, 
  SchoolDepartment, 
  LabResponsible, 
  Resource, 
  LabPolicy, 
  LabSchedule, 
  LabHistory 
} from '@/types/lab';

/**
 * Servicios API para la gestión de laboratorios
 * Basados en los endpoints de la API
 */

// ----------------------------- Utils -----------------------------
const isTecEmail = (v?: string) => /@((estudiante\.)?tec\.ac\.cr|itcr\.ac\.cr)$/i.test(v || "");

// ----------------------------- API helpers -----------------------------
export const LabsAPI = {
  list: (q?: string, schoolDeptId?: number) => 
    api.get<Lab[]>(`/labs`, { 
      params: { 
        query: q || '', 
        school_dept_id: schoolDeptId 
      } 
    }).then(r => r.data),
  get: (id: number) => api.get<Lab>(`/labs/${id}`).then(r => r.data),
  create: (payload: Partial<Lab>) => api.post<Lab>(`/labs`, payload).then(r => r.data),
  update: (id: number, payload: Partial<Lab>) => api.put<Lab>(`/labs/${id}`, payload).then(r => r.data),
  delete: (id: number) => api.delete(`/labs/${id}`),
};

export const SchoolsAPI = {
  list: () => api.get<SchoolDepartment[]>(`/labs/schools`).then(r => r.data),
};

export const LabResponsiblesAPI = {
  list: (labId: number) => api.get<LabResponsible[]>(`/labs/${labId}/responsibles`).then(r => r.data),
  create: (labId: number, payload: Partial<LabResponsible>) => 
    api.post<LabResponsible>(`/labs/${labId}/responsibles`, payload).then(r => r.data),
  update: (labId: number, responsibleId: number, payload: Partial<LabResponsible>) => 
    api.put<LabResponsible>(`/labs/${labId}/responsibles/${responsibleId}`, payload).then(r => r.data),
  delete: (labId: number, responsibleId: number) => 
    api.delete(`/labs/${labId}/responsibles/${responsibleId}`),
};

export const ResourcesAPI = {
  list: (labId: number, type?: string) => 
    api.get<Resource[]>(`/labs/${labId}/resources`, { 
      params: { type } 
    }).then(r => r.data),
  create: (labId: number, payload: Partial<Resource>) => 
    api.post<Resource>(`/labs/${labId}/resources`, payload).then(r => r.data),
  update: (labId: number, resourceId: number, payload: Partial<Resource>) => 
    api.put<Resource>(`/labs/${labId}/resources/${resourceId}`, payload).then(r => r.data),
  delete: (labId: number, resourceId: number) => 
    api.delete(`/labs/${labId}/resources/${resourceId}`),
};

export const LabPoliciesAPI = {
  get: (labId: number) => api.get<LabPolicy>(`/labs/${labId}/policies`).then(r => r.data),
  update: (labId: number, payload: Partial<LabPolicy>) => 
    api.put<LabPolicy>(`/labs/${labId}/policies`, payload).then(r => r.data),
};

export const LabScheduleAPI = {
  list: (labId: number) => api.get<LabSchedule[]>(`/labs/${labId}/schedule`).then(r => r.data),
  create: (labId: number, payload: Partial<LabSchedule>) => 
    api.post<LabSchedule>(`/labs/${labId}/schedule`, payload).then(r => r.data),
  delete: (labId: number, scheduleId: number) => 
    api.delete(`/labs/${labId}/schedule/${scheduleId}`),
};

export const LabHistoryAPI = {
  list: (labId: number, limit = 100) => 
    api.get<LabHistory[]>(`/labs/${labId}/history`, { 
      params: { limit } 
    }).then(r => r.data),
};

// ----------------------------- Validaciones -----------------------------
export const LabValidations = {
  isTecEmail,
  validateLab: (lab: Partial<Lab>) => {
    const errors: string[] = [];
    
    if (!lab.name?.trim()) errors.push('El nombre es requerido');
    if (!lab.internal_code?.trim()) errors.push('El código interno es requerido');
    if (!lab.location?.trim()) errors.push('La ubicación es requerida');
    if (!lab.email_contact?.trim()) {
      errors.push('El correo institucional es requerido');
    } else if (!isTecEmail(lab.email_contact)) {
      errors.push('El correo debe ser institucional (@tec.ac.cr o @itcr.ac.cr)');
    }
    
    return errors;
  },
  validateResponsible: (responsible: Partial<LabResponsible>) => {
    const errors: string[] = [];
    
    if (!responsible.full_name?.trim()) errors.push('El nombre es requerido');
    if (!responsible.position_title?.trim()) errors.push('El cargo es requerido');
    if (!responsible.email?.trim()) {
      errors.push('El correo institucional es requerido');
    } else if (!isTecEmail(responsible.email)) {
      errors.push('El correo debe ser institucional (@tec.ac.cr o @itcr.ac.cr)');
    }
    
    return errors;
  },
  validateResource: (resource: Partial<Resource>) => {
    const errors: string[] = [];
    
    if (!resource.name?.trim()) errors.push('El nombre es requerido');
    if (!resource.type) errors.push('El tipo es requerido');
    if (!resource.state) errors.push('El estado es requerido');
    
    if (resource.type === 'EQUIPMENT' && !resource.inventory_code?.trim()) {
      errors.push('El código de inventario es requerido para equipos');
    }
    
    if (resource.type === 'CONSUMABLE') {
      if (!resource.unit?.trim()) errors.push('La unidad de medida es requerida para consumibles');
      if (resource.qty_available === undefined || resource.qty_available < 0) {
        errors.push('La cantidad disponible debe ser mayor o igual a 0');
      }
      if (resource.reorder_point === undefined || resource.reorder_point < 0) {
        errors.push('El punto de reorden debe ser mayor o igual a 0');
      }
    }
    
    return errors;
  },
  validateSchedule: (schedule: Partial<LabSchedule>) => {
    const errors: string[] = [];
    
    if (schedule.weekday === undefined || schedule.weekday < 0 || schedule.weekday > 6) {
      errors.push('El día de la semana debe estar entre 0 y 6');
    }
    if (!schedule.time_start?.trim()) errors.push('La hora de inicio es requerida');
    if (!schedule.time_end?.trim()) errors.push('La hora de fin es requerida');
    
    return errors;
  },
};
