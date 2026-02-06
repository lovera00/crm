import { describe, it, expect } from 'vitest';
import { crearCuotaPrueba, crearDeudaPrueba, crearDeudaConCuotas, crearFecha, avanzarDias } from './test-helpers';
import { EstadoCuota } from '../domain/enums/estado-cuota';
import { EstadoDeuda } from '../domain/enums/estado-deuda';

describe('test-helpers', () => {
  describe('crearCuotaPrueba', () => {
    it('debería crear cuota con valores por defecto', () => {
      const cuota = crearCuotaPrueba();

      expect(cuota.numeroCuota).toBe(1);
      expect(cuota.fechaVencimiento).toEqual(new Date('2024-01-01'));
      expect(cuota.capitalOriginal).toBe(1000);
      expect(cuota.montoCuota).toBe(200);
    });

    it('debería crear cuota con overrides', () => {
      const fechaVencimiento = new Date('2024-12-31');
      const cuota = crearCuotaPrueba({
        numeroCuota: 5,
        fechaVencimiento,
        capitalOriginal: 2000,
        montoCuota: 250,
      });

      expect(cuota.numeroCuota).toBe(5);
      expect(cuota.fechaVencimiento).toBe(fechaVencimiento);
      expect(cuota.capitalOriginal).toBe(2000);
      expect(cuota.montoCuota).toBe(250);
    });
  });

  describe('crearDeudaPrueba', () => {
    it('debería crear deuda con valores por defecto', () => {
      const deuda = crearDeudaPrueba();

      expect(deuda.acreedor).toBe('Banco de Prueba');
      expect(deuda.concepto).toBe('Préstamo de prueba');
      expect(deuda.gestorAsignadoId).toBe(1);
      expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO);
      expect(deuda.cuotas).toEqual([]);
    });

    it('debería crear deuda con overrides', () => {
      const cuota = crearCuotaPrueba();
      const deuda = crearDeudaPrueba({
        acreedor: 'Otro Banco',
        concepto: 'Otro préstamo',
        gestorAsignadoId: 2,
        cuotas: [cuota],
      });

      expect(deuda.acreedor).toBe('Otro Banco');
      expect(deuda.concepto).toBe('Otro préstamo');
      expect(deuda.gestorAsignadoId).toBe(2);
      expect(deuda.cuotas).toHaveLength(1);
      expect(deuda.cuotas[0]).toBe(cuota);
    });
  });

  describe('crearDeudaConCuotas', () => {
    it('debería crear deuda con múltiples cuotas', () => {
      const fecha1 = new Date('2024-01-01');
      const fecha2 = new Date('2024-02-01');
      
      const deuda = crearDeudaConCuotas([
        { numeroCuota: 1, fechaVencimiento: fecha1, capitalOriginal: 1000 },
        { numeroCuota: 2, fechaVencimiento: fecha2, capitalOriginal: 1000, estadoCuota: EstadoCuota.VENCIDA },
      ]);

      expect(deuda.cuotas).toHaveLength(2);
      expect(deuda.cuotas[0].numeroCuota).toBe(1);
      expect(deuda.cuotas[0].fechaVencimiento).toBe(fecha1);
      expect(deuda.cuotas[0].capitalOriginal).toBe(1000);
      expect(deuda.cuotas[1].numeroCuota).toBe(2);
      expect(deuda.cuotas[1].estadoCuota).toBe(EstadoCuota.VENCIDA);
    });

    it('debería crear deuda con cuotas y valores opcionales', () => {
      const fecha = new Date('2024-01-01');
      const deuda = crearDeudaConCuotas([
        { 
          numeroCuota: 1, 
          fechaVencimiento: fecha, 
          capitalOriginal: 1000,
          saldoCapital: 800,
          interesMoratorioAcumulado: 50,
          interesPunitorioAcumulado: 25,
        },
      ]);

      expect(deuda.cuotas[0].saldoCapital).toBe(800);
      expect(deuda.cuotas[0].interesMoratorioAcumulado).toBe(50);
      expect(deuda.cuotas[0].interesPunitorioAcumulado).toBe(25);
    });
  });

  describe('crearFecha', () => {
    it('debería crear fecha base sin offset', () => {
      const fecha = crearFecha();
      expect(fecha).toEqual(new Date('2024-06-01'));
    });

    it('debería crear fecha con offset positivo', () => {
      const fecha = crearFecha(5);
      const fechaEsperada = new Date('2024-06-01');
      fechaEsperada.setDate(fechaEsperada.getDate() + 5);
      expect(fecha).toEqual(fechaEsperada);
    });

    it('debería crear fecha con offset negativo', () => {
      const fecha = crearFecha(-10);
      const fechaEsperada = new Date('2024-06-01');
      fechaEsperada.setDate(fechaEsperada.getDate() - 10);
      expect(fecha).toEqual(fechaEsperada);
    });
  });

  describe('avanzarDias', () => {
    it('debería avanzar fecha en días positivos', () => {
      const fechaInicial = new Date('2024-01-01');
      const fechaAvanzada = avanzarDias(fechaInicial, 10);
      
      const fechaEsperada = new Date('2024-01-01');
      fechaEsperada.setDate(fechaEsperada.getDate() + 10);
      
      expect(fechaAvanzada).toEqual(fechaEsperada);
    });

    it('debería retroceder fecha con días negativos', () => {
      const fechaInicial = new Date('2024-01-15');
      const fechaAvanzada = avanzarDias(fechaInicial, -5);
      
      const fechaEsperada = new Date('2024-01-15');
      fechaEsperada.setDate(fechaEsperada.getDate() - 5);
      
      expect(fechaAvanzada).toEqual(fechaEsperada);
    });

    it('no debería modificar la fecha original', () => {
      const fechaOriginal = new Date('2024-01-01');
      const fechaCopia = new Date(fechaOriginal);
      
      avanzarDias(fechaOriginal, 7);
      
      expect(fechaOriginal).toEqual(fechaCopia);
    });
  });
});