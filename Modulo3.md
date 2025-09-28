# API LabTec – Endpoints 3.1 → 3.5  
**Proyecto:** Gestión de Laboratorios Académicos (Backend `apps/api`)  
**Stack:** Node.js + Express · PostgreSQL 16 · JWT · Bcrypt · express-validator · Multer (adjuntos) · ExcelJS · PDFKit · ICS · Docker

---

## Arquitectura (capas, MVC, modularidad)

- **Rutas (routes/)**: definen endpoints REST y encadenan middlewares/validadores → controladores.
- **Controladores (controllers/)**: lógica de caso de uso (autenticación, reservas, préstamos, mensajes, historial, admin).
- **Middlewares (middlewares/)**:
  - `authRequired` (JWT obligatorio)
  - `requireRole('teacher'|...)` (autorización por rol)
- **Servicios/DB (db/)**:
  - `pool.js` (conexión PG)
  - `migrations/*.sql` (esquema y cambios)
  - `migrate.js` (aplica migraciones)
- **Jobs (jobs/)**: `scheduler.js` (alertas T-24h / T-1h / vencidos).
- **Archivos (uploads/)**: `uploads/reports/<userId>` (PDF/Excel), adjuntos de reserva/préstamo si aplica.
- **Configuración**: `.env` (secretos y URLs), `docker-compose.yml` para Postgres/pgAdmin.

**Justificación técnica:**
- **Express + PG** por simplicidad y control fino de validaciones/queries.
- **JWT** para sesiones stateless (móvil/web).
- **Bcrypt** para contraseñas seguras.
- **express-validator** para entrada confiable (422 en invalidaciones).
- **ICS/ExcelJS/PDFKit** para calendarios y reportes descargables.
- **Scheduler** interno (setInterval) suficiente para recordatorios; escalable a cron/worker si hiciera falta.

---

## Estructura de datos (tablas clave)

- **users**(id, email (único+índice), password_hash, role: `student|teacher|admin`, full_name, id_code, career/department, phone…)
- **certifications**, **user_certifications**(user_id, certification_id, obtained_at)
- **labs**(id, name, location)
- **resources**(id, lab_id, type, name, description, allowed_roles `user_role[]`, required_certifications[])
- **reservations**(id, user_id, resource_id, start_time, end_time, status: `in_review|pending|approved|rejected|cancelled`, reason)
- **loans**(id, user_id, resource_id, start_time, end_time, status: `requested|approved|picked_up|returned|rejected|cancelled|overdue`, reason)
- **reservation_attachments / loan_attachments** (opcional)
- **lab_staff**(lab_id, user_id, role: `owner|tech`) ← encargados por laboratorio
- **message_threads**(id, context_type `reservation|loan`, context_id, lab_id, status)
- **message_thread_participants**(thread_id, user_id, last_read_at)
- **messages**(id, thread_id, sender_id, body, created_at)
- **user_notifications**(id, user_id, type, title, message, data jsonb, created_at, read_at)
- **user_activity_log**(id, user_id, activity_type, event_time, lab_id, resource_id, reservation_id, loan_id, hours, credits, meta jsonb)
  - `activity_type` incluye:  
    `reservation_created|reservation_status_changed|reservation_approved|reservation_cancelled|loan_created|loan_status_changed|loan_picked_up|loan_returned|loan_cancelled|training_completed`

---

## Validaciones y seguridad

- **Contraseñas**: `bcrypt` (no `TEMP_HASH`).  
- **JWT**: al loguear; se retorna `token` (no `TEMP_TOKEN`).
- **Email**: único e indexado; validación de dominio institucional `@estudiantec.cr|@itcr.ac.cr`.
- **Rol**: `student | teacher | admin`; `requireRole('teacher')` protege rutas admin.
- **Disponibilidad**: verificación de traslapes en **reservations** y **loans**.
- **Requisitos**: `allowed_roles` del recurso y `required_certifications` del usuario.
- **Entrada**: `express-validator` → 422 con detalle de campo.
- **Export**: generación a **memoria** y escritura atómica (tmp → rename). Si hay error 4xx/5xx, **no** crea archivo.

