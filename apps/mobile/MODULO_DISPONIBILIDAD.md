# Módulo 1.2: Publicación de Disponibilidad y Recursos

## 📋 Descripción
Módulo completo para la gestión de disponibilidad y recursos académicos, implementado siguiendo la arquitectura correcta con separación entre frontend (mobile) y backend (API).

## 🏗️ Arquitectura

### **Backend (API)**
- **Ubicación**: `apps/api/src/routes/availability.js`
- **Base de datos**: PostgreSQL con tablas SQL definidas
- **Endpoints**: REST API completa para calendario, recursos y notificaciones

### **Frontend (Mobile)**
- **Ubicación**: `apps/mobile/app/(tabs)/disponibilidad.tsx`
- **Tecnología**: React Native + TypeScript
- **Servicios**: `apps/mobile/services/availability.ts`
- **Tipos**: `apps/mobile/types/availability.ts`

## 🎯 Funcionalidades Implementadas

### ✅ **Gestión de Calendario**
- **Vistas**: Semanal y mensual con actualización al momento
- **Estados**: Disponible, Bloqueado, Reservado, Mantenimiento, Exclusivo
- **Bloqueos**: Eventos, mantenimiento, uso exclusivo
- **Navegación**: Cambio de fechas con botones anterior/siguiente

### ✅ **Publicación de Recursos**
- **Catálogo por tipo**: Equipos, Materiales, Software
- **Ficha técnica**: Fotos, estado, cantidades disponibles
- **Estados**: Disponible, Reservado, En mantenimiento, Inactivo
- **Stock**: Gestión de inventario para consumibles

### ✅ **Estados de Disponibilidad**
- **Transiciones**: Reglas entre estados
- **Validaciones**: Cambios de estado controlados
- **Historial**: Registro de todas las transiciones

### ✅ **Suscripciones y Notificaciones**
- **Suscripciones**: Por laboratorio o recurso específico
- **Notificaciones**: Avisos cuando se libere un recurso/espacio
- **Canales**: Email e interno
- **Tiempo real**: Actualizaciones inmediatas

### ✅ **Bitácora de Cambios**
- **Registro completo**: Usuario, fecha, detalle
- **Campos**: Antes y después de cada cambio
- **Filtros**: Por laboratorio, recurso, fecha
- **Auditoría**: Trazabilidad completa

### ✅ **Enlace Directo a Solicitud**
- **Botón "Solicitar"**: En cada ficha publicada
- **Integración**: Con sistema de solicitudes
- **Contexto**: Información del recurso pre-cargada

## 📊 Estructura de Datos

### **Tablas Principales**
- `calendar_slot` - Slots del calendario
- `resource` - Recursos (equipos, consumibles, software)
- `resource_photo` - Fotos de recursos
- `consumable_stock` - Stock de consumibles
- `availability_subscription` - Suscripciones de usuarios
- `publish_changelog` - Bitácora de cambios
- `notification` - Notificaciones del sistema

### **Relaciones**
- Laboratorio → Slots del calendario (1:N)
- Recurso → Slots del calendario (1:N)
- Recurso → Fotos (1:N)
- Recurso → Stock (1:1 para consumibles)
- Usuario → Suscripciones (1:N)
- Usuario → Notificaciones (1:N)

## 🚀 Cómo Ejecutar

### **1. API (Backend)**
```bash
cd apps/api
npm install
npm run dev
```

### **2. Mobile (Frontend)**
```bash
cd apps/mobile
npm install
npx expo start
```

### **3. Base de Datos**
```bash
# Ejecutar el script SQL para crear las tablas
psql -d tu_base_de_datos -f tablas.sql
```

## 🔧 Endpoints de la API

### **Calendario**
- `GET /availability/calendar` - Listar slots del calendario
- `POST /availability/calendar` - Crear slot del calendario
- `PUT /availability/calendar/:id` - Actualizar slot
- `DELETE /availability/calendar/:id` - Eliminar slot

