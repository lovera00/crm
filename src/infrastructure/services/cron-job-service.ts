import { ActualizarDeudasDiariamenteUseCase } from '../../application/use-cases/actualizar-deudas-diariamente';

export interface Logger {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
}

export interface CronJobServiceConfig {
  horaEjecucion: number; // 0-23 hora del día en la que ejecutar (por defecto 2 AM)
  minutoEjecucion?: number; // 0-59 minuto (por defecto 0)
  timezone?: string; // Zona horaria (por defecto 'America/Argentina/Buenos_Aires')
}

export class CronJobService {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private actualizarDeudasUseCase: ActualizarDeudasDiariamenteUseCase,
    private logger: Logger,
    private config: CronJobServiceConfig = { horaEjecucion: 2 }
  ) {}

  start(): void {
    if (this.intervalId) {
      this.logger.warn('CronJobService ya está iniciado');
      return;
    }

    this.logger.info('Iniciando CronJobService para actualizaciones diarias de deudas');
    
    // Calcular el próximo tiempo de ejecución
    const ahora = new Date();
    const proximaEjecucion = this.calcularProximaEjecucion(ahora);
    const delayMs = proximaEjecucion.getTime() - ahora.getTime();

    this.logger.info(`Primera ejecución programada para: ${proximaEjecucion.toISOString()} (en ${Math.round(delayMs / 1000 / 60)} minutos)`);

    // Programar primera ejecución
    this.intervalId = setTimeout(() => {
      this.ejecutarActualizacion();
      // Después de la primera ejecución, programar cada 24 horas
      this.intervalId = setInterval(() => {
        this.ejecutarActualizacion();
      }, 24 * 60 * 60 * 1000);
    }, delayMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      clearTimeout(this.intervalId);
      this.intervalId = null;
      this.logger.info('CronJobService detenido');
    }
  }

  async ejecutarManualmente(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Ya hay una ejecución en curso');
      return;
    }
    await this.ejecutarActualizacion();
  }

  private async ejecutarActualizacion(): Promise<void> {
    this.isRunning = true;
    const fechaInicio = new Date();
    
    try {
      this.logger.info('Iniciando actualización diaria de deudas', { fechaInicio: fechaInicio.toISOString() });
      
      const resultado = await this.actualizarDeudasUseCase.execute();
      
      this.logger.info('Actualización diaria de deudas completada', {
        fechaFin: new Date().toISOString(),
        deudasProcesadas: resultado.deudasProcesadas,
        deudasConInteresesAplicados: resultado.deudasConInteresesAplicados,
        deudasConEstadoCambiado: resultado.deudasConEstadoCambiado,
        interesMoratorioTotal: resultado.interesMoratorioTotal,
        interesPunitorioTotal: resultado.interesPunitorioTotal,
      });

      // Registrar detalles para debugging
      resultado.detalles.forEach(detalle => {
        this.logger.debug(`Deuda ${detalle.deudaId}: ${detalle.cambios.join(', ')}`, {
          deudaId: detalle.deudaId,
          interesMoratorioAplicado: detalle.interesMoratorioAplicado,
          interesPunitorioAplicado: detalle.interesPunitorioAplicado,
          estadoCambiado: detalle.estadoCambiado,
        });
      });

    } catch (error) {
      this.logger.error('Error durante la actualización diaria de deudas', { error: error instanceof Error ? error.message : String(error) });
    } finally {
      this.isRunning = false;
    }
  }

  private calcularProximaEjecucion(fechaActual: Date): Date {
    const { horaEjecucion = 2, minutoEjecucion = 0 } = this.config;
    
    const proxima = new Date(fechaActual);
    proxima.setUTCHours(horaEjecucion, minutoEjecucion, 0, 0);
    
    // Si la hora ya pasó hoy, programar para mañana
    if (proxima.getTime() <= fechaActual.getTime()) {
      proxima.setUTCDate(proxima.getUTCDate() + 1);
    }
    
    return proxima;
  }

  isActive(): boolean {
    return this.intervalId !== null;
  }
}

export class ConsoleLogger implements Logger {
  info(message: string, metadata?: Record<string, any>): void {
    console.log(`[INFO] ${message}`, metadata || '');
  }
  warn(message: string, metadata?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, metadata || '');
  }
  error(message: string, metadata?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, metadata || '');
  }
  debug(message: string, metadata?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, metadata || '');
  }
}