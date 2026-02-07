import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaEmailRepository } from './prisma-email-repository';
import { PrismaClient, EstadoContacto as PrismaEstadoContacto } from '../../generated/client';
import { Email } from '../../domain/entities/email';
import { EstadoContacto } from '../../domain/enums/estado-contacto';

describe('PrismaEmailRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaEmailRepository;

  beforeEach(() => {
    prisma = {
      email: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaClient;
    repository = new PrismaEmailRepository(prisma);
  });

  describe('buscarPorId', () => {
    it('debería retornar null si email no existe', async () => {
      vi.mocked(prisma.email.findUnique).mockResolvedValue(null);

      const resultado = await repository.buscarPorId(999);

      expect(resultado).toBeNull();
      expect(prisma.email.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('debería retornar email reconstruido', async () => {
      const emailData = {
        id: 1,
        personaId: 100,
        email: 'juan@example.com',
        estado: PrismaEstadoContacto.Pendiente_de_Verificacion,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.email.findUnique).mockResolvedValue(emailData);

      const resultado = await repository.buscarPorId(1);

      expect(resultado).toBeInstanceOf(Email);
      expect(resultado?.id).toBe(1);
      expect(resultado?.personaId).toBe(100);
      expect(resultado?.email).toBe('juan@example.com');
      expect(resultado?.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
      expect(resultado?.fechaModificacion).toEqual(new Date('2024-01-01T10:00:00Z'));
    });
  });

  describe('buscarPorPersona', () => {
    it('debería retornar lista vacía si no hay emails', async () => {
      vi.mocked(prisma.email.findMany).mockResolvedValue([]);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toEqual([]);
      expect(prisma.email.findMany).toHaveBeenCalledWith({
        where: { personaId: 100 },
        orderBy: { id: 'asc' },
      });
    });

    it('debería retornar emails de la persona', async () => {
      const emailsData = [
        {
          id: 1,
          personaId: 100,
          email: 'juan@example.com',
          estado: PrismaEstadoContacto.Activo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-01T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 2,
          personaId: 100,
          email: 'juan.work@example.com',
          estado: PrismaEstadoContacto.Inactivo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-02T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-02T10:00:00Z'),
        },
      ];
      vi.mocked(prisma.email.findMany).mockResolvedValue(emailsData);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].id).toBe(1);
      expect(resultado[0].estado).toBe(EstadoContacto.ACTIVO);
      expect(resultado[1].id).toBe(2);
      expect(resultado[1].estado).toBe(EstadoContacto.INACTIVO);
    });
  });

  describe('guardar', () => {
    it('debería crear nuevo email si no tiene ID', async () => {
      const email = Email.crear({
        personaId: 100,
        email: 'juan@example.com',
        estado: EstadoContacto.ACTIVO,
      });
      const emailData = {
        id: 1,
        personaId: 100,
        email: 'juan@example.com',
        estado: PrismaEstadoContacto.Activo,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.email.create).mockResolvedValue(emailData);

      await repository.guardar(email);

      expect(prisma.email.create).toHaveBeenCalledWith({
        data: {
          personaId: 100,
          email: 'juan@example.com',
          estado: PrismaEstadoContacto.Activo,
          fechaModificacion: expect.any(Date),
        },
      });
    });

    it('debería actualizar email existente si tiene ID', async () => {
      const email = Email.reconstruir({
        id: 1,
        personaId: 100,
        email: 'juan@example.com',
        estado: EstadoContacto.INACTIVO,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      });
      vi.mocked(prisma.email.update).mockResolvedValue({} as any);

      await repository.guardar(email);

      expect(prisma.email.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          personaId: 100,
          email: 'juan@example.com',
          estado: PrismaEstadoContacto.Inactivo,
          fechaModificacion: email.fechaModificacion,
        },
      });
    });
  });

  describe('cambiarEstado', () => {
    it('debería actualizar estado del email', async () => {
      await repository.cambiarEstado(1, EstadoContacto.ACTIVO);

      expect(prisma.email.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          estado: PrismaEstadoContacto.Activo,
          fechaModificacion: expect.any(Date),
        },
      });
    });
  });

  describe('eliminar', () => {
    it('debería eliminar email por ID', async () => {
      await repository.eliminar(1);

      expect(prisma.email.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});