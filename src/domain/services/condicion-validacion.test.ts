import { describe, it, expect } from 'vitest';
import { EvaluadorCondicion, CondicionComparacion, CondicionLogica, ContextoDeuda } from './condicion-validacion';
import { EstadoDeuda } from '../enums/estado-deuda';

describe('EvaluadorCondicion', () => {
  const contextoBase: ContextoDeuda = {
    deudaTotal: 150000,
    saldoCapitalTotal: 100000,
    diasMora: 45,
    diasGestion: 10,
    estadoActual: EstadoDeuda.EN_GESTION,
    gestorAsignadoId: 1,
    tieneAcuerdo: false,
    fechaExpiracionAcuerdo: null,
    interesMoratorio: 5000,
    interesPunitorio: 3000,
    gastosCobranza: 2000,
    montoCuota: 5000,
  };

  describe('evaluar comparaciones', () => {
    it('debería evaluar igualdad (eq) correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'deudaTotal',
        operador: 'eq',
        valor: 150000,
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: 200000 }, contextoBase)).toBe(false);
    });

    it('debería evaluar desigualdad (neq) correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'deudaTotal',
        operador: 'neq',
        valor: 200000,
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: 150000 }, contextoBase)).toBe(false);
    });

    it('debería evaluar mayor que (gt) correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'diasMora',
        operador: 'gt',
        valor: 30,
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: 60 }, contextoBase)).toBe(false);
    });

    it('debería evaluar mayor o igual (gte) correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'diasMora',
        operador: 'gte',
        valor: 45,
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: 46 }, contextoBase)).toBe(false);
    });

    it('debería evaluar menor que (lt) correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'deudaTotal',
        operador: 'lt',
        valor: 200000,
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: 100000 }, contextoBase)).toBe(false);
    });

    it('debería evaluar menor o igual (lte) correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'deudaTotal',
        operador: 'lte',
        valor: 150000,
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: 140000 }, contextoBase)).toBe(false);
    });

    it('debería evaluar operador in correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'estadoActual',
        operador: 'in',
        valor: [EstadoDeuda.EN_GESTION, EstadoDeuda.CON_ACUERDO],
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: [EstadoDeuda.NUEVO, EstadoDeuda.CANCELADA] }, contextoBase)).toBe(false);
    });

    it('debería evaluar operador not_in correctamente', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'estadoActual',
        operador: 'not_in',
        valor: [EstadoDeuda.NUEVO, EstadoDeuda.CANCELADA],
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);
      expect(EvaluadorCondicion.evaluar({ ...condicion, valor: [EstadoDeuda.EN_GESTION, EstadoDeuda.CON_ACUERDO] }, contextoBase)).toBe(false);
    });
  });

  describe('evaluar lógicas', () => {
    it('debería evaluar AND correctamente', () => {
      const condicion: CondicionLogica = {
        tipo: 'logica',
        operador: 'and',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'gt', valor: 100000 },
          { tipo: 'comparacion', campo: 'diasMora', operador: 'gt', valor: 30 },
        ],
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);

      const condicionFalsa: CondicionLogica = {
        tipo: 'logica',
        operador: 'and',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'gt', valor: 100000 },
          { tipo: 'comparacion', campo: 'diasMora', operador: 'gt', valor: 60 },
        ],
      };
      expect(EvaluadorCondicion.evaluar(condicionFalsa, contextoBase)).toBe(false);
    });

    it('debería evaluar OR correctamente', () => {
      const condicion: CondicionLogica = {
        tipo: 'logica',
        operador: 'or',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'gt', valor: 200000 },
          { tipo: 'comparacion', campo: 'diasMora', operador: 'gt', valor: 30 },
        ],
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);

      const condicionFalsa: CondicionLogica = {
        tipo: 'logica',
        operador: 'or',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'gt', valor: 200000 },
          { tipo: 'comparacion', campo: 'diasMora', operador: 'gt', valor: 60 },
        ],
      };
      expect(EvaluadorCondicion.evaluar(condicionFalsa, contextoBase)).toBe(false);
    });

    it('debería evaluar NOT correctamente', () => {
      const condicion: CondicionLogica = {
        tipo: 'logica',
        operador: 'not',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'gt', valor: 200000 },
        ],
      };
      expect(EvaluadorCondicion.evaluar(condicion, contextoBase)).toBe(true);

      const condicionFalsa: CondicionLogica = {
        tipo: 'logica',
        operador: 'not',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'lt', valor: 200000 },
        ],
      };
      expect(EvaluadorCondicion.evaluar(condicionFalsa, contextoBase)).toBe(false);
    });

    it('debería lanzar error si NOT tiene más de una condición', () => {
      const condicion: CondicionLogica = {
        tipo: 'logica',
        operador: 'not',
        condiciones: [
          { tipo: 'comparacion', campo: 'deudaTotal', operador: 'gt', valor: 100000 },
          { tipo: 'comparacion', campo: 'diasMora', operador: 'gt', valor: 30 },
        ],
      };
      expect(() => EvaluadorCondicion.evaluar(condicion, contextoBase)).toThrow();
    });
  });

  describe('casos de error', () => {
    it('debería lanzar error para tipo de condición no soportado', () => {
      const condicion = {
        tipo: 'desconocido',
        campo: 'deudaTotal',
        operador: 'eq',
        valor: 150000,
      };
      expect(() => EvaluadorCondicion.evaluar(condicion as any, contextoBase)).toThrow('Tipo de condición no soportado: desconocido');
    });

    it('debería lanzar error para operador de comparación no soportado', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'deudaTotal',
        operador: 'desconocido' as any,
        valor: 150000,
      };
      expect(() => EvaluadorCondicion.evaluar(condicion, contextoBase)).toThrow('Operador no soportado: desconocido');
    });

    it('debería lanzar error para operador lógico no soportado', () => {
      const condicion: CondicionLogica = {
        tipo: 'logica',
        operador: 'desconocido' as any,
        condiciones: [],
      };
      expect(() => EvaluadorCondicion.evaluar(condicion, contextoBase)).toThrow('Operador lógico no soportado: desconocido');
    });
  });

  describe('parseValidacionAdicional', () => {
    it('debería devolver null si validacionAdicional es null o undefined', () => {
      expect(EvaluadorCondicion.parseValidacionAdicional(null)).toBeNull();
      expect(EvaluadorCondicion.parseValidacionAdicional(undefined)).toBeNull();
    });

    it('debería devolver la condición si ya tiene formato Condicion', () => {
      const condicion: CondicionComparacion = {
        tipo: 'comparacion',
        campo: 'deudaTotal',
        operador: 'gt',
        valor: 100000,
      };
      expect(EvaluadorCondicion.parseValidacionAdicional(condicion)).toEqual(condicion);
    });

    it('debería devolver null para objetos simples (backward compatibility)', () => {
      expect(EvaluadorCondicion.parseValidacionAdicional({ minDias: 30 })).toBeNull();
    });
  });
});