### **Recursos**
- `GET /availability/resources` - Listar recursos disponibles
- `GET /availability/resources/:id` - Obtener recurso específico
- `PUT /availability/resources/:id/state` - Cambiar estado del recurso

### **Suscripciones**
- `GET /availability/subscriptions` - Listar suscripciones del usuario
- `POST /availability/subscriptions` - Crear suscripción
- `DELETE /availability/subscriptions/:id` - Eliminar suscripción

### **Bitácora**
- `GET /availability/changelog` - Obtener bitácora de cambios

### **Notificaciones**
- `GET /availability/notifications` - Obtener notificaciones del usuario
- `PUT /availability/notifications/:id/read` - Marcar como leída

### **Estadísticas**
- `GET /availability/stats` - Obtener estadísticas de disponibilidad

## 🎨 Interfaz de Usuario

### **Pantalla Principal**
- **Tabs**: Calendario, Recursos, Estadísticas, Notificaciones
- **Navegación**: Fácil cambio entre vistas
- **Actualización**: Botón de refresh manual

### **Vista de Calendario**
- **Semanal**: Vista detallada por días de la semana
- **Mensual**: Vista general del mes con indicadores
- **Slots**: Colores según estado de disponibilidad
- **Interacción**: Tap para ver detalles del slot

### **Vista de Recursos**
- **Catálogo**: Lista de recursos con filtros
- **Fichas**: Información completa de cada recurso
- **Acciones**: Suscribirse y solicitar
- **Estados**: Indicadores visuales de disponibilidad

### **Vista de Estadísticas**
- **Métricas**: Total, disponibles, reservados, bloqueados
- **Gráficos**: Barras de distribución
- **Tendencias**: Análisis de uso

### **Vista de Notificaciones**
- **Lista**: Notificaciones del usuario
- **Estados**: Leídas y no leídas
- **Acciones**: Marcar como leída

## 🔒 Validaciones

### **Slot del Calendario**
- Laboratorio requerido
- Fechas válidas (fin > inicio)
- Estado válido
- Sin solapamientos

### **Cambio de Estado de Recurso**
- Estado válido
- Usuario requerido
- Transiciones permitidas

### **Suscripción**
- Usuario requerido
- Laboratorio o recurso especificado
- Sin duplicados

## 📱 Navegación

La ventana está integrada en la pestaña "Disponibilidad" del sistema de navegación principal.

## 🔄 Migración a Web

Para migrar a web, simplemente:
1. Crear la UI web (React/Vue/Angular)
2. Consumir los mismos endpoints de la API
3. Reutilizar la lógica de negocio del backend

## 📝 Notas Técnicas

- **Calendario**: Vistas semanal y mensual implementadas
- **Estados**: Sistema completo de transiciones
- **Notificaciones**: Sistema de suscripciones funcional
- **Bitácora**: Auditoría completa de cambios
- **Responsive**: Adaptado para dispositivos móviles
- **Tiempo real**: Actualizaciones inmediatas

## 🎯 Características Destacadas

### **Vista Semanal**
- 7 días visibles simultáneamente
- Slots con colores según estado
- Información de recurso y laboratorio
- Interacción táctil para detalles

### **Vista Mensual**
- Calendario completo del mes
- Indicadores de disponibilidad
- Navegación por meses
- Vista general de ocupación

### **Gestión de Recursos**
- Catálogo completo con filtros
- Fichas técnicas detalladas
- Gestión de stock para consumibles
- Estados visuales claros

### **Sistema de Notificaciones**
- Suscripciones personalizadas
- Notificaciones en tiempo real
- Múltiples canales (email, interno)
- Gestión de estado de lectura

## 🚧 Próximas Mejoras

- [ ] Implementar notificaciones push
- [ ] Agregar filtros avanzados
- [ ] Implementar búsqueda de recursos
- [ ] Agregar reportes de uso
- [ ] Implementar sincronización offline
- [ ] Agregar exportación de datos
- [ ] Implementar recordatorios automáticos
