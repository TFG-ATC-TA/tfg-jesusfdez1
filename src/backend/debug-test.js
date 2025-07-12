const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Debug test
async function debugTest() {
  try {
    // Conectar a una base de datos de prueba
    await mongoose.connect('mongodb://localhost:27017/test', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conectado a MongoDB');
    
    // Limpiar la base de datos
    await User.deleteMany({});
    
    // Crear hash de contraseña
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hash generado:', hashedPassword);
    
    // Crear usuario
    const user = await User.create({
      name: 'Test',
      surname: 'User',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: 'Administrador',
      farms: []
    });
    
    console.log('Usuario creado:', user);
    
    // Buscar usuario
    const foundUser = await User.findOne({ email: 'test@example.com' });
    console.log('Usuario encontrado:', foundUser);
    
    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, foundUser.passwordHash);
    console.log('Contraseña coincide:', isMatch);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

debugTest();
