import { API_BASE_URL } from '@/constants/env';

export interface Lab {
  id: string;
  name: string;
  internal_code: string;
  location: string;
  description?: string;
  email_contact: string;
  capacity_max?: number;
  is_active: boolean;
  school_department_name?: string;
  responsible_count: number;
  resource_count: number;
  created_at: string;
  updated_at: string;
}

export interface LabDetail extends Lab {
  responsibles: LabResponsible[];
  policies?: LabPolicies;
  open_hours: LabOpenHour[];
  resources: LabResource[];
  recent_history: LabHistory[];
}

export interface LabResponsible {
  id: string;
  full_name: string;
  position_title: string;
  phone?: string;
  email: string;
  is_primary: boolean;
}

export interface LabPolicies {
  academic_req?: string;
  safety_req?: string;
  notes?: string;
}

export interface LabOpenHour {
  id: string;
  weekday: number;
  time_start: string;
  time_end: string;
}

export interface LabResource {
  id: string;
  type: string;
  name: string;
  description?: string;
  allowed_roles: string[];
}

export interface LabHistory {
  id: string;
  action_type: string;
  detail: string;
  actor_name?: string;
  created_at: string;
}

export interface LabFilters {
  search?: string;
  school_dept_id?: string;
  is_active?: boolean;
}

export interface LabCreateData {
  name: string;
  internal_code: string;
  school_dept_id: string;
  email_contact: string;
  location: string;
  description?: string;
  capacity_max?: number;
  responsibles?: Omit<LabResponsible, 'id'>[];
  policies?: LabPolicies;
  open_hours?: Omit<LabOpenHour, 'id'>[];
}

export interface LabUpdateData {
  name?: string;
  internal_code?: string;
  school_dept_id?: string;
  email_contact?: string;
  location?: string;
  description?: string;
  capacity_max?: number;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class LabService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private async getAuthToken(): Promise<string> {
    // Implementar lógica para obtener el token de autenticación
    // Por ahora retornamos un token vacío
    return '';
  }

  /**
   * Obtener todos los laboratorios con filtros opcionales
   */
  async getLabs(filters: LabFilters = {}): Promise<PaginatedResponse<Lab>> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.school_dept_id) params.append('school_dept_id', filters.school_dept_id);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/labs?${queryString}` : '/labs';

    return this.request<PaginatedResponse<Lab>>(endpoint);
  }

  /**
   * Obtener un laboratorio por ID
   */
  async getLabById(id: string): Promise<ApiResponse<LabDetail>> {
    return this.request<ApiResponse<LabDetail>>(`/labs/${id}`);
  }

  /**
   * Crear un nuevo laboratorio
   */
  async createLab(data: LabCreateData): Promise<ApiResponse<Lab>> {
    return this.request<ApiResponse<Lab>>('/labs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualizar un laboratorio
   */
  async updateLab(id: string, data: LabUpdateData): Promise<ApiResponse<Lab>> {
    return this.request<ApiResponse<Lab>>(`/labs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Gestionar responsables del laboratorio
   */
  async manageResponsibles(
    labId: string,
    action: 'add' | 'update' | 'delete',
    responsible: Partial<LabResponsible>
  ): Promise<ApiResponse<LabResponsible>> {
    return this.request<ApiResponse<LabResponsible>>(`/labs/${labId}/responsibles`, {
      method: 'POST',
      body: JSON.stringify({ action, responsible }),
    });
  }

  /**
   * Actualizar políticas del laboratorio
   */
  async updatePolicies(
    labId: string,
    policies: LabPolicies
  ): Promise<ApiResponse<LabPolicies>> {
    return this.request<ApiResponse<LabPolicies>>(`/labs/${labId}/policies`, {
      method: 'PUT',
      body: JSON.stringify(policies),
    });
  }

  /**
   * Gestionar horarios del laboratorio
   */
  async manageOpenHours(
    labId: string,
    action: 'replace' | 'add' | 'delete',
    hours?: LabOpenHour | LabOpenHour[]
  ): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/labs/${labId}/open-hours`, {
      method: 'POST',
      body: JSON.stringify({ action, hours }),
    });
  }

  /**
   * Obtener historial del laboratorio
   */
  async getLabHistory(
    labId: string,
    page: number = 1,
    limit: number = 20,
    action_type?: string
  ): Promise<PaginatedResponse<LabHistory>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (action_type) params.append('action_type', action_type);

    return this.request<PaginatedResponse<LabHistory>>(`/labs/${labId}/history?${params.toString()}`);
  }
}

export const labService = new LabService();
