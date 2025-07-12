import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';

// Import models using ES modules
import Farm from './models/Farm.js';
import User from './models/User.js';
import Equipment from './models/Equipment.js';
import Device from './models/Device.js';
import Collection from './models/Collection.js';
import Notification from './models/Notification.js';

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/lactokeeper');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("Connected to MongoDB");
});

// Helper functions
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
const randomItems = (array, min, max) => {
  const count = faker.number.int({ min, max });
  return faker.helpers.arrayElements(array, count);
};

// Generate fake data for Farm
const createFarm = async (idname) => {
  const farm = new Farm({
    name: faker.company.name(),
    idname: idname || faker.string.alphanumeric(10),
    users: [],
    equipments: [], 
    collections: [],
  });
  await farm.save();
  return farm;
};

// Generate fake data for User
const createUser = async (farms) => {
  const roles = ["Administrador", "Veterinario", "Ganadero"]; // Removed "Industria"
  const role = randomItem(roles);
  
  const user = new User({
    name: faker.person.firstName(),
    surname: faker.person.lastName(),
    email: faker.internet.email(),
    passwordHash: '12345678',
    role: role,
    farms: [],
  });
  await user.save();

  // Assign farms to non-admin users
  if (role !== "Administrador") {
    let assignedFarms;
    if (role === "Ganadero") {
      // Ganaderos get only one farm
      assignedFarms = randomItems(farms, 1, 1);
    } else {
      // Veterinarios get 1-3 farms
      assignedFarms = randomItems(farms, 1, 3);
    }
    
    for (const farm of assignedFarms) {
      user.farms.push(farm._id);
      await Farm.findByIdAndUpdate(farm._id, { $push: { users: user._id } });
    }
    await user.save();
  }

  return user;
};

// Generate fake data for Equipment
const createEquipment = async (farm, type = null, createAssociated = true) => {
  console.log(`Creando equipo para granja ${farm.name} - Tipo: ${type || 'aleatorio'}`);
  const types = ["Tanque de leche", "Estación de lavado"];
  const equipment = new Equipment({
    name: faker.commerce.productName(),
    type: type || randomItem(types),
    farm: farm._id,
    devices: [],
    associatedTanks: [],
  });
  await equipment.save();
  console.log(`Equipo creado: ${equipment.name} (${equipment.type})`);
  
  await Farm.findByIdAndUpdate(farm._id, { $push: { equipments: equipment._id } });
  console.log(`Equipo agregado a la granja ${farm.name}`);

  // Create associated tanks for milk tanks (only if createAssociated is true to avoid recursion)
  if (equipment.type === "Tanque de leche" && createAssociated) {
    console.log(`Creando tanques asociados para ${equipment.name}...`);
    const tankCount = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < tankCount; i++) {
      console.log(`Creando tanque asociado ${i + 1}/${tankCount}...`);
      const associatedTank = await createEquipment(farm, "Tanque de leche", false);
      if (associatedTank) {
        equipment.associatedTanks.push(associatedTank._id);
        console.log(`Tanque asociado ${associatedTank.name} agregado`);
      }
    }
    await equipment.save();
    console.log(`Tanques asociados guardados para ${equipment.name}`);
  }

  console.log(`Equipo ${equipment.name} completado`);
  return equipment;
};

// Generate fake data for Device
const createDevice = async (farm, equipment) => {
  const types = ["Monitor de leche", "Monitor de tanque", "Monitor de estación de lavado"];
  const device = new Device({
    boardId: faker.string.alphanumeric(10),
    type: randomItem(types),
    farm: farm._id,
    equipment: equipment._id,
    description: faker.lorem.sentence(),
    sensors: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      sensorId: faker.string.alphanumeric(8),
      name: faker.commerce.productName(),
      description: faker.lorem.sentence(),
    })),
  });
  await device.save();

  await Equipment.findByIdAndUpdate(equipment._id, { $push: { devices: device._id } });
  return device;
};

