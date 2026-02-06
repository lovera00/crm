import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaReferenciaPersonalRepository } from './prisma-referencia-personal-repository';
import { PrismaClient, EstadoContacto as PrismaEstadoContacto } from '../../generated/prisma';
import { ReferenciaPersonal } from '../../domain/entities/referencia-personal';
import { EstadoContacto } from '../../domain/enums/estado-contacto';

describe('PrismaReferenciaPersonalRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaReferenciaPersonalRepository;

  beforeEach(() => {
    prisma = {
      referenciaPersonal: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaClient;
    repository = new PrismaReferenciaPersonalRepository(prisma);
  });

  describe('buscarPorId', () => {
    it('debería retornar null si referencia no existe', async () => {
      vi.mocked(prisma.referenciaPersonal.findUnique).mockResolvedValue(null);

      const resultado = await repository.buscarPorId(999);

      expect(resultado).toBeNull();
      expect(prisma.referenciaPersonal.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('debería retornar referencia reconstruida', async () => {
      const referenciaData = {
        id: 1,
        personaId: 100,
        nombre: 'María Gómez',
        parentesco: 'Hermana',
        telefono: '+595991234567',
        estado: PrismaEstadoContacto.Pendiente_de_Verificacion,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.referenciaPersonal.findUnique).mockResolvedValue(referenciaData);

      const resultado = await repository.buscarPorId(1);

      expect(resultado).toBeInstanceOf(ReferenciaPersonal);
      expect(resultado?.id).toBe(1);
      expect(resultado?.personaId).toBe(100);
      expect(resultado?.nombre).toBe('María Gómez');
      expect(resultado?.parentesco).toBe('Hermana');
      expect(resultado?.telefono).toBe('+595991234567');
      expect(resultado?.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
    });
  });

  describe('buscarPorPersona', () => {
    it('debería retornar lista vacía si no hay referencias', async () => {
      vi.mocked(prisma.referenciaPersonal.findMany).mockResolvedValue([]);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toEqual([]);
      expect(prisma.referenciaPersonal.findMany).toHaveBeenCalledWith({
        where: { personaId: 100 },
        orderBy: { id: 'asc' },
      });
    });

    it('debería retornar referencias de la persona', async () => {
      const referenciasData = [
        {
          id: 1,
          personaId: 100,
          nombre: 'María Gómez',
          parentesco: 'Hermana',
          telefono: '+595991234567',
          estado: PrismaEstadoContacto.Activo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-01T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 2,
          personaId: 100,
          nombre: 'Carlos López',
          parentesco: 'Amigo',
          telefono: '+595992345678',
          estado: PrismaEstadoContacto.Inactivo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-02T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-02T10:00:00Z'),
        },
      ];
      vi.mocked(prisma.referenciaPersonal.findMany).mockResolvedValue(referenciasData);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].id).toBe(1);
      expect(resultado[0].estado).toBe(EstadoContacto.ACTIVO);
      expect(resultado[1].id).toBe(2);
      expect(resultado[1].estado).toBe(EstadoContacto.INACTIVO);
    });
  });

  describe('guardar', () => {
    it('debería crear nueva referencia si no tiene ID', async () => {
      const referencia = ReferenciaPersonal.crear({
        personaId: 100,
        nombre: 'María Gómez',
        parentesco: 'Hermana',
        telefono: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });
      const referenciaData = {
        id: 1,
        personaId: 100,
        nombre: 'María Gómez',
        parentesco: 'Hermana',
        telefono: '+595991234567',
        estado: PrismaEstadoContacto.Activo,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.referenciaPersonal.create).mockResolvedValue(referenciaData);

      await repository.guardar(referencia);

      expect(prisma.referenciaPersonal.create).toHaveBeenCalledWith({
        data: {
          personaId: 100,
          nombre: 'María Gómez',
          parentesco: 'Hermana',
          telefono: '+595991234567',
          estado: PrismaEstadoContacto.Activo,
        },
      });
    });

    it('debería actualizar referencia existente si tiene ID', async () => {
      const referencia = ReferenciaPersonal.reconstruir({
        id: 1,
        personaId: 100,
        nombre: 'María Gómez',
        parentesco: 'Hermana',
        telefono: '+595991234567',
        estado: EstadoContacto.INACTIVO,
      });
      vi.mocked(prisma.referenciaPersonal.update).mockResolvedValue({} as any);

      await repository.guardar(referencia);

      expect(prisma.referenciaPersonal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          personaId: 100,
          nombre: 'María Gómez',
          parentesco: 'Hermana',
          telefono: '+595991234567',
          estado: PrismaEstadoContacto.Inactivo,
        },
      });
    });
  });

  describe('cambiarEstado', () => {
    it('debería actualizar estado de la referencia', async () => {
      await repository.cambiarEstado(1, EstadoContacto.ACTIVO);

      expect(prisma.referenciaPersonal.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          estado: PrismaEstadoContacto.Activo,
          fechaModificacion: expect.any(Date),
        },
      });
    });
  });

  describe('eliminar', () => {
    it('debería eliminar referencia por ID', async () => {
      await repository.eliminar(1);

      expect(prisma.referenciaPersonal.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});