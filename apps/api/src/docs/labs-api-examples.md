# Módulo 1.1: Gestión de Perfiles de Laboratorio - Ejemplos de API

## Descripción General

Este módulo permite la gestión completa de perfiles de laboratorio, incluyendo:
- Registro y administración de perfiles de laboratorio
- Gestión de responsables y contactos
- Registro de recursos fijos y materiales consumibles
- Definición de políticas internas
- Horarios de funcionamiento
- Historial del laboratorio

## Endpoints Disponibles

### 1. Laboratorios

#### GET /api/labs
Obtener todos los laboratorios con filtros opcionales.

**Parámetros de consulta:**
- `school_dept_id` (UUID, opcional): Filtrar por departamento escolar
- `is_active` (boolean, opcional): Filtrar por estado activo/inactivo
- `search` (string, opcional): Búsqueda por nombre, código interno o ubicación

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Laboratorio de Química Orgánica",
      "internal_code": "LAB-QO-001",
      "location": "Edificio A, Piso 2, Sala 201",
      "description": "Laboratorio especializado en química orgánica",
      "email_contact": "lab.quimica@tec.ac.cr",
      "capacity_max": 25,
      "is_active": true,
      "school_department_name": "Escuela de Química",
      "responsible_count": 2,
      "resource_count": 15,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### GET /api/labs/:id
