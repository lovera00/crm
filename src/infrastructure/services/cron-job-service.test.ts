import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CronJobService, ConsoleLogger } from './cron-job-service';
import { ActualizarDeudasDiariamenteUseCase } from '../../application/use-cases/actualizar-deudas-diariamente';

describe('CronJobService', () => {
  let useCase: ActualizarDeudasDiariamenteUseCase;
  let logger: ConsoleLogger;
  let service: CronJobService;

  beforeEach(() => {
    useCase = {
      execute: vi.fn().mockResolvedValue({
        deudasProcesadas: 0,
        deudasConInteresesAplicados: 0,
        deudasConEstadoCambiado: 0,
        interesMoratorioTotal: 0,
        interesPunitorioTotal: 0,
        detalles: [],
      }),
    } as unknown as ActualizarDeudasDiariamenteUseCase;

    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    } as unknown as ConsoleLogger;

    service = new CronJobService(useCase, logger, { horaEjecucion: 2 });
  });

  afterEach(() => {
    service.stop();
  });

  describe('start', () => {
    it('debería iniciar el servicio y programar la próxima ejecución', () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(now);

      service.start();

      expect(service.isActive()).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('Iniciando CronJobService para actualizaciones diarias de deudas');
      
      vi.useRealTimers();
    });

    it('no debería iniciar múltiples veces', () => {
      service.start();
      service.start();
      
      expect(logger.warn).toHaveBeenCalledWith('CronJobService ya está iniciado');
    });
  });

  describe('stop', () => {
    it('debería detener el servicio', () => {
      service.start();
      expect(service.isActive()).toBe(true);
      
      service.stop();
      
      expect(service.isActive()).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('CronJobService detenido');
    });
  });

  describe('ejecutarManualmente', () => {
    it('debería ejecutar la actualización manualmente', async () => {
      await service.ejecutarManualmente();
      
      expect(useCase.execute).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Iniciando actualización diaria de deudas', expect.any(Object));
    });

    it('no debería permitir ejecución concurrente', async () => {
      // Simular ejecución lenta
      useCase.execute = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const ejecucion1 = service.ejecutarManualmente();
      const ejecucion2 = service.ejecutarManualmente();
      
      await Promise.all([ejecucion1, ejecucion2]);
      
      expect(logger.warn).toHaveBeenCalledWith('Ya hay una ejecución en curso');
    });
  });

  describe('calcularProximaEjecucion', () => {
    it('debería calcular la próxima ejecución para hoy si la hora no ha pasado', () => {
      const now = new Date('2024-01-01T10:00:00Z'); // 10 AM UTC
      const service = new CronJobService(useCase, logger, { horaEjecucion: 14 }); // 2 PM UTC
      
      const proxima = (service as any).calcularProximaEjecucion(now);
      
      expect(proxima.getUTCDate()).toBe(1); // Mismo día
      expect(proxima.getUTCHours()).toBe(14);
    });

    it('debería calcular la próxima ejecución para mañana si la hora ya pasó', () => {
      const now = new Date('2024-01-01T15:00:00Z'); // 3 PM UTC
      const service = new CronJobService(useCase, logger, { horaEjecucion: 14 }); // 2 PM UTC (ya pasó)
      
      const proxima = (service as any).calcularProximaEjecucion(now);
      
      expect(proxima.getUTCDate()).toBe(2); // Día siguiente
      expect(proxima.getUTCHours()).toBe(14);
    });
  });

  describe('ejecución programada', () => {
    it('debería ejecutar actualización cuando el timer se dispara', async () => {
      vi.useFakeTimers();
      const now = new Date('2024-01-01T10:00:00Z');
      vi.setSystemTime(now);

      const mockExecute = vi.fn().mockResolvedValue({
        deudasProcesadas: 2,
        deudasConInteresesAplicados: 1,
        deudasConEstadoCambiado: 0,
        interesMoratorioTotal: 5.5,
        interesPunitorioTotal: 2.3,
        detalles: [
          {
            deudaId: 1,
            cambios: ['Intereses aplicados'],
            interesMoratorioAplicado: 5.5,
            interesPunitorioAplicado: 2.3,
          },
        ],
      });
      const useCaseWithMock = { execute: mockExecute } as unknown as ActualizarDeudasDiariamenteUseCase;
      const loggerMock = { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() };
      const service = new CronJobService(useCaseWithMock, loggerMock, { horaEjecucion: 10, minutoEjecucion: 30 }); // Configurar para que se ejecute pronto

      service.start();
      
      // Avanzar el tiempo 30 minutos para que se ejecute (hora de ejecución 10:30, ahora son 10:00)
      await vi.advanceTimersByTimeAsync(30 * 60 * 1000);
      
      expect(mockExecute).toHaveBeenCalled();
      expect(loggerMock.info).toHaveBeenCalledWith('Iniciando actualización diaria de deudas', expect.any(Object));
      expect(loggerMock.debug).toHaveBeenCalledWith('Deuda 1: Intereses aplicados', expect.any(Object));
      
      vi.useRealTimers();
    });
  });

  describe('ConsoleLogger', () => {
    it('debería loggear mensajes en consola', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

      const logger = new ConsoleLogger();
      logger.info('Mensaje info', { data: 'test' });
      logger.warn('Mensaje warn');
      logger.error('Mensaje error', { error: 'something' });
      logger.debug('Mensaje debug');

      expect(consoleLogSpy).toHaveBeenCalledWith('[INFO] Mensaje info', { data: 'test' });
      expect(consoleWarnSpy).toHaveBeenCalledWith('[WARN] Mensaje warn', '');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Mensaje error', { error: 'something' });
      expect(consoleDebugSpy).toHaveBeenCalledWith('[DEBUG] Mensaje debug', '');

      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleDebugSpy.mockRestore();
    });
  });
});