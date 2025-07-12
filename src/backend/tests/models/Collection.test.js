const mongoose = require('mongoose');
const Collection = require('../../models/Collection');
const Farm = require('../../models/Farm');
const Equipment = require('../../models/Equipment');
const { cleanDatabase } = require('../utils/testHelpers');

describe('Collection Model', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Collection Creation', () => {
    test('debería crear una colección válida', async () => {
      const collectionData = {
        collectionDate: new Date(),
        cisternLicensePlate: 'ABC-123',
        collectionCompany: 'Lacteos SA',
        driver: 'Juan Pérez',
        tankId: 'TANK-001',
        sampleLabel: 'SAMPLE-001',
        milkTemperature: 4.5,
        inhibitorSampleTaken: true,
        litersPerTank: [{
          liters: 500,
          compartment: 'A'
        }]
      };

      const collection = new Collection(collectionData);
      const savedCollection = await collection.save();

      expect(savedCollection._id).toBeDefined();
      expect(savedCollection.sampleLabel).toBe(collectionData.sampleLabel);
      expect(savedCollection.milkTemperature).toBe(collectionData.milkTemperature);
      expect(savedCollection.inhibitorSampleTaken).toBe(true);
      expect(savedCollection.litersPerTank).toHaveLength(1);
      expect(savedCollection.litersPerTank[0].liters).toBe(500);
    });

    test('debería requerir sampleLabel', async () => {
      const collection = new Collection({
        collectionDate: new Date(),
        cisternLicensePlate: 'ABC-123'
        // Falta sampleLabel requerido
      });
      
      let error;
      try {
        await collection.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.sampleLabel).toBeDefined();
    });

    test('debería validar unicidad de sampleLabel', async () => {
      const collectionData = {
        sampleLabel: 'UNIQUE-SAMPLE-001',
        collectionDate: new Date()
      };

      await new Collection(collectionData).save();

      const duplicateCollection = new Collection({
        sampleLabel: 'UNIQUE-SAMPLE-001',
        collectionDate: new Date()
      });

      let error;
      try {
        await duplicateCollection.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // Código de error de duplicado
    });

    test('debería permitir colección sin datos opcionales', async () => {
      const minimalData = {
        sampleLabel: 'MINIMAL-001'
      };

      const collection = new Collection(minimalData);
      const savedCollection = await collection.save();

      expect(savedCollection.sampleLabel).toBe('MINIMAL-001');
      expect(savedCollection.cisternLicensePlate).toBeUndefined();
      expect(savedCollection.driver).toBeUndefined();
      expect(savedCollection.milkTemperature).toBeUndefined();
    });
  });

  describe('Collection Relationships', () => {
    test('debería asociar colección con granja', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });
      await farm.save();

      const collection = new Collection({
        sampleLabel: 'FARM-COLLECTION-001',
        farmId: farm._id
      });
      await collection.save();

      const populatedCollection = await Collection.findById(collection._id).populate('farmId');
      expect(populatedCollection.farmId._id).toEqual(farm._id);
      expect(populatedCollection.farmId.name).toBe('Granja Test');
    });

    test('debería asociar litros con tanques específicos', async () => {
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

      const collection = new Collection({
        sampleLabel: 'MULTI-TANK-001',
        litersPerTank: [
          {
            tankId: tank1._id,
            liters: 300,
            compartment: 'A'
          },
          {
            tankId: tank2._id,
            liters: 200,
            compartment: 'B'
          }
        ]
      });
      await collection.save();

      const populatedCollection = await Collection.findById(collection._id)
        .populate('litersPerTank.tankId');

      expect(populatedCollection.litersPerTank).toHaveLength(2);
      expect(populatedCollection.litersPerTank[0].tankId.name).toBe('Tanque 1');
      expect(populatedCollection.litersPerTank[0].liters).toBe(300);
      expect(populatedCollection.litersPerTank[1].tankId.name).toBe('Tanque 2');
      expect(populatedCollection.litersPerTank[1].liters).toBe(200);
    });
  });

  describe('Collection Data Validation', () => {
    test('debería validar tipos de datos numéricos', async () => {
      const collection = new Collection({
        sampleLabel: 'NUMERIC-TEST-001',
        milkTemperature: 4.5,
        litersPerTank: [{
          liters: 250.75,
          compartment: 'A'
        }]
      });

      const savedCollection = await collection.save();
      expect(savedCollection.milkTemperature).toBe(4.5);
      expect(savedCollection.litersPerTank[0].liters).toBe(250.75);
    });

    test('debería manejar valores booleanos correctamente', async () => {
      const collectionTrue = new Collection({
        sampleLabel: 'BOOLEAN-TRUE-001',
        inhibitorSampleTaken: true
      });

      const collectionFalse = new Collection({
        sampleLabel: 'BOOLEAN-FALSE-001',
        inhibitorSampleTaken: false
      });

      const savedTrue = await collectionTrue.save();
      const savedFalse = await collectionFalse.save();

      expect(savedTrue.inhibitorSampleTaken).toBe(true);
      expect(savedFalse.inhibitorSampleTaken).toBe(false);
    });

    test('debería manejar fechas correctamente', async () => {
      const testDate = new Date('2025-01-15T10:30:00Z');
      
      const collection = new Collection({
        sampleLabel: 'DATE-TEST-001',
        collectionDate: testDate
      });

      const savedCollection = await collection.save();
      expect(savedCollection.collectionDate).toEqual(testDate);
    });

    test('debería permitir múltiples compartimentos por colección', async () => {
      const collection = new Collection({
        sampleLabel: 'MULTI-COMPARTMENT-001',
        litersPerTank: [
          { liters: 100, compartment: 'A' },
          { liters: 150, compartment: 'B' },
          { liters: 200, compartment: 'C' },
          { liters: 175, compartment: 'D' }
        ]
      });

      const savedCollection = await collection.save();
      expect(savedCollection.litersPerTank).toHaveLength(4);
      
      const compartments = savedCollection.litersPerTank.map(tank => tank.compartment);
      expect(compartments).toEqual(['A', 'B', 'C', 'D']);
      
      const totalLiters = savedCollection.litersPerTank.reduce((sum, tank) => sum + tank.liters, 0);
      expect(totalLiters).toBe(625);
    });
  });

  describe('Collection Queries', () => {
    test('debería poder buscar por fecha de colección', async () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-02');
      
      await new Collection({
        sampleLabel: 'DATE-SEARCH-001',
        collectionDate: date1
      }).save();

      await new Collection({
        sampleLabel: 'DATE-SEARCH-002',
        collectionDate: date2
      }).save();

      const collections = await Collection.find({
        collectionDate: { $gte: date1, $lt: date2 }
      });

      expect(collections).toHaveLength(1);
      expect(collections[0].sampleLabel).toBe('DATE-SEARCH-001');
    });

    test('debería poder buscar por empresa de colección', async () => {
      await new Collection({
        sampleLabel: 'COMPANY-001',
        collectionCompany: 'Lacteos Norte SA'
      }).save();

      await new Collection({
        sampleLabel: 'COMPANY-002',
        collectionCompany: 'Lacteos Sur SA'
      }).save();

      const collections = await Collection.find({
        collectionCompany: /Norte/i
      });

      expect(collections).toHaveLength(1);
      expect(collections[0].collectionCompany).toBe('Lacteos Norte SA');
    });

    test('debería poder buscar por rango de temperatura', async () => {
      await new Collection({
        sampleLabel: 'TEMP-001',
        milkTemperature: 3.5
      }).save();

      await new Collection({
        sampleLabel: 'TEMP-002',
        milkTemperature: 4.5
      }).save();

      await new Collection({
        sampleLabel: 'TEMP-003',
        milkTemperature: 5.5
      }).save();

      const collections = await Collection.find({
        milkTemperature: { $gte: 4.0, $lte: 5.0 }
      });

      expect(collections).toHaveLength(1);
      expect(collections[0].milkTemperature).toBe(4.5);
    });
  });

  describe('Collection Aggregation', () => {
    test('debería calcular total de litros por colección', async () => {
      const collection = new Collection({
        sampleLabel: 'AGGREGATION-001',
        litersPerTank: [
          { liters: 100, compartment: 'A' },
          { liters: 200, compartment: 'B' },
          { liters: 150, compartment: 'C' }
        ]
      });
      await collection.save();

      const result = await Collection.aggregate([
        { $match: { _id: collection._id } },
        { $unwind: '$litersPerTank' },
        { $group: {
          _id: '$_id',
          totalLiters: { $sum: '$litersPerTank.liters' },
          tankCount: { $sum: 1 }
        }}
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].totalLiters).toBe(450);
      expect(result[0].tankCount).toBe(3);
    });
  });
});