---

## Funcionalidades implementadas

- **3.1 Gestión de perfiles de usuario**  
  Registro, login, perfil, certificaciones (alta/listado), propagación de datos y vínculos a historial y reservas.
- **3.2 Búsqueda y disponibilidad**  
  Búsqueda por laboratorio, tipo, fecha, hora, ubicación; filtros por rol/certificaciones; vista calendario semanal/mensual; ICS público.
- **3.3 Solicitudes y reservas**  
  Crear reserva/préstamo con validación previa; seguimiento de estado; cancelación; integración a calendario; adjuntos (opcional).
- **3.4 Historial de uso**  
  Registro cronológico, trazabilidad (lab/recurso/fecha), horas y créditos; export PDF/Excel descargable.
- **3.5 Notificaciones y mensajería**  
  Notificaciones automáticas (estados y mensajes); mensajería interna (dueño ↔ lab_staff); alertas T-24h/T-1h/vencidos.

---

# Endpoints (con ejemplos)

> Todos bajo prefijo **`/api`**.  
> **Headers comunes:**  
> `Authorization: Bearer <JWT>` (salvo `/auth/*`) · `Content-Type: application/json`

---

## 3.1 Gestión de Perfiles

### Auth
**POST** `/auth/register`  
Body:
```json
{
  "email": "alguien@itcr.ac.cr",
  "password": "Password!123",
  "role": "student", 
  "full_name": "Nombre Apellido",
  "id_code": "20241234"
}
```
Res:
```json
{ "token":"<JWT>", "user": { "id":"...", "email":"...", "role":"student" } }
```

**POST** `/auth/login`  
Body:
```json
{ "email": "alguien@itcr.ac.cr", "password": "Password!123" }
```
Res:
```json
{ "token":"<JWT>", "user": { "id":"...", "role":"student" } }
```

### Perfil
**GET** `/users/me` → datos del usuario (JWT)  
**PATCH** `/users/me` → actualiza nombre, teléfono, etc.  
Body (ejemplo):
```json
{ "full_name": "Nuevo Nombre", "phone": "8888-8888" }
```

### Certificaciones
**GET** `/users/me/certifications`  
**POST** `/users/me/certifications`  
Body:
```json
{ "code": "SEG-LAB-INDUCCION", "name": "Inducción Seguridad", "obtained_at": "2025-09-01" }
```
Res (201):
```json
{ "user_id":"...", "certification_id":"...", "obtained_at":"2025-09-01" }
```
> Se registra en `user_activity_log` (training_completed) con meta (`code`, `name`).

---

## 3.2 Búsqueda y Disponibilidad

### Catálogos
**GET** `/labs` → lista labs  
**GET** `/resources?lab_id=...&type=...` → recursos por filtros  
Res (ejemplo):
```json
[
  {
    "id":"...", "name":"Campana #1", "type":"campana-extraccion",
    "lab_id":"...", "lab_name":"Lab Química", "location":"Edificio A - Piso 2",
    "allowed_roles":["teacher"], 
    "required_certifications":[{"code":"SEG-LAB-INDUCCION","name":"..."}]
  }
]
```

### Búsqueda por criterios
**POST** `/availability/search`  
Body:
```json
{
  "lab_id": "<UUID>",
  "resource_type": "campana-extraccion",
  "date": "2025-09-26",
  "from": "08:00",
  "to": "12:00",
  "location": "Edificio A - Piso 2"
}
```
Res: recursos disponibles con bloques libres/ocupados.

### Vista calendario
**GET** `/availability/calendar?lab_id=<UUID>&resource_id=<UUID>&view=weekly&from=2025-09-22`  
Res: grilla semanal/mensual de bloques libres/ocupados.

