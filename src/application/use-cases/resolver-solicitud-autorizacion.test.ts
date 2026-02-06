import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResolverSolicitudAutorizacionUseCase } from './resolver-solicitud-autorizacion';
import { SolicitudAutorizacionRepository } from '../../domain/repositories/solicitud-autorizacion-repository';
import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { SolicitudAutorizacion } from '../../domain/entities/solicitud-autorizacion';
import { Deuda } from '../../domain/entities/deuda';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';
import { PrioridadSolicitud } from '../../domain/enums/prioridad-solicitud';
import { EstadoSolicitud } from '../../domain/enums/estado-solicitud';

describe('ResolverSolicitudAutorizacionUseCase', () => {
  let solicitudAutorizacionRepository: SolicitudAutorizacionRepository;
  let deudaRepository: DeudaRepository;
  let useCase: ResolverSolicitudAutorizacionUseCase;

  beforeEach(() => {
    solicitudAutorizacionRepository = {
      crear: vi.fn(),
      buscarPorId: vi.fn(),
      buscarPorDeuda: vi.fn(),
      buscarPorSeguimiento: vi.fn(),
      buscarPendientesPorSupervisor: vi.fn(),
      actualizar: vi.fn(),
    };
    deudaRepository = {
      buscarPorId: vi.fn(),
      guardar: vi.fn(),
      buscarPorGestor: vi.fn(),
      obtenerDeudasParaActualizacionDiaria: vi.fn().mockResolvedValue([]),
      obtenerDeudasConEstado: vi.fn().mockResolvedValue([]),
    };
    useCase = new ResolverSolicitudAutorizacionUseCase(
      solicitudAutorizacionRepository,
      deudaRepository,
    );
  });

  describe('aprobar', () => {
    it('debería aprobar solicitud y actualizar deuda', async () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });
      solicitud.asignarSupervisor(200);
      solicitud.asignarId(500);

      const deuda = Deuda.crear({
        id: 100,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        gestorAsignadoId: 50,
        montoCuota: null,
      });
      // Asegurarse que la deuda está en estado NUEVO
      expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO);

      vi.mocked(solicitudAutorizacionRepository.buscarPorId).mockResolvedValue(solicitud);
      vi.mocked(deudaRepository.buscarPorId).mockResolvedValue(deuda);

      const input = {
        solicitudId: 500,
        supervisorId: 200,
        aprobar: true,
        comentarioSupervisor: 'Autorizado',
      };

      const output = await useCase.execute(input);

      expect(output.solicitudId).toBe(500);
      expect(output.estadoSolicitud).toBe(EstadoSolicitud.APROBADA);
      expect(output.deudaActualizada).toBe(true);
      expect(output.nuevoEstadoDeuda).toBe(EstadoDeuda.EN_GESTION);
      expect(deuda.estadoActual).toBe(EstadoDeuda.EN_GESTION);
      expect(deudaRepository.guardar).toHaveBeenCalledWith(deuda);
      expect(solicitudAutorizacionRepository.actualizar).toHaveBeenCalledWith(solicitud);
    });

    it('no debería aprobar si supervisor no es el asignado', async () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });
      solicitud.asignarSupervisor(200);
      solicitud.asignarId(500);

      vi.mocked(solicitudAutorizacionRepository.buscarPorId).mockResolvedValue(solicitud);

      const input = {
        solicitudId: 500,
        supervisorId: 300, // Supervisor diferente
        aprobar: true,
      };

      await expect(useCase.execute(input)).rejects.toThrow('El supervisor no está autorizado para resolver esta solicitud');
    });

    it('no debería aprobar si la deuda ya no está en el estado origen', async () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });
      solicitud.asignarSupervisor(200);
      solicitud.asignarId(500);

      const deuda = Deuda.crear({
        id: 100,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        gestorAsignadoId: 50,
        montoCuota: null,
      });
      // Cambiar estado de la deuda a otro diferente
      deuda.cambiarEstado(EstadoDeuda.EN_GESTION);

      vi.mocked(solicitudAutorizacionRepository.buscarPorId).mockResolvedValue(solicitud);
      vi.mocked(deudaRepository.buscarPorId).mockResolvedValue(deuda);

      const input = {
        solicitudId: 500,
        supervisorId: 200,
        aprobar: true,
      };

      await expect(useCase.execute(input)).rejects.toThrow('La deuda ya no está en el estado origen (Nuevo)');
    });
  });

  describe('rechazar', () => {
    it('debería rechazar solicitud sin actualizar deuda', async () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });
      solicitud.asignarSupervisor(200);
      solicitud.asignarId(500);

      const deuda = Deuda.crear({
        id: 100,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        gestorAsignadoId: 50,
        montoCuota: null,
      });

      vi.mocked(solicitudAutorizacionRepository.buscarPorId).mockResolvedValue(solicitud);
      vi.mocked(deudaRepository.buscarPorId).mockResolvedValue(deuda);

      const input = {
        solicitudId: 500,
        supervisorId: 200,
        aprobar: false,
        comentarioSupervisor: 'No cumple requisitos',
      };

      const output = await useCase.execute(input);

      expect(output.solicitudId).toBe(500);
      expect(output.estadoSolicitud).toBe(EstadoSolicitud.RECHAZADA);
      expect(output.deudaActualizada).toBe(false);
      expect(output.nuevoEstadoDeuda).toBeUndefined();
      expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO); // Estado no cambió
      expect(deudaRepository.guardar).not.toHaveBeenCalled();
      expect(solicitudAutorizacionRepository.actualizar).toHaveBeenCalledWith(solicitud);
    });
  });
});