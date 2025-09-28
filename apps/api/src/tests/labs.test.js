const request = require('supertest');
const app = require('../app');
const db = require('../db/pool');

// Mock de autenticación para las pruebas
const mockAuth = (req, res, next) => {
  req.user = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    role: 'admin',
    email: 'admin@tec.ac.cr'
  };
  next();
};

// Aplicar mock de autenticación
app.use(mockAuth);

describe('Módulo 1.1: Gestión de Perfiles de Laboratorio', () => {
  let testLabId;
  let testDepartmentId;

  beforeAll(async () => {
    // Crear departamento de prueba
    const deptResult = await db.query(
      'INSERT INTO school_departments (name, email_domain, description) VALUES ($1, $2, $3) RETURNING id',
      ['Escuela de Prueba', 'prueba.cr', 'Departamento para pruebas']
    );
    testDepartmentId = deptResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    if (testLabId) {
      await db.query('DELETE FROM labs WHERE id = $1', [testLabId]);
    }
    if (testDepartmentId) {
      await db.query('DELETE FROM school_departments WHERE id = $1', [testDepartmentId]);
    }
  });

  describe('GET /api/labs', () => {
    it('debería obtener todos los laboratorios', async () => {
      const response = await request(app)
        .get('/api/labs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debería filtrar laboratorios por departamento', async () => {
      const response = await request(app)
        .get(`/api/labs?school_dept_id=${testDepartmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debería filtrar laboratorios por estado activo', async () => {
      const response = await request(app)
        .get('/api/labs?is_active=true')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debería buscar laboratorios por texto', async () => {
      const response = await request(app)
        .get('/api/labs?search=quimica')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/labs', () => {
    it('debería crear un nuevo laboratorio', async () => {
      const labData = {
        name: 'Laboratorio de Prueba',
        internal_code: 'LAB-PRUEBA-001',
        school_dept_id: testDepartmentId,
        email_contact: 'lab.prueba@tec.ac.cr',
        location: 'Edificio de Prueba, Sala 001',
        description: 'Laboratorio para pruebas unitarias',
        capacity_max: 20,
        responsibles: [
          {
            full_name: 'Dr. Prueba Test',
            position_title: 'Encargado de Pruebas',
            phone: '+506 2550-0000',
            email: 'prueba.test@tec.ac.cr',
            is_primary: true
          }
        ],
        policies: {
          academic_req: 'Curso de Pruebas',
          safety_req: 'Equipos de protección',
          notes: 'Notas de prueba'
        },
        open_hours: [
          {
            weekday: 1,
            time_start: '08:00',
            time_end: '17:00'
          }
        ]
      };

      const response = await request(app)
        .post('/api/labs')
        .send(labData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(labData.name);
      testLabId = response.body.data.id;
    });

    it('debería fallar con datos inválidos', async () => {
      const invalidData = {
        name: '', // Nombre vacío
        internal_code: 'LAB-PRUEBA-002',
        school_dept_id: testDepartmentId,
        email_contact: 'invalid-email', // Email inválido
        location: 'Edificio de Prueba, Sala 002'
      };

      const response = await request(app)
        .post('/api/labs')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/labs/:id', () => {
    it('debería obtener un laboratorio específico', async () => {
      if (!testLabId) {
        // Crear laboratorio de prueba si no existe
        const labData = {
          name: 'Laboratorio de Prueba GET',
          internal_code: 'LAB-PRUEBA-GET',
          school_dept_id: testDepartmentId,
          email_contact: 'lab.prueba.get@tec.ac.cr',
          location: 'Edificio de Prueba, Sala GET'
        };

        const createResponse = await request(app)
          .post('/api/labs')
          .send(labData);
        
        testLabId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/labs/${testLabId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testLabId);
      expect(response.body.data.responsibles).toBeDefined();
      expect(response.body.data.policies).toBeDefined();
      expect(response.body.data.open_hours).toBeDefined();
    });

    it('debería fallar con ID inválido', async () => {
      const response = await request(app)
        .get('/api/labs/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería fallar con laboratorio no encontrado', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      const response = await request(app)
        .get(`/api/labs/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/labs/:id', () => {
    it('debería actualizar un laboratorio', async () => {
      if (!testLabId) {
        // Crear laboratorio de prueba si no existe
        const labData = {
          name: 'Laboratorio de Prueba PUT',
          internal_code: 'LAB-PRUEBA-PUT',
          school_dept_id: testDepartmentId,
          email_contact: 'lab.prueba.put@tec.ac.cr',
          location: 'Edificio de Prueba, Sala PUT'
        };

        const createResponse = await request(app)
          .post('/api/labs')
          .send(labData);
        
        testLabId = createResponse.body.data.id;
      }

      const updateData = {
        name: 'Laboratorio de Prueba Actualizado',
        description: 'Descripción actualizada',
        capacity_max: 30
      };

      const response = await request(app)
        .put(`/api/labs/${testLabId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });
  });

  describe('POST /api/labs/:id/responsibles', () => {
    it('debería agregar un responsable', async () => {
      if (!testLabId) {
        // Crear laboratorio de prueba si no existe
        const labData = {
          name: 'Laboratorio de Prueba RESP',
          internal_code: 'LAB-PRUEBA-RESP',
          school_dept_id: testDepartmentId,
          email_contact: 'lab.prueba.resp@tec.ac.cr',
          location: 'Edificio de Prueba, Sala RESP'
        };

        const createResponse = await request(app)
          .post('/api/labs')
          .send(labData);
        
        testLabId = createResponse.body.data.id;
      }

      const responsibleData = {
        action: 'add',
        responsible: {
          full_name: 'Ing. Responsable Test',
          position_title: 'Técnico de Pruebas',
          phone: '+506 2550-0001',
          email: 'responsable.test@tec.ac.cr',
          is_primary: false
        }
      };

      const response = await request(app)
        .post(`/api/labs/${testLabId}/responsibles`)
        .send(responsibleData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.full_name).toBe(responsibleData.responsible.full_name);
    });
  });

  describe('PUT /api/labs/:id/policies', () => {
    it('debería actualizar políticas del laboratorio', async () => {
      if (!testLabId) {
        // Crear laboratorio de prueba si no existe
        const labData = {
          name: 'Laboratorio de Prueba POL',
          internal_code: 'LAB-PRUEBA-POL',
          school_dept_id: testDepartmentId,
          email_contact: 'lab.prueba.pol@tec.ac.cr',
          location: 'Edificio de Prueba, Sala POL'
        };

        const createResponse = await request(app)
          .post('/api/labs')
          .send(labData);
        
        testLabId = createResponse.body.data.id;
      }

      const policiesData = {
        academic_req: 'Requisitos académicos actualizados',
        safety_req: 'Requisitos de seguridad actualizados',
        notes: 'Notas actualizadas'
      };

      const response = await request(app)
        .put(`/api/labs/${testLabId}/policies`)
        .send(policiesData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/labs/:id/open-hours', () => {
    it('debería actualizar horarios del laboratorio', async () => {
      if (!testLabId) {
        // Crear laboratorio de prueba si no existe
        const labData = {
          name: 'Laboratorio de Prueba HRS',
          internal_code: 'LAB-PRUEBA-HRS',
          school_dept_id: testDepartmentId,
          email_contact: 'lab.prueba.hrs@tec.ac.cr',
          location: 'Edificio de Prueba, Sala HRS'
        };

        const createResponse = await request(app)
          .post('/api/labs')
          .send(labData);
        
        testLabId = createResponse.body.data.id;
      }

      const hoursData = {
        action: 'replace',
        hours: [
          {
            weekday: 1,
            time_start: '08:00',
            time_end: '17:00'
          },
          {
            weekday: 2,
            time_start: '08:00',
            time_end: '17:00'
          }
        ]
      };

      const response = await request(app)
        .post(`/api/labs/${testLabId}/open-hours`)
        .send(hoursData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/labs/:id/history', () => {
    it('debería obtener historial del laboratorio', async () => {
      if (!testLabId) {
        // Crear laboratorio de prueba si no existe
        const labData = {
          name: 'Laboratorio de Prueba HIST',
          internal_code: 'LAB-PRUEBA-HIST',
          school_dept_id: testDepartmentId,
          email_contact: 'lab.prueba.hist@tec.ac.cr',
          location: 'Edificio de Prueba, Sala HIST'
        };

        const createResponse = await request(app)
          .post('/api/labs')
          .send(labData);
        
        testLabId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/labs/${testLabId}/history`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });
  });
});
