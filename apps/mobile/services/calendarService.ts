import { API_BASE_URL } from '@/constants/env';

export interface CalendarSlot {
  id: string;
  lab_id: string;
  resource_id?: string;
  starts_at: string;
  ends_at: string;
  status: 'DISPONIBLE' | 'BLOQUEADO' | 'RESERVADO' | 'MANTENIMIENTO' | 'EXCLUSIVO';
  reason?: string;
  lab_name: string;
  resource_name?: string;
  resource_type?: string;
  created_by_name?: string;
}

export interface CalendarFilters {
  lab_id?: string;
  resource_id?: string;
  start_date?: string;
  end_date?: string;
  status?: string;
  week_start?: string;
  year?: number;
  month?: number;
}

export interface WeeklyViewData {
  monday: CalendarSlot[];
  tuesday: CalendarSlot[];
  wednesday: CalendarSlot[];
  thursday: CalendarSlot[];
  friday: CalendarSlot[];
  saturday: CalendarSlot[];
  sunday: CalendarSlot[];
  week_start: string;
  week_end: string;
}

export interface MonthlyViewData {
  [key: number]: CalendarSlot[];
  year: number;
  month: number;
  month_start: string;
  month_end: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any[];
}

class CalendarService {
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
   * Obtener slots del calendario
   */
  async getCalendarSlots(filters: CalendarFilters = {}): Promise<ApiResponse<CalendarSlot[]>> {
    const params = new URLSearchParams();
    
    if (filters.lab_id) params.append('lab_id', filters.lab_id);
    if (filters.resource_id) params.append('resource_id', filters.resource_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.status) params.append('status', filters.status);

    const queryString = params.toString();
    const endpoint = queryString ? `/calendar-availability/slots?${queryString}` : '/calendar-availability/slots';

    return this.request<ApiResponse<CalendarSlot[]>>(endpoint);
  }

  /**
   * Obtener vista semanal del calendario
   */
  async getWeeklyView(filters: CalendarFilters): Promise<ApiResponse<WeeklyViewData>> {
    const params = new URLSearchParams();
    
    if (filters.lab_id) params.append('lab_id', filters.lab_id);
    if (filters.resource_id) params.append('resource_id', filters.resource_id);
    if (filters.week_start) params.append('week_start', filters.week_start);

    const queryString = params.toString();
    const endpoint = queryString ? `/calendar-availability/weekly?${queryString}` : '/calendar-availability/weekly';

    return this.request<ApiResponse<WeeklyViewData>>(endpoint);
  }

  /**
   * Obtener vista mensual del calendario
   */
  async getMonthlyView(filters: CalendarFilters): Promise<ApiResponse<MonthlyViewData>> {
    const params = new URLSearchParams();
    
    if (filters.lab_id) params.append('lab_id', filters.lab_id);
    if (filters.resource_id) params.append('resource_id', filters.resource_id);
    if (filters.year) params.append('year', filters.year.toString());
    if (filters.month) params.append('month', filters.month.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/calendar-availability/monthly?${queryString}` : '/calendar-availability/monthly';

    return this.request<ApiResponse<MonthlyViewData>>(endpoint);
  }

  /**
   * Crear un nuevo slot del calendario
   */
  async createCalendarSlot(data: {
    lab_id: string;
    resource_id?: string;
    starts_at: string;
    ends_at: string;
    status?: string;
    reason?: string;
  }): Promise<ApiResponse<CalendarSlot>> {
    return this.request<ApiResponse<CalendarSlot>>('/calendar-availability/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Actualizar un slot del calendario
   */
  async updateCalendarSlot(id: string, data: {
    starts_at?: string;
    ends_at?: string;
    status?: string;
    reason?: string;
  }): Promise<ApiResponse<CalendarSlot>> {
    return this.request<ApiResponse<CalendarSlot>>(`/calendar-availability/slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Eliminar un slot del calendario
   */
  async deleteCalendarSlot(id: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/calendar-availability/slots/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Suscribirse a notificaciones de disponibilidad
   */
  async subscribeToAvailability(data: {
    lab_id?: string;
    resource_id?: string;
  }): Promise<ApiResponse<any>> {
    return this.request<ApiResponse<any>>('/calendar-availability/subscribe', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Cancelar suscripción a notificaciones
   */
  async unsubscribeFromAvailability(subscriptionId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/calendar-availability/subscribe/${subscriptionId}`, {
      method: 'DELETE',
    });
  }
}

export const calendarService = new CalendarService();
