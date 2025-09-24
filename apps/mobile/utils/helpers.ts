// Utilidades para el módulo de laboratorios

export const isTecEmail = (email?: string): boolean => {
  if (!email) return false;
  return /@((estudiante\.)?tec\.ac\.cr|itcr\.ac\.cr)$/i.test(email);
};

export const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-CR');
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('es-CR');
};

// ----------------------------- Utilidades para calendario -----------------------------
export const formatDateISO = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const startOfWeek = (date: Date): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day + 6) % 7; // Lunes = 0
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const startOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

export const getStatusPillColor = (status: string): 'green' | 'red' | 'yellow' | 'blue' | 'gray' => {
  switch (status) {
    case 'DISPONIBLE': return 'green';
    case 'RESERVADO': return 'yellow';
    case 'EN_MANTENIMIENTO': return 'blue';
    case 'INACTIVO': return 'red';
    default: return 'gray';
  }
};