// Generate fake data for Collection
const createCollection = async (farm, tankEquipments) => {
  // Select random tanks for this collection
  const selectedTanks = randomItems(tankEquipments, 1, Math.min(3, tankEquipments.length));
  
  const collection = new Collection({
    collectionDate: faker.date.past(),
    cisternLicensePlate: faker.vehicle.vrm(),
    collectionCompany: faker.company.name(),
    driver: faker.person.fullName(),
    tankId: faker.string.alphanumeric(8),
    sampleLabel: faker.string.alphanumeric(12),
    milkTemperature: parseFloat(faker.number.float({ min: 2, max: 8, precision: 0.01 }).toFixed(2)),
    inhibitorSampleTaken: faker.datatype.boolean(),
    litersPerTank: selectedTanks.map(tank => ({
      tankId: tank._id,
      liters: parseFloat(faker.number.float({ min: 100, max: 5000, precision: 0.01 }).toFixed(2)),
      compartment: faker.string.alphanumeric(2),
    })),
    farmId: farm._id,
  });
  await collection.save();

  await Farm.findByIdAndUpdate(farm._id, { $push: { collections: collection._id } });
  return collection;
};

// Generate fake data for Notification with proper types
const createNotification = async (farm, equipment, device, users) => {
  // Define notification types: info, warning, error, and "others"
  const notificationTypes = ['info', 'warning', 'error'];
  const otherTypes = ['maintenance', 'alert', 'system', 'update', 'reminder'];
  
  // 70% chance for standard types, 30% for "other" types
  const useStandardType = faker.datatype.boolean({ probability: 0.7 });
  const type = useStandardType ? randomItem(notificationTypes) : randomItem(otherTypes);

  const notification = new Notification({
    type: type,
    message: faker.lorem.sentence(),
    read: users.map(user => ({
      userId: user._id,
      read: faker.datatype.boolean(),
      readDate: faker.date.past(),
    })),
    farm: farm._id, // Ensure farm is correctly linked
    equipment: equipment._id, // Ensure equipment belongs to the farm
    device: device._id, // Ensure device belongs to the equipment
    createdAt: faker.date.past(),
  });
  await notification.save();
  return notification;
};

