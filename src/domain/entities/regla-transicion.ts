import { EstadoDeuda } from '../enums/estado-deuda';

export interface ReglaTransicionProps {
  id?: number;
  tipoGestionId: number;
  estadoOrigen: EstadoDeuda | null; // null significa cualquier estado
  estadoDestino: EstadoDeuda | null; // null significa mismo estado
  requiereAutorizacion: boolean;
  mensajeUi?: string;
  validacionAdicional?: any;
  activo: boolean;
}

export class ReglaTransicion {
  private constructor(private props: ReglaTransicionProps) {}

  public static crear(props: Omit<ReglaTransicionProps, 'activo'>): ReglaTransicion {
    const defaultProps: Partial<ReglaTransicionProps> = {
      activo: true,
    };
    const mergedProps: ReglaTransicionProps = {
      ...defaultProps,
      ...props,
    } as ReglaTransicionProps;
    return new ReglaTransicion(mergedProps);
  }

  public static reconstruir(props: ReglaTransicionProps): ReglaTransicion {
    return new ReglaTransicion(props);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get tipoGestionId(): number {
    return this.props.tipoGestionId;
  }

  get estadoOrigen(): EstadoDeuda | null {
    return this.props.estadoOrigen;
  }

  get estadoDestino(): EstadoDeuda | null {
    return this.props.estadoDestino;
  }

  get requiereAutorizacion(): boolean {
    return this.props.requiereAutorizacion;
  }

  get mensajeUi(): string | undefined {
    return this.props.mensajeUi;
  }

  get validacionAdicional(): any | undefined {
    return this.props.validacionAdicional;
  }

  get activo(): boolean {
    return this.props.activo;
  }

  aplicaPara(tipoGestionId: number, estadoActual: EstadoDeuda): boolean {
    if (this.tipoGestionId !== tipoGestionId) return false;
    if (!this.activo) return false;
    if (this.estadoOrigen === null) return true; // cualquier estado
    return this.estadoOrigen === estadoActual;
  }

  obtenerEstadoDestino(estadoActual: EstadoDeuda): EstadoDeuda | null {
    if (this.estadoDestino === null) return estadoActual; // mismo estado
    return this.estadoDestino;
  }
}
