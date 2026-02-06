import { describe, it, expect } from 'vitest';
import { Persona } from './persona';
import { EstadoVerificacion } from '../enums/estado-verificacion';
import { Telefono } from './telefono';
import { Email } from './email';
import { ReferenciaPersonal } from './referencia-personal';
import { ReferenciaLaboral } from './referencia-laboral';
import { EstadoContacto } from '../enums/estado-contacto';

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

  describe('reconstruir', () => {
    it('debería reconstruir persona con propiedades completas', () => {
      const telefonos = [
        Telefono.crear({ personaId: 1, numero: '+595991234567' }),
        Telefono.crear({ personaId: 1, numero: '+595992345678', estado: EstadoContacto.ACTIVO }),
      ];
      const emails = [
        Email.crear({ personaId: 1, email: 'test@example.com' }),
      ];
      const referenciasPersonales = [
        ReferenciaPersonal.crear({ personaId: 1, nombre: 'Ref1', parentesco: 'Hermano', telefono: '+595993456789' }),
      ];
      const referenciasLaborales = [
        ReferenciaLaboral.crear({ personaId: 1, nombre: 'Jefe', empresa: 'Acme', telefono: '+595994567890' }),
      ];

      const persona = Persona.reconstruir({
        id: 1,
        nombres: 'Carlos',
        apellidos: 'López',
        documento: '55555555',
        funcionarioPublico: EstadoVerificacion.SI,
        fechaModFuncionario: new Date('2024-01-01'),
        jubilado: EstadoVerificacion.NO,
        fechaModJubilado: new Date('2024-01-02'),
        ipsActivo: EstadoVerificacion.SI,
        fechaModIps: new Date('2024-01-03'),
        datosVarios: { nota: 'test' },
        telefonos,
        emails,
        referenciasPersonales,
        referenciasLaborales,
      });

      expect(persona.id).toBe(1);
      expect(persona.nombres).toBe('Carlos');
      expect(persona.apellidos).toBe('López');
      expect(persona.documento).toBe('55555555');
      expect(persona.funcionarioPublico).toBe(EstadoVerificacion.SI);
      expect(persona.fechaModFuncionario).toEqual(new Date('2024-01-01'));
      expect(persona.jubilado).toBe(EstadoVerificacion.NO);
      expect(persona.fechaModJubilado).toEqual(new Date('2024-01-02'));
      expect(persona.ipsActivo).toBe(EstadoVerificacion.SI);
      expect(persona.fechaModIps).toEqual(new Date('2024-01-03'));
      expect(persona.datosVarios).toEqual({ nota: 'test' });
      expect(persona.telefonos).toEqual(telefonos);
      expect(persona.emails).toEqual(emails);
      expect(persona.referenciasPersonales).toEqual(referenciasPersonales);
      expect(persona.referenciasLaborales).toEqual(referenciasLaborales);
    });
  });

  describe('métodos de negocio', () => {
    it('debería actualizar funcionario público', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const fecha = new Date('2024-06-01');

      persona.actualizarFuncionarioPublico(EstadoVerificacion.SI, fecha);

      expect(persona.funcionarioPublico).toBe(EstadoVerificacion.SI);
      expect(persona.fechaModFuncionario).toEqual(fecha);
    });

    it('debería actualizar jubilado', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const fecha = new Date('2024-06-01');

      persona.actualizarJubilado(EstadoVerificacion.NO, fecha);

      expect(persona.jubilado).toBe(EstadoVerificacion.NO);
      expect(persona.fechaModJubilado).toEqual(fecha);
    });

    it('debería actualizar ips activo', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const fecha = new Date('2024-06-01');

      persona.actualizarIpsActivo(EstadoVerificacion.SI, fecha);

      expect(persona.ipsActivo).toBe(EstadoVerificacion.SI);
      expect(persona.fechaModIps).toEqual(fecha);
    });

    it('debería agregar teléfono', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const telefono = Telefono.crear({
        personaId: 1,
        numero: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });

      persona.agregarTelefono(telefono);

      expect(persona.telefonos).toHaveLength(1);
      expect(persona.telefonos[0]).toBe(telefono);
    });

    it('debería agregar email', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const email = Email.crear({
        personaId: 1,
        email: 'test@example.com',
        estado: EstadoContacto.ACTIVO,
      });

      persona.agregarEmail(email);

      expect(persona.emails).toHaveLength(1);
      expect(persona.emails[0]).toBe(email);
    });

    it('debería agregar referencia personal', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const referencia = ReferenciaPersonal.crear({
        personaId: 1,
        nombre: 'María',
        parentesco: 'Hermana',
        telefono: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });

      persona.agregarReferenciaPersonal(referencia);

      expect(persona.referenciasPersonales).toHaveLength(1);
      expect(persona.referenciasPersonales[0]).toBe(referencia);
    });

    it('debería agregar referencia laboral', () => {
      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
      });
      const referencia = ReferenciaLaboral.crear({
        personaId: 1,
        nombre: 'Carlos',
        empresa: 'Acme Corp',
        telefono: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });

      persona.agregarReferenciaLaboral(referencia);

      expect(persona.referenciasLaborales).toHaveLength(1);
      expect(persona.referenciasLaborales[0]).toBe(referencia);
    });
  });

  describe('getters', () => {
    it('debería retornar propiedades correctas', () => {
      const fechaFuncionario = new Date('2024-01-01');
      const fechaJubilado = new Date('2024-01-02');
      const fechaIps = new Date('2024-01-03');
      
      const persona = Persona.reconstruir({
        id: 1,
        nombres: 'Ana',
        apellidos: 'Martínez',
        documento: '99999999',
        funcionarioPublico: EstadoVerificacion.SI,
        fechaModFuncionario: fechaFuncionario,
        jubilado: EstadoVerificacion.NO,
        fechaModJubilado: fechaJubilado,
        ipsActivo: EstadoVerificacion.SI,
        fechaModIps: fechaIps,
        datosVarios: null,
        telefonos: [],
        emails: [],
        referenciasPersonales: [],
        referenciasLaborales: [],
      });

      expect(persona.id).toBe(1);
      expect(persona.nombres).toBe('Ana');
      expect(persona.apellidos).toBe('Martínez');
      expect(persona.documento).toBe('99999999');
      expect(persona.funcionarioPublico).toBe(EstadoVerificacion.SI);
      expect(persona.fechaModFuncionario).toEqual(fechaFuncionario);
      expect(persona.jubilado).toBe(EstadoVerificacion.NO);
      expect(persona.fechaModJubilado).toEqual(fechaJubilado);
      expect(persona.ipsActivo).toBe(EstadoVerificacion.SI);
      expect(persona.fechaModIps).toEqual(fechaIps);
      expect(persona.datosVarios).toBeNull();
      expect(persona.telefonos).toEqual([]);
      expect(persona.emails).toEqual([]);
      expect(persona.referenciasPersonales).toEqual([]);
      expect(persona.referenciasLaborales).toEqual([]);
    });
  });
});
