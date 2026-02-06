import { Deuda } from '../domain/entities/deuda';
import { Cuota } from '../domain/entities/cuota';
import { EstadoCuota } from '../domain/enums/estado-cuota';
import { EstadoDeuda } from '../domain/enums/estado-deuda';

export function crearCuotaPrueba(overrides: Partial<Parameters<typeof Cuota.crear>[0]> = {}) {
  const defaults = {
    numeroCuota: 1,
    fechaVencimiento: new Date('2024-01-01'),
    capitalOriginal: 1000,
    montoCuota: 200,
  };
  
  return Cuota.crear({ ...defaults, ...overrides });
}

export function crearDeudaPrueba(overrides: Partial<Parameters<typeof Deuda.crear>[0]> = {}) {
  const defaults = {
    acreedor: 'Banco de Prueba',
    concepto: 'Préstamo de prueba',
    gestorAsignadoId: 1,
    cuotas: [],
    montoCuota: null,
  };
  
  return Deuda.crear({ ...defaults, ...overrides });
}

export function crearDeudaConCuotas(
  cuotasConfig: Array<{
    numeroCuota: number;
    fechaVencimiento: Date;
    capitalOriginal: number;
    estadoCuota?: EstadoCuota;
    saldoCapital?: number;
    interesMoratorioAcumulado?: number;
    interesPunitorioAcumulado?: number;
  }>
) {
  const cuotas = cuotasConfig.map(config => 
    Cuota.crear({
      numeroCuota: config.numeroCuota,
      fechaVencimiento: config.fechaVencimiento,
      capitalOriginal: config.capitalOriginal,
      montoCuota: config.capitalOriginal * 0.1,
      ...(config.estadoCuota && { estadoCuota: config.estadoCuota }),
      ...(config.saldoCapital !== undefined && { saldoCapital: config.saldoCapital }),
      ...(config.interesMoratorioAcumulado !== undefined && { interesMoratorioAcumulado: config.interesMoratorioAcumulado }),
      ...(config.interesPunitorioAcumulado !== undefined && { interesPunitorioAcumulado: config.interesPunitorioAcumulado }),
    })
  );
  
  return crearDeudaPrueba({ cuotas });
}

export function crearFecha(daysOffset = 0): Date {
  const fecha = new Date('2024-06-01');
  fecha.setDate(fecha.getDate() + daysOffset);
  return fecha;
}

export function avanzarDias(fecha: Date, days: number): Date {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setDate(nuevaFecha.getDate() + days);
  return nuevaFecha;
}