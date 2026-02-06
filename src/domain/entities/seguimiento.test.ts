import { describe, it, expect } from 'vitest';
import { Seguimiento } from './seguimiento';

describe('Seguimiento', () => {
  describe('crear', () => {
    it('debería crear un seguimiento con valores por defecto', () => {
      const seguimiento = Seguimiento.crear({
        gestorId: 100,
        personaId: 200,
        tipoGestionId: 5,
        observacion: 'Primer contacto',
        fechaProximoSeguimiento: new Date('2024-12-31'),
      });

      expect(seguimiento.id).toBeUndefined();
      expect(seguimiento.gestorId).toBe(100);
      expect(seguimiento.personaId).toBe(200);
      expect(seguimiento.tipoGestionId).toBe(5);
      expect(seguimiento.fechaHora).toBeInstanceOf(Date);
      expect(seguimiento.observacion).toBe('Primer contacto');
      expect(seguimiento.requiereSeguimiento).toBe(false);
      expect(seguimiento.fechaProximoSeguimiento).toEqual(new Date('2024-12-31'));
    });

    it('debería crear un seguimiento sin observación ni fecha próxima', () => {
      const seguimiento = Seguimiento.crear({
        gestorId: 100,
        personaId: 200,
        tipoGestionId: 5,
      });

      expect(seguimiento.observacion).toBeUndefined();
      expect(seguimiento.fechaProximoSeguimiento).toBeUndefined();
    });
  });

  describe('asignarId', () => {
    it('debería asignar ID correctamente', () => {
      const seguimiento = Seguimiento.crear({
        gestorId: 100,
        personaId: 200,
        tipoGestionId: 5,
      });

      seguimiento.asignarId(999);
      expect(seguimiento.id).toBe(999);
    });
  });

  describe('getters', () => {
    it('debería devolver todas las propiedades correctamente', () => {
      const fechaProxima = new Date('2024-12-31');
      const seguimiento = Seguimiento.crear({
        gestorId: 100,
        personaId: 200,
        tipoGestionId: 5,
        observacion: 'Test observación',
        fechaProximoSeguimiento: fechaProxima,
      });

      // Verificar todos los getters
      expect(seguimiento.id).toBeUndefined();
      expect(seguimiento.gestorId).toBe(100);
      expect(seguimiento.personaId).toBe(200);
      expect(seguimiento.tipoGestionId).toBe(5);
      expect(seguimiento.fechaHora).toBeInstanceOf(Date);
      expect(seguimiento.observacion).toBe('Test observación');
      expect(seguimiento.requiereSeguimiento).toBe(false);
      expect(seguimiento.fechaProximoSeguimiento).toBe(fechaProxima);
    });
  });
});