# Módulo 1.1: Gestión de Perfiles de Laboratorio

## 📋 Descripción
Módulo completo para la gestión de perfiles de laboratorios académicos, implementado siguiendo la arquitectura correcta con separación entre frontend (mobile) y backend (API).

## 🏗️ Arquitectura

### **Backend (API)**
- **Ubicación**: `apps/api/src/routes/labs.js`
- **Base de datos**: PostgreSQL con tablas SQL definidas
- **Endpoints**: REST API completa para CRUD de laboratorios

### **Frontend (Mobile)**
- **Ubicación**: `apps/mobile/app/(tabs)/gestion-perfiles.tsx`
- **Tecnología**: React Native + TypeScript
- **Servicios**: `apps/mobile/services/labs.ts`
- **Tipos**: `apps/mobile/types/lab.ts`

## 🎯 Funcionalidades Implementadas

### ✅ **Gestión de Laboratorios**
- Listado con búsqueda y filtros por escuela
- Creación y edición de perfiles
- Validación de correo institucional (@tec.ac.cr, @itcr.ac.cr)
- Campos obligatorios: nombre, código interno, escuela, ubicación, correo

### ✅ **Responsables y Contactos**
- Registro de responsables del laboratorio
- Campos: nombre, cargo, teléfono, correo institucional
- Marcado de responsable principal
- Validación de correos institucionales

### ✅ **Recursos (Equipos y Consumibles)**
- Gestión unificada de recursos
- Tipos: EQUIPMENT, CONSUMABLE, SOFTWARE
- Estados: DISPONIBLE, RESERVADO, EN_MANTENIMIENTO, INACTIVO
- Para consumibles: cantidad, unidad, punto de reorden

### ✅ **Políticas Internas**
- Requisitos académicos y de seguridad
- Cursos previos e inducciones
- Notas adicionales

### ✅ **Horarios de Funcionamiento**
- Horarios semanales (lunes a domingo)
- Franjas horarias configurables
- Gestión de excepciones y bloqueos

### ✅ **Historial del Laboratorio**
- Registro cronológico de actividades
- Usuario, fecha y acción
- Referencias a tablas relacionadas

## 📊 Estructura de Datos

### **Tablas Principales**
- `lab` - Información básica del laboratorio
- `lab_responsible` - Responsables y contactos
- `resource` - Recursos (equipos, consumibles, software)
- `lab_policy` - Políticas internas
- `lab_open_hours` - Horarios de funcionamiento
- `lab_history` - Historial de actividades

### **Relaciones**
- Laboratorio → Escuela/Departamento
- Laboratorio → Responsables (1:N)
- Laboratorio → Recursos (1:N)
- Laboratorio → Políticas (1:1)
- Laboratorio → Horarios (1:N)

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

### **Laboratorios**
- `GET /labs` - Listar laboratorios
- `GET /labs/:id` - Obtener laboratorio
- `POST /labs` - Crear laboratorio
- `PUT /labs/:id` - Actualizar laboratorio
- `DELETE /labs/:id` - Eliminar laboratorio

### **Responsables**
- `GET /labs/:id/responsibles` - Listar responsables
- `POST /labs/:id/responsibles` - Crear responsable
- `PUT /labs/:id/responsibles/:responsibleId` - Actualizar responsable
- `DELETE /labs/:id/responsibles/:responsibleId` - Eliminar responsable

### **Recursos**
- `GET /labs/:id/resources` - Listar recursos
- `POST /labs/:id/resources` - Crear recurso
- `PUT /labs/:id/resources/:resourceId` - Actualizar recurso
- `DELETE /labs/:id/resources/:resourceId` - Eliminar recurso

### **Políticas**
- `GET /labs/:id/policies` - Obtener políticas
- `PUT /labs/:id/policies` - Actualizar políticas

### **Horarios**
- `GET /labs/:id/schedule` - Listar horarios
- `POST /labs/:id/schedule` - Crear horario
- `DELETE /labs/:id/schedule/:scheduleId` - Eliminar horario

### **Historial**
- `GET /labs/:id/history` - Obtener historial

### **Escuelas**
- `GET /labs/schools` - Listar escuelas/departamentos

## 🎨 Interfaz de Usuario

### **Pantalla Principal**
- Lista de laboratorios con búsqueda
- Filtro por escuela/departamento
- Botón para crear nuevo laboratorio

### **Formulario de Laboratorio**
- Campos obligatorios marcados con *
- Validación en tiempo real
- Selector de escuela/departamento
- Validación de correo institucional

### **Tabs de Detalle**
- **Perfil**: Información básica y descripción
- **Responsables**: Gestión de contactos
- **Recursos**: Equipos y consumibles
- **Políticas**: Requisitos académicos y seguridad
- **Horario**: Franjas horarias semanales
- **Historial**: Actividades del laboratorio

## 🔒 Validaciones

### **Laboratorio**
- Nombre requerido
- Código interno único
- Escuela/departamento requerido
- Ubicación requerida
- Correo institucional válido

### **Responsable**
- Nombre requerido
- Cargo requerido
- Correo institucional válido

### **Recurso**
- Nombre requerido
- Tipo requerido
- Estado requerido
- Código de inventario para equipos
- Unidad y cantidades para consumibles

## 📱 Navegación

La ventana está integrada en la pestaña "Laboratorios" del sistema de navegación principal.

## 🔄 Migración a Web

Para migrar a web, simplemente:
1. Crear la UI web (React/Vue/Angular)
2. Consumir los mismos endpoints de la API
3. Reutilizar la lógica de negocio del backend

## 📝 Notas Técnicas

- **Validaciones**: Implementadas tanto en frontend como backend
- **Tipos TypeScript**: Completamente tipados
- **Manejo de errores**: Alertas informativas para el usuario
- **Estados de carga**: Indicadores visuales durante operaciones
- **Responsive**: Adaptado para dispositivos móviles

## 🚧 Próximas Mejoras

- [ ] Implementar tabs de Recursos, Políticas, Horario e Historial
- [ ] Agregar subida de fotos para recursos
- [ ] Implementar notificaciones push
- [ ] Agregar reportes y estadísticas
- [ ] Implementar sincronización offline
