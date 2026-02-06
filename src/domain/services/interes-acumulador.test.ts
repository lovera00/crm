import { describe, it, expect, beforeEach } from 'vitest';
import { InteresAcumulador } from './interes-acumulador';
import { Cuota } from '../entities/cuota';
import { Deuda } from '../entities/deuda';
import { EstadoCuota } from '../enums/estado-cuota';
import { EstadoDeuda } from '../enums/estado-deuda';
import { crearCuotaPrueba, crearDeudaPrueba, crearFecha, avanzarDias } from '../../__tests__/test-helpers';

describe('InteresAcumulador', () => {
  let acumulador: InteresAcumulador;

  beforeEach(() => {
    acumulador = new InteresAcumulador();
  });

  describe('calcularInteresDiario', () => {
    it('debería retornar cero para cuota pagada', () => {
      const cuota = Cuota.reconstruir({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 0,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.PAGADA,
        fechaUltimoPago: new Date('2024-01-01'),
        montoCuota: 100,
      });

      const fechaReferencia = new Date('2024-02-01');
      const resultado = acumulador.calcularInteresDiario(cuota, 0.1, 0.05, fechaReferencia);

      expect(resultado.interesMoratorio).toBe(0);
      expect(resultado.interesPunitorio).toBe(0);
    });

    it('debería retornar cero para cuota no vencida', () => {
      const cuota = crearCuotaPrueba({
        fechaVencimiento: new Date('2024-12-31'),
      });

      const fechaReferencia = new Date('2024-01-01');
      const resultado = acumulador.calcularInteresDiario(cuota, 0.1, 0.05, fechaReferencia);

      expect(resultado.interesMoratorio).toBe(0);
      expect(resultado.interesPunitorio).toBe(0);
    });

    it('debería calcular intereses para cuota vencida', () => {
      const cuota = Cuota.reconstruir({
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

      // 10 días después del vencimiento
      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.calcularInteresDiario(cuota, 10, 5, fechaReferencia);

      // Cálculo: saldoCapital * tasa / 365
      // interesMoratorio = 1000 * 10% / 365 = 0.27397 por día
      // interesPunitorio = 1000 * 5% / 365 = 0.13699 por día
      // Como son 10 días: moratorio = 2.7397, punitorio = 1.3699
      expect(resultado.interesMoratorio).toBeCloseTo(2.7397, 4);
      expect(resultado.interesPunitorio).toBeCloseTo(1.3699, 4);
    });

    it('debería retornar cero cuando tasas son null', () => {
      const cuota = Cuota.reconstruir({
        id: 999,
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

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.calcularInteresDiario(cuota, null, null, fechaReferencia);

      expect(resultado.interesMoratorio).toBe(0);
      expect(resultado.interesPunitorio).toBe(0);
    });

    it('debería retornar cero para cuota EN_ACUERDO', () => {
      const cuota = Cuota.reconstruir({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 1000,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.EN_ACUERDO,
        fechaUltimoPago: null,
        montoCuota: 100,
      });

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.calcularInteresDiario(cuota, 10, 5, fechaReferencia);

      expect(resultado.interesMoratorio).toBe(0);
      expect(resultado.interesPunitorio).toBe(0);
    });

    it('debería calcular intereses considerando interés ya aplicado', () => {
      const cuota = Cuota.reconstruir({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 1000,
        interesMoratorioAcumulado: 1.0, // Ya se aplicó 1 unidad de interés
        interesPunitorioAcumulado: 0.5,
        estadoCuota: EstadoCuota.VENCIDA,
        fechaUltimoPago: null,
        montoCuota: 100,
      });

      // 10 días después del vencimiento, interés total esperado: 2.7397 moratorio, 1.3699 punitorio
      // Ya aplicado: 1.0 moratorio, 0.5 punitorio
      // Diferencia: 1.7397 moratorio, 0.8699 punitorio
      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.calcularInteresDiario(cuota, 10, 5, fechaReferencia);

      expect(resultado.interesMoratorio).toBeCloseTo(1.7397, 4);
      expect(resultado.interesPunitorio).toBeCloseTo(0.8699, 4);
    });

    it('debería retornar cero cuando interés ya aplicado es mayor o igual al total', () => {
      const cuota = Cuota.reconstruir({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 1000,
        interesMoratorioAcumulado: 5.0, // Más que el interés total esperado
        interesPunitorioAcumulado: 3.0,
        estadoCuota: EstadoCuota.VENCIDA,
        fechaUltimoPago: null,
        montoCuota: 100,
      });

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.calcularInteresDiario(cuota, 10, 5, fechaReferencia);

      expect(resultado.interesMoratorio).toBe(0);
      expect(resultado.interesPunitorio).toBe(0);
    });
  });

  describe('aplicarInteresDiario', () => {
    it('debería aplicar intereses a cuotas vencidas', () => {
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

      const cuotaPendiente = crearCuotaPrueba({
        fechaVencimiento: new Date('2024-12-31'),
      });

      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.EN_GESTION,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1500,
        deudaTotal: 1500,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: 10,
        tasaInteresPunitorio: 5,
        fechaExpiracionAcuerdo: null,
        cuotas: [cuotaVencida, cuotaPendiente],
      });

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.aplicarInteresDiario(deuda, fechaReferencia);

      expect(resultado.cuotasActualizadas).toHaveLength(1);
      expect(resultado.interesMoratorioTotal).toBeCloseTo(2.7397, 4);
      expect(resultado.interesPunitorioTotal).toBeCloseTo(1.3699, 4);
    });

    it('debería aplicar intereses solo a cuotas vencidas, no pendientes', () => {
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

      const cuotaPendienteNoVencida = crearCuotaPrueba({
        fechaVencimiento: new Date('2024-12-31'),
      });

      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.EN_GESTION,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 2000,
        deudaTotal: 2000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: 10,
        tasaInteresPunitorio: 5,
        fechaExpiracionAcuerdo: null,
        cuotas: [cuotaVencida, cuotaPendienteNoVencida],
      });

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.aplicarInteresDiario(deuda, fechaReferencia);

      expect(resultado.cuotasActualizadas).toHaveLength(1);
      expect(resultado.interesMoratorioTotal).toBeCloseTo(2.7397, 4);
      expect(resultado.interesPunitorioTotal).toBeCloseTo(1.3699, 4);
    });

    it('debería retornar arrays vacíos cuando no hay cuotas vencidas', () => {
      const cuotaPendiente = crearCuotaPrueba({
        fechaVencimiento: new Date('2024-12-31'),
      });

      const cuotaPagada = Cuota.reconstruir({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 0,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.PAGADA,
        fechaUltimoPago: new Date('2024-01-01'),
        montoCuota: 100,
      });

      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.EN_GESTION,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: 10,
        tasaInteresPunitorio: 5,
        fechaExpiracionAcuerdo: null,
        cuotas: [cuotaPendiente, cuotaPagada],
      });

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.aplicarInteresDiario(deuda, fechaReferencia);

      expect(resultado.cuotasActualizadas).toHaveLength(0);
      expect(resultado.interesMoratorioTotal).toBe(0);
      expect(resultado.interesPunitorioTotal).toBe(0);
    });

    it('debería manejar tasas de interés null', () => {
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
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: null,
        cuotas: [cuotaVencida],
      });

      const fechaReferencia = new Date('2024-01-11');
      const resultado = acumulador.aplicarInteresDiario(deuda, fechaReferencia);

      expect(resultado.cuotasActualizadas).toHaveLength(0);
      expect(resultado.interesMoratorioTotal).toBe(0);
      expect(resultado.interesPunitorioTotal).toBe(0);
    });
  });

  describe('actualizarEstadoCuotasPorVencimiento', () => {
    it('debería actualizar cuotas pendientes vencidas a VENCIDA', () => {
      const cuotaPendienteVencida = Cuota.reconstruir({
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

      const cuotaPendienteNoVencida = Cuota.reconstruir({
        id: 2,
        numeroCuota: 2,
        fechaVencimiento: new Date('2024-12-31'),
        capitalOriginal: 1000,
        saldoCapital: 1000,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.PENDIENTE,
        fechaUltimoPago: null,
        montoCuota: 100,
      });

      const cuotaPagada = Cuota.reconstruir({
        id: 3,
        numeroCuota: 3,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 0,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.PAGADA,
        fechaUltimoPago: new Date('2024-01-01'),
        montoCuota: 100,
      });

      const fechaReferencia = new Date('2024-02-01');
      const resultado = acumulador.actualizarEstadoCuotasPorVencimiento(
        [cuotaPendienteVencida, cuotaPendienteNoVencida, cuotaPagada],
        fechaReferencia
      );

      expect(resultado).toHaveLength(3);
      // Solo la primera debe cambiar a VENCIDA
      expect(resultado[0].estadoCuota).toBe(EstadoCuota.VENCIDA);
      expect(resultado[1].estadoCuota).toBe(EstadoCuota.PENDIENTE);
      expect(resultado[2].estadoCuota).toBe(EstadoCuota.PAGADA);
    });

    it('debería mantener cuotas EN_ACUERDO sin cambios', () => {
      const cuotaEnAcuerdo = Cuota.reconstruir({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento: new Date('2024-01-01'),
        capitalOriginal: 1000,
        saldoCapital: 1000,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.EN_ACUERDO,
        fechaUltimoPago: null,
        montoCuota: 100,
      });

      const fechaReferencia = new Date('2024-02-01');
      const resultado = acumulador.actualizarEstadoCuotasPorVencimiento(
        [cuotaEnAcuerdo],
        fechaReferencia
      );

      expect(resultado).toHaveLength(1);
      expect(resultado[0].estadoCuota).toBe(EstadoCuota.EN_ACUERDO);
    });

    it('debería mantener cuotas VENCIDAS sin cambios', () => {
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

      const fechaReferencia = new Date('2024-02-01');
      const resultado = acumulador.actualizarEstadoCuotasPorVencimiento(
        [cuotaVencida],
        fechaReferencia
      );

      expect(resultado).toHaveLength(1);
      expect(resultado[0].estadoCuota).toBe(EstadoCuota.VENCIDA);
    });
  });
});