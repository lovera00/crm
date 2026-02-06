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
  });
});
