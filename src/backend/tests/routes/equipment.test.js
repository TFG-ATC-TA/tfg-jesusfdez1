const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Equipment = require('../../models/Equipment');
const Farm = require('../../models/Farm');
const User = require('../../models/User');
const { generateToken, createTestUser, createTestFarm, createTestEquipment } = require('../utils/testHelpers');

describe('Equipment Routes', () => {
  let server;
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testFarm;
  let userFarm;

  beforeAll(async () => {
    // Solo crear usuarios una vez ya que se recrearán las granjas en beforeEach
    adminUser = await createTestUser({ 
      role: 'Administrador',
      email: `admin-${Date.now()}@example.com`
    });
    regularUser = await createTestUser({ 
      role: 'Ganadero',
      email: `user-${Date.now() + 1}@example.com`
    });
    
    // Crear tokens
    adminToken = generateToken(adminUser);
    userToken = generateToken(regularUser);
  });

  beforeEach(async () => {
    // Limpiar equipment antes de cada test
    await Equipment.deleteMany({});
    
    // Recrear usuarios si no existen (ya que afterEach en setup.js los borra)
    if (!await User.findById(adminUser._id)) {
      adminUser = await createTestUser({ 
        role: 'Administrador',
        email: `admin-${Date.now()}@example.com`
      });
      adminToken = generateToken(adminUser);
    }
    if (!await User.findById(regularUser._id)) {
      regularUser = await createTestUser({ 
        role: 'Ganadero',
        email: `user-${Date.now()}@example.com`
      });
      userToken = generateToken(regularUser);
    }
    
    // Recrear granjas antes de cada test (ya que afterEach en setup.js las borra)
    testFarm = await createTestFarm({ users: [adminUser._id] });
    userFarm = await createTestFarm({ users: [regularUser._id] });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Farm.deleteMany({});
    await Equipment.deleteMany({});
  });

  describe('GET /listName', () => {
    beforeEach(async () => {
      await createTestEquipment({ 
        name: 'Tanque 1', 
        type: 'Tanque de leche',
        farm: testFarm._id 
      });
      await createTestEquipment({ 
        name: 'Ordeñadora 1', 
        type: 'Estación de lavado',
        farm: testFarm._id 
      });
    });

    it('should get equipment names successfully for admin', async () => {
      const response = await request(app)
        .get('/equipment/listName')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/equipment/listName')
        .expect(401);
    });
  });

  describe('GET /list', () => {
    beforeEach(async () => {
      // Crear equipos para diferentes granjas
      await createTestEquipment({ 
        name: 'Tanque 1', 
        type: 'Tanque de leche',
        farm: testFarm._id,
        devices: []
      });
      await createTestEquipment({ 
        name: 'Tanque 2', 
        type: 'Tanque de leche',
        farm: userFarm._id,
        devices: []
      });
      await createTestEquipment({ 
        name: 'Ordeñadora 1', 
        type: 'Estación de lavado',
        farm: testFarm._id,
        devices: []
      });
    });

    it('should get equipment list successfully for admin', async () => {
      const response = await request(app)
        .get('/equipment/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('totalItems');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('currentPage');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter equipment by user farms for regular users', async () => {
      const response = await request(app)
        .get('/equipment/list')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].name).toBe('Tanque 2');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/equipment/list?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.currentPage).toBe(1);
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get('/equipment/list?searchTerm=Tanque')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach(equipment => {
        expect(equipment.name.toLowerCase()).toContain('tanque');
      });
    });

    it('should support filtering by type', async () => {
      const response = await request(app)
        .get('/equipment/list?types=Tanque de leche')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.forEach(equipment => {
        expect(equipment.type).toBe('Tanque de leche');
      });
    });

    it('should filter by specific farm', async () => {
      const response = await request(app)
        .get(`/equipment/list?farmId=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/equipment/list')
        .expect(401);
    });
  });

  describe('GET /listTanks', () => {
    beforeEach(async () => {
      await createTestEquipment({ 
        name: 'Tanque de Leche 1', 
        type: 'Tanque de leche',
        farm: testFarm._id 
      });
      await createTestEquipment({ 
        name: 'Tanque de Leche 2', 
        type: 'Tanque de leche',
        farm: testFarm._id 
      });
      await createTestEquipment({ 
        name: 'Ordeñadora 1', 
        type: 'Estación de lavado',
        farm: testFarm._id 
      });
    });

    it('should get tanks list successfully for admin', async () => {
      const response = await request(app)
        .get(`/equipment/listTanks?farmId=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      response.body.forEach(tank => {
        expect(tank).toHaveProperty('_id');
        expect(tank).toHaveProperty('name');
      });
    });

    it('should require farmId parameter', async () => {
      const response = await request(app)
        .get('/equipment/listTanks')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.message).toBe('Se requiere el ID de la granja');
    });

    it('should return 404 for non-existent farm', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/equipment/listTanks?farmId=${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Granja no encontrada');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .get(`/equipment/listTanks?farmId=${testFarm._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a esta granja');
    });

    it('should allow access for users with farm access', async () => {
      const response = await request(app)
        .get(`/equipment/listTanks?farmId=${userFarm._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /', () => {
    it('should create equipment successfully for admin', async () => {
      const equipmentData = {
        name: 'Nuevo Tanque',
        type: 'Tanque de leche',
        description: 'Tanque de prueba',
        farm: testFarm._id,
        devices: []
      };

      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(equipmentData)
        .expect(201);

      expect(response.body.message).toBe('Equipo creado con éxito');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.name).toBe('Nuevo Tanque');

      // Verificar que el equipo fue creado en la BD
      const createdEquipment = await Equipment.findOne({ name: 'Nuevo Tanque' });
      expect(createdEquipment).toBeTruthy();
    });

    it('should create washing station with associated tanks', async () => {
      // Crear un tanque primero
      const tank = await createTestEquipment({ 
        name: 'Tanque Asociado', 
        type: 'Tanque de leche',
        farm: testFarm._id 
      });

      const equipmentData = {
        name: 'Estación de Lavado',
        type: 'Estación de lavado',
        description: 'Estación de prueba',
        farm: testFarm._id,
        devices: [],
        associatedTanks: [tank._id]
      };

      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(equipmentData)
        .expect(201);

      expect(response.body.data.associatedTanks).toHaveLength(1);
      expect(response.body.data.associatedTanks[0].toString()).toBe(tank._id.toString());
    });

    it('should require mandatory fields', async () => {
      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.message).toBe('Nombre, tipo y granja son obligatorios');
    });

    it('should validate name format', async () => {
      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'a', // Muy corto
          type: 'Tanque de leche',
          farm: testFarm._id
        })
        .expect(400);

      expect(response.body.message).toContain('entre 2 y 50 caracteres');
    });

    it('should return 404 for non-existent farm', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Nuevo Equipo',
          type: 'Tanque de leche',
          farm: fakeId
        })
        .expect(404);

      expect(response.body.message).toBe('Granja no encontrada');
    });

    it('should allow users to create equipment in their farms', async () => {
      const equipmentData = {
        name: 'Equipo Usuario',
        type: 'Tanque de leche',
        description: 'Equipo de usuario',
        farm: userFarm._id
      };

      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(equipmentData)
        .expect(201);

      expect(response.body.message).toBe('Equipo creado con éxito');
    });

    it('should deny access to farms user does not own', async () => {
      const equipmentData = {
        name: 'Equipo No Permitido',
        type: 'Tanque de leche',
        farm: testFarm._id // Usuario no tiene acceso a esta granja
      };

      const response = await request(app)
        .post('/equipment')
        .set('Authorization', `Bearer ${userToken}`)
        .send(equipmentData)
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a esta granja');
    });
  });

  describe('GET /:id', () => {
    let testEquipment;

    beforeEach(async () => {
      testEquipment = await createTestEquipment({
        name: 'Equipo Test',
        type: 'Tanque de leche',
        description: 'Descripción test',
        farm: testFarm._id
      });
    });

    it('should get equipment details successfully for admin', async () => {
      const response = await request(app)
        .get(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body._id).toBe(testEquipment._id.toString());
      expect(response.body.name).toBe('Equipo Test');
      expect(response.body.type).toBe('Tanque de leche');
      expect(response.body.description).toBe('Descripción test');
      expect(response.body.farm).toHaveProperty('name');
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/equipment/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Equipo no encontrado');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .get(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a este equipo');
    });
  });

  describe('PUT /:id', () => {
    let testEquipment;

    beforeEach(async () => {
      testEquipment = await createTestEquipment({
        name: 'Equipo Original',
        type: 'Tanque de leche',
        description: 'Descripción original',
        farm: testFarm._id
      });
    });

    it('should update equipment successfully for admin', async () => {
      const updateData = {
        name: 'Equipo Actualizado',
        type: 'Estación de lavado',
        description: 'Descripción actualizada',
        devices: []
      };

      const response = await request(app)
        .put(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Equipo actualizado con éxito');
      expect(response.body.data.name).toBe('Equipo Actualizado');

      // Verificar en BD
      const updatedEquipment = await Equipment.findById(testEquipment._id);
      expect(updatedEquipment.name).toBe('Equipo Actualizado');
      expect(updatedEquipment.type).toBe('Estación de lavado');
    });

    it('should handle washing station tank associations', async () => {
      const tank = await createTestEquipment({ 
        name: 'Tanque Asociado', 
        type: 'Tanque de leche',
        farm: testFarm._id 
      });

      const updateData = {
        type: 'Estación de lavado',
        associatedTanks: [tank._id]
      };

      const response = await request(app)
        .put(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.type).toBe('Estación de lavado');
      expect(response.body.data.associatedTanks).toHaveLength(1);
    });

    it('should clear associated tanks for non-washing stations', async () => {
      // Crear un tanque real para asociar
      const tank = await createTestEquipment({ 
        name: 'Tanque Real', 
        type: 'Tanque de leche',
        farm: testFarm._id 
      });

      // Primero crear como estación de lavado
      testEquipment.type = 'Estación de lavado';
      testEquipment.associatedTanks = [tank._id];
      await testEquipment.save();

      const updateData = {
        type: 'Tanque de leche'
      };

      const response = await request(app)
        .put(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.type).toBe('Tanque de leche');
      expect(response.body.data.associatedTanks).toHaveLength(0);
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/equipment/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.message).toBe('Equipo no encontrado');
    });

    it('should validate name format', async () => {
      const response = await request(app)
        .put(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'x' })
        .expect(400);

      expect(response.body.message).toContain('entre 2 y 50 caracteres');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .put(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a este equipo');
    });
  });

  describe('DELETE /:id', () => {
    let testEquipment;

    beforeEach(async () => {
      testEquipment = await createTestEquipment({
        name: 'Equipo a Eliminar',
        type: 'Tanque de leche',
        farm: testFarm._id
      });
    });

    it('should delete equipment successfully for admin', async () => {
      const response = await request(app)
        .delete(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Equipo eliminado con éxito');

      // Verificar que fue eliminado de la BD
      const deletedEquipment = await Equipment.findById(testEquipment._id);
      expect(deletedEquipment).toBeNull();
    });

    it('should return 404 for non-existent equipment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/equipment/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Equipo no encontrado');
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .delete(`/equipment/${testEquipment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes permisos para eliminar este equipo');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Simular error de base de datos desconectando
      await mongoose.disconnect();

      const response = await request(app)
        .get('/equipment/list')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error obteniendo datos de los equipos');

      // Reconectar para otros tests
      await mongoose.connect(process.env.MONGODB_URI);
    });
  });
});
