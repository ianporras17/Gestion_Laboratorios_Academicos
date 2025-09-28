import { API_BASE_URL } from '@/constants/env';

export interface Resource {
  id: string;
  name: string;
  type: string;
  description?: string;
  inventory_code?: string;
  state: 'DISPONIBLE' | 'RESERVADO' | 'EN_MANTENIMIENTO' | 'INACTIVO';
  location?: string;
  last_maintenance?: string;
  tech_sheet?: string;
  is_public: boolean;
  requires_approval: boolean;
  max_loan_days?: number;
  daily_rate?: number;
  lab_id: string;
  lab_name: string;
  lab_location?: string;
  technical_sheet?: string;
  specifications?: any;
  qty_available?: number;
  unit?: string;
  reorder_point?: number;
  primary_photo_url?: string;
  photo_caption?: string;
}

export interface ResourceDetails extends Resource {
  photos: ResourcePhoto[];
  stock?: ConsumableStock;
  state_history: AvailabilityState[];
  upcoming_slots: CalendarSlot[];
}

export interface ResourcePhoto {
  id: string;
  url: string;
  caption?: string;
  is_primary: boolean;
}

export interface ConsumableStock {
  resource_id: string;
  unit: string;
  qty_available: number;
  reorder_point: number;
  last_restocked?: string;
}

export interface AvailabilityState {
  id: string;
  resource_id: string;
  current_state: string;
  previous_state?: string;
  changed_by?: string;
  changed_by_name?: string;
  reason?: string;
  changed_at: string;
  expires_at?: string;
}

export interface CalendarSlot {
  id: string;
  lab_id: string;
  resource_id?: string;
  starts_at: string;
  ends_at: string;
  status: string;
  lab_name: string;
}

export interface ResourceFilters {
  lab_id?: string;
  type?: string;
  state?: string;
  is_public?: boolean;
  search?: string;
  page?: number;
  limit?: number;
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class ResourceService {
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
   * Obtener catálogo de recursos
   */
  async getResources(filters: ResourceFilters = {}): Promise<PaginatedResponse<Resource>> {
    const params = new URLSearchParams();
    
    if (filters.lab_id) params.append('lab_id', filters.lab_id);
    if (filters.type) params.append('type', filters.type);
    if (filters.state) params.append('state', filters.state);
    if (filters.is_public !== undefined) params.append('is_public', filters.is_public.toString());
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/resource-catalog?${queryString}` : '/resource-catalog';

    return this.request<PaginatedResponse<Resource>>(endpoint);
  }

  /**
   * Obtener detalles de un recurso
   */
  async getResourceDetails(id: string): Promise<ApiResponse<ResourceDetails>> {
    return this.request<ApiResponse<ResourceDetails>>(`/resource-catalog/${id}`);
  }

  /**
   * Actualizar estado de disponibilidad de un recurso
   */
  async updateResourceState(id: string, data: {
    new_state: string;
    reason?: string;
    expires_at?: string;
  }): Promise<ApiResponse<Resource>> {
    return this.request<ApiResponse<Resource>>(`/resource-catalog/${id}/state`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Gestionar fotos de un recurso
   */
  async manageResourcePhotos(id: string, data: {
    action: 'add' | 'update' | 'delete';
    photo: {
      id?: string;
      url?: string;
      caption?: string;
      is_primary?: boolean;
    };
  }): Promise<ApiResponse<ResourcePhoto>> {
    return this.request<ApiResponse<ResourcePhoto>>(`/resource-catalog/${id}/photos`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Solicitar un recurso
   */
  async requestResource(id: string, data: {
    start_date: string;
    end_date: string;
    purpose: string;
    notes?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>(`/resource-catalog/${id}/request`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Obtener recursos por laboratorio
   */
  async getResourcesByLab(labId: string, filters: Omit<ResourceFilters, 'lab_id'> = {}): Promise<PaginatedResponse<Resource>> {
    return this.getResources({ ...filters, lab_id: labId });
  }

  /**
   * Obtener recursos por tipo
   */
  async getResourcesByType(type: string, filters: Omit<ResourceFilters, 'type'> = {}): Promise<PaginatedResponse<Resource>> {
    return this.getResources({ ...filters, type });
  }

  /**
   * Buscar recursos
   */
  async searchResources(query: string, filters: Omit<ResourceFilters, 'search'> = {}): Promise<PaginatedResponse<Resource>> {
    return this.getResources({ ...filters, search: query });
  }
}

export const resourceService = new ResourceService();
