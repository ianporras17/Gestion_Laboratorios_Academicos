/**
 * Tipos para el módulo de Gestión de Perfiles de Laboratorio
 * Basados en las tablas SQL del sistema
 */

export type SchoolDepartment = {
  id: number;
  name: string;
  email_domain: string;
};

export type Lab = {
  id: number;
  name: string;                 // nombre
  internal_code: string;        // código interno
  school_dept_id: number;       // ID de escuela/departamento
  school_name?: string;         // nombre de la escuela (join)
  email_contact: string;        // correo institucional del lab/escuela
  location: string;             // ubicación
  description?: string;         // descripción de áreas
  capacity_max?: number;        // capacidad máxima
  created_at: string;
  updated_at: string;
};

export type LabResponsible = {
  id: number;
  lab_id: number;
  full_name: string;            // nombre
  position_title: string;       // cargo (encargado/técnico)
  phone?: string;               // teléfono
  email: string;                // correo institucional
  is_primary: boolean;          // responsable principal
};

export type Resource = {
  id: number;
  lab_id: number;
  type: 'EQUIPMENT' | 'CONSUMABLE' | 'SOFTWARE';
  name: string;
  inventory_code?: string;      // código de inventario (obligatorio para equipos)
  state: 'DISPONIBLE' | 'RESERVADO' | 'EN_MANTENIMIENTO' | 'INACTIVO';
  location?: string;
  last_maintenance?: string;    // fecha de último mantenimiento (YYYY-MM-DD)
  tech_sheet?: string;          // ficha técnica
  description?: string;
  unit?: string;                // unidad de medida (para consumibles)
  qty_available?: number;       // cantidad actual (para consumibles)
  reorder_point?: number;       // punto de reorden (para consumibles)
  created_at: string;
  updated_at: string;
};

export type LabPolicy = {
  id: number;
  lab_id: number;
  academic_req?: string;        // requisitos académicos
  safety_req?: string;          // requisitos de seguridad
  notes?: string;               // notas adicionales
};

export type LabSchedule = {
  id: number;
  lab_id: number;
  weekday: number;              // 0..6 (Dom..Sáb)
  time_start: string;           // HH:mm
  time_end: string;             // HH:mm
};

export type LabHistory = {
  id: number;
  lab_id: number;
  actor_user_id?: number;
  actor_name?: string;          // nombre del usuario (join)
  action_type: string;          // tipo de acción
  ref_table?: string;           // tabla relacionada
  ref_id?: number;              // ID del registro relacionado
  detail?: string;              // detalle de la acción
  created_at: string;
};
