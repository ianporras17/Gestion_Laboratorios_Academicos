export type CalendarBlock = {
  id: number;
  lab_id: number;
  date: string;        // YYYY-MM-DD
  time_start: string;  // HH:mm
  time_end: string;    // HH:mm
  status: "DISPONIBLE" | "BLOQUEADO"; // calendario
  reason?: "evento" | "mantenimiento" | "uso_exclusivo";
  note?: string;
};

export type Resource = {
  id: number;
  lab_id: number;
  type: "equipo" | "material" | "software";
  name: string;
  description?: string;
  image_url?: string;
  status: "DISPONIBLE" | "RESERVADO" | "EN_MANTENIMIENTO" | "INACTIVO";
  qty_available?: number;     // para consumibles/materiales
  qty_total?: number;         // opcional
};

export type AvailabilityHistory = {
  id: number;
  lab_id: number;
  user_name?: string;
  entity: string; // 'calendar_block' | 'resource'
  action: string; // CREATE/UPDATE/DELETE/STATE_CHANGE
  detail?: string;
  created_at: string;
};
