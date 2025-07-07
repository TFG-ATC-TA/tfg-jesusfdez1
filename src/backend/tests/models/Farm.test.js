const mongoose = require('mongoose');
const Farm = require('../../models/Farm');
const User = require('../../models/User');
const Equipment = require('../../models/Equipment');
const Device = require('../../models/Device');
const { cleanDatabase } = require('../utils/testHelpers');

describe('Farm Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Farm Creation', () => {
    test('debería crear una granja válida', async () => {
      const farmData = {
        name: 'Granja La Esperanza',
        idname: 'granja-la-esperanza'
      };

      const farm = new Farm(farmData);
      const savedFarm = await farm.save();

      expect(savedFarm._id).toBeDefined();
      expect(savedFarm.name).toBe(farmData.name);
      expect(savedFarm.idname).toBe(farmData.idname);
      expect(savedFarm.users).toEqual([]);
      expect(savedFarm.equipments).toEqual([]);
      expect(savedFarm.devices).toEqual([]);
    });

    test('debería requerir campos obligatorios', async () => {
      const farm = new Farm({});
      
      let error;
      try {
        await farm.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.idname).toBeDefined();
    });

    test('debería validar que el nombre sea único', async () => {
      const farmData = {
        name: 'Granja Única',
        idname: 'granja-unica-1'
      };

      await new Farm(farmData).save();

      const duplicateFarm = new Farm({
        name: 'Granja Única',
        idname: 'granja-unica-2'
      });

      let error;
      try {
        await duplicateFarm.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });

    test('debería validar que el idname sea único', async () => {
      const farmData = {
        name: 'Granja Primera',
        idname: 'granja-id-unico'
      };

      await new Farm(farmData).save();

      const duplicateFarm = new Farm({
        name: 'Granja Segunda',
        idname: 'granja-id-unico'
      });

      let error;
      try {
        await duplicateFarm.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });
  });

  describe('Farm Relationships', () => {
    test('debería asociar usuarios correctamente', async () => {
      const user = new User({
        name: 'Juan',
        email: 'juan@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user.save();

      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        users: [user._id]
      });
      await farm.save();

      const populatedFarm = await Farm.findById(farm._id).populate('users');
      expect(populatedFarm.users).toHaveLength(1);
      expect(populatedFarm.users[0]._id).toEqual(user._id);
    });

    test('debería asociar equipos correctamente', async () => {
      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche'
      });
      await equipment.save();

      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        equipments: [equipment._id]
      });
      await farm.save();

      const populatedFarm = await Farm.findById(farm._id).populate('equipments');
      expect(populatedFarm.equipments).toHaveLength(1);
      expect(populatedFarm.equipments[0]._id).toEqual(equipment._id);
    });

    test('debería asociar dispositivos correctamente', async () => {
      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor temperatura'
        }]
      });
      await device.save();

      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        devices: [device._id]
      });
      await farm.save();

      const populatedFarm = await Farm.findById(farm._id).populate('devices');
      expect(populatedFarm.devices).toHaveLength(1);
      expect(populatedFarm.devices[0]._id).toEqual(device._id);
    });
  });

  describe('Farm Deletion Cascade', () => {
    test('debería limpiar referencias de usuarios al eliminar granja', async () => {
      const user = new User({
        name: 'Juan',
        email: 'juan@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user.save();

      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        users: [user._id]
      });
      await farm.save();

      // Actualizar el usuario con la granja
      user.farms = [farm._id];
      await user.save();

      // Verificar que la relación está establecida
      const userWithFarms = await User.findById(user._id);
      expect(userWithFarms.farms).toContainEqual(farm._id);

      // Eliminar la granja
      await Farm.deleteOne({ _id: farm._id });

      // Verificar que la referencia se eliminó del usuario
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.farms).not.toContain(farm._id);
    });

    test('debería limpiar referencias de equipos al eliminar granja', async () => {
      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche'
      });
      await equipment.save();

      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        equipments: [equipment._id]
      });
      await farm.save();

      // Asociar la granja al equipo
      equipment.farm = farm._id;
      await equipment.save();

      // Verificar que la relación está establecida
      const equipmentWithFarm = await Equipment.findById(equipment._id);
      expect(equipmentWithFarm.farm).toEqual(farm._id);

      // Eliminar la granja
      await Farm.deleteOne({ _id: farm._id });

      // Verificar que la referencia se eliminó del equipo
      const updatedEquipment = await Equipment.findById(equipment._id);
      expect(updatedEquipment.farm).toBeUndefined();
    });

    test('debería limpiar referencias de dispositivos al eliminar granja', async () => {
      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor temperatura'
        }]
      });
      await device.save();

      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        devices: [device._id]
      });
      await farm.save();

      // Asociar la granja al dispositivo
      device.farm = farm._id;
      await device.save();

      // Verificar que la relación está establecida
      const deviceWithFarm = await Device.findById(device._id);
      expect(deviceWithFarm.farm).toEqual(farm._id);

      // Eliminar la granja
      await Farm.deleteOne({ _id: farm._id });

      // Verificar que la referencia se eliminó del dispositivo
      const updatedDevice = await Device.findById(device._id);
      expect(updatedDevice.farm).toBeUndefined();
    });
  });
});
