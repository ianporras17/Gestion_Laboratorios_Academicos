# Módulo 1.1: Gestión de Perfiles de Laboratorio - Aplicación Móvil

## Descripción General

Este documento describe la implementación del Módulo 1.1: Gestión de Perfiles de Laboratorio en la aplicación móvil desarrollada con React Native y Expo.

## Características Implementadas

### 1. Pantalla Principal de Laboratorios (`/labs`)
- **Lista de laboratorios** con información básica
- **Búsqueda en tiempo real** por nombre, código interno o ubicación
- **Filtros avanzados** por departamento escolar y estado
- **Pull-to-refresh** para actualizar la lista
- **Navegación** a detalles del laboratorio

### 2. Pantalla de Detalle del Laboratorio (`/labs/[id]`)
- **Información completa** del laboratorio
- **Navegación por pestañas** para diferentes secciones
- **Gestión de responsables** con información de contacto
- **Políticas internas** (requisitos académicos y de seguridad)
- **Horarios de funcionamiento** organizados por día
- **Recursos del laboratorio** agrupados por tipo
- **Historial de actividades** con trazabilidad completa

### 3. Componentes Reutilizables

#### LabCard
- Tarjeta individual para cada laboratorio
- Información básica: nombre, código, ubicación, estado
- Estadísticas: responsables, recursos, capacidad
- Indicador visual de estado (activo/inactivo)

#### LabFilters
- Filtros por departamento escolar
- Filtro por estado (activo/inactivo)
- Búsqueda por texto
- Interfaz intuitiva con botones de limpieza

#### LabDetailHeader
- Header con información principal del laboratorio
- Estadísticas visuales
- Botón de edición
- Estado del laboratorio

#### Secciones de Detalle
- **LabInfoSection**: Información básica y resumen
- **LabResponsiblesSection**: Lista de responsables
- **LabPoliciesSection**: Políticas y requisitos
- **LabHoursSection**: Horarios de funcionamiento
- **LabResourcesSection**: Recursos disponibles
- **LabHistorySection**: Historial de actividades

## Estructura de Archivos

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── labs.tsx                    # Pantalla principal de laboratorios
│   │   └── _layout.tsx                 # Layout de pestañas (actualizado)
│   └── labs/
│       └── [id].tsx                    # Pantalla de detalle del laboratorio
├── components/
│   └── labs/
│       ├── LabCard.tsx                 # Tarjeta de laboratorio
│       ├── LabFilters.tsx              # Filtros de búsqueda
│       ├── LabDetailHeader.tsx         # Header del detalle
│       ├── LabInfoSection.tsx          # Sección de información
│       ├── LabResponsiblesSection.tsx  # Sección de responsables
│       ├── LabPoliciesSection.tsx      # Sección de políticas
│       ├── LabHoursSection.tsx         # Sección de horarios
│       ├── LabResourcesSection.tsx     # Sección de recursos
│       └── LabHistorySection.tsx       # Sección de historial
├── services/
│   ├── labService.ts                   # Servicio de laboratorios
│   └── schoolDepartmentService.ts      # Servicio de departamentos
└── constants/
    └── env.ts                          # Configuración de API (actualizado)
```

## Servicios de API

### LabService
- `getLabs(filters)` - Obtener lista de laboratorios
- `getLabById(id)` - Obtener laboratorio específico
- `createLab(data)` - Crear nuevo laboratorio
- `updateLab(id, data)` - Actualizar laboratorio
- `manageResponsibles(labId, action, responsible)` - Gestionar responsables
- `updatePolicies(labId, policies)` - Actualizar políticas
- `manageOpenHours(labId, action, hours)` - Gestionar horarios
- `getLabHistory(labId, page, limit, action_type)` - Obtener historial

### SchoolDepartmentService
- `getDepartments(filters)` - Obtener departamentos escolares
- `getDepartmentById(id)` - Obtener departamento específico
- `createDepartment(data)` - Crear departamento
- `updateDepartment(id, data)` - Actualizar departamento
- `deleteDepartment(id)` - Eliminar departamento

## Navegación

### Pestañas Principales
1. **Inicio** - Pantalla principal
2. **Laboratorios** - Módulo de gestión de laboratorios
3. **Explorar** - Búsqueda y exploración
4. **Perfil** - Perfil del usuario

### Flujo de Navegación
```
/labs (Lista) → /labs/[id] (Detalle) → /labs/[id]/edit (Edición)
                ↓
            Gestión de:
            - Responsables
            - Políticas
            - Horarios
            - Recursos
            - Historial
```

## Características de UX/UI

### Diseño Responsivo
- Adaptable a diferentes tamaños de pantalla
- Componentes optimizados para touch
- Navegación intuitiva con gestos

### Temas y Colores
- Soporte para modo claro y oscuro
- Colores consistentes con el sistema de diseño
- Iconografía clara y reconocible

### Interacciones
- Pull-to-refresh en listas
- Búsqueda en tiempo real
- Filtros desplegables
- Navegación por pestañas
- Botones de acción contextuales

### Estados de Carga
- Indicadores de carga durante peticiones
- Estados vacíos informativos
- Manejo de errores con mensajes claros

## Integración con Backend

### Autenticación
- Token JWT para autenticación
- Headers de autorización automáticos
- Manejo de tokens expirados

### Sincronización
- Actualización automática de datos
- Cache local para mejor rendimiento
- Sincronización en segundo plano

### Manejo de Errores
- Mensajes de error descriptivos
- Reintentos automáticos para errores de red
- Fallbacks para datos no disponibles

## Próximas Funcionalidades

### Formularios de Gestión
- Creación y edición de laboratorios
- Gestión de responsables
- Configuración de políticas
- Definición de horarios

### Funcionalidades Avanzadas
- Notificaciones push
- Sincronización offline
- Búsqueda avanzada
- Filtros guardados
- Exportación de datos

### Mejoras de UX
- Animaciones fluidas
- Gestos de navegación
- Modo de pantalla completa
- Accesibilidad mejorada

## Consideraciones Técnicas

### Rendimiento
- Lazy loading de componentes
- Optimización de re-renders
- Memoización de datos
- Paginación eficiente

### Accesibilidad
- Soporte para lectores de pantalla
- Navegación por teclado
- Contraste adecuado
- Textos descriptivos

### Mantenibilidad
- Componentes reutilizables
- Separación de responsabilidades
- Tipado fuerte con TypeScript
- Documentación clara

## Instalación y Configuración

### Dependencias Requeridas
```json
{
  "@expo/vector-icons": "^13.0.0",
  "expo-router": "^2.0.0",
  "react-native": "0.72.0",
  "expo": "~49.0.0"
}
```

### Variables de Entorno
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Configuración de Navegación
- Rutas definidas en `app/(tabs)/_layout.tsx`
- Navegación anidada para detalles
- Parámetros de ruta para IDs dinámicos

## Testing

### Pruebas Unitarias
- Componentes individuales
- Servicios de API
- Utilidades y helpers

### Pruebas de Integración
- Flujos completos de usuario
- Integración con backend
- Manejo de errores

### Pruebas de UI
- Componentes visuales
- Interacciones de usuario
- Responsividad

## Conclusión

El Módulo 1.1 para la aplicación móvil proporciona una interfaz completa y intuitiva para la gestión de perfiles de laboratorio, con características avanzadas de búsqueda, filtrado y navegación que mejoran significativamente la experiencia del usuario.
