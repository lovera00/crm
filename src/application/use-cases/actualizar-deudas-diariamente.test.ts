import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActualizarDeudasDiariamenteUseCase } from './actualizar-deudas-diariamente';
import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { TransicionEstadoRepository } from '../../domain/repositories/transicion-estado-repository';
import { InteresAcumulador } from '../../domain/services/interes-acumulador';
import { Deuda } from '../../domain/entities/deuda';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { EstadoCuota } from '../../domain/enums/estado-cuota';
import { Cuota } from '../../domain/entities/cuota';
import { ValidadorTransicionEstado } from '../../domain/services/validador-transicion-estado';

describe('ActualizarDeudasDiariamenteUseCase', () => {
  let deudaRepository: DeudaRepository;
  let transicionEstadoRepository: TransicionEstadoRepository;
  let interesAcumulador: InteresAcumulador;
  let useCase: ActualizarDeudasDiariamenteUseCase;

  beforeEach(() => {
    deudaRepository = {
      buscarPorId: vi.fn(),
      guardar: vi.fn(),
      buscarPorGestor: vi.fn(),
      obtenerDeudasParaActualizacionDiaria: vi.fn().mockResolvedValue([]),
      obtenerDeudasConEstado: vi.fn().mockResolvedValue([]),
    };
    transicionEstadoRepository = {
      esTransicionValida: vi.fn(),
      obtenerTransicionesDesde: vi.fn(),
      obtenerTransicion: vi.fn(),
    };
    interesAcumulador = {
      calcularInteresDiario: vi.fn(),
      aplicarInteresDiario: vi.fn(),
      actualizarEstadoCuotasPorVencimiento: vi.fn(),
      // Métodos privados que no se usan directamente en los tests
      calcularDiasMora: vi.fn(),
      crearCuotaConIntereses: vi.fn(),
    } as unknown as InteresAcumulador;
    useCase = new ActualizarDeudasDiariamenteUseCase(
      deudaRepository,
      transicionEstadoRepository,
      interesAcumulador
    );
  });

  it('debería procesar cero deudas cuando no hay deudas activas', async () => {
    deudaRepository.obtenerDeudasParaActualizacionDiaria = vi.fn().mockResolvedValue([]);

    const resultado = await useCase.execute();

    expect(resultado.deudasProcesadas).toBe(0);
    expect(resultado.deudasConInteresesAplicados).toBe(0);
    expect(resultado.deudasConEstadoCambiado).toBe(0);
    expect(resultado.interesMoratorioTotal).toBe(0);
    expect(resultado.interesPunitorioTotal).toBe(0);
    expect(resultado.detalles).toHaveLength(0);
  });

  it('debería actualizar días de mora y gestión para deuda activa', async () => {
    const deuda = Deuda.reconstruir({
      id: 1,
      acreedor: 'Banco',
      concepto: 'Préstamo',
      estadoActual: EstadoDeuda.EN_GESTION,
      gestorAsignadoId: 1,
      diasMora: 5,
      diasGestion: 2,
      saldoCapitalTotal: 1000,
      deudaTotal: 1000,
      gastosCobranza: 0,
      interesMoratorio: 0,
      interesPunitorio: 0,
      fechaUltimoPago: null,
      montoCuota: null,
      fechaAsignacionGestor: new Date('2024-01-01'),
      tasaInteresMoratorio: null,
      tasaInteresPunitorio: null,
      fechaExpiracionAcuerdo: null,
      cuotas: [],
    });

    deudaRepository.obtenerDeudasParaActualizacionDiaria = vi.fn().mockResolvedValue([deuda]);
    deudaRepository.guardar = vi.fn().mockImplementation((d) => Promise.resolve(d));
    interesAcumulador.aplicarInteresDiario = vi.fn().mockReturnValue({
      cuotasActualizadas: [],
      interesMoratorioTotal: 0,
      interesPunitorioTotal: 0,
    });
    interesAcumulador.actualizarEstadoCuotasPorVencimiento = vi.fn().mockReturnValue([]);
    transicionEstadoRepository.esTransicionValida = vi.fn().mockResolvedValue(false);

    const fechaReferencia = new Date('2024-01-10'); // 9 días después de asignación
    const resultado = await useCase.execute({ fechaReferencia });

    expect(resultado.deudasProcesadas).toBe(1);
    expect(resultado.detalles[0].cambios).toContain('Días de mora y gestión actualizados');
    // Verificar que se llamó a guardar con la deuda actualizada
    expect(deudaRepository.guardar).toHaveBeenCalledWith(expect.any(Deuda));
  });

  it('debería aplicar intereses a cuotas vencidas', async () => {
    const cuotaVencida = Cuota.reconstruir({
      id: 1,
      numeroCuota: 1,
      fechaVencimiento: new Date('2024-01-01'),
      capitalOriginal: 1000,
      saldoCapital: 1000,
      interesMoratorioAcumulado: 0,
      interesPunitorioAcumulado: 0,
      estadoCuota: EstadoCuota.VENCIDA,
      fechaUltimoPago: null,
      montoCuota: 100,
    });

    const deuda = Deuda.reconstruir({
      id: 1,
      acreedor: 'Banco',
      concepto: 'Préstamo',
      estadoActual: EstadoDeuda.EN_GESTION,
      gestorAsignadoId: 1,
      diasMora: 10,
      diasGestion: 5,
      saldoCapitalTotal: 1000,
      deudaTotal: 1000,
      gastosCobranza: 0,
      interesMoratorio: 0,
      interesPunitorio: 0,
      fechaUltimoPago: null,
      montoCuota: null,
      fechaAsignacionGestor: new Date('2024-01-01'),
      tasaInteresMoratorio: 10,
      tasaInteresPunitorio: 5,
      fechaExpiracionAcuerdo: null,
      cuotas: [cuotaVencida],
    });

    deudaRepository.obtenerDeudasParaActualizacionDiaria = vi.fn().mockResolvedValue([deuda]);
    deudaRepository.guardar = vi.fn().mockImplementation((d) => Promise.resolve(d));
    interesAcumulador.aplicarInteresDiario = vi.fn().mockReturnValue({
      cuotasActualizadas: [cuotaVencida],
      interesMoratorioTotal: 2.74,
      interesPunitorioTotal: 1.37,
    });
    interesAcumulador.actualizarEstadoCuotasPorVencimiento = vi.fn().mockReturnValue([]);
    transicionEstadoRepository.esTransicionValida = vi.fn().mockResolvedValue(false);

    const resultado = await useCase.execute();

    expect(resultado.deudasConInteresesAplicados).toBe(1);
    expect(resultado.interesMoratorioTotal).toBe(2.74);
    expect(resultado.interesPunitorioTotal).toBe(1.37);
    expect(resultado.detalles[0].cambios.some(c => c.includes('Intereses'))).toBe(true);
  });

  it('debería cambiar estado a EN_GESTION cuando acuerdo expira', async () => {
    const deuda = Deuda.reconstruir({
      id: 1,
      acreedor: 'Banco',
      concepto: 'Préstamo',
      estadoActual: EstadoDeuda.CON_ACUERDO,
      gestorAsignadoId: 1,
      diasMora: 10,
      diasGestion: 5,
      saldoCapitalTotal: 1000,
      deudaTotal: 1000,
      gastosCobranza: 0,
      interesMoratorio: 0,
      interesPunitorio: 0,
      fechaUltimoPago: null,
      montoCuota: null,
      fechaAsignacionGestor: new Date('2024-01-01'),
      tasaInteresMoratorio: null,
      tasaInteresPunitorio: null,
      fechaExpiracionAcuerdo: new Date('2024-01-05'), // Expiró
      cuotas: [],
    });

    deudaRepository.obtenerDeudasParaActualizacionDiaria = vi.fn().mockResolvedValue([deuda]);
    deudaRepository.guardar = vi.fn().mockImplementation((d) => Promise.resolve(d));
    interesAcumulador.aplicarInteresDiario = vi.fn().mockReturnValue({
      cuotasActualizadas: [],
      interesMoratorioTotal: 0,
      interesPunitorioTotal: 0,
    });
    interesAcumulador.actualizarEstadoCuotasPorVencimiento = vi.fn().mockReturnValue([]);
    transicionEstadoRepository.obtenerTransicion = vi.fn().mockResolvedValue({ requiereAutorizacion: false, descripcion: 'test' });
    transicionEstadoRepository.esTransicionValida = vi.fn().mockResolvedValue(true);

    const fechaReferencia = new Date('2024-01-10');
    const resultado = await useCase.execute({ fechaReferencia });

    expect(resultado.deudasConEstadoCambiado).toBe(1);
    expect(resultado.detalles[0].estadoCambiado).toBe(EstadoDeuda.EN_GESTION);
    expect(resultado.detalles[0].cambios).toContain('Acuerdo expirado, cambiado a estado "En Gestión"');
  });

  it('debería actualizar estado de cuotas pendientes a vencidas', async () => {
    const cuotaPendiente = Cuota.reconstruir({
      id: 1,
      numeroCuota: 1,
      fechaVencimiento: new Date('2024-01-01'),
      capitalOriginal: 1000,
      saldoCapital: 1000,
      interesMoratorioAcumulado: 0,
      interesPunitorioAcumulado: 0,
      estadoCuota: EstadoCuota.PENDIENTE,
      fechaUltimoPago: null,
      montoCuota: 100,
    });

    const deuda = Deuda.reconstruir({
      id: 1,
      acreedor: 'Banco',
      concepto: 'Préstamo',
      estadoActual: EstadoDeuda.EN_GESTION,
      gestorAsignadoId: 1,
      diasMora: 10,
      diasGestion: 5,
      saldoCapitalTotal: 1000,
      deudaTotal: 1000,
      gastosCobranza: 0,
      interesMoratorio: 0,
      interesPunitorio: 0,
      fechaUltimoPago: null,
      montoCuota: null,
      fechaAsignacionGestor: new Date('2024-01-01'),
      tasaInteresMoratorio: null,
      tasaInteresPunitorio: null,
      fechaExpiracionAcuerdo: null,
      cuotas: [cuotaPendiente],
    });

    const cuotaVencida = Cuota.reconstruir({
      id: cuotaPendiente.id,
      numeroCuota: cuotaPendiente.numeroCuota,
      fechaVencimiento: cuotaPendiente.fechaVencimiento,
      capitalOriginal: cuotaPendiente.capitalOriginal,
      saldoCapital: cuotaPendiente.saldoCapital,
      interesMoratorioAcumulado: cuotaPendiente.interesMoratorioAcumulado,
      interesPunitorioAcumulado: cuotaPendiente.interesPunitorioAcumulado,
      estadoCuota: EstadoCuota.VENCIDA,
      fechaUltimoPago: cuotaPendiente.fechaUltimoPago,
      montoCuota: cuotaPendiente.montoCuota,
    });

    deudaRepository.obtenerDeudasParaActualizacionDiaria = vi.fn().mockResolvedValue([deuda]);
    deudaRepository.guardar = vi.fn().mockImplementation((d) => Promise.resolve(d));
    interesAcumulador.aplicarInteresDiario = vi.fn().mockReturnValue({
      cuotasActualizadas: [],
      interesMoratorioTotal: 0,
      interesPunitorioTotal: 0,
    });
    interesAcumulador.actualizarEstadoCuotasPorVencimiento = vi.fn().mockReturnValue([cuotaVencida]);
    transicionEstadoRepository.esTransicionValida = vi.fn().mockResolvedValue(false);

    const fechaReferencia = new Date('2024-02-01');
    const resultado = await useCase.execute({ fechaReferencia });

    expect(resultado.detalles[0].cambios).toContain('1 cuotas actualizadas a vencidas');
  });
});