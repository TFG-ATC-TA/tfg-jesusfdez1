const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Collection = require('../../models/Collection');
const Equipment = require('../../models/Equipment');
const Farm = require('../../models/Farm');
const User = require('../../models/User');
const { generateToken, createTestUser, createTestFarm, createTestEquipment, createTestCollection } = require('../utils/testHelpers');

describe('Collection Routes', () => {
  let server;
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testFarm;
  let userFarm;
  let testTank;
  let userTank;

  beforeAll(async () => {
    // Crear usuarios de prueba con emails únicos
    adminUser = await createTestUser({ 
      role: 'Administrador',
      email: `admin-collection-${Date.now()}@example.com`
    });
    regularUser = await createTestUser({ 
      role: 'Ganadero',
      email: `user-collection-${Date.now() + 1}@example.com`
    });
    
    // Crear tokens
    adminToken = generateToken(adminUser);
    userToken = generateToken(regularUser);
  });

  beforeEach(async () => {
    // Limpiar collections antes de cada test
    await Collection.deleteMany({});
    await Equipment.deleteMany({});
    
    // Recrear usuarios si no existen (ya que afterEach en setup.js los borra)
    if (!await User.findById(adminUser._id)) {
      adminUser = await createTestUser({ 
        role: 'Administrador',
        email: `admin-collection-${Date.now()}@example.com`
      });
      adminToken = generateToken(adminUser);
    }
    if (!await User.findById(regularUser._id)) {
      regularUser = await createTestUser({ 
        role: 'Ganadero',
        email: `user-collection-${Date.now() + 1}@example.com`
      });
      userToken = generateToken(regularUser);
    }
    
    // Recrear granjas y tanques antes de cada test
    testFarm = await createTestFarm({ users: [adminUser._id] });
    userFarm = await createTestFarm({ users: [regularUser._id] });
    
    // Crear tanques de prueba
    testTank = await createTestEquipment({
      name: 'Tanque Test',
      type: 'Tanque de leche',
      farm: testFarm._id
    });
    
    userTank = await createTestEquipment({
      name: 'Tanque Usuario',
      type: 'Tanque de leche',
      farm: userFarm._id
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Farm.deleteMany({});
    await Equipment.deleteMany({});
    await Collection.deleteMany({});
  });

  describe('GET /list', () => {
    beforeEach(async () => {
      // Crear recogidas de prueba
      await createTestCollection({
        sampleLabel: 'SAMPLE001',
        collectionCompany: 'Empresa A',
        farmId: testFarm._id,
        litersPerTank: [{ tankId: testTank._id, liters: 100 }]
      });
      
      await createTestCollection({
        sampleLabel: 'SAMPLE002',
        collectionCompany: 'Empresa B',
        farmId: userFarm._id,
        litersPerTank: [{ tankId: userTank._id, liters: 150 }]
      });
    });

    it('should get collection list successfully for admin', async () => {
      const response = await request(app)
        .get('/collection/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/collection/list?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.currentPage).toBe(1);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/collection/list?searchTerm=SAMPLE001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].sampleLabel).toBe('SAMPLE001');
    });

    it('should filter by farm when farmId provided', async () => {
      const response = await request(app)
        .get(`/collection/list?farmId=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].sampleLabel).toBe('SAMPLE001');
    });

    it('should return 404 for non-existent farm', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/collection/list?farmId=${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Granja no encontrada');
    });

    it('should deny access to farm user does not own', async () => {
      const response = await request(app)
        .get(`/collection/list?farmId=${testFarm._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a esta granja');
    });

    it('should allow access to own farm', async () => {
      const response = await request(app)
        .get(`/collection/list?farmId=${userFarm._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].sampleLabel).toBe('SAMPLE002');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/collection/list')
        .expect(401);
    });
  });

  describe('GET /:id', () => {
    let testCollection;

    beforeEach(async () => {
      testCollection = await createTestCollection({
        sampleLabel: 'DETAIL_SAMPLE',
        collectionCompany: 'Empresa Detalle',
        farmId: testFarm._id,
        litersPerTank: [{ tankId: testTank._id, liters: 200 }],
        milkTemperature: 4.5,
        inhibitorSampleTaken: true
      });
    });

    it('should get collection details successfully for admin', async () => {
      const response = await request(app)
        .get(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body._id).toBe(testCollection._id.toString());
      expect(response.body.sampleLabel).toBe('DETAIL_SAMPLE');
      expect(response.body.collectionCompany).toBe('Empresa Detalle');
      expect(response.body.milkTemperature).toBe(4.5);
      expect(response.body.inhibitorSampleTaken).toBe(true);
      expect(response.body.litersPerTank).toHaveLength(1);
    });

    it('should return 404 for non-existent collection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/collection/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Recogida de leche no encontrada');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .get(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a esta recogida de leche');
    });

    it('should require authentication', async () => {
      await request(app)
        .get(`/collection/${testCollection._id}`)
        .expect(401);
    });
  });

  describe('POST /', () => {
    it('should create collection successfully for admin', async () => {
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'NEW_SAMPLE_001',
        collectionCompany: 'Nueva Empresa',
        cisternLicensePlate: 'ABC-1234',
        driver: 'Juan Pérez',
        milkTemperature: 4.2,
        inhibitorSampleTaken: false,
        litersPerTank: [
          { tankId: testTank._id, liters: 250 }
        ],
        farmId: testFarm._id
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(collectionData)
        .expect(201);

      expect(response.body.message).toBe('Recogida de leche creada con éxito');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.sampleLabel).toBe('NEW_SAMPLE_001');

      // Verificar que se creó en la BD
      const createdCollection = await Collection.findOne({ sampleLabel: 'NEW_SAMPLE_001' });
      expect(createdCollection).toBeTruthy();
      expect(createdCollection.collectionCompany).toBe('Nueva Empresa');
    });

    it('should require mandatory fields', async () => {
      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toContain('obligatorios');
    });

    it('should prevent duplicate sample labels', async () => {
      // Crear primera recogida
      await createTestCollection({
        sampleLabel: 'DUPLICATE_SAMPLE',
        collectionCompany: 'Empresa',
        farmId: testFarm._id,
        litersPerTank: [{ tankId: testTank._id, liters: 100 }]
      });

      // Intentar crear otra con la misma etiqueta
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'DUPLICATE_SAMPLE',
        collectionCompany: 'Otra Empresa',
        litersPerTank: [{ tankId: testTank._id, liters: 150 }]
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(collectionData)
        .expect(409);

      expect(response.body.message).toBe('Ya existe una recogida con esta etiqueta de muestra');
    });

    it('should validate tank existence', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'INVALID_TANK_SAMPLE',
        collectionCompany: 'Empresa',
        litersPerTank: [{ tankId: fakeId, liters: 100 }]
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(collectionData)
        .expect(404);

      expect(response.body.message).toContain('Tanque con ID');
      expect(response.body.message).toContain('no encontrado');
    });

    it('should validate tank belongs to specified farm', async () => {
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'WRONG_FARM_SAMPLE',
        collectionCompany: 'Empresa',
        litersPerTank: [{ tankId: userTank._id, liters: 100 }],
        farmId: testFarm._id // Tanque pertenece a userFarm, no testFarm
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(collectionData)
        .expect(400);

      expect(response.body.message).toContain('no pertenece a la granja proporcionada');
    });

    it('should return 404 for non-existent farm', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'INVALID_FARM_SAMPLE',
        collectionCompany: 'Empresa',
        litersPerTank: [{ tankId: testTank._id, liters: 100 }],
        farmId: fakeId
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(collectionData)
        .expect(404);

      expect(response.body.message).toBe('Granja no encontrada');
    });

    it('should allow users to create collections in their farms', async () => {
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'USER_SAMPLE',
        collectionCompany: 'Empresa Usuario',
        litersPerTank: [{ tankId: userTank._id, liters: 120 }],
        farmId: userFarm._id
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${userToken}`)
        .send(collectionData)
        .expect(201);

      expect(response.body.message).toBe('Recogida de leche creada con éxito');
    });

    it('should deny access to farms user does not own', async () => {
      const collectionData = {
        collectionDate: new Date().toISOString(),
        sampleLabel: 'UNAUTHORIZED_SAMPLE',
        collectionCompany: 'Empresa',
        litersPerTank: [{ tankId: testTank._id, liters: 100 }],
        farmId: testFarm._id
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${userToken}`)
        .send(collectionData)
        .expect(401);

      expect(response.body.message).toBe('No tienes permiso para crear recogidas en esta granja');
    });
  });

  describe('PUT /:id', () => {
    let testCollection;

    beforeEach(async () => {
      testCollection = await createTestCollection({
        sampleLabel: 'UPDATE_SAMPLE',
        collectionCompany: 'Empresa Original',
        farmId: testFarm._id,
        litersPerTank: [{ tankId: testTank._id, liters: 100 }],
        milkTemperature: 4.0
      });
    });

    it('should update collection successfully for admin', async () => {
      const updateData = {
        sampleLabel: 'UPDATED_SAMPLE',
        collectionCompany: 'Empresa Actualizada',
        milkTemperature: 4.5,
        inhibitorSampleTaken: true,
        litersPerTank: [{ tankId: testTank._id, liters: 200 }],
        farmId: testFarm._id
      };

      const response = await request(app)
        .put(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Recogida de leche actualizada con éxito');
      expect(response.body.data.sampleLabel).toBe('UPDATED_SAMPLE');
      expect(response.body.data.collectionCompany).toBe('Empresa Actualizada');
      expect(response.body.data.milkTemperature).toBe(4.5);

      // Verificar en BD
      const updatedCollection = await Collection.findById(testCollection._id);
      expect(updatedCollection.sampleLabel).toBe('UPDATED_SAMPLE');
      expect(updatedCollection.milkTemperature).toBe(4.5);
    });

    it('should return 404 for non-existent collection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/collection/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sampleLabel: 'UPDATED' })
        .expect(404);

      expect(response.body.message).toBe('Recogida de leche no encontrada');
    });

    it('should prevent duplicate sample labels on update', async () => {
      // Crear otra recogida con etiqueta específica
      await createTestCollection({
        sampleLabel: 'EXISTING_SAMPLE',
        collectionCompany: 'Otra Empresa',
        farmId: testFarm._id,
        litersPerTank: [{ tankId: testTank._id, liters: 50 }]
      });

      // Intentar actualizar con etiqueta existente
      const response = await request(app)
        .put(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ 
          sampleLabel: 'EXISTING_SAMPLE',
          farmId: testFarm._id 
        })
        .expect(409);

      expect(response.body.message).toBe('Ya existe otra recogida con esta etiqueta de muestra');
    });

    it('should validate tank existence on update', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        litersPerTank: [{ tankId: fakeId, liters: 150 }],
        farmId: testFarm._id
      };

      const response = await request(app)
        .put(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toContain('Tanque con ID');
      expect(response.body.message).toContain('no encontrado');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .put(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ 
          sampleLabel: 'UNAUTHORIZED_UPDATE',
          farmId: testFarm._id 
        })
        .expect(401);

      expect(response.body.message).toBe('No tienes permiso para actualizar recogidas en esta granja');
    });
  });

  describe('DELETE /:id', () => {
    let testCollection;

    beforeEach(async () => {
      testCollection = await createTestCollection({
        sampleLabel: 'DELETE_SAMPLE',
        collectionCompany: 'Empresa Delete',
        farmId: testFarm._id,
        litersPerTank: [{ tankId: testTank._id, liters: 100 }]
      });
    });

    it('should delete collection successfully for admin', async () => {
      const response = await request(app)
        .delete(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Recogida de leche eliminada con éxito');

      // Verificar que fue eliminada de la BD
      const deletedCollection = await Collection.findById(testCollection._id);
      expect(deletedCollection).toBeNull();
    });

    it('should return 404 for non-existent collection', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/collection/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Recogida de leche no encontrada');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .delete(`/collection/${testCollection._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes permiso para eliminar recogidas en esta granja');
    });

    it('should allow users to delete collections from their farms', async () => {
      // Crear recogida en la granja del usuario
      const userCollection = await createTestCollection({
        sampleLabel: 'USER_DELETE_SAMPLE',
        collectionCompany: 'Empresa Usuario',
        farmId: userFarm._id,
        litersPerTank: [{ tankId: userTank._id, liters: 75 }]
      });

      const response = await request(app)
        .delete(`/collection/${userCollection._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.message).toBe('Recogida de leche eliminada con éxito');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simular error de base de datos desconectando
      await mongoose.disconnect();

      const response = await request(app)
        .get('/collection/list')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error obteniendo datos de recogidas de leche');

      // Reconectar para otros tests
      await mongoose.connect(process.env.MONGODB_URI);
    });

    it('should handle validation errors on creation', async () => {
      const invalidData = {
        collectionDate: 'invalid-date',
        sampleLabel: 'INVALID_DATA',
        collectionCompany: 'Empresa',
        litersPerTank: [{ tankId: 'invalid-id', liters: 'not-a-number' }]
      };

      const response = await request(app)
        .post('/collection')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Error al crear la recogida de leche');
    });
  });
});