Obtener un laboratorio específico con información completa.

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Laboratorio de Química Orgánica",
    "internal_code": "LAB-QO-001",
    "location": "Edificio A, Piso 2, Sala 201",
    "description": "Laboratorio especializado en química orgánica",
    "email_contact": "lab.quimica@tec.ac.cr",
    "capacity_max": 25,
    "is_active": true,
    "school_department_name": "Escuela de Química",
    "responsibles": [
      {
        "id": "456e7890-e89b-12d3-a456-426614174001",
        "full_name": "Dr. María González",
        "position_title": "Encargada Principal",
        "phone": "+506 2550-2000",
        "email": "maria.gonzalez@tec.ac.cr",
        "is_primary": true
      }
    ],
    "policies": {
      "academic_req": "Curso de Química Orgánica I y II, Certificación de Seguridad en Laboratorio",
      "safety_req": "Uso obligatorio de bata, guantes y gafas de seguridad",
      "notes": "No se permite el consumo de alimentos en el laboratorio"
    },
    "open_hours": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174002",
        "weekday": 1,
        "time_start": "08:00",
        "time_end": "17:00"
      }
    ],
    "resources": [...],
    "recent_history": [...]
  }
}
```

#### POST /api/labs
Crear un nuevo laboratorio.

**Cuerpo de la petición:**
```json
{
  "name": "Laboratorio de Física Moderna",
  "internal_code": "LAB-FM-002",
  "school_dept_id": "123e4567-e89b-12d3-a456-426614174000",
  "email_contact": "lab.fisica@tec.ac.cr",
  "location": "Edificio B, Piso 3, Sala 301",
  "description": "Laboratorio para experimentos de física moderna",
  "capacity_max": 20,
  "responsibles": [
    {
      "full_name": "Dr. Carlos Rodríguez",
      "position_title": "Encargado Principal",
      "phone": "+506 2550-2001",
      "email": "carlos.rodriguez@tec.ac.cr",
      "is_primary": true
    }
  ],
  "policies": {
    "academic_req": "Curso de Física Moderna, Certificación de Seguridad",
    "safety_req": "Uso de equipos de protección personal",
    "notes": "Manejo cuidadoso de equipos láser"
  },
  "open_hours": [
    {
      "weekday": 1,
      "time_start": "08:00",
      "time_end": "17:00"
    },
    {
      "weekday": 2,
      "time_start": "08:00",
      "time_end": "17:00"
    }
  ]
}
```

#### PUT /api/labs/:id
Actualizar un laboratorio existente.

**Cuerpo de la petición:**
```json
{
  "name": "Laboratorio de Física Moderna - Actualizado",
  "description": "Laboratorio renovado para experimentos de física moderna",
  "capacity_max": 25
}
```

### 2. Gestión de Responsables

#### POST /api/labs/:id/responsibles
Gestionar responsables del laboratorio.

**Agregar responsable:**
```json
{
  "action": "add",
  "responsible": {
    "full_name": "Ing. Ana Martínez",
    "position_title": "Técnica de Laboratorio",
    "phone": "+506 2550-2002",
    "email": "ana.martinez@tec.ac.cr",
    "is_primary": false
  }
}
```

**Actualizar responsable:**
```json
{
  "action": "update",
  "responsible": {
    "id": "456e7890-e89b-12d3-a456-426614174001",
    "full_name": "Dr. María González",
    "position_title": "Coordinadora Principal",
    "phone": "+506 2550-2000",
    "email": "maria.gonzalez@tec.ac.cr",
    "is_primary": true
  }
}
```

**Eliminar responsable:**
```json
{
  "action": "delete",
  "responsible": {
    "id": "456e7890-e89b-12d3-a456-426614174001"
  }
}
```

### 3. Gestión de Políticas

#### PUT /api/labs/:id/policies
Actualizar políticas del laboratorio.

**Cuerpo de la petición:**
```json
{
  "academic_req": "Curso de Química Orgánica I y II, Certificación de Seguridad en Laboratorio, Curso de Manejo de Reactivos",
  "safety_req": "Uso obligatorio de bata, guantes, gafas de seguridad y zapatos cerrados. No se permite el consumo de alimentos o bebidas",
  "notes": "El laboratorio cuenta con sistema de ventilación forzada. En caso de emergencia, usar la ducha de seguridad ubicada en la entrada"
}
```

### 4. Gestión de Horarios

#### POST /api/labs/:id/open-hours
Gestionar horarios del laboratorio.

**Reemplazar todos los horarios:**
```json
{
  "action": "replace",
  "hours": [
    {
      "weekday": 1,
      "time_start": "08:00",
      "time_end": "17:00"
    },
    {
      "weekday": 2,
      "time_start": "08:00",
      "time_end": "17:00"
    },
    {
      "weekday": 3,
      "time_start": "08:00",
      "time_end": "17:00"
    },
    {
      "weekday": 4,
      "time_start": "08:00",
      "time_end": "17:00"
    },
    {
      "weekday": 5,
      "time_start": "08:00",
      "time_end": "17:00"
    }
  ]
}
```

**Agregar horario:**
```json
{
  "action": "add",
  "hours": {
    "weekday": 6,
    "time_start": "09:00",
    "time_end": "13:00"
  }
}
```

**Eliminar horario:**
```json
{
  "action": "delete",
  "hours": {
    "id": "789e0123-e89b-12d3-a456-426614174002"
  }
}
```

### 5. Historial del Laboratorio

#### GET /api/labs/:id/history
Obtener historial del laboratorio.

**Parámetros de consulta:**
- `page` (integer, opcional): Número de página (default: 1)
- `limit` (integer, opcional): Elementos por página (default: 20, max: 100)
- `action_type` (string, opcional): Filtrar por tipo de acción

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc12345-e89b-12d3-a456-426614174003",
      "lab_id": "123e4567-e89b-12d3-a456-426614174000",
      "actor_user_id": "def67890-e89b-12d3-a456-426614174004",
      "action_type": "lab_updated",
      "ref_table": "labs",
      "ref_id": "123e4567-e89b-12d3-a456-426614174000",
      "detail": "Información del laboratorio actualizada",
      "actor_name": "Dr. María González",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

## Códigos de Error

### 400 Bad Request
- Datos de entrada inválidos
- Validación fallida

### 401 Unauthorized
- Token de autenticación faltante o inválido

### 403 Forbidden
- Usuario sin permisos para la operación
- Rol insuficiente

### 404 Not Found
- Laboratorio no encontrado
- Recurso no encontrado

### 409 Conflict
- Violación de restricciones únicas
- Dependencias existentes

### 500 Internal Server Error
- Error interno del servidor

## Notas de Implementación

1. **Autenticación**: Todas las rutas requieren autenticación mediante JWT
2. **Autorización**: Los permisos se basan en roles de usuario
3. **Validación**: Se utiliza express-validator para validar datos de entrada
4. **Transacciones**: Las operaciones complejas utilizan transacciones de base de datos
5. **Historial**: Todas las operaciones se registran en el historial del laboratorio
6. **Soft Delete**: Los departamentos se eliminan de forma lógica (soft delete)
7. **Índices**: Se han creado índices para optimizar las consultas más frecuentes
