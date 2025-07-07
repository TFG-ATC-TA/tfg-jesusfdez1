const mongoose = require('mongoose');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Farm = require('../../models/Farm');
const Equipment = require('../../models/Equipment');
const Device = require('../../models/Device');
const { cleanDatabase } = require('../utils/testHelpers');

describe('Notification Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Notification Creation', () => {
    test('debería crear una notificación válida', async () => {
      const notificationData = {
        type: 'ALERT',
        message: 'Temperatura alta en tanque principal',
        createdAt: new Date()
      };

      const notification = new Notification(notificationData);
      const savedNotification = await notification.save();

      expect(savedNotification._id).toBeDefined();
      expect(savedNotification.type).toBe(notificationData.type);
      expect(savedNotification.message).toBe(notificationData.message);
      expect(savedNotification.read).toEqual([]);
      expect(savedNotification.createdAt).toBeDefined();
    });

    test('debería requerir campos obligatorios', async () => {
      const notification = new Notification({});
      
      let error;
      try {
        await notification.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
      expect(error.errors.message).toBeDefined();
    });

    test('debería establecer fecha de creación automáticamente', async () => {
      const beforeSave = new Date();
      
      const notification = new Notification({
        type: 'INFO',
        message: 'Test notification'
      });
      
      const savedNotification = await notification.save();
      const afterSave = new Date();

      expect(savedNotification.createdAt).toBeDefined();
      expect(savedNotification.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime());
      expect(savedNotification.createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime());
    });

    test('debería permitir notificación sin entidades asociadas', async () => {
      const notification = new Notification({
        type: 'SYSTEM',
        message: 'Mantenimiento programado del sistema'
      });

      const savedNotification = await notification.save();
      expect(savedNotification.farm).toBeUndefined();
      expect(savedNotification.equipment).toBeUndefined();
      expect(savedNotification.device).toBeUndefined();
    });
  });

  describe('Notification Relationships', () => {
    test('debería asociar notificación con granja', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });
      await farm.save();

      const notification = new Notification({
        type: 'FARM_ALERT',
        message: 'Alerta en la granja',
        farm: farm._id
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id).populate('farm');
      expect(populatedNotification.farm._id).toEqual(farm._id);
      expect(populatedNotification.farm.name).toBe('Granja Test');
    });

    test('debería asociar notificación con equipo', async () => {
      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche'
      });
      await equipment.save();

      const notification = new Notification({
        type: 'EQUIPMENT_ALERT',
        message: 'Fallo en el equipo',
        equipment: equipment._id
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id).populate('equipment');
      expect(populatedNotification.equipment._id).toEqual(equipment._id);
      expect(populatedNotification.equipment.name).toBe('Tanque Principal');
    });

    test('debería asociar notificación con dispositivo', async () => {
      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor temperatura'
        }]
      });
      await device.save();

      const notification = new Notification({
        type: 'DEVICE_ALERT',
        message: 'Sensor desconectado',
        device: device._id
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id).populate('device');
      expect(populatedNotification.device._id).toEqual(device._id);
      expect(populatedNotification.device.boardId).toBe('DEVICE-001');
    });

    test('debería asociar múltiples entidades a la vez', async () => {
      const farm = new Farm({ name: 'Granja Test', idname: 'granja-test' });
      await farm.save();

      const equipment = new Equipment({ name: 'Tanque', type: 'Tanque de leche' });
      await equipment.save();

      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{ sensorId: 'SENSOR-001', name: 'Sensor' }]
      });
      await device.save();

      const notification = new Notification({
        type: 'COMPLEX_ALERT',
        message: 'Alerta compleja',
        farm: farm._id,
        equipment: equipment._id,
        device: device._id
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id)
        .populate('farm')
        .populate('equipment')
        .populate('device');

      expect(populatedNotification.farm.name).toBe('Granja Test');
      expect(populatedNotification.equipment.name).toBe('Tanque');
      expect(populatedNotification.device.boardId).toBe('DEVICE-001');
    });
  });

  describe('Read Status Management', () => {
    test('debería gestionar estado de lectura por usuario', async () => {
      const user1 = new User({
        name: 'Usuario 1',
        email: 'user1@test.com',
        passwordHash: 'password123',
        role: 'Ganadero'
      });
      await user1.save();

      const user2 = new User({
        name: 'Usuario 2',
        email: 'user2@test.com',
        passwordHash: 'password123',
        role: 'Veterinario'
      });
      await user2.save();

      const notification = new Notification({
        type: 'INFO',
        message: 'Información importante',
        read: [
          {
            userId: user1._id,
            read: true,
            readDate: new Date()
          },
          {
            userId: user2._id,
            read: false
          }
        ]
      });
      await notification.save();

      const populatedNotification = await Notification.findById(notification._id)
        .populate('read.userId');

      expect(populatedNotification.read).toHaveLength(2);
      expect(populatedNotification.read[0].read).toBe(true);
      expect(populatedNotification.read[0].readDate).toBeDefined();
      expect(populatedNotification.read[1].read).toBe(false);
      expect(populatedNotification.read[1].readDate).toBeUndefined();
    });

    test('debería inicializar read como array vacío por defecto', async () => {
      const notification = new Notification({
        type: 'DEFAULT',
        message: 'Notificación por defecto'
      });
      await notification.save();

      expect(notification.read).toEqual([]);
    });

    test('debería permitir agregar usuarios a la lista de lectura', async () => {
      const user = new User({
        name: 'Usuario Test',
        email: 'user@test.com',
        passwordHash: 'password123',
        role: 'Ganadero'
      });
      await user.save();

      const notification = new Notification({
        type: 'UPDATE',
        message: 'Notificación actualizable'
      });
      await notification.save();

      // Agregar usuario a la lista de lectura
      notification.read.push({
        userId: user._id,
        read: false
      });
      await notification.save();

      const updatedNotification = await Notification.findById(notification._id);
      expect(updatedNotification.read).toHaveLength(1);
      expect(updatedNotification.read[0].userId).toEqual(user._id);
      expect(updatedNotification.read[0].read).toBe(false);
    });

    test('debería permitir marcar como leída con fecha', async () => {
      const user = new User({
        name: 'Usuario Test',
        email: 'user@test.com',
        passwordHash: 'password123',
        role: 'Ganadero'
      });
      await user.save();

      const notification = new Notification({
        type: 'MARKABLE',
        message: 'Notificación marcable',
        read: [{
          userId: user._id,
          read: false
        }]
      });
      await notification.save();

      // Marcar como leída
      const readDate = new Date();
      notification.read[0].read = true;
      notification.read[0].readDate = readDate;
      await notification.save();

      const updatedNotification = await Notification.findById(notification._id);
      expect(updatedNotification.read[0].read).toBe(true);
      expect(updatedNotification.read[0].readDate).toEqual(readDate);
    });
  });

  describe('Notification Types', () => {
    test('debería permitir diferentes tipos de notificación', async () => {
      const types = ['ALERT', 'WARNING', 'INFO', 'ERROR', 'SUCCESS', 'MAINTENANCE'];
      const notifications = [];

      for (const type of types) {
        const notification = new Notification({
          type: type,
          message: `Mensaje de tipo ${type}`
        });
        const saved = await notification.save();
        notifications.push(saved);
      }

      expect(notifications).toHaveLength(types.length);
      notifications.forEach((notification, index) => {
        expect(notification.type).toBe(types[index]);
      });
    });

    test('debería permitir tipos personalizados', async () => {
      const customTypes = ['CUSTOM_ALERT', 'FARM_SPECIFIC', 'DEVICE_MAINTENANCE'];

      for (const type of customTypes) {
        const notification = new Notification({
          type: type,
          message: `Notificación ${type}`
        });
        const saved = await notification.save();
        expect(saved.type).toBe(type);
      }
    });
  });

  describe('Notification Queries', () => {
    test('debería poder buscar notificaciones no leídas por usuario', async () => {
      const user = new User({
        name: 'Usuario Test',
        email: 'user@test.com',
        passwordHash: 'password123',
        role: 'Ganadero'
      });
      await user.save();

      // Notificación leída
      await new Notification({
        type: 'READ',
        message: 'Notificación leída',
        read: [{ userId: user._id, read: true, readDate: new Date() }]
      }).save();

      // Notificación no leída
      await new Notification({
        type: 'UNREAD',
        message: 'Notificación no leída',
        read: [{ userId: user._id, read: false }]
      }).save();

      // Notificación sin usuario
      await new Notification({
        type: 'NO_USER',
        message: 'Sin usuario'
      }).save();

      const unreadNotifications = await Notification.find({
        'read': {
          $elemMatch: {
            userId: user._id,
            read: false
          }
        }
      });

      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].type).toBe('UNREAD');
    });

    test('debería poder buscar por rango de fechas', async () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-02');
      const date3 = new Date('2025-01-03');

      await new Notification({
        type: 'OLD',
        message: 'Notificación antigua',
        createdAt: date1
      }).save();

      await new Notification({
        type: 'MIDDLE',
        message: 'Notificación intermedia',
        createdAt: date2
      }).save();

      await new Notification({
        type: 'NEW',
        message: 'Notificación nueva',
        createdAt: date3
      }).save();

      const notifications = await Notification.find({
        createdAt: { $gte: date2, $lt: date3 }
      });

      expect(notifications).toHaveLength(1);
      expect(notifications[0].type).toBe('MIDDLE');
    });

    test('debería poder buscar por tipo de notificación', async () => {
      await new Notification({ type: 'ALERT', message: 'Alerta 1' }).save();
      await new Notification({ type: 'ALERT', message: 'Alerta 2' }).save();
      await new Notification({ type: 'INFO', message: 'Info 1' }).save();

      const alerts = await Notification.find({ type: 'ALERT' });
      expect(alerts).toHaveLength(2);
      alerts.forEach(alert => {
        expect(alert.type).toBe('ALERT');
      });
    });
  });

  describe('Notification Aggregation', () => {
    test('debería contar notificaciones por tipo', async () => {
      await new Notification({ type: 'ALERT', message: 'Alert 1' }).save();
      await new Notification({ type: 'ALERT', message: 'Alert 2' }).save();
      await new Notification({ type: 'INFO', message: 'Info 1' }).save();

      const counts = await Notification.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);

      expect(counts).toHaveLength(2);
      expect(counts.find(c => c._id === 'ALERT').count).toBe(2);
      expect(counts.find(c => c._id === 'INFO').count).toBe(1);
    });
  });
});
