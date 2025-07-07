const request = require('supertest');
const express = require('express');
const userRouter = require('../../routes/user');
const User = require('../../models/User');
const Farm = require('../../models/Farm');
const { 
  generateToken, 
  createTestUser, 
  createTestAdmin, 
  createTestFarm,
  cleanDatabase,
  expectValidUserResponse 
} = require('../utils/testHelpers');

// Crear app de prueba
const app = express();
app.use(express.json());
app.use('/user', userRouter);

describe('User Routes', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /user/list', () => {
    test('debería obtener lista de usuarios para administrador', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      // Crear algunos usuarios de prueba
      await createTestUser({ name: 'Juan', email: 'juan@test.com', role: 'Ganadero' });
      await createTestUser({ name: 'María', email: 'maria@test.com', role: 'Veterinario' });

      const response = await request(app)
        .get('/user/list')
        .set('Authorization', token)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.totalItems).toBe(2);
      expect(response.body.currentPage).toBe(1);
      response.body.data.forEach(user => {
        expectValidUserResponse(user);
      });
    });

    test('debería denegar acceso a usuarios no administradores', async () => {
      const user = await createTestUser({ role: 'Ganadero' });
      const token = generateToken(user);

      const response = await request(app)
        .get('/user/list')
        .set('Authorization', token)
        .expect(401);

      expect(response.body.message).toBe('No tienes permisos para acceder a esta información');
    });

    test('debería filtrar usuarios por término de búsqueda', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      await createTestUser({ name: 'Juan', email: 'juan@test.com' });
      await createTestUser({ name: 'María', email: 'maria@test.com' });

      const response = await request(app)
        .get('/user/list?searchTerm=Juan')
        .set('Authorization', token)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Juan');
    });

    test('debería filtrar usuarios por rol', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      await createTestUser({ name: 'Ganadero1', email: 'ganadero1@test.com', role: 'Ganadero' });
      await createTestUser({ name: 'Veterinario1', email: 'veterinario1@test.com', role: 'Veterinario' });

      const response = await request(app)
        .get('/user/list?roles=Ganadero')
        .set('Authorization', token)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].role).toBe('Ganadero');
    });

    test('debería manejar paginación correctamente', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      // Crear 5 usuarios
      for (let i = 1; i <= 5; i++) {
        await createTestUser({ 
          name: `Usuario${i}`, 
          email: `usuario${i}@test.com` 
        });
      }

      const response = await request(app)
        .get('/user/list?page=1&limit=3')
        .set('Authorization', token)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.totalItems).toBe(5);
      expect(response.body.totalPages).toBe(2);
      expect(response.body.currentPage).toBe(1);
    });

    test('debería requerir autenticación', async () => {
      const response = await request(app)
        .get('/user/list')
        .expect(401);

      expect(response.body.message).toBe('Acceso denegado. No hay token proporcionado.');
    });
  });

  describe('POST /user', () => {
    test('debería crear un usuario válido', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const userData = {
        name: 'Nuevo Usuario',
        surname: 'Apellido',
        email: 'nuevo@test.com',
        password: 'Password123',
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(200);

      expect(response.body.message).toBe('Usuario creado correctamente');

      // Verificar que el usuario se creó en la base de datos
      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.role).toBe(userData.role);
    });

    test('debería denegar acceso a usuarios no administradores', async () => {
      const user = await createTestUser({ role: 'Ganadero' });
      const token = generateToken(user);

      const userData = {
        name: 'Nuevo Usuario',
        email: 'nuevo@test.com',
        password: 'Password123',
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(401);

      expect(response.body.message).toBe('No tienes permisos para realizar esta acción');
    });

    test('debería validar campos obligatorios', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const invalidData = {
        surname: 'Apellido'
        // Faltan campos obligatorios
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Faltan campos obligatorios');
    });

    test('debería validar formato de email', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const userData = {
        name: 'Usuario',
        email: 'email-invalido',
        password: 'Password123',
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('El formato del email no es válido');
    });

    test('debería validar unicidad del email', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      // Crear un usuario
      await createTestUser({ email: 'existente@test.com' });

      const userData = {
        name: 'Nuevo Usuario',
        email: 'existente@test.com',
        password: 'Password123',
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('El email introducida ya está registrado');
    });

    test('debería validar fortaleza de contraseña', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const userData = {
        name: 'Usuario',
        email: 'test@test.com',
        password: '123', // Contraseña débil
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('La contraseña no cumple con los requisitos de seguridad');
      expect(response.body.failedRequirements).toBeDefined();
    });

    test('debería validar formato de nombre', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const userData = {
        name: 'A', // Muy corto
        email: 'test@test.com',
        password: 'Password123',
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('El nombre debe contener al menos 2 caracteres');
    });

    test('debería crear usuario con granjas asociadas', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);
      const farm = await createTestFarm();

      const userData = {
        name: 'Usuario con Granja',
        email: 'congranja@test.com',
        password: 'Password123',
        role: 'Ganadero',
        farms: [farm._id]
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(200);

      expect(response.body.message).toBe('Usuario creado correctamente');

      const createdUser = await User.findOne({ email: userData.email });
      expect(createdUser.farms).toContainEqual(farm._id);
    });
  });

  describe('PUT /user/:userId', () => {
    test('debería actualizar un usuario válido', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);
      const user = await createTestUser();

      const updateData = {
        name: 'Nombre Actualizado',
        surname: 'Apellido Actualizado',
        email: 'actualizado@test.com',
        role: 'Veterinario'
      };

      const response = await request(app)
        .put(`/user/${user._id}`)
        .set('Authorization', token)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Usuario actualizado correctamente');

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
      expect(updatedUser.role).toBe(updateData.role);
    });

    test('debería denegar acceso a usuarios no administradores', async () => {
      const user = await createTestUser({ role: 'Ganadero' });
      const otherUser = await createTestUser({ email: 'otro@test.com' });
      const token = generateToken(user);

      const updateData = {
        name: 'Nombre Actualizado',
        email: 'actualizado@test.com',
        role: 'Veterinario'
      };

      const response = await request(app)
        .put(`/user/${otherUser._id}`)
        .set('Authorization', token)
        .send(updateData)
        .expect(401);

      expect(response.body.message).toBe('No tienes permisos para realizar esta acción');
    });

    test('debería impedir que el administrador se modifique a sí mismo', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const updateData = {
        name: 'Nombre Actualizado',
        email: 'actualizado@test.com',
        role: 'Ganadero'
      };

      const response = await request(app)
        .put(`/user/${admin._id}`)
        .set('Authorization', token)
        .send(updateData)
        .expect(403);

      expect(response.body.message).toContain('No puedes modificarte a ti mismo');
    });

    test('debería validar usuario inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);
      const fakeId = '507f1f77bcf86cd799439011';

      const updateData = {
        name: 'Nombre',
        email: 'test@test.com',
        role: 'Ganadero'
      };

      const response = await request(app)
        .put(`/user/${fakeId}`)
        .set('Authorization', token)
        .send(updateData)
        .expect(404);

      expect(response.body.message).toBe('Usuario no encontrado');
    });
  });

  describe('DELETE /user/:userId', () => {
    test('debería eliminar un usuario', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);
      const user = await createTestUser();

      const response = await request(app)
        .delete(`/user/${user._id}`)
        .set('Authorization', token)
        .expect(200);

      expect(response.body.message).toBe('Usuario eliminado correctamente');

      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });

    test('debería denegar acceso a usuarios no administradores', async () => {
      const user = await createTestUser({ role: 'Ganadero' });
      const otherUser = await createTestUser({ email: 'otro@test.com' });
      const token = generateToken(user);

      const response = await request(app)
        .delete(`/user/${otherUser._id}`)
        .set('Authorization', token)
        .expect(401);

      expect(response.body.message).toBe('No tienes permisos para realizar esta acción');
    });

    test('debería impedir que el administrador se elimine a sí mismo', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      const response = await request(app)
        .delete(`/user/${admin._id}`)
        .set('Authorization', token)
        .expect(403);

      expect(response.body.message).toBe('No puedes eliminarte a ti mismo');
    });

    test('debería manejar usuario inexistente', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/user/${fakeId}`)
        .set('Authorization', token)
        .expect(404);

      expect(response.body.message).toBe('Usuario no encontrado');
    });
  });

  describe('Error Handling', () => {
    test('debería manejar errores de base de datos', async () => {
      const admin = await createTestAdmin();
      const token = generateToken(admin);

      // Simular error cerrando la conexión
      const mongoose = require('mongoose');
      await mongoose.connection.close();

      const userData = {
        name: 'Usuario',
        email: 'test@test.com',
        password: 'Password123',
        role: 'Ganadero'
      };

      const response = await request(app)
        .post('/user')
        .set('Authorization', token)
        .send(userData)
        .expect(500);

      expect(response.body.message).toContain('Error creando el usuario');
    });
  });
});
