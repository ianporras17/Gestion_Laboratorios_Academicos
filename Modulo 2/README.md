# README – Módulo 2 (Personal Técnico y Encargados) — **Guía de Pruebas Completa**

Este README está listo para ejecutar **todas** las pruebas del **Módulo 2** (2.1–2.4) con Postman/cURL y con datos mínimos de ejemplo.
Incluye *gotchas* del backend y cómo solucionarlos para que **todo** funcione end‑to‑end.

## Alcance
- **2.1** Solicitudes aprobadas: listar, validar, entregar, devolver, notificar.
- **2.2** Inventario: equipos, materiales, estados, movimientos y alertas.
- **2.3** Mantenimientos: programación, inicio, cierre, historial y detalle.
- **2.4** Reportes: uso, inventario, mantenimiento, exportación PDF/XLSX.

Backend: `apps/api` (Node + Express + PostgreSQL).  
Base de datos: Docker (`db`).

---

## 0) Reglas de correo por rol (obligatorias)

| Rol     | Dominio requerido     |
|---------|-----------------------|
| student | @estudiantec.cr       |
| teacher | @itcr.ac.cr           |
| TECH    | @itcr.ac.cr           |
| ADMIN   | @tec.ac.cr            |

Si no coincide:  
- `/auth/register` → `422 Unprocessable Entity`  
- `/auth/login` → `403 Forbidden`

---

## 1) Puesta en marcha

### 1.1 Levantar servicios
**Windows / PowerShell (desde la raíz del repo):**
```powershell
docker compose up -d --build
```

**Linux/macOS:**
```bash
docker compose up -d --build
```

### 1.2 Migraciones
**Windows (desde la raíz del repo):**
```powershell
node .\apps\api\src\db\migrate.js
```

**Linux/macOS:**
```bash
node apps/api/src/db/migrate.js
```

### 1.3 Iniciar API en modo dev (si no está en Docker)
**Windows:**
```powershell
node .\apps\api\src\server.js
```

**Linux/macOS:**
```bash
node apps/api/src/server.js
```

### 1.4 Healthcheck
```http
GET http://localhost:8080/health
```

---

## 2) Usuarios y Tokens

Registra al menos (vía API):
- `ADMIN` (`admin@tec.ac.cr`)
- `TECH` (`tecnico@itcr.ac.cr`)
- `TEACHER` o `STUDENT` (solicitante), por ejemplo `docente.demo@itcr.ac.cr`

**Login** para obtener tokens: `/api/auth/login` → `{ token, user }`

---

## 3) Variables en Postman (Environment)
El Postman (Environment) esta en la carpeta modulo 2, este se importa dentro de postman

```
base_url       = http://localhost:8080/api
token_admin    = <se autollenará al hacer login>
token_tech     = <se autollenará al hacer login>
lab_id         = <se llenará con el seed>
resource_id    = <se llenará con el seed o respuesta>
material_id    = <se llenará con el seed o respuesta>
request_id     = <se llenará al listar aprobadas>
delivery_id    = <se llenará al entregar>
maintenance_id = <se llenará al programar mantenimiento>
```

Headers comunes:
```
Authorization: Bearer {{token_tech}}   (o {{token_admin}} si aplica)
Content-Type: application/json
```

---

## 4) Seed mínimo de datos (SQL listo)

> Ejecuta cada bloque así:
>
> **Windows (PowerShell):**
> ```powershell
> docker compose exec -T db psql -U labtec -d labtec -c "<TU_SQL_AQUI>"
> ```
> **Linux/macOS:**
> ```bash
> docker compose exec -T db psql -U labtec -d labtec -c "<TU_SQL_AQUI>"
> ```

### 4.1 Laboratorio, Equipo, Material
```sql
-- Laboratorio
INSERT INTO laboratories (name, code, location)
VALUES ('Lab Prueba','LAB-PR','Edif B')
RETURNING id;
```

```sql
-- Equipo (buscable por code)
INSERT INTO resources (lab_id, type, name, code, status, location)
SELECT id, 'EQUIPO', 'Fuente DC', 'EQ-FTE-01', 'DISPONIBLE', 'Rack 1'
FROM laboratories WHERE code='LAB-PR'
RETURNING id;
```

```sql
-- Material (con stock y umbral)
INSERT INTO resources (lab_id, type, name, code, status, stock, min_stock)
SELECT id, 'MATERIAL', 'Guantes', 'MAT-GL-01', 'DISPONIBLE', 100, 20
FROM laboratories WHERE code='LAB-PR'
RETURNING id;
```

### 4.2 Certificación, requisito y otorgamiento al solicitante
> Asegúrate de registrar previamente al solicitante (teacher/student) por API. Ajusta el correo si usaste otro.
```sql
-- Certificación genérica
INSERT INTO certifications (code, name) VALUES ('IND-SEG','Inducción Seguridad')
ON CONFLICT (code) DO NOTHING;
```

