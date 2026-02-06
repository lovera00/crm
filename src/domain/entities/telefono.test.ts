import { describe, it, expect } from 'vitest';
import { Telefono } from './telefono';
import { EstadoContacto } from '../enums/estado-contacto';

describe('Telefono', () => {
  describe('creación', () => {
    it('debería crear un teléfono con estado Pendiente de Verificación por defecto', () => {
      const telefono = Telefono.crear({
        personaId: 1,
        numero: '+595991234567',
      });

      expect(telefono.personaId).toBe(1);
      expect(telefono.numero).toBe('+595991234567');
      expect(telefono.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
    });

    it('debería aceptar estado personalizado', () => {
      const telefono = Telefono.crear({
        personaId: 1,
        numero: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });

      expect(telefono.estado).toBe(EstadoContacto.ACTIVO);
    });

    it('debería rechazar número vacío', () => {
      expect(() =>
        Telefono.crear({
          personaId: 1,
          numero: '',
        })
      ).toThrow();
    });
  });

  describe('cambiar estado', () => {
    it('debería actualizar estado y fecha de modificación', () => {
      const telefono = Telefono.crear({
        personaId: 1,
        numero: '+595991234567',
      });
      const nuevaFecha = new Date('2024-06-01');
      
      telefono.cambiarEstado(EstadoContacto.ACTIVO, nuevaFecha);
      
      expect(telefono.estado).toBe(EstadoContacto.ACTIVO);
      expect(telefono.fechaModificacion).toEqual(nuevaFecha);
    });

    it('debería usar fecha actual por defecto', () => {
      const telefono = Telefono.crear({
        personaId: 1,
        numero: '+595991234567',
      });
      const antes = new Date();
      
      telefono.cambiarEstado(EstadoContacto.INACTIVO);
      
      expect(telefono.estado).toBe(EstadoContacto.INACTIVO);
      expect(telefono.fechaModificacion!.getTime()).toBeGreaterThanOrEqual(antes.getTime());
    });
  });
});
