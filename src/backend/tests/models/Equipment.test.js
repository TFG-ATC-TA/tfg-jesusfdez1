const mongoose = require('mongoose');
const Equipment = require('../../models/Equipment');
const Farm = require('../../models/Farm');
const Device = require('../../models/Device');
const { cleanDatabase } = require('../utils/testHelpers');

describe('Equipment Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Equipment Creation', () => {
    test('debería crear un equipo válido', async () => {
      const equipmentData = {
        name: 'Tanque Principal',
        type: 'Tanque de leche',
        description: 'Tanque de almacenamiento principal'
      };

      const equipment = new Equipment(equipmentData);
      const savedEquipment = await equipment.save();

      expect(savedEquipment._id).toBeDefined();
      expect(savedEquipment.name).toBe(equipmentData.name);
      expect(savedEquipment.type).toBe(equipmentData.type);
    });

    test('debería requerir campos obligatorios', async () => {
      const equipment = new Equipment({});
      
      let error;
      try {
        await equipment.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    test('debería validar tipos de equipo permitidos', async () => {
      const equipmentData = {
        name: 'Equipo Test',
        type: 'Tipo Inválido'
      };

      const equipment = new Equipment(equipmentData);
      
      let error;
      try {
        await equipment.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.type).toBeDefined();
    });

    test('debería crear tanque de leche correctamente', async () => {
      const tankData = {
        name: 'Tanque de Enfriamiento',
        type: 'Tanque de leche'
      };

      const tank = new Equipment(tankData);
      const savedTank = await tank.save();

      expect(savedTank.type).toBe('Tanque de leche');
    });

    test('debería crear estación de lavado correctamente', async () => {
      const washStationData = {
        name: 'Estación de Lavado Principal',
        type: 'Estación de lavado'
      };

      const washStation = new Equipment(washStationData);
      const savedWashStation = await washStation.save();

      expect(savedWashStation.type).toBe('Estación de lavado');
    });
  });

  describe('Equipment Relationships', () => {
    test('debería asociar equipo con granja', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });
      await farm.save();

      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche',
        farm: farm._id
      });
      await equipment.save();

      const populatedEquipment = await Equipment.findById(equipment._id).populate('farm');
      expect(populatedEquipment.farm._id).toEqual(farm._id);
    });

    test('debería asociar dispositivos con equipo', async () => {
      const device1 = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor 1'
        }]
      });
      await device1.save();

      const device2 = new Device({
        boardId: 'DEVICE-002',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-002',
          name: 'Sensor 2'
        }]
      });
      await device2.save();

      const equipment = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche',
        devices: [device1._id, device2._id]
      });
      await equipment.save();

      const populatedEquipment = await Equipment.findById(equipment._id).populate('devices');
      expect(populatedEquipment.devices).toHaveLength(2);
      expect(populatedEquipment.devices.map(d => d._id)).toEqual([device1._id, device2._id]);
    });

    test('debería asociar tanques relacionados', async () => {
      const tank1 = new Equipment({
        name: 'Tanque Principal',
        type: 'Tanque de leche'
      });
      await tank1.save();

      const tank2 = new Equipment({
        name: 'Tanque Secundario',
        type: 'Tanque de leche'
      });
      await tank2.save();

      const tank3 = new Equipment({
        name: 'Estación con Tanques Asociados',
        type: 'Estación de lavado',
        associatedTanks: [tank1._id, tank2._id]
      });
      await tank3.save();

      const populatedEquipment = await Equipment.findById(tank3._id).populate('associatedTanks');
      expect(populatedEquipment.associatedTanks).toHaveLength(2);
      expect(populatedEquipment.associatedTanks.map(t => t._id)).toEqual([tank1._id, tank2._id]);
    });

    test('debería validar que solo estaciones de lavado pueden tener tanques asociados', async () => {
      const tank1 = new Equipment({
        name: 'Tanque 1',
        type: 'Tanque de leche'
      });
      await tank1.save();

      const tank = new Equipment({
        name: 'Tanque Test',
        type: 'Tanque de leche',
        associatedTanks: [tank1._id] // Esto debería fallar
      });

      let error;
      try {
        await tank.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.associatedTanks).toBeDefined();
    });
  });

  describe('Equipment Types', () => {
    test('debería permitir solo tipos válidos', async () => {
      const validTypes = ['Tanque de leche', 'Estación de lavado'];
      
      for (const type of validTypes) {
        const equipment = new Equipment({
          name: `Equipo ${type}`,
          type: type
        });
        
        const savedEquipment = await equipment.save();
        expect(savedEquipment.type).toBe(type);
      }
    });

    test('debería rechazar tipos inválidos', async () => {
      const invalidTypes = ['Tipo Inválido', 'Otro Equipo', ''];
      
      for (const type of invalidTypes) {
        const equipment = new Equipment({
          name: 'Equipo Test',
          type: type
        });

        let error;
        try {
          await equipment.save();
        } catch (err) {
          error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.type).toBeDefined();
      }
    });
  });

  describe('Associated Tanks Validation', () => {
    test('debería permitir estaciones de lavado con tanques asociados', async () => {
      const tank1 = new Equipment({
        name: 'Tanque 1',
        type: 'Tanque de leche'
      });
      await tank1.save();

      const tank2 = new Equipment({
        name: 'Tanque 2',
        type: 'Tanque de leche'
      });
      await tank2.save();

      const washStation = new Equipment({
        name: 'Estación Principal',
        type: 'Estación de lavado',
        associatedTanks: [tank1._id, tank2._id]
      });

      const savedEquipment = await washStation.save();
      expect(savedEquipment.associatedTanks).toHaveLength(2);
    });

    test('debería permitir equipo sin tanques asociados', async () => {
      const equipment = new Equipment({
        name: 'Equipo Simple',
        type: 'Tanque de leche',
        associatedTanks: []
      });

      const savedEquipment = await equipment.save();
      expect(savedEquipment.associatedTanks).toHaveLength(0);
    });
  });

  describe('Equipment Population', () => {
    test('debería poblar correctamente todas las referencias', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });
      await farm.save();

      const device = new Device({
        boardId: 'DEVICE-001',
        type: 'Monitor de leche',
        sensors: [{
          sensorId: 'SENSOR-001',
          name: 'Sensor test'
        }]
      });
      await device.save();

      const associatedTank = new Equipment({
        name: 'Tanque Asociado',
        type: 'Tanque de leche'
      });
      await associatedTank.save();

      const equipment = new Equipment({
        name: 'Estación Principal',
        type: 'Estación de lavado',
        farm: farm._id,
        devices: [device._id],
        associatedTanks: [associatedTank._id]
      });
      await equipment.save();

      const populatedEquipment = await Equipment.findById(equipment._id)
        .populate('farm')
        .populate('devices')
        .populate('associatedTanks');

      expect(populatedEquipment.farm.name).toBe('Granja Test');
      expect(populatedEquipment.devices[0].boardId).toBe('DEVICE-001');
      expect(populatedEquipment.associatedTanks[0].name).toBe('Tanque Asociado');
    });
  });
});
