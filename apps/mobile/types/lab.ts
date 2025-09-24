export type Lab = {
  id: number;
  name: string;                 // nombre
  internal_code: string;        // código interno
  school?: string;              // escuela/departamento
  location: string;             // ubicación
  description?: string;         // descripción de áreas
  email_contact: string;        // correo institucional del lab/escuela
  capacity_max?: number;        // capacidad máxima
};

export type Contact = {
  id: number;
  laboratory_id: number;
  full_name: string;            // nombre
  position_title?: string;      // cargo
  phone?: string;               // teléfono
  email: string;                // correo institucional
  is_primary?: boolean;         // responsable principal
};

export type Equipment = {
  id: number;
  laboratory_id: number;
  inventory_code: string;       // código de inventario
  name: string;                 // nombre de equipo
  state: "operativo" | "mantenimiento" | "inactivo"; // estado operativo
  last_maintenance?: string;    // fecha de último mantenimiento (YYYY-MM-DD)
  notes?: string;
};

export type Consumable = {
  id: number;
  laboratory_id: number;
  name: string;
  unit: string;                 // unidad de medida
  qty_available: number;        // cantidad actual
  reorder_point: number;        // punto de reorden
};

export type Policy = {
  id: number;
  laboratory_id: number;
  kind: "academica" | "seguridad" | "otra";
  requirement: string;          // requisito (curso, inducción, etc.)
  detail?: string;
  active: boolean;
};

export type Schedule = {
  id: number;
  laboratory_id: number;
  weekday: number;              // 0..6 (Dom..Sáb)
  time_start: string;           // HH:mm
  time_end: string;             // HH:mm
  capacity_per_block?: number;  // opcional
  active?: boolean;
};

export type ScheduleException = {
  id: number;
  laboratory_id: number;
  date: string;                 // YYYY-MM-DD
  time_start: string;           // HH:mm
  time_end: string;             // HH:mm
  reason: "mantenimiento" | "evento" | "bloqueo";
  note?: string;
};

export type History = {
  id: number;
  laboratory_id: number;
  entity: string;               // 'lab' | 'contact' | 'equipment' | 'consumable' | 'policy' | 'schedule' | 'schedule_exception'
  entity_id?: number;
  action: "CREAR" | "ACTUALIZAR" | "ELIMINAR";
  actor_user_id?: number;
  created_at: string;
  before?: any;
  after?: any;
};
