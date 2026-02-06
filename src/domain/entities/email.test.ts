import { describe, it, expect } from 'vitest';
import { Email } from './email';
import { EstadoContacto } from '../enums/estado-contacto';

describe('Email', () => {
  describe('creación', () => {
    it('debería crear un email con estado Pendiente de Verificación por defecto', () => {
      const email = Email.crear({
        personaId: 1,
        email: 'test@example.com',
      });

      expect(email.personaId).toBe(1);
      expect(email.email).toBe('test@example.com');
      expect(email.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
    });

    it('debería aceptar estado personalizado', () => {
      const email = Email.crear({
        personaId: 1,
        email: 'test@example.com',
        estado: EstadoContacto.ACTIVO,
      });

      expect(email.estado).toBe(EstadoContacto.ACTIVO);
    });

    it('debería rechazar email vacío', () => {
      expect(() =>
        Email.crear({
          personaId: 1,
          email: '',
        })
      ).toThrow();
    });

    it('debería rechazar email inválido', () => {
      expect(() =>
        Email.crear({
          personaId: 1,
          email: 'no-email',
        })
      ).toThrow();
    });
  });

  describe('cambiar estado', () => {
    it('debería actualizar estado y fecha de modificación', () => {
      const email = Email.crear({
        personaId: 1,
        email: 'test@example.com',
      });
      const nuevaFecha = new Date('2024-06-01');
      
      email.cambiarEstado(EstadoContacto.INACTIVO, nuevaFecha);
      
      expect(email.estado).toBe(EstadoContacto.INACTIVO);
      expect(email.fechaModificacion).toEqual(nuevaFecha);
    });
  });
});
