import { describe, it, expect } from 'vitest';
import { Persona } from './persona';
import { EstadoVerificacion } from '../enums/estado-verificacion';

describe('Persona', () => {
  describe('creación', () => {
    it('debería crear una persona con valores por defecto', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });

      expect(persona.nombres).toBe('Juan');
      expect(persona.apellidos).toBe('Pérez');
      expect(persona.documento).toBe('12345678');
      expect(persona.funcionarioPublico).toBe(EstadoVerificacion.PENDIENTE);
      expect(persona.jubilado).toBe(EstadoVerificacion.PENDIENTE);
      expect(persona.ipsActivo).toBe(EstadoVerificacion.PENDIENTE);
      expect(persona.datosVarios).toBeNull();
      expect(persona.telefonos).toEqual([]);
      expect(persona.emails).toEqual([]);
      expect(persona.referenciasPersonales).toEqual([]);
      expect(persona.referenciasLaborales).toEqual([]);
    });

    it('debería aceptar propiedades personalizadas', () => {
      const datosVarios = { entidadOrigen: 'Banco XYZ' };
      const persona = Persona.crear({
        nombres: 'María',
        apellidos: 'Gómez',
        documento: '87654321',
        funcionarioPublico: EstadoVerificacion.SI,
        jubilado: EstadoVerificacion.NO,
        ipsActivo: EstadoVerificacion.SI,
        datosVarios,
      });

      expect(persona.funcionarioPublico).toBe(EstadoVerificacion.SI);
      expect(persona.jubilado).toBe(EstadoVerificacion.NO);
      expect(persona.ipsActivo).toBe(EstadoVerificacion.SI);
      expect(persona.datosVarios).toEqual(datosVarios);
    });

    it('debería rechazar documento vacío', () => {
      expect(() => 
        Persona.crear({
          nombres: 'Juan',
          apellidos: 'Pérez',
          documento: '',
        })
      ).toThrow();
    });
  });
});
