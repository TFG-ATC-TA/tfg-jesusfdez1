const jwt = require('jsonwebtoken');
const { verifyToken, isAdmin } = require('../../middleware/auth');
const { createTestUser, createTestAdmin } = require('../utils/testHelpers');

describe('Auth Middleware', () => {
  describe('verifyToken', () => {
    test('debería verificar token válido', async () => {
      const user = await createTestUser();
      const token = jwt.sign(
        { user: { id: user._id, email: user.email, role: user.role } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: token
        }
      };
      const res = {};
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user._id.toString());
      expect(req.user.email).toBe(user.email);
      expect(req.user.role).toBe(user.role);
      expect(next).toHaveBeenCalledWith();
    });

    test('debería rechazar petición sin token', async () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Acceso denegado. No hay token proporcionado.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar token inválido', async () => {
      const req = {
        headers: {
          authorization: 'token-invalido'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar token expirado', async () => {
      const user = await createTestUser();
      const expiredToken = jwt.sign(
        { user: { id: user._id, email: user.email, role: user.role } },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Token expirado
      );

      const req = {
        headers: {
          authorization: expiredToken
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('debería rechazar token con secret incorrecto', async () => {
      const user = await createTestUser();
      const tokenWithWrongSecret = jwt.sign(
        { user: { id: user._id, email: user.email, role: user.role } },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: tokenWithWrongSecret
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      await verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Token inválido.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('isAdmin', () => {
    test('debería permitir acceso a administradores', () => {
      const req = {
        user: {
          role: 'Administrador'
        }
      };
      const res = {};
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('debería denegar acceso a no administradores', () => {
      const roles = ['Ganadero', 'Veterinario', 'Industria'];

      roles.forEach(role => {
        const req = {
          user: {
            role: role
          }
        };
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };
        const next = jest.fn();

        isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
          message: 'Acceso denegado. Solo para administradores.'
        });
        expect(next).not.toHaveBeenCalled();
      });
    });

    test('debería denegar acceso sin role definido', () => {
      const req = {
        user: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      isAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Acceso denegado. Solo para administradores.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Middleware Chain', () => {
    test('debería funcionar verifyToken seguido de isAdmin para administrador', async () => {
      const admin = await createTestAdmin();
      const token = jwt.sign(
        { user: { id: admin._id, email: admin.email, role: admin.role } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: token
        }
      };
      const res = {};
      const next = jest.fn();

      // Primero verifyToken
      await verifyToken(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.user.role).toBe('Administrador');

      // Luego isAdmin
      next.mockClear();
      isAdmin(req, res, next);
      expect(next).toHaveBeenCalledWith();
    });

    test('debería fallar isAdmin después de verifyToken para usuario normal', async () => {
      const user = await createTestUser({ role: 'Ganadero' });
      const token = jwt.sign(
        { user: { id: user._id, email: user.email, role: user.role } },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = {
        headers: {
          authorization: token
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Primero verifyToken
      await verifyToken(req, res, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.user.role).toBe('Ganadero');

      // Luego isAdmin (debería fallar)
      next.mockClear();
      isAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
