const DevConsole = require('../../utils/console');

describe('DevConsole Utility', () => {
  let originalConsole;

  beforeAll(() => {
    originalConsole = console;
  });

  afterAll(() => {
    global.console = originalConsole;
  });

  test('debería proporcionar métodos de consola', () => {
    expect(DevConsole).toHaveProperty('log');
    expect(DevConsole).toHaveProperty('error');
    expect(DevConsole).toHaveProperty('warn');
    expect(DevConsole).toHaveProperty('info');
    expect(DevConsole).toHaveProperty('debug');
  });

  test('debería funcionar sin errores', () => {
    expect(() => {
      DevConsole.log('Test message');
      DevConsole.error('Test error');
      DevConsole.warn('Test warning');
      DevConsole.info('Test info');
      DevConsole.debug('Test debug');
    }).not.toThrow();
  });
});