import { describe, it, expect, beforeEach } from 'vitest';
import { SolicitudAutorizacion } from './solicitud-autorizacion';
import { EstadoSolicitud } from '../enums/estado-solicitud';
import { PrioridadSolicitud } from '../enums/prioridad-solicitud';
import { EstadoDeuda } from '../enums/estado-deuda';

describe('SolicitudAutorizacion', () => {
  describe('crear', () => {
    it('debería crear una solicitud con valores por defecto', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
        comentarioSolicitante: 'Necesito autorización',
      });

      expect(solicitud.id).toBeUndefined();
      expect(solicitud.seguimientoId).toBe(1);
      expect(solicitud.deudaMaestraId).toBe(100);
      expect(solicitud.estadoOrigen).toBe(EstadoDeuda.NUEVO);
      expect(solicitud.estadoDestino).toBe(EstadoDeuda.EN_GESTION);
      expect(solicitud.gestorSolicitanteId).toBe(50);
      expect(solicitud.supervisorAsignadoId).toBeNull();
      expect(solicitud.estadoSolicitud).toBe(EstadoSolicitud.PENDIENTE);
      expect(solicitud.fechaSolicitud).toBeInstanceOf(Date);
      expect(solicitud.fechaResolucion).toBeNull();
      expect(solicitud.comentarioSolicitante).toBe('Necesito autorización');
      expect(solicitud.comentarioSupervisor).toBeUndefined();
      expect(solicitud.prioridad).toBe(PrioridadSolicitud.MEDIA);
      expect(solicitud.estaPendiente).toBe(true);
      expect(solicitud.estaAprobada).toBe(false);
      expect(solicitud.estaRechazada).toBe(false);
      expect(solicitud.estaExpirada).toBe(false);
    });

    it('debería asignar ID correctamente', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.asignarId(999);
      expect(solicitud.id).toBe(999);
    });
  });

  describe('asignarSupervisor', () => {
    it('debería asignar supervisor correctamente', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.asignarSupervisor(200);
      expect(solicitud.supervisorAsignadoId).toBe(200);
    });
  });

  describe('aprobar', () => {
    it('debería aprobar solicitud pendiente', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.aprobar('Autorizado');
      expect(solicitud.estadoSolicitud).toBe(EstadoSolicitud.APROBADA);
      expect(solicitud.fechaResolucion).toBeInstanceOf(Date);
      expect(solicitud.comentarioSupervisor).toBe('Autorizado');
      expect(solicitud.estaPendiente).toBe(false);
      expect(solicitud.estaAprobada).toBe(true);
    });

    it('no debería aprobar solicitud ya resuelta', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.aprobar('Autorizado');
      expect(() => solicitud.aprobar('Otra vez')).toThrow('Solo se pueden aprobar solicitudes pendientes');
    });
  });

  describe('rechazar', () => {
    it('debería rechazar solicitud pendiente', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.rechazar('No cumple requisitos');
      expect(solicitud.estadoSolicitud).toBe(EstadoSolicitud.RECHAZADA);
      expect(solicitud.fechaResolucion).toBeInstanceOf(Date);
      expect(solicitud.comentarioSupervisor).toBe('No cumple requisitos');
      expect(solicitud.estaPendiente).toBe(false);
      expect(solicitud.estaRechazada).toBe(true);
    });

    it('no debería rechazar solicitud ya resuelta', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.rechazar('Rechazado');
      expect(() => solicitud.rechazar('Otra vez')).toThrow('Solo se pueden rechazar solicitudes pendientes');
    });
  });

  describe('expirar', () => {
    it('debería expirar solicitud pendiente', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.expirar();
      expect(solicitud.estadoSolicitud).toBe(EstadoSolicitud.EXPIRADA);
      expect(solicitud.fechaResolucion).toBeInstanceOf(Date);
      expect(solicitud.estaExpirada).toBe(true);
    });

    it('no debería expirar solicitud ya resuelta', () => {
      const solicitud = SolicitudAutorizacion.crear({
        seguimientoId: 1,
        deudaMaestraId: 100,
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        gestorSolicitanteId: 50,
        prioridad: PrioridadSolicitud.MEDIA,
      });

      solicitud.aprobar('Autorizado');
      expect(() => solicitud.expirar()).toThrow('Solo se pueden expirar solicitudes pendientes');
    });
  });
});