```sql
-- Requisito del laboratorio
INSERT INTO lab_requirements (lab_id, certification_id, requirement_type)
SELECT l.id, c.id, 'SEGURIDAD'
FROM laboratories l, certifications c
WHERE l.code='LAB-PR' AND c.code='IND-SEG'
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

### 4.3 Solicitud APROBADA con items
```sql
-- Crear solicitud APROBADA
INSERT INTO requests (user_id, lab_id, status, purpose)
SELECT u.id, l.id, 'APROBADA', 'Práctica 1'
FROM users u, laboratories l
WHERE u.email='docente.demo@itcr.ac.cr' AND l.code='LAB-PR'
RETURNING id;
```

```sql
-- Agregar 1 equipo como ítem (toma el EQ-FTE-01)
INSERT INTO request_items (request_id, resource_id, quantity)
SELECT r.id, e.id, 1
FROM (SELECT id FROM requests ORDER BY created_at DESC LIMIT 1) r,
     (SELECT id FROM resources WHERE code='EQ-FTE-01' LIMIT 1) e;
```

*(Opcional) si quieres que la entrega descuente también material, agrega un item del material:*  
```sql
INSERT INTO request_items (request_id, resource_id, quantity)
SELECT r.id, m.id, 2
FROM (SELECT id FROM requests ORDER BY created_at DESC LIMIT 1) r,
     (SELECT id FROM resources WHERE code='MAT-GL-01' LIMIT 1) m;
```

---

## 5) 2.1 – Solicitudes aprobadas (TECH/ADMIN)

**Base URL:** `{{base_url}}/approved`

- **Listar aprobadas**
  ```http
  GET {{base_url}}/approved
  ```
  > Guarda `{{request_id}}` de la primera fila.

- **Validación previa**
  ```http
  POST {{base_url}}/approved/{{request_id}}/validate
  Body opcional: { "notes": "Validación previa" }
  ```

- **Registrar entrega** *(NO pases items; los usa desde `request_items`)*
  ```http
  POST {{base_url}}/approved/{{request_id}}/deliver
  Body: { "observations": "Entrega inicial" }
  ```
  > Guarda `{{delivery_id}}` de la respuesta.  
  > **Efecto:** recurso(s) → `RESERVADO` + movimiento `OUT` (material: stock−).

- **Registrar devolución** *(NO pases items; se espejan de `delivery_items`)*
  ```http
  POST {{base_url}}/approved/deliveries/{{delivery_id}}/return
  Body: { "condition": "OK", "notes": "Devolución completa" }
  ```
  > **Efecto:** recurso(s) → `DISPONIBLE` + movimiento `IN` (material: stock = sin cambio).

- **Notificación (stub hasta habilitar INSERT)**
  ```http
  POST {{base_url}}/approved/{{request_id}}/notify
  Body: { "audience":"SOLICITANTE", "type":"RETRASO", "message":"No devolvió a tiempo" }
  ```

**Errores típicos y solución**
- `Cannot POST /api/approved//validate` → faltó `{{request_id}}` (repite “Listar aprobadas”).
- `403` → token sin rol TECH/ADMIN.
- `409` → estado incompatible (p.ej., entregar dos veces).

---

## 6) 2.2 – Inventario (TECH/ADMIN)

**Base URL:** `{{base_url}}/inventory`  
**Estados válidos:** `DISPONIBLE`, `RESERVADO`, `EN_MANTENIMIENTO`, `INACTIVO`.

### 6.1 Equipos
```http
POST {{base_url}}/inventory/equipment
{ "lab_id":"{{lab_id}}", "name":"Osciloscopio", "code":"EQ-OSC-001", "location":"Edif A" }
```
```http
PATCH {{base_url}}/inventory/equipment/{{resource_id}}
{ "location":"Edif B", "name":"Osciloscopio TDS" }
```
```http
DELETE {{base_url}}/inventory/equipment/{{resource_id}}
```
```http
POST {{base_url}}/inventory/resources/{{resource_id}}/status
{ "status":"EN_MANTENIMIENTO" }
```

### 6.2 Materiales
```http
POST {{base_url}}/inventory/materials
{ "lab_id":"{{lab_id}}", "name":"Guantes", "code":"MAT-GL-001", "min_stock":50, "initial_stock":120 }
```
```http
POST {{base_url}}/inventory/materials/{{material_id}}/stock
{ "delta": -20, "reason":"Consumo" }
```
```http
GET {{base_url}}/inventory/materials/low-stock
```

