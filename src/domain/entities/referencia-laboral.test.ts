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
  });
});
