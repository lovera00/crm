import { EstadoContacto } from '../enums/estado-contacto';

export interface TelefonoProps {
  id?: number;
  personaId: number;
  numero: string;
  estado: EstadoContacto;
  fechaModificacion?: Date;
}

export class Telefono {
  private constructor(private props: TelefonoProps) {}

  public static crear(props: Omit<TelefonoProps, 'estado' | 'fechaModificacion'> & {
    estado?: EstadoContacto;
  }): Telefono {
    const defaultProps: Partial<TelefonoProps> = {
      estado: EstadoContacto.PENDIENTE_DE_VERIFICACION,
    };
    const mergedProps: TelefonoProps = {
      ...defaultProps,
      ...props,
    } as TelefonoProps;
    
    if (!mergedProps.numero.trim()) {
      throw new Error('Número de teléfono es requerido');
    }
    
    return new Telefono(mergedProps);
  }

  public static reconstruir(props: TelefonoProps): Telefono {
    return new Telefono(props);
  }

  cambiarEstado(nuevoEstado: EstadoContacto, fechaModificacion: Date = new Date()): void {
    this.props.estado = nuevoEstado;
    this.props.fechaModificacion = fechaModificacion;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get personaId(): number {
    return this.props.personaId;
  }

  get numero(): string {
    return this.props.numero;
  }

  get estado(): EstadoContacto {
    return this.props.estado;
  }

  get fechaModificacion(): Date | undefined {
    return this.props.fechaModificacion;
  }
}
