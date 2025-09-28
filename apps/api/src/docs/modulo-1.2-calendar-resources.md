# Módulo 1.2: Publicación de Disponibilidad y Recursos

## Descripción General

El Módulo 1.2 implementa la gestión completa de calendarios, publicación de recursos y estados de disponibilidad, permitiendo a los usuarios visualizar, gestionar y solicitar recursos de laboratorio de manera eficiente.

## Características Implementadas

### 1. Gestión de Calendario

#### Definición de Bloques Disponibles/Bloqueados
- **Slots del calendario**: Bloques de tiempo para laboratorios y recursos específicos
- **Estados de slot**: DISPONIBLE, BLOQUEADO, RESERVADO, MANTENIMIENTO, EXCLUSIVO
- **Razones de bloqueo**: Eventos, mantenimiento, uso exclusivo, etc.
- **Validación de conflictos**: Prevención de solapamientos de horarios

#### Vistas Semanal y Mensual
- **Vista semanal**: Organización por días de la semana con slots detallados
- **Vista mensual**: Vista de calendario con indicadores de disponibilidad
- **Navegación temporal**: Navegación entre semanas y meses
- **Actualización en tiempo real**: Sincronización automática de cambios

### 2. Publicación de Recursos

#### Estructura de Catálogo por Tipo
- **Equipos**: Recursos físicos con códigos de inventario
- **Consumibles**: Materiales con control de stock
- **Software**: Recursos digitales con licencias

#### Ficha Técnica Completa
- **Especificaciones técnicas**: Detalles técnicos en formato JSON
- **Fotos del recurso**: Múltiples imágenes con foto principal
- **Información de mantenimiento**: Fechas y notas de mantenimiento
- **Información de garantía**: Detalles de cobertura

#### Estados de Disponibilidad
- **DISPONIBLE**: Recurso listo para uso
- **RESERVADO**: Recurso asignado temporalmente
- **EN_MANTENIMIENTO**: Recurso en reparación
- **INACTIVO**: Recurso no disponible

### 3. Estados de Disponibilidad

#### Reglas y Transiciones
- **Transiciones válidas**: Control de cambios de estado permitidos
- **Razones de cambio**: Justificación para cada transición
- **Fechas de expiración**: Para estados temporales
- **Historial de estados**: Trazabilidad completa de cambios

#### Enlace Directo a Solicitud
- **Botón de solicitud**: Acceso directo desde la ficha del recurso
- **Validación previa**: Verificación de disponibilidad antes de solicitar
- **Integración con Módulo 3**: Conexión con sistema de solicitudes

### 4. Bitácora de Cambios

#### Registro de Modificaciones
- **Usuario**: Quién realizó el cambio
- **Fecha y hora**: Cuándo se realizó
- **Campo modificado**: Qué se cambió
- **Valores**: Valor anterior y nuevo
- **Contexto**: Laboratorio o recurso afectado

### 5. Notificaciones

#### Avisos a Suscritos
- **Suscripciones**: Usuarios interesados en laboratorios/recursos específicos
- **Tipos de notificación**: Recurso disponible, slot liberado, mantenimiento programado
- **Canal de notificación**: Email e interno
- **Configuración personalizable**: Preferencias de notificación

## Estructura de Base de Datos

### Tablas Principales

1. **calendar_slots** - Slots del calendario
2. **availability_subscriptions** - Suscripciones de notificación
3. **publish_changelog** - Bitácora de cambios
4. **resource_specs** - Fichas técnicas de recursos
5. **resource_photos** - Fotos de recursos
6. **consumable_stock** - Control de stock de consumibles
7. **inventory_moves** - Movimientos de inventario
8. **availability_states** - Estados de disponibilidad
9. **availability_notifications** - Notificaciones de disponibilidad

### Relaciones

- `calendar_slots.lab_id` → `labs.id`
- `calendar_slots.resource_id` → `resources.id`
- `availability_subscriptions.user_id` → `users.id`
- `resource_specs.resource_id` → `resources.id`
- `resource_photos.resource_id` → `resources.id`
- `consumable_stock.resource_id` → `resources.id`
- `availability_states.resource_id` → `resources.id`

## API Endpoints

