const DevConsole = require('../../utils/console');

describe('DevConsole Utility', () => {
  let originalConsole;
  let originalNodeEnv;
  let mockLog, mockError, mockWarn, mockInfo, mockDebug;

  beforeAll(() => {
    originalConsole = { ...console };
    originalNodeEnv = process.env.NODE_ENV;
    
    // Mock de todos los métodos de console
    mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockInfo = jest.spyOn(console, 'info').mockImplementation(() => {});
    mockDebug = jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restaurar console original
    mockLog.mockRestore();
    mockError.mockRestore();
    mockWarn.mockRestore();
    mockInfo.mockRestore();
    mockDebug.mockRestore();
    
    // Restaurar NODE_ENV original
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterEach(() => {
    // Limpiar mocks después de cada test
    jest.clearAllMocks();
  });

  describe('Propiedades y Métodos', () => {
    test('debería proporcionar todos los métodos de consola', () => {
      expect(DevConsole).toHaveProperty('log');
      expect(DevConsole).toHaveProperty('error');
      expect(DevConsole).toHaveProperty('warn');
      expect(DevConsole).toHaveProperty('info');
      expect(DevConsole).toHaveProperty('debug');
    });

    test('debería exportar todos los métodos como funciones', () => {
      expect(typeof DevConsole.log).toBe('function');
      expect(typeof DevConsole.error).toBe('function');
      expect(typeof DevConsole.warn).toBe('function');
      expect(typeof DevConsole.info).toBe('function');
      expect(typeof DevConsole.debug).toBe('function');
    });
  });

  describe('Comportamiento en Modo Desarrollo', () => {
    beforeEach(() => {
      // Forzar modo desarrollo
      process.env.NODE_ENV = 'development';
    });

    test('debería llamar console.log en modo development', () => {
      DevConsole.log('Test message', 'additional param');
      
      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith('Test message', 'additional param');
    });

    test('debería llamar console.error en modo development', () => {
      DevConsole.error('Test error', { error: 'object' });
      
      expect(mockError).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledWith('Test error', { error: 'object' });
    });

    test('debería llamar console.warn en modo development', () => {
      DevConsole.warn('Test warning', 123);
      
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledWith('Test warning', 123);
    });

    test('debería llamar console.info en modo development', () => {
      DevConsole.info('Test info', true);
      
      expect(mockInfo).toHaveBeenCalledTimes(1);
      expect(mockInfo).toHaveBeenCalledWith('Test info', true);
    });

    test('debería llamar console.debug en modo development', () => {
      DevConsole.debug('Test debug', null);
      
      expect(mockDebug).toHaveBeenCalledTimes(1);
      expect(mockDebug).toHaveBeenCalledWith('Test debug', null);
    });

    test('debería manejar múltiples argumentos correctamente', () => {
      DevConsole.log('Mensaje', 123, { key: 'value' }, [1, 2, 3], true);
      
      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith('Mensaje', 123, { key: 'value' }, [1, 2, 3], true);
    });
  });

  describe('Comportamiento en Modo dev (alternativo)', () => {
    beforeEach(() => {
      // Forzar modo dev (alternativo)
      process.env.NODE_ENV = 'dev';
    });

    test('debería funcionar también con NODE_ENV=dev', () => {
      DevConsole.log('Test in dev mode');
      
      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockLog).toHaveBeenCalledWith('Test in dev mode');
    });
  });

  describe('Comportamiento en Modo Producción', () => {
    beforeEach(() => {
      // Forzar modo producción
      process.env.NODE_ENV = 'production';
    });

    test('NO debería llamar console.log en modo production', () => {
      DevConsole.log('Test message');
      
      expect(mockLog).not.toHaveBeenCalled();
    });

    test('NO debería llamar console.error en modo production', () => {
      DevConsole.error('Test error');
      
      expect(mockError).not.toHaveBeenCalled();
    });

    test('NO debería llamar console.warn en modo production', () => {
      DevConsole.warn('Test warning');
      
      expect(mockWarn).not.toHaveBeenCalled();
    });

    test('NO debería llamar console.info en modo production', () => {
      DevConsole.info('Test info');
      
      expect(mockInfo).not.toHaveBeenCalled();
    });

    test('NO debería llamar console.debug en modo production', () => {
      DevConsole.debug('Test debug');
      
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });

  describe('Comportamiento en Modo Test', () => {
    beforeEach(() => {
      // Forzar modo test
      process.env.NODE_ENV = 'test';
    });

    test('NO debería llamar console.log en modo test', () => {
      DevConsole.log('Test message');
      
      expect(mockLog).not.toHaveBeenCalled();
    });

    test('NO debería llamar ningún método de console en modo test', () => {
      DevConsole.log('Test log');
      DevConsole.error('Test error');
      DevConsole.warn('Test warn');
      DevConsole.info('Test info');
      DevConsole.debug('Test debug');
      
      expect(mockLog).not.toHaveBeenCalled();
      expect(mockError).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });

  describe('Comportamiento sin NODE_ENV definido', () => {
    beforeEach(() => {
      // Eliminar NODE_ENV para simular entorno sin definir
      delete process.env.NODE_ENV;
    });

    test('NO debería llamar console.log cuando NODE_ENV no está definido', () => {
      DevConsole.log('Test message');
      
      expect(mockLog).not.toHaveBeenCalled();
    });

    test('NO debería llamar ningún método cuando NODE_ENV es undefined', () => {
      DevConsole.log('Test log');
      DevConsole.error('Test error');
      DevConsole.warn('Test warn');
      DevConsole.info('Test info');
      DevConsole.debug('Test debug');
      
      expect(mockLog).not.toHaveBeenCalled();
      expect(mockError).not.toHaveBeenCalled();
      expect(mockWarn).not.toHaveBeenCalled();
      expect(mockInfo).not.toHaveBeenCalled();
      expect(mockDebug).not.toHaveBeenCalled();
    });
  });

  describe('Casos de Borde y Robustez', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('debería funcionar sin argumentos', () => {
      expect(() => {
        DevConsole.log();
        DevConsole.error();
        DevConsole.warn();
        DevConsole.info();
        DevConsole.debug();
      }).not.toThrow();
      
      expect(mockLog).toHaveBeenCalledWith();
      expect(mockError).toHaveBeenCalledWith();
      expect(mockWarn).toHaveBeenCalledWith();
      expect(mockInfo).toHaveBeenCalledWith();
      expect(mockDebug).toHaveBeenCalledWith();
    });

    test('debería manejar argumentos undefined y null', () => {
      expect(() => {
        DevConsole.log(undefined, null);
        DevConsole.error(null, undefined);
      }).not.toThrow();
      
      expect(mockLog).toHaveBeenCalledWith(undefined, null);
      expect(mockError).toHaveBeenCalledWith(null, undefined);
    });

    test('debería manejar objetos complejos', () => {
      const complexObj = {
        nested: { deep: { value: 'test' } },
        array: [1, 2, { inner: 'value' }],
        func: () => 'function',
        date: new Date(),
        regex: /test/g
      };
      
      expect(() => {
        DevConsole.log('Complex object:', complexObj);
      }).not.toThrow();
      
      expect(mockLog).toHaveBeenCalledWith('Complex object:', complexObj);
    });

    test('debería manejar errores como argumentos', () => {
      const error = new Error('Test error');
      
      expect(() => {
        DevConsole.error('Error occurred:', error);
      }).not.toThrow();
      
      expect(mockError).toHaveBeenCalledWith('Error occurred:', error);
    });

    test('debería manejar cambios dinámicos de NODE_ENV', () => {
      // Inicialmente en development
      process.env.NODE_ENV = 'development';
      DevConsole.log('Message 1');
      expect(mockLog).toHaveBeenCalledTimes(1);
      
      // Cambiar a production
      process.env.NODE_ENV = 'production';
      DevConsole.log('Message 2');
      expect(mockLog).toHaveBeenCalledTimes(1); // No debería incrementar
      
      // Volver a development
      process.env.NODE_ENV = 'development';
      DevConsole.log('Message 3');
      expect(mockLog).toHaveBeenCalledTimes(2); // Debería incrementar
    });
  });

  describe('Integración y Compatibilidad', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('debería ser compatible con el uso en cadena', () => {
      expect(() => {
        DevConsole.log('Mensaje 1');
        DevConsole.warn('Mensaje 2');
        DevConsole.error('Mensaje 3');
      }).not.toThrow();
      
      expect(mockLog).toHaveBeenCalledTimes(1);
      expect(mockWarn).toHaveBeenCalledTimes(1);
      expect(mockError).toHaveBeenCalledTimes(1);
    });

    test('debería preservar el comportamiento original de console', () => {
      const testMessage = 'Test message with special chars: áéíóú ñ 中文 🚀';
      
      DevConsole.log(testMessage);
      
      expect(mockLog).toHaveBeenCalledWith(testMessage);
    });

    test('debería manejar variables de entorno especiales', () => {
      // Casos edge con valores inusuales de NODE_ENV
      const specialValues = ['DEVELOPMENT', 'Development', 'DEV', 'Dev', '', ' '];
      
      specialValues.forEach(value => {
        process.env.NODE_ENV = value;
        DevConsole.log(`Test with ${value}`);
        // Solo debería funcionar con 'development' y 'dev' exactos (case-sensitive)
        expect(mockLog).not.toHaveBeenCalled();
        jest.clearAllMocks();
      });
    });

    test('debería funcionar correctamente con múltiples llamadas simultáneas', () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        promises.push(Promise.resolve().then(() => {
          DevConsole.log(`Message ${i}`);
        }));
      }
      
      return Promise.all(promises).then(() => {
        expect(mockLog).toHaveBeenCalledTimes(10);
      });
    });
  });

  describe('Cobertura de Rendimiento', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    test('debería ejecutarse rápidamente con múltiples llamadas', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        DevConsole.log(`Performance test ${i}`);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(100); // Debería ejecutarse en menos de 100ms
      expect(mockLog).toHaveBeenCalledTimes(1000);
    });

    test('debería ser eficiente en modo producción (sin llamadas)', () => {
      process.env.NODE_ENV = 'production';
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        DevConsole.log(`Performance test ${i}`);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      expect(duration).toBeLessThan(50); // Debería ser aún más rápido sin hacer nada
      expect(mockLog).not.toHaveBeenCalled();
    });
  });
});