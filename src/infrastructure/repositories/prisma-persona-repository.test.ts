import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaPersonaRepository } from './prisma-persona-repository';
import { PrismaClient, EstadoVerificacion as PrismaEstadoVerificacion, EstadoContacto as PrismaEstadoContacto } from '../../generated/prisma';
import { Persona } from '../../domain/entities/persona';
import { Telefono } from '../../domain/entities/telefono';
import { Email } from '../../domain/entities/email';
import { ReferenciaPersonal } from '../../domain/entities/referencia-personal';
import { ReferenciaLaboral } from '../../domain/entities/referencia-laboral';
import { EstadoVerificacion } from '../../domain/enums/estado-verificacion';
import { EstadoContacto } from '../../domain/enums/estado-contacto';

describe('PrismaPersonaRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaPersonaRepository;

  beforeEach(() => {
    prisma = {
      persona: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        delete: vi.fn(),
      },
      telefono: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      email: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      referenciaPersonal: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      referenciaLaboral: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as PrismaClient;
    repository = new PrismaPersonaRepository(prisma);
  });

  describe('buscarPorId', () => {
    it('debería retornar null si persona no existe', async () => {
      vi.mocked(prisma.persona.findUnique).mockResolvedValue(null);

      const resultado = await repository.buscarPorId(999);

      expect(resultado).toBeNull();
      expect(prisma.persona.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        include: {
          telefonos: true,
          emails: true,
          referenciasPersonales: true,
          referenciasLaborales: true,
        },
      });
    });

    it('debería retornar persona reconstruida con relaciones', async () => {
      const personaData = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        funcionarioPublico: PrismaEstadoVerificacion.Pendiente,
        fechaModFuncionario: null,
        jubilado: PrismaEstadoVerificacion.Pendiente,
        fechaModJubilado: null,
        ipsActivo: PrismaEstadoVerificacion.Pendiente,
        fechaModIps: null,
        datosVarios: null,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T08:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T08:00:00Z'),
        telefonos: [
          {
            id: 10,
            personaId: 1,
            numero: '+595991234567',
            estado: PrismaEstadoContacto.Pendiente_de_Verificacion,
            creadoPorId: null,
            fechaCreacion: new Date('2024-01-01T09:00:00Z'),
            modificadoPorId: null,
            fechaModificacion: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        emails: [
          {
            id: 20,
            personaId: 1,
            email: 'juan@example.com',
            estado: PrismaEstadoContacto.Activo,
            creadoPorId: null,
            fechaCreacion: new Date('2024-01-01T09:00:00Z'),
            modificadoPorId: null,
            fechaModificacion: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        referenciasPersonales: [
          {
            id: 30,
            personaId: 1,
            nombre: 'María Gómez',
            parentesco: 'Hermana',
            telefono: '+595992345678',
            estado: PrismaEstadoContacto.Pendiente_de_Verificacion,
            creadoPorId: null,
            fechaCreacion: new Date('2024-01-01T09:00:00Z'),
            modificadoPorId: null,
            fechaModificacion: new Date('2024-01-01T10:00:00Z'),
          },
        ],
        referenciasLaborales: [
          {
            id: 40,
            personaId: 1,
            nombre: 'Carlos Rodríguez',
            empresa: 'Acme Corp',
            telefono: '+595993456789',
            estado: PrismaEstadoContacto.Activo,
            creadoPorId: null,
            fechaCreacion: new Date('2024-01-01T09:00:00Z'),
            modificadoPorId: null,
            fechaModificacion: new Date('2024-01-01T10:00:00Z'),
          },
        ],
      };
      vi.mocked(prisma.persona.findUnique).mockResolvedValue(personaData);

      const resultado = await repository.buscarPorId(1);

      expect(resultado).toBeInstanceOf(Persona);
      expect(resultado?.id).toBe(1);
      expect(resultado?.nombres).toBe('Juan');
      expect(resultado?.apellidos).toBe('Pérez');
      expect(resultado?.documento).toBe('12345678');
      expect(resultado?.funcionarioPublico).toBe(EstadoVerificacion.PENDIENTE);
      expect(resultado?.jubilado).toBe(EstadoVerificacion.PENDIENTE);
      expect(resultado?.ipsActivo).toBe(EstadoVerificacion.PENDIENTE);
      expect(resultado?.telefonos).toHaveLength(1);
      expect(resultado?.telefonos[0]).toBeInstanceOf(Telefono);
      expect(resultado?.telefonos[0].numero).toBe('+595991234567');
      expect(resultado?.emails).toHaveLength(1);
      expect(resultado?.emails[0]).toBeInstanceOf(Email);
      expect(resultado?.emails[0].email).toBe('juan@example.com');
      expect(resultado?.referenciasPersonales).toHaveLength(1);
      expect(resultado?.referenciasPersonales[0]).toBeInstanceOf(ReferenciaPersonal);
      expect(resultado?.referenciasPersonales[0].nombre).toBe('María Gómez');
      expect(resultado?.referenciasLaborales).toHaveLength(1);
      expect(resultado?.referenciasLaborales[0]).toBeInstanceOf(ReferenciaLaboral);
      expect(resultado?.referenciasLaborales[0].nombre).toBe('Carlos Rodríguez');
    });
  });

  describe('buscarPorDocumento', () => {
    it('debería retornar null si persona no existe', async () => {
      vi.mocked(prisma.persona.findUnique).mockResolvedValue(null);

      const resultado = await repository.buscarPorDocumento('99999999');

      expect(resultado).toBeNull();
      expect(prisma.persona.findUnique).toHaveBeenCalledWith({
        where: { documento: '99999999' },
        include: expect.any(Object),
      });
    });

    it('debería retornar persona por documento', async () => {
      const personaData = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        funcionarioPublico: PrismaEstadoVerificacion.Pendiente,
        fechaModFuncionario: null,
        jubilado: PrismaEstadoVerificacion.Pendiente,
        fechaModJubilado: null,
        ipsActivo: PrismaEstadoVerificacion.Pendiente,
        fechaModIps: null,
        datosVarios: null,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T08:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T08:00:00Z'),
        telefonos: [],
        emails: [],
        referenciasPersonales: [],
        referenciasLaborales: [],
      };
      vi.mocked(prisma.persona.findUnique).mockResolvedValue(personaData);
      // Mock buscarPorId que será llamado internamente
      const buscarPorIdSpy = vi.spyOn(repository as any, 'buscarPorId').mockResolvedValue(
        Persona.reconstruir({
          id: 1,
          nombres: 'Juan',
          apellidos: 'Pérez',
          documento: '12345678',
          funcionarioPublico: EstadoVerificacion.PENDIENTE,
          fechaModFuncionario: null,
          jubilado: EstadoVerificacion.PENDIENTE,
          fechaModJubilado: null,
          ipsActivo: EstadoVerificacion.PENDIENTE,
          fechaModIps: null,
          datosVarios: null,
          telefonos: [],
          emails: [],
          referenciasPersonales: [],
          referenciasLaborales: [],
        })
      );

      const resultado = await repository.buscarPorDocumento('12345678');

      expect(resultado).toBeInstanceOf(Persona);
      expect(resultado?.documento).toBe('12345678');
      expect(buscarPorIdSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('buscarPorNombreOApellido', () => {
    it('debería retornar lista vacía si no hay coincidencias', async () => {
      vi.mocked(prisma.persona.findMany).mockResolvedValue([]);

      const resultado = await repository.buscarPorNombreOApellido('inexistente');

      expect(resultado).toEqual([]);
      expect(prisma.persona.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { nombres: { contains: 'inexistente', mode: 'insensitive' } },
            { apellidos: { contains: 'inexistente', mode: 'insensitive' } },
          ],
        },
        include: expect.any(Object),
        take: 50,
      });
    });

    it('debería retornar personas que coincidan con término', async () => {
      const personasData = [
        {
          id: 1,
          nombres: 'Juan',
          apellidos: 'Pérez',
          documento: '12345678',
          funcionarioPublico: PrismaEstadoVerificacion.Pendiente,
          fechaModFuncionario: null,
          jubilado: PrismaEstadoVerificacion.Pendiente,
          fechaModJubilado: null,
          ipsActivo: PrismaEstadoVerificacion.Pendiente,
          fechaModIps: null,
          datosVarios: null,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-01T08:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-01T08:00:00Z'),
          telefonos: [],
          emails: [],
          referenciasPersonales: [],
          referenciasLaborales: [],
        },
        {
          id: 2,
          nombres: 'María',
          apellidos: 'Pérez',
          documento: '87654321',
          funcionarioPublico: PrismaEstadoVerificacion.Pendiente,
          fechaModFuncionario: null,
          jubilado: PrismaEstadoVerificacion.Pendiente,
          fechaModJubilado: null,
          ipsActivo: PrismaEstadoVerificacion.Pendiente,
          fechaModIps: null,
          datosVarios: null,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-01T08:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-01T08:00:00Z'),
          telefonos: [],
          emails: [],
          referenciasPersonales: [],
          referenciasLaborales: [],
        },
      ];
      vi.mocked(prisma.persona.findMany).mockResolvedValue(personasData);
      // Mock buscarPorId para cada persona
      const buscarPorIdSpy = vi.spyOn(repository as any, 'buscarPorId')
        .mockResolvedValueOnce(
          Persona.reconstruir({
            id: 1,
            nombres: 'Juan',
            apellidos: 'Pérez',
            documento: '12345678',
            funcionarioPublico: EstadoVerificacion.PENDIENTE,
            fechaModFuncionario: null,
            jubilado: EstadoVerificacion.PENDIENTE,
            fechaModJubilado: null,
            ipsActivo: EstadoVerificacion.PENDIENTE,
            fechaModIps: null,
            datosVarios: null,
            telefonos: [],
            emails: [],
            referenciasPersonales: [],
            referenciasLaborales: [],
          })
        )
        .mockResolvedValueOnce(
          Persona.reconstruir({
            id: 2,
            nombres: 'María',
            apellidos: 'Pérez',
            documento: '87654321',
            funcionarioPublico: EstadoVerificacion.PENDIENTE,
            fechaModFuncionario: null,
            jubilado: EstadoVerificacion.PENDIENTE,
            fechaModJubilado: null,
            ipsActivo: EstadoVerificacion.PENDIENTE,
            fechaModIps: null,
            datosVarios: null,
            telefonos: [],
            emails: [],
            referenciasPersonales: [],
            referenciasLaborales: [],
          })
        );

      const resultado = await repository.buscarPorNombreOApellido('Pérez');

      expect(resultado).toHaveLength(2);
      expect(resultado[0].apellidos).toBe('Pérez');
      expect(resultado[1].apellidos).toBe('Pérez');
      expect(buscarPorIdSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('guardar', () => {
    it('debería crear nueva persona si no tiene ID', async () => {
      const telefono = Telefono.crear({
        personaId: 1,
        numero: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });
      const email = Email.crear({
        personaId: 1,
        email: 'test@example.com',
        estado: EstadoContacto.ACTIVO,
      });
      const referenciaPersonal = ReferenciaPersonal.crear({
        personaId: 1,
        nombre: 'Ref1',
        parentesco: 'Hermano',
        telefono: '+595992345678',
        estado: EstadoContacto.ACTIVO,
      });
      const referenciaLaboral = ReferenciaLaboral.crear({
        personaId: 1,
        nombre: 'Ref2',
        empresa: 'Acme',
        telefono: '+595993456789',
        estado: EstadoContacto.ACTIVO,
      });

      const persona = Persona.crear({
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        funcionarioPublico: EstadoVerificacion.SI,
        jubilado: EstadoVerificacion.NO,
        ipsActivo: EstadoVerificacion.SI,
        datosVarios: { nota: 'test' },
        telefonos: [telefono],
        emails: [email],
        referenciasPersonales: [referenciaPersonal],
        referenciasLaborales: [referenciaLaboral],
      });

      const personaGuardada = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        funcionarioPublico: PrismaEstadoVerificacion.SI,
        fechaModFuncionario: null,
        jubilado: PrismaEstadoVerificacion.NO,
        fechaModJubilado: null,
        ipsActivo: PrismaEstadoVerificacion.SI,
        fechaModIps: null,
        datosVarios: { nota: 'test' },
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T08:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T08:00:00Z'),
      };
      vi.mocked(prisma.persona.upsert).mockResolvedValue(personaGuardada);
      vi.mocked(prisma.telefono.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.email.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.referenciaPersonal.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.referenciaLaboral.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.telefono.create).mockResolvedValue({} as any);
      vi.mocked(prisma.email.create).mockResolvedValue({} as any);
      vi.mocked(prisma.referenciaPersonal.create).mockResolvedValue({} as any);
      vi.mocked(prisma.referenciaLaboral.create).mockResolvedValue({} as any);

      await repository.guardar(persona);

      expect(prisma.persona.upsert).toHaveBeenCalledWith({
        where: { id: -1 },
        update: {
          nombres: 'Juan',
          apellidos: 'Pérez',
          documento: '12345678',
          funcionarioPublico: PrismaEstadoVerificacion.SI,
          fechaModFuncionario: null,
          jubilado: PrismaEstadoVerificacion.NO,
          fechaModJubilado: null,
          ipsActivo: PrismaEstadoVerificacion.SI,
          fechaModIps: null,
          datosVarios: { nota: 'test' },
        },
        create: {
          nombres: 'Juan',
          apellidos: 'Pérez',
          documento: '12345678',
          funcionarioPublico: PrismaEstadoVerificacion.SI,
          fechaModFuncionario: null,
          jubilado: PrismaEstadoVerificacion.NO,
          fechaModJubilado: null,
          ipsActivo: PrismaEstadoVerificacion.SI,
          fechaModIps: null,
          datosVarios: { nota: 'test' },
          id: undefined,
        },
      });

      expect(prisma.telefono.deleteMany).toHaveBeenCalledWith({ where: { personaId: 1 } });
      expect(prisma.telefono.create).toHaveBeenCalledWith({
        data: {
          personaId: 1,
          numero: '+595991234567',
          estado: PrismaEstadoContacto.Activo,
          fechaModificacion: telefono.fechaModificacion,
        },
      });
    });

    it('debería actualizar persona existente si tiene ID', async () => {
      const persona = Persona.reconstruir({
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        funcionarioPublico: EstadoVerificacion.SI,
        fechaModFuncionario: null,
        jubilado: EstadoVerificacion.NO,
        fechaModJubilado: null,
        ipsActivo: EstadoVerificacion.SI,
        fechaModIps: null,
        datosVarios: null,
        telefonos: [],
        emails: [],
        referenciasPersonales: [],
        referenciasLaborales: [],
      });

      const personaGuardada = {
        id: 1,
        nombres: 'Juan',
        apellidos: 'Pérez',
        documento: '12345678',
        funcionarioPublico: PrismaEstadoVerificacion.SI,
        fechaModFuncionario: null,
        jubilado: PrismaEstadoVerificacion.NO,
        fechaModJubilado: null,
        ipsActivo: PrismaEstadoVerificacion.SI,
        fechaModIps: null,
        datosVarios: null,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T08:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T08:00:00Z'),
      };
      vi.mocked(prisma.persona.upsert).mockResolvedValue(personaGuardada);
      vi.mocked(prisma.telefono.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.email.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.referenciaPersonal.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.referenciaLaboral.deleteMany).mockResolvedValue({ count: 0 });

      await repository.guardar(persona);

      expect(prisma.persona.upsert).toHaveBeenCalledWith({
        where: { id: 1 },
        update: expect.any(Object),
        create: expect.any(Object),
      });
    });
  });

  describe('eliminar', () => {
    it('debería eliminar persona por ID', async () => {
      await repository.eliminar(1);

      expect(prisma.persona.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});