### Calendario

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/calendar-availability/slots` | Obtener slots del calendario | Público |
| POST | `/api/calendar-availability/slots` | Crear slot del calendario | Admin, EncargadoTecnico, LabOwner |
| GET | `/api/calendar-availability/weekly` | Vista semanal | Público |
| GET | `/api/calendar-availability/monthly` | Vista mensual | Público |
| POST | `/api/calendar-availability/subscribe` | Suscribirse a notificaciones | Authenticated |
| DELETE | `/api/calendar-availability/subscribe/:id` | Cancelar suscripción | Authenticated |

### Catálogo de Recursos

| Método | Endpoint | Descripción | Permisos |
|--------|----------|-------------|----------|
| GET | `/api/resource-catalog` | Obtener catálogo de recursos | Público |
| GET | `/api/resource-catalog/:id` | Obtener detalles de recurso | Público |
| PUT | `/api/resource-catalog/:id/state` | Actualizar estado de recurso | Admin, EncargadoTecnico, LabOwner |
| POST | `/api/resource-catalog/:id/photos` | Gestionar fotos de recurso | Admin, EncargadoTecnico, LabOwner |

## Aplicación Móvil

### Pantallas Implementadas

1. **Calendario** (`/calendar`)
   - Vista semanal y mensual
   - Filtros por laboratorio y recurso
   - Navegación temporal
   - Creación de slots

2. **Catálogo de Recursos** (`/resource-catalog`)
   - Lista de recursos con filtros
   - Búsqueda en tiempo real
   - Fichas técnicas detalladas
   - Solicitud directa de recursos

### Componentes Móviles

- **CalendarWeekView**: Vista semanal del calendario
- **CalendarMonthView**: Vista mensual del calendario
- **CalendarFilters**: Filtros para el calendario
- **ResourceCard**: Tarjeta de recurso en el catálogo
- **ResourceFilters**: Filtros para el catálogo

### Servicios Móviles

- **CalendarService**: Gestión del calendario
- **ResourceService**: Gestión del catálogo de recursos

## Características Técnicas

### Seguridad
- Autenticación JWT requerida
- Autorización basada en roles
- Validación de conflictos de horario
- Sanitización de datos

### Rendimiento
- Índices optimizados para consultas temporales
- Paginación en listados largos
- Cache de datos frecuentes
- Consultas eficientes con JOINs

### Escalabilidad
- Estructura modular
- APIs RESTful estándar
- Separación de responsabilidades
- Soporte para múltiples laboratorios

## Flujos de Usuario

### 1. Visualización del Calendario
1. Usuario accede a la vista del calendario
2. Selecciona vista semanal o mensual
3. Aplica filtros por laboratorio/recurso
4. Navega entre períodos de tiempo
5. Ve slots disponibles y ocupados

### 2. Gestión de Recursos
1. Usuario accede al catálogo de recursos
2. Busca recursos por nombre, tipo o laboratorio
3. Aplica filtros de estado y disponibilidad
4. Ve detalles técnicos del recurso
5. Solicita el recurso si está disponible

### 3. Administración de Disponibilidad
1. Administrador crea slots del calendario
2. Define bloques de tiempo disponibles
3. Establece razones de bloqueo
4. Gestiona estados de recursos
5. Recibe notificaciones de cambios

## Integración con Otros Módulos

### Módulo 1.1 (Laboratorios)
- Slots del calendario vinculados a laboratorios
- Recursos asociados a laboratorios específicos
- Políticas de laboratorio aplicadas a recursos

### Módulo 3 (Usuarios y Reservas)
- Solicitudes de recursos desde el catálogo
- Notificaciones a usuarios suscritos
- Historial de uso vinculado a usuarios

## Próximas Funcionalidades

### Funcionalidades Avanzadas
- **Reservas automáticas**: Sistema de reserva en tiempo real
- **Conflictos inteligentes**: Resolución automática de conflictos
- **Analytics**: Estadísticas de uso y disponibilidad
- **Integración externa**: Sincronización con calendarios externos

### Mejoras de UX
- **Drag & Drop**: Arrastrar y soltar para crear slots
- **Vista de agenda**: Lista cronológica de eventos
- **Notificaciones push**: Alertas en tiempo real
- **Modo offline**: Funcionalidad sin conexión

## Consideraciones de Implementación

### Base de Datos
- Índices temporales para consultas eficientes
- Triggers para actualización automática
- Constraints para integridad de datos
- Particionado por fechas para grandes volúmenes

### API
- Validación de conflictos de horario
- Rate limiting para prevenir abuso
- Cache de consultas frecuentes
- Paginación optimizada

### Móvil
- Sincronización offline
- Notificaciones push
- Gestos de navegación
- Optimización de imágenes

## Conclusión

El Módulo 1.2 proporciona una solución completa para la gestión de disponibilidad y recursos de laboratorio, con características avanzadas de calendario, catálogo de recursos y notificaciones que mejoran significativamente la experiencia del usuario y la eficiencia operativa.
