node apps/api/src/db/migrate.js
node apps/api/src/server.js

node ".\apps\api\src\db\migrate.js" ####
node ".\apps\api\src\server.js" ####

docker compose stop api
docker-compose down
docker-compose up -d --build

Set-Location "C:\Users\Admin\OneDrive - Estudiantes ITCR\Escritorio\Code_Proyecto Admin\Gestion_Laboratorios_Academicos"

# Reportes de excel
npm i exceljs pdfkit


//para ver los usuarios que hay
docker compose exec -T db psql -U labtec -d labtec -c "SELECT id, role, email FROM users ORDER BY created_at DESC LIMIT 20;"

//Reset total (borrón y cuenta nueva)
docker compose exec -T db psql -U labtec -d labtec -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

http://localhost:8080/api/auth/register
{
  "email": "prueba2@estudiantec.cr",
  "password": "ClaveFuerte!123",
  "role": "student",
  "full_name": "Nombre Apellido",
  "id_code": "2022437948",
  "career_or_department": "Ing. en Computación",
  "phone": "+50688888888"
}


# Ver datos (chequeo rápido)
# Listar tablas de tu esquema público
docker compose exec -T db psql -U labtec -d labtec -c "\dt public.*"

# Ver estructura de una tabla (ej.: users)
docker compose exec -T db psql -U labtec -d labtec -c "\d+ public.users"

# Ver registros recientes (ej.: users, resources, requests)
docker compose exec -T db psql -U labtec -d labtec -c "SELECT id, role, email, full_name, created_at FROM public.users ORDER BY created_at DESC LIMIT 50;"
docker compose exec -T db psql -U labtec -d labtec -c "SELECT id, type, name, code, status, stock, min_stock FROM public.resources ORDER BY updated_at DESC LIMIT 50;"
docker compose exec -T db psql -U labtec -d labtec -c "SELECT id, user_id, lab_id, status, purpose, created_at FROM public.requests ORDER BY created_at DESC LIMIT 50;"


# eliminar datos “Suave”: TRUNCATE de todas las tablas (mantiene el esquema)
docker compose exec -T db psql -U labtec -d labtec -c ^
"DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT quote_ident(schemaname)||'.'||quote_ident(tablename)
    FROM pg_tables
    WHERE schemaname='public'
  LOOP
    EXECUTE 'TRUNCATE TABLE '|| t ||' RESTART IDENTITY CASCADE';
  END LOOP;
END$$;"



POST /api/maintenance/schedule


{
  "resourceId": "UUID",
  "labId": "UUID",
  "type": "PREVENTIVO | CORRECTIVO",
  "scheduledAt": "2025-09-30T14:00:00Z",
  "technicianId": "UUID", 
  "notes": "Chequeo general previo a prácticas de laboratorio"
}


{
  "email": "jocsanadmin@tec.ac.cr",
  "password": "ClaveFuerte!123",
  "role": "admin",
  "full_name": "jocsan Perez",
  "id_code": "2022437948",
  "career_or_department": "Ing. en Computación",
  "phone": "+50688888888"
}


docker compose exec -T db psql -U labtec -d labtec -c `
"INSERT INTO users (role, full_name, id_code, career_or_department, email, phone, password_hash)
 VALUES ('TECH','Tech Tester','T-001','LabOps','tech2@test.cr','+50670000000','x') RETURNING id;"

# crear un lab
 docker compose exec -T db psql -U labtec -d labtec -c "INSERT INTO laboratories (name, code, school, location) VALUES ('Lab Electrónica','ELEC-01','EIC','Edif B-201') RETURNING id, name;"
 # id 87302ef1-11f7-40b1-bc6b-9987746d2b4b

| Endpoint                  | Qué hace                                        | Query params                       |       |
| ------------------------- | ----------------------------------------------- | ---------------------------------- | ----- |
| `GET /usage`              | Recursos más utilizados y usuarios frecuentes   | `from`, `to`, `labId`, `limit`     |       |
| `GET /inventory`          | Estado de stock, críticos y consumo por periodo | `from`, `to`, `labId`              |       |
| `GET /maintenance`        | Downtime promedio y frecuencia de reparaciones  | `from`, `to`, `labId`              |       |
| `GET /usage/export`       | Exporta uso (PDF/Excel)                         | `from`, `to`, `labId`, `format=pdf | xlsx` |
| `GET /inventory/export`   | Exporta inventario (PDF/Excel)                  | idem                               |       |
| `GET /maintenance/export` | Exporta mantenimiento (PDF/Excel)               | idem                               |       |
