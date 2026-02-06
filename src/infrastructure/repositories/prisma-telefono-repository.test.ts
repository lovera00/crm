import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaTelefonoRepository } from './prisma-telefono-repository';
import { PrismaClient, EstadoContacto as PrismaEstadoContacto } from '../../generated/prisma';
import { Telefono } from '../../domain/entities/telefono';
import { EstadoContacto } from '../../domain/enums/estado-contacto';

describe('PrismaTelefonoRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaTelefonoRepository;

  beforeEach(() => {
    prisma = {
      telefono: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaClient;
    repository = new PrismaTelefonoRepository(prisma);
  });

  describe('buscarPorId', () => {
    it('debería retornar null si teléfono no existe', async () => {
      vi.mocked(prisma.telefono.findUnique).mockResolvedValue(null);

      const resultado = await repository.buscarPorId(999);

      expect(resultado).toBeNull();
      expect(prisma.telefono.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('debería retornar teléfono reconstruido', async () => {
      const telefonoData = {
        id: 1,
        personaId: 100,
        numero: '+595991234567',
        estado: PrismaEstadoContacto.Pendiente_de_Verificacion,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.telefono.findUnique).mockResolvedValue(telefonoData);

      const resultado = await repository.buscarPorId(1);

      expect(resultado).toBeInstanceOf(Telefono);
      expect(resultado?.id).toBe(1);
      expect(resultado?.personaId).toBe(100);
      expect(resultado?.numero).toBe('+595991234567');
      expect(resultado?.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
      expect(resultado?.fechaModificacion).toEqual(new Date('2024-01-01T10:00:00Z'));
    });
  });

  describe('buscarPorPersona', () => {
    it('debería retornar lista vacía si no hay teléfonos', async () => {
      vi.mocked(prisma.telefono.findMany).mockResolvedValue([]);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toEqual([]);
      expect(prisma.telefono.findMany).toHaveBeenCalledWith({
        where: { personaId: 100 },
        orderBy: { id: 'asc' },
      });
    });

    it('debería retornar teléfonos de la persona', async () => {
      const telefonosData = [
        {
          id: 1,
          personaId: 100,
          numero: '+595991234567',
          estado: PrismaEstadoContacto.Activo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-01T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 2,
          personaId: 100,
          numero: '+595992345678',
          estado: PrismaEstadoContacto.Inactivo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-02T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-02T10:00:00Z'),
        },
      ];
      vi.mocked(prisma.telefono.findMany).mockResolvedValue(telefonosData);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].id).toBe(1);
      expect(resultado[0].estado).toBe(EstadoContacto.ACTIVO);
      expect(resultado[1].id).toBe(2);
      expect(resultado[1].estado).toBe(EstadoContacto.INACTIVO);
    });
  });

  describe('guardar', () => {
    it('debería crear nuevo teléfono si no tiene ID', async () => {
      const telefono = Telefono.crear({
        personaId: 100,
        numero: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });
      const telefonoData = {
        id: 1,
        personaId: 100,
        numero: '+595991234567',
        estado: PrismaEstadoContacto.Activo,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.telefono.create).mockResolvedValue(telefonoData);

      await repository.guardar(telefono);

      expect(prisma.telefono.create).toHaveBeenCalledWith({
        data: {
          personaId: 100,
          numero: '+595991234567',
          estado: PrismaEstadoContacto.Activo,
          fechaModificacion: expect.any(Date),
        },
      });
    });

    it('debería actualizar teléfono existente si tiene ID', async () => {
      const telefono = Telefono.reconstruir({
        id: 1,
        personaId: 100,
        numero: '+595991234567',
        estado: EstadoContacto.INACTIVO,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      });
      vi.mocked(prisma.telefono.update).mockResolvedValue({} as any);

      await repository.guardar(telefono);

      expect(prisma.telefono.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          personaId: 100,
          numero: '+595991234567',
          estado: PrismaEstadoContacto.Inactivo,
          fechaModificacion: telefono.fechaModificacion,
        },
      });
    });
  });

  describe('cambiarEstado', () => {
    it('debería actualizar estado del teléfono', async () => {
      await repository.cambiarEstado(1, EstadoContacto.ACTIVO);

      expect(prisma.telefono.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          estado: PrismaEstadoContacto.Activo,
          fechaModificacion: expect.any(Date),
        },
      });
    });
  });

  describe('eliminar', () => {
    it('debería eliminar teléfono por ID', async () => {
      await repository.eliminar(1);

      expect(prisma.telefono.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});