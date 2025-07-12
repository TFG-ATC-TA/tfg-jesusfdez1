const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Farm = require('../../models/Farm');
const Device = require('../../models/Device');
const Equipment = require('../../models/Equipment');
const Collection = require('../../models/Collection');
const Notification = require('../../models/Notification');

/**
 * Genera un token JWT para testing
 */
const generateToken = (user, expiresIn = '1h') => {
  return jwt.sign(
    { 
      user: { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      } 
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Crea un usuario de prueba
 */
const createTestUser = async (userData = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const defaultUser = {
    name: 'Test User',
    surname: 'Test Surname',
    email: userData.email || `test-${timestamp}-${randomId}@example.com`,
    passwordHash: 'TestPassword123',
    role: 'Ganadero'
  };

  try {
    const user = new User({ ...defaultUser, ...userData });
    await user.save();
    return user;
  } catch (error) {
    // Si hay error de email duplicado, intentar con otro email
    if (error.code === 11000) {
      const retryUser = {
        ...defaultUser,
        ...userData,
        email: `test-retry-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
      };
      const user = new User(retryUser);
      await user.save();
      return user;
    }
    throw error;
  }
};

/**
 * Crea un usuario administrador de prueba
 */
const createTestAdmin = async (userData = {}) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const adminData = {
    name: 'Admin User',
    surname: 'Admin Surname',
    email: userData.email || `admin-${timestamp}-${randomId}@example.com`,
    passwordHash: 'AdminPassword123',
    role: 'Administrador'
  };

  try {
    const admin = new User({ ...adminData, ...userData });
    await admin.save();
    return admin;
  } catch (error) {
    if (error.code === 11000) {
      const retryAdmin = {
        ...adminData,
        ...userData,
        email: `admin-retry-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
      };
      const admin = new User(retryAdmin);
      await admin.save();
      return admin;
    }
    throw error;
  }
};

/**
 * Crea una granja de prueba
 */
const createTestFarm = async (farmData = {}) => {
  const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
  const defaultFarm = {
    name: `Test Farm ${uniqueId}`,
    idname: `test-farm-${uniqueId}`,
    users: [],
    equipments: [],
    devices: []
  };

  const farm = new Farm({ ...defaultFarm, ...farmData });
  await farm.save();
  return farm;
};

/**
 * Crea un dispositivo de prueba
 */
const createTestDevice = async (deviceData = {}) => {
  const randomId = Math.floor(Math.random() * 10000);
  const defaultDevice = {
    boardId: `TEST-DEVICE-${randomId}`,
    type: 'Monitor de leche',
    description: 'Test device',
    sensors: [{
      sensorId: `SENSOR-${randomId}`,
      name: 'Test Sensor'
    }]
  };

  const device = new Device({ ...defaultDevice, ...deviceData });
  await device.save();
  return device;
};

/**
 * Crea un equipo de prueba
 */
const createTestEquipment = async (equipmentData = {}) => {
  const defaultEquipment = {
    name: 'Test Equipment',
    type: 'Tanque de leche',
    description: 'Test equipment'
  };

  const equipment = new Equipment({ ...defaultEquipment, ...equipmentData });
  await equipment.save();
  return equipment;
};

/**
 * Crea una recogida de leche de prueba
 */
const createTestCollection = async (collectionData = {}) => {
  const defaultCollection = {
    collectionDate: new Date(),
    sampleLabel: 'TEST-SAMPLE-001',
    collectionCompany: 'Test Company',
    cisternLicensePlate: 'TEST-123',
    driver: 'Test Driver',
    milkTemperature: 4.0,
    inhibitorSampleTaken: false,
    litersPerTank: []
  };

  const collection = new Collection({ ...defaultCollection, ...collectionData });
  await collection.save();
  return collection;
};

/**
 * Crea una notificación de prueba
 */
const createTestNotification = async (notificationData = {}) => {
  const defaultNotification = {
    type: 'info',
    message: 'Test notification message',
    read: []
  };

  const notification = new Notification({ ...defaultNotification, ...notificationData });
  await notification.save();
  return notification;
};

/**
 * Limpia todas las colecciones
 */
const cleanDatabase = async () => {
  await User.deleteMany({});
  await Farm.deleteMany({});
  await Device.deleteMany({});
  await Equipment.deleteMany({});
  await Collection.deleteMany({});
  await Notification.deleteMany({});
};

/**
 * Validadores comunes para responses
 */
const expectValidUserResponse = (user) => {
  expect(user).toHaveProperty('_id');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('role');
  expect(user).not.toHaveProperty('passwordHash');
};

const expectValidFarmResponse = (farm) => {
  expect(farm).toHaveProperty('_id');
  expect(farm).toHaveProperty('name');
  expect(farm).toHaveProperty('idname');
  // Solo verificar campos opcionales si existen
  if (farm.users !== undefined) {
    expect(farm).toHaveProperty('users');
  }
  if (farm.equipments !== undefined) {
    expect(farm).toHaveProperty('equipments');
  }
  if (farm.devices !== undefined) {
    expect(farm).toHaveProperty('devices');
  }
};

const expectValidDeviceResponse = (device) => {
  expect(device).toHaveProperty('_id');
  expect(device).toHaveProperty('boardId');
  expect(device).toHaveProperty('type');
  expect(device).toHaveProperty('sensors');
};

const expectValidEquipmentResponse = (equipment) => {
  expect(equipment).toHaveProperty('_id');
  expect(equipment).toHaveProperty('name');
  expect(equipment).toHaveProperty('type');
};

const expectValidCollectionResponse = (collection) => {
  expect(collection).toHaveProperty('_id');
  expect(collection).toHaveProperty('sampleLabel');
  expect(collection).toHaveProperty('collectionCompany');
  expect(collection).toHaveProperty('collectionDate');
  expect(collection).toHaveProperty('litersPerTank');
  expect(Array.isArray(collection.litersPerTank)).toBe(true);
};

const expectValidNotificationResponse = (notification) => {
  expect(notification).toHaveProperty('id');
  expect(notification).toHaveProperty('type');
  expect(notification).toHaveProperty('message');
  expect(notification).toHaveProperty('read');
  expect(notification).toHaveProperty('createdAt');
};

module.exports = {
  generateToken,
  createTestUser,
  createTestAdmin,
  createTestFarm,
  createTestDevice,
  createTestEquipment,
  createTestCollection,
  createTestNotification,
  cleanDatabase,
  expectValidUserResponse,
  expectValidFarmResponse,
  expectValidDeviceResponse,
  expectValidEquipmentResponse,
  expectValidCollectionResponse,
  expectValidNotificationResponse
};