### ICS
**GET** `/calendar/general.ics` → todas las reservas **aprobadas**  
**GET** `/calendar/labs/:labId.ics` → aprobadas por laboratorio

---

## 3.3 Solicitudes de uso y reservas / préstamos

### Reservas (usuario)
**POST** `/reservations`  
Body:
```json
{
  "resource_id":"<UUID>",
  "start_time":"2025-09-26T10:00:00-06:00",
  "end_time":"2025-09-26T11:30:00-06:00",
  "reason":"Práctica #3"
}
```
Res (201):
```json
{ "reservation": { "id":"...", "status":"pending" } }
```

**GET** `/reservations/my` → mis reservas  
**GET** `/reservations/:id` → detalle (propietario)  
**PATCH** `/reservations/:id/cancel` → cancela si procede  
Res:
```json
{ "ok": true }
```

### Reservas (admin/teacher)
**PATCH** `/admin/reservations/:id/status`  
Body:
```json
{ "status":"approved" }  // o 'rejected' | 'cancelled' | 'pending' | 'in_review'
```
Res:
```json
{ "ok": true, "old_status":"pending", "new_status":"approved" }
```
> Inserta en `user_activity_log` (horas/créditos si `approved`) y en `user_notifications` (`reservation_status`).

### Préstamos (usuario)
**POST** `/loans`  
Body:
```json
{
  "resource_id":"<UUID>",
  "start_time":"2025-09-26T13:00:00-06:00",
  "end_time":"2025-09-26T15:00:00-06:00",
  "reason":"Préstamo balanza"
}
```
Res (201):
```json
{ "loan": { "id":"...", "status":"requested" } }
```
**GET** `/loans/my`  
**PATCH** `/loans/:id/cancel` → cancela si procede (`loan_cancelled` en historial)

### Préstamos (admin/teacher)
**PATCH** `/admin/loans/:id/status`  
Body:
```json
{ "status":"approved" } // o 'picked_up' | 'returned' | 'rejected' | 'cancelled' | 'overdue'
```
Res:
```json
{ "ok": true, "old_status":"requested", "new_status":"approved" }
```
> Log en `user_activity_log` (tipo según estado) y notificación `loan_status`.

---

## 3.4 Historial de uso

**GET** `/history/me?from=2025-09-01&to=2025-09-30&type=all`  
Res:
```json
[
  {
    "activity_type":"reservation_approved",
    "event_time":"2025-09-25T16:00:00Z",
    "lab_name":"Lab Química",
    "resource_name":"Campana #1",
    "hours":1.50,
    "credits":0.15,
    "meta":{"old":"pending","new":"approved"}
  }
]
```

**GET** `/history/summary`  
Res:
```json
{ "total_hours": 5.0, "total_credits": 0.5, "reservations": 3, "loans": 1, "trainings": 1 }
```

**GET** `/history/export?format=pdf&delivery=link&type=all&from=2025-09-01&to=2025-09-30`  
Res:
```json
{ "ok": true, "url": "/uploads/reports/<userId>/historial_all_2025-09-25T16-23-14Z.pdf", "filename": "historial_all_....pdf" }
```
> Export usa escritura **segura**; si hay error 4xx/5xx, **no** se crea archivo.  
> PDF en “tarjetas” (Fecha, Tipo, Laboratorio, Recurso, Horas, Créditos, Detalle formateado); Excel con columnas.

---

## 3.5 Notificaciones y Mensajería

### Notificaciones
**GET** `/notifications?only_unread=1&limit=50&offset=0`  
Res:
```json
[
  {
    "id":"...",
    "type":"reservation_status",
    "title":"Reserva APROBADA",
    "message":"Campana #1 — Lab Química (25/09/2025 10:00)",
    "data":{"reservation_id":"...","old_status":"pending","new_status":"approved"},
    "created_at":"2025-09-25T16:23:14Z",
    "read_at":null
  }
]
```
_(Opcional)_ **PATCH** `/notifications/:id/read` → `{ "ok": true }`

