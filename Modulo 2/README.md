# README -- Módulos 2.1 Gestión de Solicitudes Aprobadas, 2.2 Gestión de Inventario y 2.3 Gestión de Mantenimientos

Este documento explica cómo preparar datos, qué roles/correos son válidos, y cómo probar manualmente en Postman las funcionalidades:

- **2.1**: Validación previa, entrega, devolución y notificaciones de solicitudes aprobadas.  
- **2.2**: Inventario de equipos y materiales (alta/baja/edición, estados, stock y movimientos).  
- **2.3**: Mantenimientos preventivos/correctivos (programación, ejecución, cierre, estado y trazabilidad).

Backend: `apps/api` (Node + Express + PostgreSQL). Base de datos en Docker (servicio `db`).

---

## 0) Reglas de correo por rol (obligatorias)

El backend fuerza que el dominio del correo coincida con el rol:

| Rol     | Dominio requerido         |
|---------|---------------------------|
| student | @estudiantec.cr     |
| teacher | @itcr.ac.cr               |
| TECH    | @itcr.ac.cr               |
| ADMIN   | @tec.ac.cr                |

Si no coincide:

- **/auth/register** → 422 Unprocessable Entity  
- **/auth/login** (para cuentas antiguas/erróneas) → 403 Forbidden

---

## 1) Puesta en marcha

### 1.1 Levantar Docker
```bash
docker compose up -d --build
```

### 1.2 Migraciones (desde apps/api)
```bash
cd apps/api
node src/db/migrate.js
```

### 1.3 Verificar API
```http
GET http://localhost:8080/health
```

---

## 2) Usuarios y Tokens

### 2.1 Registro por API
Headers: `Content-Type: application/json`

**ADMIN**
```http
POST http://localhost:8080/api/auth/register
{
  "email": "admin.pruebas@tec.ac.cr",
  "password": "ClaveFuerte!23",
  "role": "ADMIN",
  "full_name": "Admin Pruebas",
  "id_code": "A-001",
  "career_or_department": "Escuela de Computación",
  "phone": "+50670001234"
}
```

**TECH**
```http
POST http://localhost:8080/api/auth/register
{
  "email": "tecnico1@itcr.ac.cr",
  "password": "ClaveFuerte!23",
  "role": "TECH",
  "full_name": "Técnico Uno",
  "id_code": "T-001",
  "career_or_department": "LabOps",
  "phone": "+50670004567"
}
```

**TEACHER / STUDENT (para solicitudes)**
```http
POST http://localhost:8080/api/auth/register
{
  "email": "docente.demo@itcr.ac.cr",
  "password": "ClaveFuerte!23",
  "role": "teacher",
  "full_name": "Docente Demo",
  "id_code": "D-100",
  "career_or_department": "Escuela X"
}
```

Respuesta esperada: `201 Created` con `{ "token": "...", "user": {...} }`.

### 2.2 Login
```http
POST http://localhost:8080/api/auth/login
{
  "email": "tecnico1@itcr.ac.cr",
  "password": "ClaveFuerte!23"
}
```
→ `200 OK` con `{ token, user }`.

---

## 3) Variables recomendadas en Postman

Crear **Environment**:
```
base_url       = http://localhost:8080/api
token_admin    = <token del admin>
token_tech     = <token del tech>
lab_id         = <se completa en ejecuciones>
resource_id    = <se completa en ejecuciones>
material_id    = <se completa en ejecuciones>
request_id     = <se completa en ejecuciones>
delivery_id    = <se completa en ejecuciones>
maintenance_id = <se completa en ejecuciones>
```

Headers en todas las peticiones:
```
Authorization: Bearer {{token_tech}}   (o {{token_admin}} si aplica)
Accept: application/json
Content-Type: application/json          (en POST/PATCH/DELETE)
```

---

## 4) Seed de datos (SQL) para pruebas rápidas

Ejecuta cada bloque con:
```bash
docker compose exec -T db psql -U labtec -d labtec -c "<AQUI_TU_SQL>"
```

### 4.1 Laboratorio, equipo y material
```sql
-- Laboratorio
INSERT INTO laboratories (name, code, location)
VALUES ('Lab Electrónica','LAB-EL','Edif A') RETURNING id;
```
Guarda el id (`{{lab_id}}`).

```sql
-- Equipo de ejemplo
INSERT INTO resources (lab_id, type, name, code, status, location)
VALUES ('{{lab_id}}','EQUIPO','Fuente DC','EQ-FTE-001','DISPONIBLE','Rack 1') RETURNING id;
```

