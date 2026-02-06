import { describe, it, expect } from 'vitest';
import { ReferenciaLaboral } from './referencia-laboral';
import { EstadoContacto } from '../enums/estado-contacto';

describe('ReferenciaLaboral', () => {
  describe('creación', () => {
    it('debería crear una referencia laboral con estado Pendiente de Verificación por defecto', () => {
      const referencia = ReferenciaLaboral.crear({
        personaId: 1,
        nombre: 'Ana Martínez',
        empresa: 'Tech Corp',
        telefono: '+595993456789',
      });

      expect(referencia.personaId).toBe(1);
      expect(referencia.nombre).toBe('Ana Martínez');
      expect(referencia.empresa).toBe('Tech Corp');
      expect(referencia.telefono).toBe('+595993456789');
      expect(referencia.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
    });

    it('debería aceptar empresa opcional', () => {
      const referencia = ReferenciaLaboral.crear({
        personaId: 1,
        nombre: 'Ana Martínez',
        telefono: '+595993456789',
      });

      expect(referencia.empresa).toBeUndefined();
    });

    it('debería aceptar estado personalizado', () => {
      const referencia = ReferenciaLaboral.crear({
        personaId: 1,
        nombre: 'Ana Martínez',
        telefono: '+595993456789',
        estado: EstadoContacto.ACTIVO,
      });

      expect(referencia.estado).toBe(EstadoContacto.ACTIVO);
    });

    it('debería rechazar nombre vacío', () => {
      expect(() =>
        ReferenciaLaboral.crear({
          personaId: 1,
          nombre: '',
          telefono: '+595993456789',
        })
      ).toThrow();
    });

    it('debería rechazar teléfono vacío', () => {
      expect(() =>
        ReferenciaLaboral.crear({
          personaId: 1,
          nombre: 'Ana Martínez',
          telefono: '',
        })
      ).toThrow();
    });
  });

  describe('reconstruir', () => {
    it('debería reconstruir referencia laboral con propiedades completas', () => {
      const referencia = ReferenciaLaboral.reconstruir({
        id: 1,
        personaId: 100,
        nombre: 'Carlos Rodríguez',
        empresa: 'Acme Corp',
        telefono: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });

      expect(referencia.id).toBe(1);
      expect(referencia.personaId).toBe(100);
      expect(referencia.nombre).toBe('Carlos Rodríguez');
      expect(referencia.empresa).toBe('Acme Corp');
      expect(referencia.telefono).toBe('+595991234567');
      expect(referencia.estado).toBe(EstadoContacto.ACTIVO);
    });

    it('debería reconstruir referencia laboral sin empresa', () => {
      const referencia = ReferenciaLaboral.reconstruir({
        id: 2,
        personaId: 100,
        nombre: 'Ana Martínez',
        empresa: undefined,
        telefono: '+595992345678',
        estado: EstadoContacto.INACTIVO,
      });

      expect(referencia.id).toBe(2);
      expect(referencia.empresa).toBeUndefined();
      expect(referencia.estado).toBe(EstadoContacto.INACTIVO);
    });
  });

  describe('cambiarEstado', () => {
    it('debería actualizar estado de la referencia', () => {
      const referencia = ReferenciaLaboral.crear({
        personaId: 1,
        nombre: 'Ana Martínez',
        telefono: '+595993456789',
      });

      referencia.cambiarEstado(EstadoContacto.INACTIVO);

      expect(referencia.estado).toBe(EstadoContacto.INACTIVO);
    });
  });

  describe('getters', () => {
    it('debería retornar propiedades correctas', () => {
      const referencia = ReferenciaLaboral.reconstruir({
        id: 5,
        personaId: 200,
        nombre: 'Roberto Sánchez',
        empresa: 'Global Inc',
        telefono: '+595994567890',
        estado: EstadoContacto.ACTIVO,
      });

      expect(referencia.id).toBe(5);
      expect(referencia.personaId).toBe(200);
      expect(referencia.nombre).toBe('Roberto Sánchez');
      expect(referencia.empresa).toBe('Global Inc');
      expect(referencia.telefono).toBe('+595994567890');
      expect(referencia.estado).toBe(EstadoContacto.ACTIVO);
    });
  });
});