### Mensajería interna
**POST** `/messages/threads`  
Body:
```json
{ "context_type":"reservation", "context_id":"<RESERVATION_ID>" }
```
Res:
```json
{ "id":"<THREAD_ID>", "context_type":"reservation", "lab_id":"<LAB_ID>", ... }
```
> Crea hilo (1 por solicitud) e inserta participantes: dueño + `lab_staff`. Si el hilo ya existía, re-inyecta staff.

**GET** `/messages/threads/my` → hilos del usuario (con `last_message`, `last_created_at`, `unread_count`)  
**GET** `/messages/threads/:id/messages` → mensajes del hilo ascendente  
**POST** `/messages/threads/:id/messages`  
Body:
```json
{ "body":"Hola, ¿podemos ajustar el horario?" }
```
Res (201): mensaje creado.  
> Si un staff no estaba como participante pero **sí** pertenece a `lab_staff` del `lab_id` del hilo, el backend lo **auto-añade** y permite enviar (deja de devolver 403).

**PATCH** `/messages/threads/:id/read` → marca como leído para el usuario actual → `{ "ok": true }`

### Alertas programadas (scheduler)
- **Reservas**: `reservation_alert` T-24h y T-1h antes de `start_time`.
- **Préstamos**: `loan_alert` T-24h y T-1h antes de `end_time`; `overdue` cuando expira.
- **Antiduplicado** por `stage` (`t-24h|t-1h|overdue`) e ID.

---

## Errores comunes (y códigos)

- **401** `Missing bearer token` / `Invalid token` → sin JWT o inválido.
- **403** `Forbidden` → rol insuficiente o no participante del hilo.
- **404** `... not found` → id inexistente o ajeno.
- **409** `overlap` → traslape de disponibilidad (reserva/préstamo).
- **422** `errors: [...]` → validaciones `express-validator` (UUID, fechas, formatos, dominios de email).
- **500** `Failed to ...` → error interno; logs en servidor con tag del controlador.

---

## Ejemplos rápidos (cURL)

Registrar y loguear:
```bash
curl -X POST http://localhost:8080/api/auth/register   -H "Content-Type: application/json"   -d '{"email":"alguien@itcr.ac.cr","password":"Password!123","role":"student","full_name":"Nombre","id_code":"20241234"}'

curl -X POST http://localhost:8080/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"alguien@itcr.ac.cr","password":"Password!123"}'
```

Crear reserva:
```bash
curl -X POST http://localhost:8080/api/reservations   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"resource_id":"<UUID>","start_time":"2025-09-26T10:00:00-06:00","end_time":"2025-09-26T11:30:00-06:00","reason":"Práctica"}'
```

Aprobar reserva (teacher):
```bash
curl -X PATCH http://localhost:8080/api/admin/reservations/<ID>/status   -H "Authorization: Bearer $TEACHER_TOKEN" -H "Content-Type: application/json"   -d '{"status":"approved"}'
```

Abrir hilo y enviar mensaje:
```bash
curl -X POST http://localhost:8080/api/messages/threads   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"context_type":"reservation","context_id":"<RESERVATION_ID>"}'

curl -X POST http://localhost:8080/api/messages/threads/<THREAD_ID>/messages   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   -d '{"body":"Hola!"}'
```

Export historial (PDF link):
```bash
curl -X GET "http://localhost:8080/api/history/export?format=pdf&delivery=link&type=all&from=2025-09-01&to=2025-09-30"   -H "Authorization: Bearer $TOKEN"
```

---

## Notas de despliegue / entorno

- **.env (raíz del repo)**: credenciales Postgres, puertos, CORS; `JWT_SECRET` en `apps/api/.env`.
- **Docker**: `docker compose up -d` (db + pgAdmin); `node apps/api/src/migrate.js` para migraciones.
- **Servidor**: `node apps/api/src/server.js` (o `docker compose restart api`).
- **Scheduler**: se inicia en `server.js` (`require('./jobs/scheduler').start()`).
