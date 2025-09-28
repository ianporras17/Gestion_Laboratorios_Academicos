# Módulo 1.1: Gestión de Perfiles de Laboratorio

## Descripción General

El Módulo 1.1 implementa la gestión completa de perfiles de laboratorio, permitiendo el registro, administración y seguimiento de todos los aspectos relacionados con los laboratorios académicos.

## Características Implementadas

### 1. Registro y Administración de Perfiles

- **Campos obligatorios**: nombre, código interno, escuela/departamento, ubicación, descripción de áreas
- **Vinculación con correo institucional** del laboratorio/escuela
- **Gestión de estado** (activo/inactivo)
- **Capacidad máxima** del laboratorio

### 2. Gestión de Responsables y Contactos

- **Registro de responsables**: nombre, cargo, teléfono, correo institucional
- **Responsable principal**: identificación del encargado principal
- **Múltiples responsables**: soporte para varios responsables por laboratorio
- **Actualización automática** en reservas/solicitudes asociadas

### 3. Registro de Recursos Fijos

- **Estructura para equipos**: código de inventario, estado operativo, fecha de último mantenimiento
- **Integración con el sistema de recursos** existente
- **Categorización por tipo**: equipos, consumibles, software

### 4. Registro de Materiales Consumibles

- **Inventario inicial**: cantidad, unidad de medida, punto de reorden
- **Control de stock** y alertas de reabastecimiento
- **Seguimiento de movimientos** de inventario

### 5. Definición de Políticas Internas

- **Requisitos académicos**: cursos previos, inducción necesaria
- **Requisitos de seguridad**: equipos de protección, procedimientos
- **Notas adicionales**: información complementaria

### 6. Horarios de Funcionamiento

- **Configuración flexible**: días de la semana y horarios
- **Múltiples bloques**: soporte para horarios discontinuos
- **Validación de conflictos** con reservas existentes

### 7. Historial del Laboratorio

- **Registro cronológico** de todas las actividades
- **Trazabilidad completa**: usuario, fecha, acción, detalle
- **Filtros y paginación** para consultas eficientes
- **Integración con auditoría** del sistema

## Estructura de Base de Datos

### Tablas Principales

1. **labs** - Información básica del laboratorio
2. **lab_responsibles** - Responsables y contactos
3. **lab_policies** - Políticas internas
4. **lab_open_hours** - Horarios de funcionamiento
5. **lab_history** - Historial de actividades
6. **school_departments** - Departamentos escolares

### Relaciones

- `labs.school_dept_id` → `school_departments.id`
- `lab_responsibles.lab_id` → `labs.id`
- `lab_policies.lab_id` → `labs.id`
- `lab_open_hours.lab_id` → `labs.id`
- `lab_history.lab_id` → `labs.id`

## API Endpoints

### Laboratorios

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/labs` | Listar laboratorios | Público |
| GET | `/api/labs/:id` | Obtener laboratorio específico | Público |
| POST | `/api/labs` | Crear laboratorio | Admin, EncargadoTecnico |
| PUT | `/api/labs/:id` | Actualizar laboratorio | Admin, EncargadoTecnico, LabOwner |

### Gestión de Responsables

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/labs/:id/responsibles` | Gestionar responsables | Admin, EncargadoTecnico, LabOwner |

### Políticas

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| PUT | `/api/labs/:id/policies` | Actualizar políticas | Admin, EncargadoTecnico, LabOwner |

### Horarios

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| POST | `/api/labs/:id/open-hours` | Gestionar horarios | Admin, EncargadoTecnico, LabOwner |

### Historial

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/labs/:id/history` | Obtener historial | Público |

### Departamentos Escolares

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/school-departments` | Listar departamentos | Público |
| GET | `/api/school-departments/:id` | Obtener departamento | Público |
| POST | `/api/school-departments` | Crear departamento | Admin |
| PUT | `/api/school-departments/:id` | Actualizar departamento | Admin |
| DELETE | `/api/school-departments/:id` | Eliminar departamento | Admin |

## Roles y Permisos

### Admin
- Acceso completo a todas las funcionalidades
- Creación y eliminación de departamentos
- Gestión de todos los laboratorios

### EncargadoTecnico
- Creación y gestión de laboratorios
- Gestión de responsables, políticas y horarios
- Acceso a historial completo

### LabOwner
- Gestión de su laboratorio asignado
- Actualización de información básica
- Gestión de responsables, políticas y horarios

### Docente/Estudiante
- Consulta de información de laboratorios
- Acceso a políticas y horarios
- Consulta de historial público

## Validaciones

### Laboratorio
- Nombre: requerido, máximo 160 caracteres
- Código interno: requerido, único, máximo 60 caracteres
- Email de contacto: formato válido, máximo 160 caracteres
- Ubicación: requerida, máximo 200 caracteres
- Capacidad máxima: número entero positivo

### Responsable
- Nombre completo: requerido, máximo 160 caracteres
- Cargo: requerido, máximo 120 caracteres
- Email: formato válido, máximo 160 caracteres
- Teléfono: máximo 40 caracteres

### Políticas
- Requisitos académicos: máximo 2000 caracteres
- Requisitos de seguridad: máximo 2000 caracteres
- Notas: máximo 2000 caracteres

### Horarios
- Día de la semana: 0-6 (0=Domingo)
- Hora de inicio/fin: formato HH:MM
- Validación de horarios lógicos

## Características Técnicas

### Seguridad
- Autenticación JWT requerida
- Autorización basada en roles
- Validación de entrada con express-validator
- Sanitización de datos

### Rendimiento
- Índices optimizados para consultas frecuentes
- Paginación en listados largos
- Consultas eficientes con JOINs

### Confiabilidad
- Transacciones para operaciones complejas
- Validación de integridad referencial
- Manejo de errores consistente

### Escalabilidad
- Estructura modular
- Separación de responsabilidades
- APIs RESTful estándar

## Próximos Pasos

1. **Integración con Módulo 2**: Recursos y equipos
2. **Integración con Módulo 3**: Usuarios y reservas
3. **Dashboard de administración**: Interfaz web
4. **Reportes avanzados**: Estadísticas y análisis
5. **Notificaciones automáticas**: Alertas y recordatorios

## Archivos del Módulo

### Controladores
- `controllers/labs.controller.js` - Lógica de negocio para laboratorios
- `controllers/school-departments.controller.js` - Gestión de departamentos

### Rutas
- `routes/labs.js` - Endpoints de laboratorios
- `routes/school-departments.js` - Endpoints de departamentos

### Middleware
- `middlewares/lab-permissions.js` - Validación de permisos
- `middlewares/roles.js` - Gestión de roles (actualizado)

### Base de Datos
- `migrations/019_lab_profiles.sql` - Estructura de laboratorios
- `migrations/020_school_departments.sql` - Estructura de departamentos

### Documentación
- `docs/labs-api-examples.md` - Ejemplos de uso de APIs
- `docs/modulo-1.1-labs.md` - Documentación del módulo

### Pruebas
- `tests/labs.test.js` - Pruebas unitarias