```sql
-- Material de ejemplo
INSERT INTO resources (lab_id, type, name, code, status, stock, min_stock)
VALUES ('{{lab_id}}','MATERIAL','Guantes de látex','MAT-GL-001','DISPONIBLE',120,50) RETURNING id;
```

### 4.2 Requisitos/certificaciones y solicitud aprobada (para 2.1)
```sql
-- Certificación y requisito para el lab
INSERT INTO certifications (code, name) VALUES ('IND-SEG','Inducción Seguridad')
ON CONFLICT (code) DO NOTHING;

INSERT INTO lab_requirements (lab_id, certification_id, requirement_type)
SELECT '{{lab_id}}', c.id, 'SEGURIDAD'
FROM certifications c WHERE c.code='IND-SEG'
ON CONFLICT DO NOTHING;
```

```sql
-- Otorgar certificación al solicitante
INSERT INTO user_certifications (user_id, certification_id)
SELECT u.id, c.id
FROM users u, certifications c
WHERE u.email='docente.demo@itcr.ac.cr' AND c.code='IND-SEG'
ON CONFLICT DO NOTHING;
```

```sql
-- Crear solicitud APROBADA
INSERT INTO requests (user_id, lab_id, status, purpose)
SELECT u.id, '{{lab_id}}', 'APROBADA', 'Práctica 1'
FROM users u WHERE u.email='docente.demo@itcr.ac.cr'
RETURNING id;
```

```sql
-- Ítem: 1 equipo
INSERT INTO request_items (request_id, resource_id, quantity)
VALUES ('{{request_id}}','{{resource_id}}',1);
```

---

## 5) 2.1 -- Gestión de Solicitudes Aprobadas (TECH / ADMIN)

**Base URL:** `{{base_url}}/approved`

- **Listar aprobadas**
```http
GET {{base_url}}/approved
```

- **Validación previa**
```http
POST {{base_url}}/approved/{{request_id}}/validate
```

- **Registrar entrega**
```http
POST {{base_url}}/approved/{{request_id}}/deliver
```

- **Registrar devolución**
```http
POST {{base_url}}/approved/deliveries/{{delivery_id}}/return
Body:
{ "condition": "OK", "notes": "Sin novedades" }
```

- **Notificación opcional**
```http
POST {{base_url}}/approved/{{request_id}}/notify
Body:
{ "type":"RETRASO", "message":"No devolvió a tiempo" }
```

**Estados esperados**:  
Entrega → recurso `RESERVADO` + movimiento `OUT`.  
Devolución → recurso `DISPONIBLE` + movimiento `IN`.

Errores esperados: `403`, `404`, `409`, `500`.

---

## 6) 2.2 -- Gestión de Inventario (TECH / ADMIN)

**Base URL:** `{{base_url}}/inventory`  
**Estados:** `DISPONIBLE`, `RESERVADO`, `EN_MANTENIMIENTO`, `INACTIVO`.

> **Importante:** en **alta de equipos** el body usa **snake_case** (`lab_id`, `name`, `code`, …).

### 6.1 Equipos
- **Alta**
```http
POST {{base_url}}/inventory/equipment
{ "lab_id": "{{lab_id}}", "name": "Osciloscopio Tektronix", "code": "EQ-OSC-001", "location": "Edif A - 2do piso" }
```

- **Edición**
```http
PATCH {{base_url}}/inventory/equipment/{{resource_id}}
{ "location": "Edif A - 3er piso", "name": "Osciloscopio TDS 2024" }
```

- **Baja**
```http
DELETE {{base_url}}/inventory/equipment/{{resource_id}}
```

- **Cambio de estado**
```http
POST {{base_url}}/inventory/resources/{{resource_id}}/status
{ "status": "EN_MANTENIMIENTO" }
```

### 6.2 Materiales
- **Alta con stock inicial**
```http
POST {{base_url}}/inventory/materials
{ "lab_id": "{{lab_id}}", "name": "Guantes de látex", "code": "MAT-GL-001", "min_stock": 50, "initial_stock": 120 }
```

- **Ajuste de stock**
```http
POST {{base_url}}/inventory/materials/{{material_id}}/stock
{ "delta": -30, "reason": "Consumo práctica 1" }
```

- **Alertas por bajo stock**
```http
GET {{base_url}}/inventory/materials/low-stock
```

### 6.3 Consulta y movimientos
```http
GET {{base_url}}/inventory/resources?type=EQUIPO&status=DISPONIBLE&labId={{lab_id}}&q=oscil
```

```http
POST {{base_url}}/inventory/movements
{ "resource_id": "{{material_id}}", "movement_type": "OUT", "quantity": 10, "reason": "Ajuste inventario" }
```

Errores esperados: `403`, `409`, `422`, `500`.

