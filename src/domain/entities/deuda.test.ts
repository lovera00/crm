import { describe, it, expect, beforeEach } from 'vitest';
import { Deuda } from './deuda';
import { EstadoDeuda } from '../enums/estado-deuda';
import { Cuota } from './cuota';

describe('Deuda', () => {
  it('debería crear una deuda con estado Nuevo por defecto', () => {
    const deuda = Deuda.crear({
      acreedor: 'Banco XYZ',
      concepto: 'Préstamo personal',
      gestorAsignadoId: 1,
      cuotas: [],
    });

    expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO);
    expect(deuda.diasMora).toBe(0);
    expect(deuda.diasGestion).toBe(0);
  });
});