### 6.3 Consulta y movimientos
```http
GET {{base_url}}/inventory/resources?type=EQUIPO&status=EN_MANTENIMIENTO&labId={{lab_id}}&q=Oscilo
```
```http
POST {{base_url}}/inventory/movements
{ "resource_id":"{{material_id}}", "movement_type":"OUT", "quantity":5, "reason":"Ajuste manual" }
```

**Validaciones clave**
- Stock **no** puede ser negativo.
- `code` es **único** por recurso.
- Estados solo de la lista válida.

---

## 7) 2.3 – Mantenimientos (TECH/ADMIN)

**Base URL:** `{{base_url}}/maintenance`  
**Tipos:** `PREVENTIVO`, `CORRECTIVO`  
**Resultados:** `OK`, `INACTIVAR`, `OBSERVACION`

```http
POST {{base_url}}/maintenance/schedule
{
  "resourceId":"{{resource_id}}",
  "labId":"{{lab_id}}",
  "type":"PREVENTIVO",
  "scheduledAt":"2025-09-30T14:00:00Z",
  "notes":"Chequeo previo"
}
```
```http
PATCH {{base_url}}/maintenance/{{maintenance_id}}/start
{ "performedAt":"2025-09-30T14:05:00Z" }
```
```http
PATCH {{base_url}}/maintenance/{{maintenance_id}}/complete
{
  "result":"OK",
  "usedMaterials":[{"code":"REP-123","name":"Correa","qty":1}],
  "notes":"Listo",
  "performedAt":"2025-09-30T15:30:00Z"
}
```
```http
GET {{base_url}}/maintenance?resourceId={{resource_id}}
GET {{base_url}}/maintenance/{{maintenance_id}}
```

**Efectos esperados**
- `start` → `resources.status = EN_MANTENIMIENTO` + movimiento `MAINTENANCE_OUT`.
- `complete` → estado final `DISPONIBLE` (OK/OBSERVACION) o `INACTIVO` (INACTIVAR) + `MAINTENANCE_IN`.

---

## 8) 2.4 – Reportes Operativos

**Base URL:** `{{base_url}}/reports`

```http
GET {{base_url}}/reports/usage
GET {{base_url}}/reports/inventory
GET {{base_url}}/reports/maintenance
GET {{base_url}}/reports/export?kind=usage&format=pdf
GET {{base_url}}/reports/export?kind=inventory&format=xlsx
```

**Nota producción:** asegura `exceljs` en `dependencies` (no solo `devDependencies`).

---

## 9) Gotchas & Fixes (importante)

### 9.1 `/reports/inventory` consulta tabla incorrecta
En el código original, inventario usa `materials` (no existe) y `low_stock_threshold` (columna no existente). Debe leer de `resources`:

```js
// En reports.controller.js, reemplaza el query de materiales por:
const matSQL = `
  SELECT id, name, 'MATERIAL'::text AS type, stock, min_stock
  FROM resources
  WHERE type = 'MATERIAL'
  ORDER BY name
  LIMIT 500;
`;
```

### 9.2 Notificaciones (2.1.5) están en stub
Habilita el INSERT (ya existe migración `notifications`):
```js
// En approved.controller.js dentro de notifyIssues:
const q = `
  INSERT INTO notifications (request_id, user_id, type, message, audience)
  VALUES ($1, $2, $3, $4, 'SOLICITANTE')
  RETURNING id, created_at
`;
const { rows } = await pool.query(q, [requestId, by, type, message]);
return res.json({ ok: true, request_id: requestId, type, notification_id: rows[0].id });
```

---

## 10) Troubleshooting rápido

- **URL con doble “//”** (p.ej. `/approved//validate`) → faltó `{{request_id}}`. Corre “Listar aprobadas” antes.
- **`401`** → falta/expiró token: re‑login.
- **`403`** → rol no permitido: usa TECH/ADMIN.
- **`404`** → ID inexistente o borrado.
- **`409`** → conflicto de estado (entrega duplicada, stock insuficiente, etc.).
- **Export XLSX falla** → mueve `exceljs` a `dependencies` y reinstala.

---

## 11) Reset de BD (solo desarrollo)
```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```
Luego corre migraciones otra vez.

---

## 12) Checklist final (debe cumplirse todo)

- [ ] Roles ↔ dominios correctos en registro/login.
- [ ] 2.1: Entrega cambia estados/stock y genera `OUT`; Devolución genera `IN`.
- [ ] 2.2: Stock no negativo, `code` único, alertas de bajo stock responden.
- [ ] 2.3: `start`/`complete` cambian estado y registran movimientos `MAINTENANCE_*`.
- [ ] 2.4: Endpoints calculan y exportan; inventario corregido a `resources`.
- [ ] (Opcional) Notificaciones persisten tras habilitar `INSERT`.
