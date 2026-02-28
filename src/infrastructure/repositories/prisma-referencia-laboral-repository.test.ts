import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaReferenciaLaboralRepository } from './prisma-referencia-laboral-repository';
import { PrismaClient, EstadoContacto as PrismaEstadoContacto } from '../../generated/client';
import { ReferenciaLaboral } from '../../domain/entities/referencia-laboral';
import { EstadoContacto } from '../../domain/enums/estado-contacto';

describe('PrismaReferenciaLaboralRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaReferenciaLaboralRepository;

  beforeEach(() => {
    prisma = {
      referenciaLaboral: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaClient;
    repository = new PrismaReferenciaLaboralRepository(prisma);
  });

  describe('buscarPorId', () => {
    it('debería retornar null si referencia no existe', async () => {
      vi.mocked(prisma.referenciaLaboral.findUnique).mockResolvedValue(null);

      const resultado = await repository.buscarPorId(999);

      expect(resultado).toBeNull();
      expect(prisma.referenciaLaboral.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('debería retornar referencia reconstruida', async () => {
      const referenciaData = {
        id: 1,
        personaId: 100,
        nombre: 'Carlos Rodríguez',
        empresa: 'Acme Corp',
        telefono: '+595991234567',
        observacion: null,
        estado: PrismaEstadoContacto.Pendiente_de_Verificacion,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.referenciaLaboral.findUnique).mockResolvedValue(referenciaData);

      const resultado = await repository.buscarPorId(1);

      expect(resultado).toBeInstanceOf(ReferenciaLaboral);
      expect(resultado?.id).toBe(1);
      expect(resultado?.personaId).toBe(100);
      expect(resultado?.nombre).toBe('Carlos Rodríguez');
      expect(resultado?.empresa).toBe('Acme Corp');
      expect(resultado?.telefono).toBe('+595991234567');
      expect(resultado?.estado).toBe(EstadoContacto.PENDIENTE_DE_VERIFICACION);
    });

    it('debería manejar referencia sin empresa', async () => {
      const referenciaData = {
        id: 2,
        personaId: 100,
        nombre: 'Ana Martínez',
        empresa: null,
        telefono: '+595992345678',
        observacion: null,
        estado: PrismaEstadoContacto.Activo,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.referenciaLaboral.findUnique).mockResolvedValue(referenciaData);

      const resultado = await repository.buscarPorId(2);

      expect(resultado?.empresa).toBeUndefined();
    });
  });

  describe('buscarPorPersona', () => {
    it('debería retornar lista vacía si no hay referencias', async () => {
      vi.mocked(prisma.referenciaLaboral.findMany).mockResolvedValue([]);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toEqual([]);
      expect(prisma.referenciaLaboral.findMany).toHaveBeenCalledWith({
        where: { personaId: 100 },
        orderBy: { id: 'asc' },
      });
    });

    it('debería retornar referencias de la persona', async () => {
      const referenciasData = [
        {
          id: 1,
          personaId: 100,
          nombre: 'Carlos Rodríguez',
          empresa: 'Acme Corp',
          telefono: '+595991234567',
          observacion: null,
          estado: PrismaEstadoContacto.Activo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-01T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 2,
          personaId: 100,
          nombre: 'Ana Martínez',
          empresa: null,
          telefono: '+595992345678',
          observacion: null,
          estado: PrismaEstadoContacto.Inactivo,
          creadoPorId: null,
          fechaCreacion: new Date('2024-01-02T09:00:00Z'),
          modificadoPorId: null,
          fechaModificacion: new Date('2024-01-02T10:00:00Z'),
        },
      ];
      vi.mocked(prisma.referenciaLaboral.findMany).mockResolvedValue(referenciasData);

      const resultado = await repository.buscarPorPersona(100);

      expect(resultado).toHaveLength(2);
      expect(resultado[0].id).toBe(1);
      expect(resultado[0].estado).toBe(EstadoContacto.ACTIVO);
      expect(resultado[0].empresa).toBe('Acme Corp');
      expect(resultado[1].id).toBe(2);
      expect(resultado[1].estado).toBe(EstadoContacto.INACTIVO);
      expect(resultado[1].empresa).toBeUndefined();
    });
  });

  describe('guardar', () => {
    it('debería crear nueva referencia si no tiene ID', async () => {
      const referencia = ReferenciaLaboral.crear({
        personaId: 100,
        nombre: 'Carlos Rodríguez',
        empresa: 'Acme Corp',
        telefono: '+595991234567',
        estado: EstadoContacto.ACTIVO,
      });
      const referenciaData = {
        id: 1,
        personaId: 100,
        nombre: 'Carlos Rodríguez',
        empresa: 'Acme Corp',
        telefono: '+595991234567',
        observacion: null,
        estado: PrismaEstadoContacto.Activo,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.referenciaLaboral.create).mockResolvedValue(referenciaData);

      await repository.guardar(referencia);

      expect(prisma.referenciaLaboral.create).toHaveBeenCalledWith({
        data: {
          personaId: 100,
          nombre: 'Carlos Rodríguez',
          empresa: 'Acme Corp',
          telefono: '+595991234567',
          estado: PrismaEstadoContacto.Activo,
        },
      });
    });

    it('debería crear referencia sin empresa', async () => {
      const referencia = ReferenciaLaboral.crear({
        personaId: 100,
        nombre: 'Ana Martínez',
        telefono: '+595992345678',
        estado: EstadoContacto.ACTIVO,
      });
      const referenciaData = {
        id: 1,
        personaId: 100,
        nombre: 'Ana Martínez',
        empresa: null,
        telefono: '+595992345678',
        observacion: null,
        estado: PrismaEstadoContacto.Activo,
        creadoPorId: null,
        fechaCreacion: new Date('2024-01-01T09:00:00Z'),
        modificadoPorId: null,
        fechaModificacion: new Date('2024-01-01T10:00:00Z'),
      };
      vi.mocked(prisma.referenciaLaboral.create).mockResolvedValue(referenciaData);

      await repository.guardar(referencia);

      expect(prisma.referenciaLaboral.create).toHaveBeenCalledWith({
        data: {
          personaId: 100,
          nombre: 'Ana Martínez',
          empresa: null,
          telefono: '+595992345678',
          estado: PrismaEstadoContacto.Activo,
        },
      });
    });

    it('debería actualizar referencia existente si tiene ID', async () => {
      const referencia = ReferenciaLaboral.reconstruir({
        id: 1,
        personaId: 100,
        nombre: 'Carlos Rodríguez',
        empresa: 'Acme Corp',
        telefono: '+595991234567',
        estado: EstadoContacto.INACTIVO,
      });
      vi.mocked(prisma.referenciaLaboral.update).mockResolvedValue({} as any);

      await repository.guardar(referencia);

      expect(prisma.referenciaLaboral.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          personaId: 100,
          nombre: 'Carlos Rodríguez',
          empresa: 'Acme Corp',
          telefono: '+595991234567',
          estado: PrismaEstadoContacto.Inactivo,
        },
      });
    });
  });

  describe('cambiarEstado', () => {
    it('debería actualizar estado de la referencia', async () => {
      await repository.cambiarEstado(1, EstadoContacto.ACTIVO);

      expect(prisma.referenciaLaboral.update).toHaveBeenCalledWith({
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

      expect(prisma.referenciaLaboral.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});