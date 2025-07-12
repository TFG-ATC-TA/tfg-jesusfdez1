const mongoose = require('mongoose');
const Device = require('../../models/Device');
const Farm = require('../../models/Farm');
const Equipment = require('../../models/Equipment');
const { cleanDatabase } = require('../utils/testHelpers');

describe('Device Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Device Creation', () => {
    test('debería crear un dispositivo válido', async () => {
      const deviceData = {
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        description: 'Monitor para tanque principal',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor de temperatura'
        }]
      };

      const device = new Device(deviceData);
      const savedDevice = await device.save();

      expect(savedDevice._id).toBeDefined();
      expect(savedDevice.boardId).toBe(deviceData.boardId);
      expect(savedDevice.type).toBe(deviceData.type);
      expect(savedDevice.description).toBe(deviceData.description);
      expect(savedDevice.sensors).toHaveLength(1);
      expect(savedDevice.sensors[0].sensorId).toBe('SENSOR-001');
      expect(savedDevice.sensors[0].name).toBe('Sensor de temperatura');
    });

    test('debería requerir campos obligatorios', async () => {
      const device = new Device({});
      
      let error;
      try {
        await device.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.boardId).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    test('debería validar que el boardId sea único', async () => {
      const deviceData = {
        boardId: 'UNIQUE-DEVICE',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      };

      await new Device(deviceData).save();

      const duplicateDevice = new Device({
        ...deviceData,
        type: 'Monitor de tanque'
      });

      let error;
      try {
        await duplicateDevice.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });

    test('debería validar tipos de dispositivo permitidos', async () => {
      const deviceData = {
        boardId: 'DEVICE-001',
        type: 'Tipo Inválido',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      };

      const device = new Device(deviceData);
      
      let error;
      try {
        await device.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    test('debería validar que los sensores tengan sensorId único', async () => {
      const deviceData = {
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'DUPLICATE-SENSOR',
          name: 'Sensor 1'
        }]
      };

      await new Device(deviceData).save();

      const duplicateDevice = new Device({
        boardId: 'DEVICE-002',
        type: 'Monitor de tanque',
        sensors: [{
          sensorId: 'DUPLICATE-SENSOR',
          name: 'Sensor 2'
        }]
      });

      let error;
      try {
        await duplicateDevice.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });
  });

  describe('Device Relationships', () => {
    test('debería asociar dispositivo con granja', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });
      await farm.save();

      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        farm: farm._id,
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      });
      await device.save();

      const populatedDevice = await Device.findById(device._id).populate('farm');
      expect(populatedDevice.farm._id).toEqual(farm._id);

      // Verificar que la granja también tiene referencia al dispositivo
      const updatedFarm = await Farm.findById(farm._id);
      expect(updatedFarm.devices).toContainEqual(device._id);
    });

    test('debería asociar dispositivo con equipo', async () => {
      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche'
      });
      await equipment.save();

      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        equipment: equipment._id,
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      });
      await device.save();

      const populatedDevice = await Device.findById(device._id).populate('equipment');
      expect(populatedDevice.equipment._id).toEqual(equipment._id);

      // Verificar que el equipo también tiene referencia al dispositivo
      const updatedEquipment = await Equipment.findById(equipment._id);
      expect(updatedEquipment.devices).toContainEqual(device._id);
    });

    test('debería actualizar referencias al cambiar granja', async () => {
      const farm1 = new Farm({
        name: 'Granja 1',
        idname: 'granja-1'
      });
      await farm1.save();

      const farm2 = new Farm({
        name: 'Granja 2',
        idname: 'granja-2'
      });
      await farm2.save();

      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        farm: farm1._id,
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      });
      await device.save();

      // Verificar que farm1 tiene el dispositivo
      let updatedFarm1 = await Farm.findById(farm1._id);
      expect(updatedFarm1.devices).toContainEqual(device._id);

      // Cambiar dispositivo a farm2
      device.farm = farm2._id;
      await device.save();

      // Verificar que farm1 ya no tiene el dispositivo
      updatedFarm1 = await Farm.findById(farm1._id);
      expect(updatedFarm1.devices).not.toContainEqual(device._id);

      // Verificar que farm2 ahora tiene el dispositivo
      const updatedFarm2 = await Farm.findById(farm2._id);
      expect(updatedFarm2.devices).toContainEqual(device._id);
    });
  });

  describe('Device Deletion', () => {
    test('debería limpiar referencias al eliminar dispositivo', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });
      await farm.save();

      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche'
      });
      await equipment.save();

      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        farm: farm._id,
        equipment: equipment._id,
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      });
      await device.save();

      // Verificar que las referencias están establecidas
      let updatedFarm = await Farm.findById(farm._id);
      let updatedEquipment = await Equipment.findById(equipment._id);
      expect(updatedFarm.devices).toContainEqual(device._id);
      expect(updatedEquipment.devices).toContainEqual(device._id);

      // Eliminar el dispositivo
      await Device.deleteOne({ _id: device._id });

      // Verificar que las referencias se limpiaron
      updatedFarm = await Farm.findById(farm._id);
      updatedEquipment = await Equipment.findById(equipment._id);
      expect(updatedFarm.devices).not.toContainEqual(device._id);
      expect(updatedEquipment.devices).not.toContainEqual(device._id);
    });
  });

  describe('Sensor Management', () => {
    test('debería manejar múltiples sensores', async () => {
      const deviceData = {
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [
          {
            sensorId: 'TEMP-001',
            name: 'Sensor de temperatura'
          },
          {
            sensorId: 'HUM-001',
            name: 'Sensor de humedad'
          },
          {
            sensorId: 'PH-001',
            name: 'Sensor de pH'
          }
        ]
      };

      const device = new Device(deviceData);
      const savedDevice = await device.save();

      expect(savedDevice.sensors).toHaveLength(3);
      expect(savedDevice.sensors.map(s => s.sensorId)).toEqual(['TEMP-001', 'HUM-001', 'PH-001']);
    });

    test('debería permitir dispositivos sin sensores', async () => {
      const deviceData = {
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: []
      };

      const device = new Device(deviceData);
      const savedDevice = await device.save();

      expect(savedDevice.sensors).toHaveLength(0);
    });
  });
});
