import { EstadoSolicitud } from '../enums/estado-solicitud';
import { PrioridadSolicitud } from '../enums/prioridad-solicitud';
import { EstadoDeuda } from '../enums/estado-deuda';

export interface SolicitudAutorizacionProps {
  id?: number;
  seguimientoId: number;
  deudaMaestraId: number;
  estadoOrigen: EstadoDeuda;
  estadoDestino: EstadoDeuda;
  gestorSolicitanteId: number;
  supervisorAsignadoId: number | null;
  estadoSolicitud: EstadoSolicitud;
  fechaSolicitud: Date;
  fechaResolucion: Date | null;
  comentarioSolicitante?: string;
  comentarioSupervisor?: string;
  prioridad: PrioridadSolicitud;
}

export class SolicitudAutorizacion {
  private constructor(private props: SolicitudAutorizacionProps) {}

  public static crear(props: Omit<SolicitudAutorizacionProps, 'estadoSolicitud' | 'fechaSolicitud' | 'fechaResolucion' | 'supervisorAsignadoId'>): SolicitudAutorizacion {
    const defaultProps: Partial<SolicitudAutorizacionProps> = {
      estadoSolicitud: EstadoSolicitud.PENDIENTE,
      fechaSolicitud: new Date(),
      fechaResolucion: null,
      supervisorAsignadoId: null,
    };
    const mergedProps: SolicitudAutorizacionProps = {
      ...defaultProps,
      ...props,
    } as SolicitudAutorizacionProps;
    return new SolicitudAutorizacion(mergedProps);
  }

  public static reconstruir(props: SolicitudAutorizacionProps): SolicitudAutorizacion {
    return new SolicitudAutorizacion(props);
  }

  asignarSupervisor(supervisorId: number): void {
    this.props.supervisorAsignadoId = supervisorId;
  }

  aprobar(comentarioSupervisor?: string): void {
    if (this.props.estadoSolicitud !== EstadoSolicitud.PENDIENTE) {
      throw new Error('Solo se pueden aprobar solicitudes pendientes');
    }
    this.props.estadoSolicitud = EstadoSolicitud.APROBADA;
    this.props.fechaResolucion = new Date();
    if (comentarioSupervisor) {
      this.props.comentarioSupervisor = comentarioSupervisor;
    }
  }

  rechazar(comentarioSupervisor?: string): void {
    if (this.props.estadoSolicitud !== EstadoSolicitud.PENDIENTE) {
      throw new Error('Solo se pueden rechazar solicitudes pendientes');
    }
    this.props.estadoSolicitud = EstadoSolicitud.RECHAZADA;
    this.props.fechaResolucion = new Date();
    if (comentarioSupervisor) {
      this.props.comentarioSupervisor = comentarioSupervisor;
    }
  }

  expirar(): void {
    if (this.props.estadoSolicitud !== EstadoSolicitud.PENDIENTE) {
      throw new Error('Solo se pueden expirar solicitudes pendientes');
    }
    this.props.estadoSolicitud = EstadoSolicitud.EXPIRADA;
    this.props.fechaResolucion = new Date();
  }

  asignarId(id: number): void {
    this.props.id = id;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get seguimientoId(): number {
    return this.props.seguimientoId;
  }

  get deudaMaestraId(): number {
    return this.props.deudaMaestraId;
  }

  get estadoOrigen(): EstadoDeuda {
    return this.props.estadoOrigen;
  }

  get estadoDestino(): EstadoDeuda {
    return this.props.estadoDestino;
  }

  get gestorSolicitanteId(): number {
    return this.props.gestorSolicitanteId;
  }

  get supervisorAsignadoId(): number | null {
    return this.props.supervisorAsignadoId;
  }

  get estadoSolicitud(): EstadoSolicitud {
    return this.props.estadoSolicitud;
  }

  get fechaSolicitud(): Date {
    return this.props.fechaSolicitud;
  }

  get fechaResolucion(): Date | null {
    return this.props.fechaResolucion;
  }

  get comentarioSolicitante(): string | undefined {
    return this.props.comentarioSolicitante;
  }

  get comentarioSupervisor(): string | undefined {
    return this.props.comentarioSupervisor;
  }

  get prioridad(): PrioridadSolicitud {
    return this.props.prioridad;
  }

  get estaPendiente(): boolean {
    return this.props.estadoSolicitud === EstadoSolicitud.PENDIENTE;
  }

  get estaAprobada(): boolean {
    return this.props.estadoSolicitud === EstadoSolicitud.APROBADA;
  }

  get estaRechazada(): boolean {
    return this.props.estadoSolicitud === EstadoSolicitud.RECHAZADA;
  }

  get estaExpirada(): boolean {
    return this.props.estadoSolicitud === EstadoSolicitud.EXPIRADA;
  }
}