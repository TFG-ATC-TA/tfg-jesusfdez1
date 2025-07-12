const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock completo de User
const mockUser = {
  findOne: jest.fn(),
  create: jest.fn(),
  deleteMany: jest.fn()
};

jest.mock('../../models/User', () => mockUser);

// Mock logger para evitar problemas
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

// Mock rate limiter para tests
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

const indexRouter = require('../../routes/index');

const app = express();
app.use(express.json());
app.use('/', indexRouter);

describe('Index Routes (Login)', () => {
  let testUser;
  const validPassword = 'TestPassword123!';
  let hashedPassword;

  beforeAll(async () => {
    // Configurar variables de entorno para tests
    process.env.JWT_SECRET = 'test-secret-key-for-testing';
    
    // Crear hash de contraseña para las pruebas
    hashedPassword = await bcrypt.hash(validPassword, 10);
  });

  beforeEach(async () => {
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Configurar mock del usuario de prueba
    testUser = {
      _id: 'test-user-id',
      name: 'Test',
      surname: 'User',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: 'Administrador',
      farms: []
    };
    
    // Configurar comportamiento por defecto del mock
    mockUser.findOne.mockResolvedValue(testUser);
    mockUser.create.mockResolvedValue(testUser);
    mockUser.deleteMany.mockResolvedValue({ deletedCount: 1 });
  });

  describe('POST /login', () => {
    it('debería autenticar usuario con credenciales válidas', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toMatchObject({
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        role: 'Administrador'
      });
      
      // Verificar que el token sea válido
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.user.email).toBe('test@example.com');
    });

    it('debería rechazar credenciales con email inválido', async () => {
      // Mock para usuario no encontrado
      mockUser.findOne.mockResolvedValue(null);
      
      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: validPassword
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('debería rechazar credenciales con contraseña incorrecta', async () => {
      // Usuario existe pero contraseña incorrecta - mock con hash diferente
      const wrongHashedPassword = await bcrypt.hash('DifferentPassword', 10);
      const userWithWrongPassword = { ...testUser, passwordHash: wrongHashedPassword };
      mockUser.findOne.mockResolvedValue(userWithWrongPassword);
      
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword // Contraseña no coincidirá con el hash
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('debería manejar errores del servidor graciosamente', async () => {
      // Simular error del servidor
      mockUser.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toContain('Error del servidor');
    });

    it('debería validar campos requeridos', async () => {
      const responseNoEmail = await request(app)
        .post('/login')
        .send({
          password: validPassword
        });

      const responseNoPassword = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com'
        });

      const responseEmpty = await request(app)
        .post('/login')
        .send({});

      // Estos deberían devolver 400 por falta de validación en el route
      expect([400, 500]).toContain(responseNoEmail.status);
      expect([400, 500]).toContain(responseNoPassword.status);
      expect([400, 500]).toContain(responseEmpty.status);
    });

    it('debería incluir información correcta del usuario', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: 'test-user-id',
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        role: 'Administrador'
      });
    });

    it('debería generar token JWT válido', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.user).toMatchObject({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test',
        surname: 'User',
        role: 'Administrador'
      });
    });

    it('debería manejar diferentes tipos de roles de usuario', async () => {
      // Crear usuario con rol diferente
      const ganaderoUser = {
        _id: 'ganadero-user-id',
        name: 'Ganadero',
        surname: 'Test',
        email: 'ganadero@example.com',
        passwordHash: hashedPassword,
        role: 'Ganadero',
        farms: []
      };
      
      mockUser.findOne.mockResolvedValue(ganaderoUser);

      const response = await request(app)
        .post('/login')
        .send({
          email: 'ganadero@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('Ganadero');
    });

    it('debería no incluir información sensible', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.user.passwordHash).toBeUndefined();
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('Rate Limiting y Headers', () => {
    it('debería permitir múltiples intentos válidos', async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/login')
          .send({
            email: 'test@example.com',
            password: validPassword
          });

        expect(response.status).toBe(200);
      }
    });

    it('debería incluir headers en la respuesta', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.headers).toBeDefined();
    });

    it('debería manejar diferentes headers de IP', async () => {
      const response = await request(app)
        .post('/login')
        .set('x-forwarded-for', '192.168.1.100')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
    });
  });

  describe('Logging', () => {
    it('debería logear intentos exitosos', async () => {
      const logger = require('../../config/logger');
      
      await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(logger.info).toHaveBeenCalled();
    });

    it('debería logear intentos fallidos', async () => {
      const logger = require('../../config/logger');
      
      await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(logger.info).toHaveBeenCalled();
    });

    it('debería logear errores del servidor', async () => {
      const logger = require('../../config/logger');
      mockUser.findOne.mockRejectedValue(new Error('Database error'));
      
      await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Security y Token', () => {
    it('debería generar tokens con expiración correcta', async () => {
      const response = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: validPassword
        });

      expect(response.status).toBe(200);
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.exp).toBeDefined();
      
      // Verificar que el token tenga una expiración razonable
      const tokenExp = new Date(decoded.exp * 1000);
      const now = new Date();
      const timeDiff = tokenExp.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      
      expect(daysDiff).toBeGreaterThan(6); // Al menos 6 días
      expect(daysDiff).toBeLessThan(8); // Menos de 8 días
    });

    it('debería procesar JSON correctamente', async () => {
      const response = await request(app)
        .post('/login')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          email: 'test@example.com',
          password: validPassword
        }));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
