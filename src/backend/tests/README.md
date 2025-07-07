# Tests del Backend

Esta carpeta contiene la suite completa de tests para el backend de la aplicación de gestión de granjas.

## Estructura de Tests

```
tests/
├── setup.js                 # Configuración global de tests
├── utils/
│   └── testHelpers.js       # Utilidades para testing
├── models/                  # Tests de modelos
│   ├── User.test.js        # Tests del modelo User
│   ├── Farm.test.js        # Tests del modelo Farm
│   ├── Device.test.js      # Tests del modelo Device
│   └── Equipment.test.js   # Tests del modelo Equipment
├── routes/                  # Tests de rutas
│   ├── user.test.js        # Tests de rutas de usuario
│   └── farm.test.js        # Tests de rutas de granja
├── middleware/              # Tests de middleware
│   └── auth.test.js        # Tests de autenticación
├── utils/                   # Tests de utilidades
│   └── console.test.js     # Tests del sistema de console
└── app.test.js             # Tests de integración de la aplicación
```

## Comandos de Testing

### Ejecutar todos los tests
```bash
npm test
```

### Ejecutar tests en modo watch (desarrollo)
```bash
npm run test:watch
```

### Ejecutar tests con reporte de cobertura
```bash
npm run test:coverage
```

### Ejecutar tests específicos
```bash
# Tests de modelos
npm test -- tests/models/

# Tests de un modelo específico
npm test -- tests/models/User.test.js

# Tests de rutas
npm test -- tests/routes/

# Tests de middleware
npm test -- tests/middleware/
```

## Configuración

Los tests utilizan:

- **Jest** como framework de testing
- **Supertest** para tests de integración HTTP
- **MongoDB Memory Server** para base de datos en memoria
- **Mocks automáticos** para servicios externos

### Variables de Entorno

Los tests configuran automáticamente las siguientes variables:

```
NODE_ENV=test
JWT_SECRET=test-secret-key
MONGODB_URI=mongodb://localhost:27017/test-db
POSTGRES_USER=test-user
POSTGRES_PASSWORD=test-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=test-db
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=test-token
MQTT_PROTOCOL=mqtt
MQTT_HOST=localhost:1883
MQTT_USERNAME=test-user
MQTT_PASSWORD=test-password
```

## Cobertura de Tests

Los tests cubren:

### Modelos
- ✅ Validación de campos obligatorios
- ✅ Validación de tipos de datos
- ✅ Relaciones entre modelos
- ✅ Hooks de pre/post save
- ✅ Métodos personalizados
- ✅ Validaciones de unicidad

### Rutas
- ✅ Autenticación y autorización
- ✅ Validación de parámetros
- ✅ CRUD completo
- ✅ Filtrado y paginación
- ✅ Manejo de errores
- ✅ Responses de éxito

### Middleware
- ✅ Verificación de tokens JWT
- ✅ Validación de roles
- ✅ Manejo de errores de autenticación

### Utilidades
- ✅ Sistema de logging por entorno
- ✅ Funciones helper

### Integración
- ✅ Configuración de la aplicación
- ✅ Manejo de errores global
- ✅ Middleware configurados
- ✅ Rutas registradas

## Helpers de Testing

### createTestUser(userData)
Crea un usuario de prueba con datos predeterminados.

```javascript
const user = await createTestUser({
  name: 'Juan',
  role: 'Ganadero'
});
```

### createTestAdmin(userData)
Crea un usuario administrador de prueba.

```javascript
const admin = await createTestAdmin();
```

### generateToken(user)
Genera un token JWT válido para el usuario.

```javascript
const token = generateToken(user);
```

### expectValidUserResponse(user)
Valida que la respuesta de usuario tenga la estructura correcta.

```javascript
expectValidUserResponse(response.body.data[0]);
```

## Ejemplos de Tests

### Test de Modelo
```javascript
test('debería crear un usuario válido', async () => {
  const userData = {
    name: 'Juan',
    email: 'juan@example.com',
    passwordHash: 'Password123',
    role: 'Ganadero'
  };

  const user = new User(userData);
  const savedUser = await user.save();

  expect(savedUser.name).toBe(userData.name);
  expect(savedUser.passwordHash).not.toBe(userData.passwordHash); // Hasheado
});
```

### Test de Ruta
```javascript
test('debería obtener lista de usuarios para administrador', async () => {
  const admin = await createTestAdmin();
  const token = generateToken(admin);

  const response = await request(app)
    .get('/user/list')
    .set('Authorization', token)
    .expect(200);

  expect(response.body.data).toBeDefined();
  expect(response.body.totalItems).toBeDefined();
});
```

## Ejecución Continua

Los tests están configurados para:

- ✅ Ejecutarse en paralelo cuando sea seguro
- ✅ Limpiar la base de datos entre tests
- ✅ Usar base de datos en memoria
- ✅ Manejar timeouts apropiados
- ✅ Generar reportes de cobertura

## Depuración

Para depurar tests específicos:

```bash
# Ejecutar un test específico en modo verbose
npm test -- --verbose tests/models/User.test.js

# Ejecutar con logs de depuración
DEBUG=* npm test -- tests/models/User.test.js
```

## Métricas de Cobertura

El objetivo es mantener:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Contribución

Al añadir nuevas funcionalidades:

1. Escribir tests antes del código (TDD)
2. Cubrir casos de éxito y error
3. Incluir validaciones de edge cases
4. Mantener tests independientes
5. Usar los helpers existentes
6. Documentar tests complejos
