import { describe, it, expect } from 'vitest';
import { ReglaTransicion } from './regla-transicion';
import { EstadoDeuda } from '../enums/estado-deuda';

describe('ReglaTransicion', () => {
  describe('crear', () => {
    it('debería crear una regla con valores por defecto', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
        mensajeUi: 'Cambiar a en gestión',
        validacionAdicional: { minDias: 30 },
      });

      expect(regla.id).toBeUndefined();
      expect(regla.tipoGestionId).toBe(5);
      expect(regla.estadoOrigen).toBe(EstadoDeuda.NUEVO);
      expect(regla.estadoDestino).toBe(EstadoDeuda.EN_GESTION);
      expect(regla.requiereAutorizacion).toBe(false);
      expect(regla.mensajeUi).toBe('Cambiar a en gestión');
      expect(regla.validacionAdicional).toEqual({ minDias: 30 });
      expect(regla.prioridad).toBe(0);
      expect(regla.activo).toBe(true);
    });

    it('debería crear regla con estado origen nulo (cualquier estado)', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: null,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: true,
      });

      expect(regla.estadoOrigen).toBeNull();
      expect(regla.estadoDestino).toBe(EstadoDeuda.EN_GESTION);
    });

    it('debería crear regla con estado destino nulo (mismo estado)', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: null,
        requiereAutorizacion: false,
      });

      expect(regla.estadoOrigen).toBe(EstadoDeuda.EN_GESTION);
      expect(regla.estadoDestino).toBeNull();
    });
  });

  describe('reconstruir', () => {
    it('debería reconstruir regla con todas las propiedades', () => {
      const props = {
        id: 100,
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: true,
        mensajeUi: 'Mensaje UI',
        validacionAdicional: { test: true },
        prioridad: 0,
        activo: false,
      };

      const regla = ReglaTransicion.reconstruir(props);

      expect(regla.id).toBe(100);
      expect(regla.tipoGestionId).toBe(5);
      expect(regla.estadoOrigen).toBe(EstadoDeuda.NUEVO);
      expect(regla.estadoDestino).toBe(EstadoDeuda.EN_GESTION);
      expect(regla.requiereAutorizacion).toBe(true);
      expect(regla.mensajeUi).toBe('Mensaje UI');
      expect(regla.validacionAdicional).toEqual({ test: true });
      expect(regla.activo).toBe(false);
    });
  });

  describe('aplicaPara', () => {
    it('debería aplicar cuando tipo gestión y estado origen coinciden', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
      });

      expect(regla.aplicaPara(5, EstadoDeuda.NUEVO)).toBe(true);
    });

    it('no debería aplicar cuando tipo gestión no coincide', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
      });

      expect(regla.aplicaPara(6, EstadoDeuda.NUEVO)).toBe(false);
    });

    it('no debería aplicar cuando regla está inactiva', () => {
      const regla = ReglaTransicion.reconstruir({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
        prioridad: 0,
        activo: false,
      });

      expect(regla.aplicaPara(5, EstadoDeuda.NUEVO)).toBe(false);
    });

    it('debería aplicar para cualquier estado cuando estado origen es null', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: null,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
      });

      expect(regla.aplicaPara(5, EstadoDeuda.NUEVO)).toBe(true);
      expect(regla.aplicaPara(5, EstadoDeuda.EN_GESTION)).toBe(true);
      expect(regla.aplicaPara(5, EstadoDeuda.CON_ACUERDO)).toBe(true);
    });

    it('no debería aplicar cuando estado origen no coincide', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
      });

      expect(regla.aplicaPara(5, EstadoDeuda.EN_GESTION)).toBe(false);
    });
  });

  describe('obtenerEstadoDestino', () => {
    it('debería devolver estado destino cuando no es null', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
      });

      expect(regla.obtenerEstadoDestino(EstadoDeuda.NUEVO)).toBe(EstadoDeuda.EN_GESTION);
    });

    it('debería devolver estado actual cuando estado destino es null', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.EN_GESTION,
        estadoDestino: null,
        requiereAutorizacion: false,
      });

      expect(regla.obtenerEstadoDestino(EstadoDeuda.EN_GESTION)).toBe(EstadoDeuda.EN_GESTION);
    });
  });

  describe('getters', () => {
    it('debería devolver todas las propiedades correctamente', () => {
      const regla = ReglaTransicion.crear({
        tipoGestionId: 5,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: true,
        mensajeUi: 'Test mensaje',
        validacionAdicional: { campo: 'valor' },
      });

      expect(regla.id).toBeUndefined();
      expect(regla.tipoGestionId).toBe(5);
      expect(regla.estadoOrigen).toBe(EstadoDeuda.NUEVO);
      expect(regla.estadoDestino).toBe(EstadoDeuda.EN_GESTION);
      expect(regla.requiereAutorizacion).toBe(true);
      expect(regla.mensajeUi).toBe('Test mensaje');
      expect(regla.validacionAdicional).toEqual({ campo: 'valor' });
      expect(regla.prioridad).toBe(0);
      expect(regla.activo).toBe(true);
    });
  });
});