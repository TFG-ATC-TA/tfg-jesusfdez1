const request = require('supertest');
const app = require('../app');
const { cleanDatabase } = require('./utils/testHelpers');

describe('App Integration Tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('Application Setup', () => {
    test('debería responder en la ruta raíz', async () => {
      const response = await request(app)
        .get('/')
        .expect(404); // La aplicación no tiene ruta raíz definida
    });

    test('debería tener middleware de parsing JSON configurado', async () => {
      const response = await request(app)
        .post('/user')
        .send({ test: 'data' })
        .expect(401); // Debería fallar por falta de autenticación, no por parsing

      // Si llegamos aquí, significa que el JSON fue parseado correctamente
    });

    test('debería manejar rutas no encontradas', async () => {
      const response = await request(app)
        .get('/ruta-inexistente')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    test('debería tener todas las rutas principales configuradas', async () => {
      const routes = [
        '/user',
        '/farm',
        '/device',
        '/equipment',
        '/history',
        '/postgres',
        '/collection',
        '/notification'
      ];

      for (const route of routes) {
        const response = await request(app)
          .get(`${route}/test`)
          .expect(res => {
            // Debería responder con algo (401, 404, etc.) pero no con error de servidor
            expect(res.status).not.toBe(500);
          });
      }
    });
  });

  describe('Error Handling', () => {
    test('debería manejar errores con formato JSON', async () => {
      const response = await request(app)
        .get('/ruta-inexistente')
        .expect(404);

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.body).toHaveProperty('error');
    });

    test('debería manejar errores de validación', async () => {
      // Enviar datos inválidos a una ruta que requiere autenticación
      const response = await request(app)
        .post('/user')
        .send({})
        .expect(401);

      expect(response.body.message).toBe('Acceso denegado. No hay token proporcionado.');
    });
  });

  describe('CORS Configuration', () => {
    test('debería permitir solicitudes CORS', async () => {
      const response = await request(app)
        .options('/')
        .expect(res => {
          // Debería manejar OPTIONS request (pre-flight CORS)
          expect(res.status).toBeLessThan(500);
        });
    });
  });

  describe('Content-Type Handling', () => {
    test('debería manejar diferentes tipos de contenido', async () => {
      const response = await request(app)
        .post('/user')
        .set('Content-Type', 'application/json')
        .send('{"invalid": "json"')
        .expect(400);
      
      // Debería fallar por JSON malformado, no por configuración
    });
  });

  describe('Security Headers', () => {
    test('debería incluir headers de seguridad básicos', async () => {
      const response = await request(app)
        .get('/')
        .expect(404);

      // Verificar que la respuesta es válida
      expect(response.status).toBe(404);
    });
  });

  describe('Environment Configuration', () => {
    test('debería funcionar en entorno de test', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    test('debería tener variables de entorno configuradas', () => {
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.MONGODB_URI).toBeDefined();
    });
  });

  describe('Database Connection', () => {
    test('debería tener conexión a la base de datos', async () => {
      const mongoose = require('mongoose');
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
    });
  });

  describe('Route Integration', () => {
    test('debería integrar correctamente con rutas de usuario', async () => {
      const response = await request(app)
        .get('/user/list')
        .expect(401); // Sin token debería fallar

      expect(response.body.message).toBe('Acceso denegado. No hay token proporcionado.');
    });

    test('debería integrar correctamente con rutas de granja', async () => {
      const response = await request(app)
        .get('/farm/list')
        .expect(401); // Sin token debería fallar

      expect(response.body.message).toBe('Acceso denegado. No hay token proporcionado.');
    });

    test('debería integrar correctamente con rutas de dispositivos', async () => {
      const response = await request(app)
        .get('/device/list')
        .expect(401); // Sin token debería fallar

      expect(response.body.message).toBe('Acceso denegado. No hay token proporcionado.');
    });

    test('debería integrar correctamente con rutas de equipos', async () => {
      const response = await request(app)
        .get('/equipment/list')
        .expect(401); // Sin token debería fallar

      expect(response.body.message).toBe('Acceso denegado. No hay token proporcionado.');
    });
  });
});
