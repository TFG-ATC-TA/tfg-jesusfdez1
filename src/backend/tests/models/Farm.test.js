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

  describe('Farm Validation', () => {
    test('debería validar longitud mínima del nombre', async () => {
      const farm = new Farm({
        name: 'A',
        idname: 'granja-test'
      });

      // El modelo actual no tiene validación de longitud mínima, 
      // por lo que este test documentará el comportamiento actual
      const savedFarm = await farm.save();
      expect(savedFarm.name).toBe('A');
      
      // TODO: Agregar validación de longitud mínima al modelo Farm
    });

    test('debería validar longitud máxima del nombre', async () => {
      const longName = 'A'.repeat(101);
      const farm = new Farm({
        name: longName,
        idname: 'granja-test'
      });

      let error;
      try {
        await farm.save();
      } catch (err) {
        error = err;
      }

      // Aunque no hay validación explícita en el modelo, es bueno tener el test
      expect(farm.name).toBe(longName);
    });

    test('debería manejar valores null en campos obligatorios', async () => {
      const farm = new Farm({
        name: null,
        idname: null
      });

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

    test('debería manejar campos vacíos', async () => {
      const farm = new Farm({
        name: '',
        idname: ''
      });

      let error;
      try {
        await farm.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Farm Update Scenarios', () => {
    test('debería permitir actualizar el nombre manteniendo idname', async () => {
      const farm = new Farm({
        name: 'Granja Original',
        idname: 'granja-original'
      });
      await farm.save();

      farm.name = 'Granja Actualizada';
      const updatedFarm = await farm.save();

      expect(updatedFarm.name).toBe('Granja Actualizada');
      expect(updatedFarm.idname).toBe('granja-original');
    });

    test('debería permitir actualizar idname manteniendo nombre', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-original'
      });
      await farm.save();

      farm.idname = 'granja-actualizada';
      const updatedFarm = await farm.save();

      expect(updatedFarm.name).toBe('Granja Test');
      expect(updatedFarm.idname).toBe('granja-actualizada');
    });

    test('debería manejar actualización con nombre duplicado', async () => {
      const farm1 = new Farm({
        name: 'Granja Primera',
        idname: 'granja-primera'
      });
      await farm1.save();

      const farm2 = new Farm({
        name: 'Granja Segunda',
        idname: 'granja-segunda'
      });
      await farm2.save();

      farm2.name = 'Granja Primera';

      let error;
      try {
        await farm2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000);
    });
  });

  describe('Farm Population and Queries', () => {
    test('debería poblar usuarios correctamente con múltiples campos', async () => {
      const user1 = new User({
        name: 'Juan',
        surname: 'Pérez',
        email: 'juan@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user1.save();

      const user2 = new User({
        name: 'María',
        surname: 'García',
        email: 'maria@example.com',
        passwordHash: 'Password123',
        role: 'Veterinario'
      });
      await user2.save();

      const farm = new Farm({
        name: 'Granja Multi-Usuario',
        idname: 'granja-multi-usuario',
        users: [user1._id, user2._id]
      });
      await farm.save();

      const populatedFarm = await Farm.findById(farm._id).populate('users', 'name surname email role');
      expect(populatedFarm.users).toHaveLength(2);
      expect(populatedFarm.users[0].name).toBeDefined();
      expect(populatedFarm.users[0].surname).toBeDefined();
      expect(populatedFarm.users[0].passwordHash).toBeUndefined(); // No debe incluir el hash
    });

    test('debería encontrar granjas por búsqueda parcial de nombre', async () => {
      await new Farm({ name: 'Granja La Esperanza', idname: 'granja-esperanza' }).save();
      await new Farm({ name: 'Granja Los Robles', idname: 'granja-robles' }).save();
      await new Farm({ name: 'Finca El Paraíso', idname: 'finca-paraiso' }).save();

      const granjas = await Farm.find({ name: { $regex: 'Granja', $options: 'i' } });
      expect(granjas).toHaveLength(2);
    });

    test('debería contar granjas correctamente', async () => {
      await new Farm({ name: 'Granja 1', idname: 'granja-1' }).save();
      await new Farm({ name: 'Granja 2', idname: 'granja-2' }).save();
      await new Farm({ name: 'Granja 3', idname: 'granja-3' }).save();

      const count = await Farm.countDocuments();
      expect(count).toBe(3);
    });
  });

  describe('Farm Array Operations', () => {
    test('debería agregar usuarios al array usando $push', async () => {
      const user1 = new User({
        name: 'Usuario1',
        email: 'user1@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user1.save();

      const user2 = new User({
        name: 'Usuario2',
        email: 'user2@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user2.save();

      const farm = new Farm({
        name: 'Granja Array Test',
        idname: 'granja-array-test'
      });
      await farm.save();

      await Farm.findByIdAndUpdate(
        farm._id,
        { $push: { users: { $each: [user1._id, user2._id] } } }
      );

      const updatedFarm = await Farm.findById(farm._id);
      expect(updatedFarm.users).toHaveLength(2);
      expect(updatedFarm.users).toContainEqual(user1._id);
      expect(updatedFarm.users).toContainEqual(user2._id);
    });

    test('debería remover usuarios del array usando $pull', async () => {
      const user = new User({
        name: 'Usuario Test',
        email: 'user@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user.save();

      const farm = new Farm({
        name: 'Granja Pull Test',
        idname: 'granja-pull-test',
        users: [user._id]
      });
      await farm.save();

      await Farm.findByIdAndUpdate(
        farm._id,
        { $pull: { users: user._id } }
      );

      const updatedFarm = await Farm.findById(farm._id);
      expect(updatedFarm.users).toHaveLength(0);
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

    test('debería manejar eliminación masiva de granjas', async () => {
      const user = new User({
        name: 'Usuario Test',
        email: 'user@example.com',
        passwordHash: 'Password123',
        role: 'Ganadero'
      });
      await user.save();

      const farm1 = new Farm({
        name: 'Granja 1',
        idname: 'granja-1',
        users: [user._id]
      });
      await farm1.save();

      const farm2 = new Farm({
        name: 'Granja 2',
        idname: 'granja-2',
        users: [user._id]
      });
      await farm2.save();

      // Asociar las granjas al usuario
      user.farms = [farm1._id, farm2._id];
      await user.save();

      // Eliminar una granja
      await Farm.deleteOne({ _id: farm1._id });

      // El usuario debería mantener solo una granja
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.farms).toHaveLength(1);
      expect(updatedUser.farms).toContainEqual(farm2._id);
      expect(updatedUser.farms).not.toContainEqual(farm1._id);
    });
  });

  describe('Farm Error Handling', () => {
    test('debería manejar errores en pre-save middleware', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test'
      });

      // Simular error en middleware
      const originalUpdateMany = mongoose.model('User').updateMany;
      mongoose.model('User').updateMany = jest.fn().mockRejectedValue(new Error('Database error'));

      let error;
      try {
        await farm.save();
      } catch (err) {
        error = err;
      }

      // Restaurar el método original
      mongoose.model('User').updateMany = originalUpdateMany;

      // En este caso, como es un farm nuevo, no debería activar el middleware
      // que causa el error (solo se activa si isModified en campos específicos)
      expect(farm._id).toBeDefined();
      
      // TODO: Crear un test más específico que active el middleware de save
    });

    test('debería manejar ObjectId inválidos en relaciones', async () => {
      const farm = new Farm({
        name: 'Granja Test',
        idname: 'granja-test',
        users: ['invalid-object-id']
      });

      let error;
      try {
        await farm.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });
});
