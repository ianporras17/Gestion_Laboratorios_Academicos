node apps/api/src/db/migrate.js
node apps/api/src/server.js

node ".\apps\api\src\db\migrate.js" ####
node ".\apps\api\src\server.js" ####

docker compose stop api
docker-compose down
docker-compose up -d --build

Set-Location "C:\Users\Admin\OneDrive - Estudiantes ITCR\Escritorio\Code_Proyecto Admin\Gestion_Laboratorios_Academicos"


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

$env:JWT_SECRET="labtecsecret"; node -e "console.log(require('jsonwebtoken').sign({id:'<b089f65f-e24c-4743-9a1b-3156deccdb12>', role:'TECH'}, process.env.JWT_SECRET, {expiresIn:'2h'}))"


docker compose exec -T db psql -U labtec -d labtec -c `
"INSERT INTO users (role, full_name, id_code, career_or_department, email, phone, password_hash)
 VALUES ('TECH','Tech Tester','T-001','LabOps','tech2@test.cr','+50670000000','x') RETURNING id;"

$env:JWT_SECRET="labtecsecret"; node -e "console.log(require('jsonwebtoken').sign({id:'86d702d1-e009-4748-b50c-fd96fc574561', role:'TECH'}, process.env.JWT_SECRET, {expiresIn:'2h'}))"

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijg2ZDcwMmQxLWUwMDktNDc0OC1iNTBjLWZkOTZmYzU3NDU2MSIsInJvbGUiOiJURUNIIiwiaWF0IjoxNzU4NzgyNjkzLCJleHAiOjE3NTg3ODk4OTN9.2nYynVwRlTNPR0dRLK9qQz6Dk-J2yfQqspruNH0Dkjc