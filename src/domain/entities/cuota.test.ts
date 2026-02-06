import { describe, it, expect } from 'vitest';
import { Cuota } from './cuota';
import { EstadoCuota } from '../enums/estado-cuota';

describe('Cuota', () => {
  describe('crear', () => {
    it('debería crear una cuota con valores por defecto', () => {
      const fechaVencimiento = new Date('2024-12-31');
      const cuota = Cuota.crear({
        id: 1,
        numeroCuota: 1,
        fechaVencimiento,
        capitalOriginal: 1000,
        montoCuota: 1200,
      });

      expect(cuota.id).toBe(1);
      expect(cuota.numeroCuota).toBe(1);
      expect(cuota.fechaVencimiento).toBe(fechaVencimiento);
      expect(cuota.capitalOriginal).toBe(1000);
      expect(cuota.saldoCapital).toBe(1000); // Por defecto igual a capitalOriginal
      expect(cuota.interesMoratorioAcumulado).toBe(0);
      expect(cuota.interesPunitorioAcumulado).toBe(0);
      expect(cuota.estadoCuota).toBe(EstadoCuota.PENDIENTE);
      expect(cuota.fechaUltimoPago).toBeNull();
      expect(cuota.montoCuota).toBe(1200);
    });

    it('debería crear cuota con montoCuota null', () => {
      const fechaVencimiento = new Date('2024-12-31');
      const cuota = Cuota.crear({
        numeroCuota: 2,
        fechaVencimiento,
        capitalOriginal: 1500,
        montoCuota: null,
      });

      expect(cuota.montoCuota).toBeNull();
    });
  });

  describe('reconstruir', () => {
    it('debería reconstruir cuota con todas las propiedades', () => {
      const fechaVencimiento = new Date('2024-12-31');
      const fechaUltimoPago = new Date('2024-06-15');
      const props = {
        id: 100,
        numeroCuota: 5,
        fechaVencimiento,
        capitalOriginal: 2000,
        saldoCapital: 1500,
        interesMoratorioAcumulado: 100,
        interesPunitorioAcumulado: 50,
        estadoCuota: EstadoCuota.PAGADA,
        fechaUltimoPago,
        montoCuota: 2150,
      };

      const cuota = Cuota.reconstruir(props);

      expect(cuota.id).toBe(100);
      expect(cuota.numeroCuota).toBe(5);
      expect(cuota.fechaVencimiento).toBe(fechaVencimiento);
      expect(cuota.capitalOriginal).toBe(2000);
      expect(cuota.saldoCapital).toBe(1500);
      expect(cuota.interesMoratorioAcumulado).toBe(100);
      expect(cuota.interesPunitorioAcumulado).toBe(50);
      expect(cuota.estadoCuota).toBe(EstadoCuota.PAGADA);
      expect(cuota.fechaUltimoPago).toBe(fechaUltimoPago);
      expect(cuota.montoCuota).toBe(2150);
    });

    it('debería reconstruir cuota con fechaUltimoPago null', () => {
      const fechaVencimiento = new Date('2024-12-31');
      const props = {
        id: 101,
        numeroCuota: 6,
        fechaVencimiento,
        capitalOriginal: 2000,
        saldoCapital: 2000,
        interesMoratorioAcumulado: 0,
        interesPunitorioAcumulado: 0,
        estadoCuota: EstadoCuota.VENCIDA,
        fechaUltimoPago: null,
        montoCuota: null,
      };

      const cuota = Cuota.reconstruir(props);

      expect(cuota.fechaUltimoPago).toBeNull();
      expect(cuota.montoCuota).toBeNull();
    });
  });

  describe('getters', () => {
    it('debería devolver todas las propiedades correctamente', () => {
      const fechaVencimiento = new Date('2024-12-31');
      const fechaUltimoPago = new Date('2024-06-15');
      const cuota = Cuota.reconstruir({
        id: 200,
        numeroCuota: 10,
        fechaVencimiento,
        capitalOriginal: 5000,
        saldoCapital: 3000,
        interesMoratorioAcumulado: 200,
        interesPunitorioAcumulado: 100,
        estadoCuota: EstadoCuota.EN_ACUERDO,
        fechaUltimoPago,
        montoCuota: 3500,
      });

      expect(cuota.id).toBe(200);
      expect(cuota.numeroCuota).toBe(10);
      expect(cuota.fechaVencimiento).toBe(fechaVencimiento);
      expect(cuota.capitalOriginal).toBe(5000);
      expect(cuota.saldoCapital).toBe(3000);
      expect(cuota.interesMoratorioAcumulado).toBe(200);
      expect(cuota.interesPunitorioAcumulado).toBe(100);
      expect(cuota.estadoCuota).toBe(EstadoCuota.EN_ACUERDO);
      expect(cuota.fechaUltimoPago).toBe(fechaUltimoPago);
      expect(cuota.montoCuota).toBe(3500);
    });
  });
});