---

## 7) 2.3 -- Gestión de Mantenimientos (TECH / ADMIN)

**Base URL:** `{{base_url}}/maintenance`  
**Tipos:** `PREVENTIVO`, `CORRECTIVO` (enum `maint_type_enum`).  
**Resultados:** `OK`, `INACTIVAR`, `OBSERVACION` (enum `maint_result_enum`).  
**Estados recurso:** `EN_MANTENIMIENTO` durante ejecución; al cerrar: `DISPONIBLE` o `INACTIVO`.

### 7.1 Programación
```http
POST {{base_url}}/maintenance/schedule
{
  "resourceId": "{{resource_id}}",
  "labId": "{{lab_id}}",
  "type": "PREVENTIVO",
  "scheduledAt": "2025-09-30T14:00:00Z",
  "technicianId": "{{tech_user_id}}",    // opcional
  "notes": "Chequeo previo a prácticas"
}
```
**Efecto:** crea registro en `maintenances` (solo programación).

### 7.2 Inicio (salida a mantenimiento)
```http
PATCH {{base_url}}/maintenance/{{maintenance_id}}/start
{ "performedAt": "2025-09-30T14:05:00Z" }   // opcional
```
**Efecto:** `resources.status = EN_MANTENIMIENTO` + movimiento `MAINTENANCE_OUT`.

### 7.3 Cierre (registro técnico + repuestos + estado)
```http
PATCH {{base_url}}/maintenance/{{maintenance_id}}/complete
{
  "result": "OK",
  "usedMaterials": [
    { "code": "REP-123", "name": "Correa 3mm", "qty": 1 }
  ],
  "notes": "Se cambió correa y lubricó. Queda operando.",
  "performedAt": "2025-09-30T15:30:00Z"
}
```
**Efecto:**
- Actualiza `maintenances.result`, `used_materials` (JSONB), `notes`, `performed_at`.
- `resources.last_maintenance_at = performed_at`.
- Cambia estado del recurso:
  - `OK`/`OBSERVACION` → `DISPONIBLE`
  - `INACTIVAR` → `INACTIVO`
- Inserta movimiento `MAINTENANCE_IN`.
- **(TODO)** Notificar a ADMIN/encargados cuando el recurso vuelva a `DISPONIBLE`.

### 7.4 Historial y detalle
```http
GET {{base_url}}/maintenance?resourceId={{resource_id}}
GET {{base_url}}/maintenance?labId={{lab_id}}&from=2025-09-01&to=2025-10-01
GET {{base_url}}/maintenance/{{maintenance_id}}
```

**Errores comunes (y solución):**
- `401 Missing token` → agrega `Authorization: Bearer …`.
- `resource_id null` en schedule → verifica `Content-Type: application/json` y que envías **IDs reales**.
- Error tipo `could not determine data type of parameter $4` → corregido con casteos en el controller (ya aplicado).

---

## 8) Checklist mínimo de validación

- Registro/login respetan dominios por rol.  
- `/api/admin/*` solo accesible con ADMIN.  
- TECH/ADMIN pueden usar 2.1, 2.2 y 2.3.  
- 2.1: Entrega → `RESERVADO` + movimiento `OUT`.  
- 2.1: Devolución → `DISPONIBLE` + movimiento `IN`.  
- 2.2: Materiales no permiten stock negativo; UNIQUE en `code`.  
- 2.2: Alta de equipos usa **snake_case** (`lab_id`, `name`, `code`).  
- 2.3: `start` pone `EN_MANTENIMIENTO` + `MAINTENANCE_OUT`.  
- 2.3: `complete` actualiza `result`, `used_materials`, `notes`, `performed_at`, cambia estado a `DISPONIBLE/INACTIVO` + `MAINTENANCE_IN`.

---

## 9) Troubleshooting

- **422 Invalid role/dominio** → revisa email vs rol.  
- **401** → token ausente/expirado.  
- **403** → rol sin permiso.  
- **404** → IDs inexistentes.  
- **409** → colisiones de estado/stock/unique `code`.  
- **500 (en mantenimientos)** → usa valores válidos de enum (`type`, `result`) y formato ISO en fechas.

Comandos útiles:
```bash
cd apps/api
node src/db/migrate.js

docker compose exec -T db psql -U labtec -d labtec -c "\dT+ public.user_role"
docker compose exec -T db psql -U labtec -d labtec -c "\d+ public.resources"
docker compose exec -T db psql -U labtec -d labtec -c "SELECT * FROM maintenances ORDER BY created_at DESC LIMIT 5;"
docker compose exec -T db psql -U labtec -d labtec -c "SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 5;"
```
