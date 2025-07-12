const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../app');
const Notification = require('../../models/Notification');
const Equipment = require('../../models/Equipment');
const Device = require('../../models/Device');
const Farm = require('../../models/Farm');
const User = require('../../models/User');
const { generateToken, createTestUser, createTestFarm, createTestEquipment, createTestDevice, createTestNotification } = require('../utils/testHelpers');

describe('Notification Routes', () => {
  let server;
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let testFarm;
  let userFarm;
  let testEquipment;
  let testDevice;

  beforeAll(async () => {
    // Crear usuarios de prueba con emails únicos
    adminUser = await createTestUser({ 
      role: 'Administrador',
      email: `admin-notification-${Date.now()}@example.com`
    });
    regularUser = await createTestUser({ 
      role: 'Ganadero',
      email: `user-notification-${Date.now() + 1}@example.com`
    });
    
    // Crear tokens
    adminToken = generateToken(adminUser);
    userToken = generateToken(regularUser);
  });

  beforeEach(async () => {
    // Limpiar notifications antes de cada test
    await Notification.deleteMany({});
    await Equipment.deleteMany({});
    await Device.deleteMany({});
    
    // Recrear usuarios si no existen (ya que afterEach en setup.js los borra)
    if (!await User.findById(adminUser._id)) {
      adminUser = await createTestUser({ 
        role: 'Administrador',
        email: `admin-notification-${Date.now()}@example.com`
      });
      adminToken = generateToken(adminUser);
    }
    if (!await User.findById(regularUser._id)) {
      regularUser = await createTestUser({ 
        role: 'Ganadero',
        email: `user-notification-${Date.now() + 1}@example.com`
      });
      userToken = generateToken(regularUser);
    }
    
    // Recrear granjas, equipment y device antes de cada test
    testFarm = await createTestFarm({ users: [adminUser._id] });
    userFarm = await createTestFarm({ users: [regularUser._id] });
    
    // Crear equipment y device de prueba
    testEquipment = await createTestEquipment({
      name: 'Equipo Test',
      type: 'Tanque de leche',
      farm: testFarm._id
    });
    
    testDevice = await createTestDevice({
      boardId: `DEVICE${Date.now()}`,
      type: 'Monitor de leche',
      farm: testFarm._id
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Farm.deleteMany({});
    await Equipment.deleteMany({});
    await Device.deleteMany({});
    await Notification.deleteMany({});
  });

  describe('GET /list', () => {
    beforeEach(async () => {
      // Crear notificaciones de prueba
      await createTestNotification({
        type: 'info',
        message: 'Información del sistema',
        farm: testFarm._id,
        equipment: testEquipment._id,
        device: testDevice._id,
        read: []
      });
      
      await createTestNotification({
        type: 'warning',
        message: 'Advertencia de temperatura',
        farm: testFarm._id,
        equipment: testEquipment._id,
        read: [{ userId: adminUser._id, read: true, readDate: new Date() }]
      });
      
      await createTestNotification({
        type: 'error',
        message: 'Error de conexión',
        farm: userFarm._id,
        device: testDevice._id,
        read: []
      });
    });

    it('should get notification list successfully for admin with farm filter', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body).toHaveProperty('stats');
      expect(Array.isArray(response.body.notifications)).toBe(true);
      expect(response.body.notifications.length).toBeGreaterThan(0);
      expect(response.body.stats.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&page=1&limit=1`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBeLessThanOrEqual(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&searchTerm=temperatura`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBe(1);
      expect(response.body.notifications[0].message).toContain('temperatura');
    });

    it('should filter by notification type', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&type=warning`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.notifications.forEach(notification => {
        expect(notification.type).toBe('warning');
      });
    });

    it('should filter by read status', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&read=false`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.notifications.forEach(notification => {
        expect(notification.read).toBe(false);
      });
    });

    it('should calculate statistics correctly', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.stats).toHaveProperty('total');
      expect(response.body.stats).toHaveProperty('info');
      expect(response.body.stats).toHaveProperty('warning');
      expect(response.body.stats).toHaveProperty('error');
      expect(response.body.stats).toHaveProperty('unread');
      expect(response.body.stats.total).toBeGreaterThan(0);
    });

    it('should only show notifications from user farms for regular users', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${userFarm._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBe(1);
      expect(response.body.notifications[0].type).toBe('error');
    });

    it('should deny access to farms user does not own', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Debe devolver lista vacía ya que el usuario no tiene acceso a esa granja
      expect(response.body.notifications.length).toBe(0);
      expect(response.body.stats.total).toBe(0);
    });

    it('should return empty results when no farm filter provided', async () => {
      const response = await request(app)
        .get('/notification/list')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBe(0);
      expect(response.body.stats.total).toBe(0);
    });

    it('should handle multiple farm filters', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id},${userFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBeGreaterThan(0);
    });

    it('should handle multiple type filters', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&type=info,warning`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.notifications.forEach(notification => {
        expect(['info', 'warning']).toContain(notification.type);
      });
    });

    it('should handle "otros" type filter', async () => {
      // Crear una notificación con tipo personalizado
      await createTestNotification({
        type: 'custom',
        message: 'Notificación personalizada',
        farm: testFarm._id,
        read: []
      });

      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&type=otros`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.notifications.forEach(notification => {
        expect(['info', 'warning', 'error']).not.toContain(notification.type);
      });
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/notification/list')
        .expect(401);
    });

    it('should format notification data correctly', async () => {
      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const notification = response.body.notifications[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('read');
      expect(notification).toHaveProperty('farm');
      expect(notification).toHaveProperty('equipment');
      expect(notification).toHaveProperty('device');
      expect(notification).toHaveProperty('createdAt');
    });
  });

  describe('PUT /:id/mark-read', () => {
    let testNotification;

    beforeEach(async () => {
      testNotification = await createTestNotification({
        type: 'info',
        message: 'Notificación para marcar como leída',
        farm: testFarm._id,
        equipment: testEquipment._id,
        read: []
      });
    });

    it('should mark notification as read successfully for admin', async () => {
      const response = await request(app)
        .put(`/notification/${testNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBe('Notificación marcada como leída');
      expect(response.body.success).toBe(true);

      // Verificar que se marcó como leída en la BD
      const updatedNotification = await Notification.findById(testNotification._id);
      const readInfo = updatedNotification.read.find(r => r.userId.toString() === adminUser._id.toString());
      expect(readInfo).toBeTruthy();
      expect(readInfo.read).toBe(true);
      expect(readInfo.readDate).toBeTruthy();
    });

    it('should update existing read status', async () => {
      // Marcar como no leída primero
      testNotification.read.push({ 
        userId: adminUser._id, 
        read: false, 
        readDate: new Date() 
      });
      await testNotification.save();

      const response = await request(app)
        .put(`/notification/${testNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que se actualizó el estado existente
      const updatedNotification = await Notification.findById(testNotification._id);
      const readInfo = updatedNotification.read.find(r => r.userId.toString() === adminUser._id.toString());
      expect(readInfo.read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/notification/${fakeId}/mark-read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.message).toBe('Notificación no encontrada');
    });

    it('should deny access for users without farm access', async () => {
      const response = await request(app)
        .put(`/notification/${testNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401);

      expect(response.body.message).toBe('No tienes acceso a esta notificación');
    });

    it('should allow users to mark notifications from their farms', async () => {
      // Crear notificación en granja del usuario
      const userNotification = await createTestNotification({
        type: 'warning',
        message: 'Notificación del usuario',
        farm: userFarm._id,
        read: []
      });

      const response = await request(app)
        .put(`/notification/${userNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar en BD
      const updatedNotification = await Notification.findById(userNotification._id);
      const readInfo = updatedNotification.read.find(r => r.userId.toString() === regularUser._id.toString());
      expect(readInfo.read).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/notification/${testNotification._id}/mark-read`)
        .expect(401);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle database errors gracefully on list', async () => {
      // Simular error de base de datos desconectando
      await mongoose.disconnect();

      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error interno del servidor');

      // Reconectar para otros tests
      await mongoose.connect(process.env.MONGODB_URI);
    });

    it('should handle database errors gracefully on mark-read', async () => {
      const testNotification = await createTestNotification({
        type: 'info',
        message: 'Test notification',
        farm: testFarm._id,
        read: []
      });

      // Simular error de base de datos desconectando
      await mongoose.disconnect();

      const response = await request(app)
        .put(`/notification/${testNotification._id}/mark-read`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error interno del servidor');

      // Reconectar para otros tests
      await mongoose.connect(process.env.MONGODB_URI);
    });

    it('should handle invalid ObjectId in mark-read', async () => {
      const response = await request(app)
        .put('/notification/invalid-id/mark-read')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(500);

      expect(response.body.message).toBe('Error interno del servidor');
    });

    it('should handle invalid farm filter', async () => {
      const response = await request(app)
        .get('/notification/list?farm=invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBe(0);
    });

    it('should handle empty farm list for regular user', async () => {
      // Crear usuario sin granjas (usar rol válido del enum)
      const userWithoutFarms = await createTestUser({ role: 'Ganadero' });
      const tokenWithoutFarms = generateToken(userWithoutFarms);

      const response = await request(app)
        .get('/notification/list?farm=all')
        .set('Authorization', `Bearer ${tokenWithoutFarms}`)
        .expect(200);

      expect(response.body.notifications.length).toBe(0);
      expect(response.body.stats.total).toBe(0);
    });

    it('should handle notifications without farm reference', async () => {
      // Crear notificación sin referencia a granja
      const orphanNotification = await createTestNotification({
        type: 'info',
        message: 'Notificación huérfana',
        read: []
        // Sin farm
      });

      const response = await request(app)
        .get('/notification/list?farm=all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // La notificación huérfana no debería aparecer ya que no tiene farm
      expect(response.body.notifications.length).toBe(0);
    });

    it('should handle large datasets with proper pagination', async () => {
      // Crear muchas notificaciones
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(createTestNotification({
          type: 'info',
          message: `Notificación ${i}`,
          farm: testFarm._id,
          read: []
        }));
      }
      await Promise.all(promises);

      const response = await request(app)
        .get(`/notification/list?farm=${testFarm._id}&limit=5`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.notifications.length).toBe(5);
      expect(response.body.pagination.totalPages).toBeGreaterThan(1);
      expect(response.body.pagination.hasNext).toBe(true);
    });
  });
});
