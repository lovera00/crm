import { describe, it, expect } from 'vitest';
import { ReferenciaPersonal } from './referencia-personal';
import { EstadoContacto } from '../enums/estado-contacto';

describe('ReferenciaPersonal', () => {
  describe('creación', () => {
    it('debería crear una referencia personal con estado Pendiente de Verificación por defecto', () => {
      const referencia = ReferenciaPersonal.crear({
        personaId: 1,
        nombre: 'Carlos López',
        parentesco: 'Hermano',
        telefono: '+595992345678',
      });

      expect(referencia.personaId).toBe(1);
      expect(referencia.nombre).toBe('Carlos López');
      expect(referencia.parentesco).toBe('Hermano');
      expect(referencia.telefono).toBe('+595992345678');
      expect(referencia.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
    });

    it('debería aceptar estado personalizado', () => {
      const referencia = ReferenciaPersonal.crear({
        personaId: 1,
        nombre: 'Carlos López',
        parentesco: 'Hermano',
        telefono: '+595992345678',
        estado: EstadoContacto.ACTIVO,
      });

      expect(referencia.estado).toBe(EstadoContacto.ACTIVO);
    });

    it('debería rechazar nombre vacío', () => {
      expect(() =>
        ReferenciaPersonal.crear({
          personaId: 1,
          nombre: '',
          parentesco: 'Hermano',
          telefono: '+595992345678',
        })
      ).toThrow();
    });

    it('debería rechazar parentesco vacío', () => {
      expect(() =>
        ReferenciaPersonal.crear({
          personaId: 1,
          nombre: 'Carlos López',
          parentesco: '',
          telefono: '+595992345678',
        })
      ).toThrow();
    });

    it('debería rechazar teléfono vacío', () => {
      expect(() =>
        ReferenciaPersonal.crear({
          personaId: 1,
          nombre: 'Carlos López',
          parentesco: 'Hermano',
          telefono: '',
        })
      ).toThrow();
    });
  });

  describe('reconstruir', () => {
    it('debería reconstruir referencia personal con propiedades completas', () => {
      const referencia = ReferenciaPersonal.reconstruir({
        id: 1,
        personaId: 100,
        nombre: 'María Gómez',
        parentesco: 'Hermana',
        telefono: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });

      expect(referencia.id).toBe(1);
      expect(referencia.personaId).toBe(100);
      expect(referencia.nombre).toBe('María Gómez');
      expect(referencia.parentesco).toBe('Hermana');
      expect(referencia.telefono).toBe('+595991234567');
      expect(referencia.estado).toBe(EstadoContacto.ACTIVO);
    });
  });

  describe('cambiarEstado', () => {
    it('debería actualizar estado de la referencia', () => {
      const referencia = ReferenciaPersonal.crear({
        personaId: 1,
        nombre: 'Carlos López',
        parentesco: 'Hermano',
        telefono: '+595992345678',
      });

      referencia.cambiarEstado(EstadoContacto.INACTIVO);

      expect(referencia.estado).toBe(EstadoContacto.INACTIVO);
    });
  });

  describe('getters', () => {
    it('debería retornar propiedades correctas', () => {
      const referencia = ReferenciaPersonal.reconstruir({
        id: 5,
        personaId: 200,
        nombre: 'Ana Martínez',
        parentesco: 'Amiga',
        telefono: '+595993456789',
        estado: EstadoContacto.INACTIVO,
      });

      expect(referencia.id).toBe(5);
      expect(referencia.personaId).toBe(200);
      expect(referencia.nombre).toBe('Ana Martínez');
      expect(referencia.parentesco).toBe('Amiga');
      expect(referencia.telefono).toBe('+595993456789');
      expect(referencia.estado).toBe(EstadoContacto.INACTIVO);
    });
  });
});
