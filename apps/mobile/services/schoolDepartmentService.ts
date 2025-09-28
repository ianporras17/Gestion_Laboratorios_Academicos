import { API_BASE_URL } from '@/constants/env';

export interface SchoolDepartment {
  id: string;
  name: string;
  email_domain: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolDepartmentCreateData {
  name: string;
  email_domain: string;
  description?: string;
}

export interface SchoolDepartmentUpdateData {
  name?: string;
  email_domain?: string;
  description?: string;
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
}

class SchoolDepartmentService {
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
   * Obtener todos los departamentos escolares
   */
  async getDepartments(filters: {
    is_active?: boolean;
    search?: string;
  } = {}): Promise<PaginatedResponse<SchoolDepartment>> {
    const params = new URLSearchParams();
    
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/school-departments?${queryString}` : '/school-departments';

    return this.request<PaginatedResponse<SchoolDepartment>>(endpoint);
  }

  /**
   * Obtener un departamento por ID
   */
  async getDepartmentById(id: string): Promise<ApiResponse<SchoolDepartment>> {
    return this.request<ApiResponse<SchoolDepartment>>(`/school-departments/${id}`);
  }

  /**
   * Crear un nuevo departamento
   */
  async createDepartment(data: SchoolDepartmentCreateData): Promise<ApiResponse<SchoolDepartment>> {
    return this.request<ApiResponse<SchoolDepartment>>('/school-departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualizar un departamento
   */
  async updateDepartment(id: string, data: SchoolDepartmentUpdateData): Promise<ApiResponse<SchoolDepartment>> {
    return this.request<ApiResponse<SchoolDepartment>>(`/school-departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Eliminar un departamento (soft delete)
   */
  async deleteDepartment(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/school-departments/${id}`, {
      method: 'DELETE',
    });
  }
}

export const schoolDepartmentService = new SchoolDepartmentService();