// Main function to populate the database
const populateDatabase = async () => {
  try {
    console.log("Iniciando la población de la base de datos...");

    // Clear existing data
    console.log("Limpiando datos existentes...");
    await Promise.all([
      User.deleteMany({}),
      Farm.deleteMany({}),
      Equipment.deleteMany({}),
      Device.deleteMany({}),
      Collection.deleteMany({}),
      Notification.deleteMany({})
    ]);

    // Create admin user
    console.log("Creando usuario administrador...");
    const adminUser = new User({
      name: 'Admin',
      surname: 'User',
      email: 'admin@admin.com',
      passwordHash: '12345678',
      role: 'Administrador',
      farms: []
    });
    await adminUser.save();

    // Create farms with specific idnames
    const farms = [];
    console.log("Creando granjas...");
    const specificIdnames = ['farm-01', 'synthetic-farm-1', 'synthetic-farm-2'];
    
    for (const idname of specificIdnames) {
      const farm = await createFarm(idname);
      farms.push(farm);
    }

    // Create additional random farms
    const additionalFarms = faker.number.int({ min: 15, max: 20 });
    for (let i = 0; i < additionalFarms; i++) {
      const farm = await createFarm();
      farms.push(farm);
    }

    // Create users (10-30)
    console.log("Creando usuarios...");
    const userCount = faker.number.int({ min: 10, max: 30 });
    const users = [];
    for (let i = 0; i < userCount; i++) {
      const user = await createUser(farms);
      users.push(user);
    }

    // Create equipment for each farm
    console.log("Creando equipos...");
    const allEquipment = [];
    for (let farmIndex = 0; farmIndex < farms.length; farmIndex++) {
      const farm = farms[farmIndex];
      console.log(`Procesando granja ${farmIndex + 1}/${farms.length}: ${farm.name}`);
      const equipmentCount = faker.number.int({ min: 2, max: 5 });
      console.log(`Creando ${equipmentCount} equipos para ${farm.name}...`);
      
      for (let i = 0; i < equipmentCount; i++) {
        console.log(`Creando equipo ${i + 1}/${equipmentCount} para ${farm.name}...`);
        const equipment = await createEquipment(farm);
        allEquipment.push(equipment);
        console.log(`Equipo ${i + 1}/${equipmentCount} completado para ${farm.name}`);
      }
      console.log(`Granja ${farm.name} completada - Total equipos: ${equipmentCount}`);
    }
    console.log(`Todos los equipos creados. Total: ${allEquipment.length}`);

    // Create devices for equipment
    console.log("Creando dispositivos...");
    for (let equipIndex = 0; equipIndex < allEquipment.length; equipIndex++) {
      const equipment = allEquipment[equipIndex];
      console.log(`Procesando equipo ${equipIndex + 1}/${allEquipment.length}: ${equipment.name}`);
      const deviceCount = faker.number.int({ min: 1, max: 3 });
      const farm = await Farm.findById(equipment.farm);
      console.log(`Creando ${deviceCount} dispositivos para ${equipment.name}...`);
      
      for (let i = 0; i < deviceCount; i++) {
        console.log(`Creando dispositivo ${i + 1}/${deviceCount} para ${equipment.name}...`);
        await createDevice(farm, equipment);
        console.log(`Dispositivo ${i + 1}/${deviceCount} completado para ${equipment.name}`);
      }
      console.log(`Dispositivos completados para ${equipment.name}`);
    }
    console.log("Todos los dispositivos creados");

    // Create collections
    console.log("Creando colecciones...");
    for (let farmIndex = 0; farmIndex < farms.length; farmIndex++) {
      const farm = farms[farmIndex];
      console.log(`Creando colecciones para granja ${farmIndex + 1}/${farms.length}: ${farm.name}`);
      
      // Get only milk tank equipment for this farm
      const tankEquipments = await Equipment.find({ 
        farm: farm._id, 
        type: "Tanque de leche" 
      });
      
      if (tankEquipments.length > 0) {
        // Create 3-8 collections per farm
        const collectionsPerFarm = faker.number.int({ min: 3, max: 8 });
        console.log(`Creando ${collectionsPerFarm} colecciones para ${farm.name}...`);
        
        for (let i = 0; i < collectionsPerFarm; i++) {
          await createCollection(farm, tankEquipments);
        }
        console.log(`${collectionsPerFarm} colecciones creadas para ${farm.name}`);
      } else {
        console.log(`No hay tanques de leche en ${farm.name}, saltando colecciones`);
      }
    }
    console.log("Todas las colecciones creadas");

    // Create notifications
    console.log("Creando notificaciones...");
    const notificationCount = faker.number.int({ min: 80, max: 150 });
    for (let i = 0; i < notificationCount; i++) {
      const farm = randomItem(farms);
      const equipmentList = await Equipment.find({ farm: farm._id });
      
      if (equipmentList.length > 0) {
        const equipment = randomItem(equipmentList);
        const deviceList = await Device.find({ equipment: equipment._id });
        
        if (deviceList.length > 0) {
          const device = randomItem(deviceList);
          const farmUsers = await User.find({ farms: farm._id });
          
          if (farmUsers.length > 0) {
            await createNotification(farm, equipment, device, farmUsers);
          }
        }
      }
    }

    // Final statistics
    const stats = {
      farms: await Farm.countDocuments(),
      users: await User.countDocuments(),
      equipment: await Equipment.countDocuments(),
      devices: await Device.countDocuments(),
      collections: await Collection.countDocuments(),
      notifications: await Notification.countDocuments()
    };

    console.log('Base de datos poblada exitosamente!');
    console.log('Estadísticas finales:', stats);
    
  } catch (error) {
    console.error('Error al poblar la base de datos:', error);
  } finally {
    console.log("Desconectando de MongoDB...");
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB.");
  }
};

await populateDatabase();
console.log(`Node.js version: ${process.version}`);