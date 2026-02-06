import { EstadoContacto } from '../enums/estado-contacto';

export interface ReferenciaPersonalProps {
  id?: number;
  personaId: number;
  nombre: string;
  parentesco: string;
  telefono: string;
  estado: EstadoContacto;
}

export class ReferenciaPersonal {
  private constructor(private props: ReferenciaPersonalProps) {}

  public static crear(props: Omit<ReferenciaPersonalProps, 'estado'> & {
    estado?: EstadoContacto;
  }): ReferenciaPersonal {
    const defaultProps: Partial<ReferenciaPersonalProps> = {
      estado: EstadoContacto.PENDIENTE_DE_VERIFICACION,
    };
    const mergedProps: ReferenciaPersonalProps = {
      ...defaultProps,
      ...props,
    } as ReferenciaPersonalProps;
    
    if (!mergedProps.nombre.trim()) {
      throw new Error('Nombre es requerido');
    }
    if (!mergedProps.parentesco.trim()) {
      throw new Error('Parentesco es requerido');
    }
    if (!mergedProps.telefono.trim()) {
      throw new Error('Teléfono es requerido');
    }
    
    return new ReferenciaPersonal(mergedProps);
  }

  public static reconstruir(props: ReferenciaPersonalProps): ReferenciaPersonal {
    return new ReferenciaPersonal(props);
  }

  cambiarEstado(nuevoEstado: EstadoContacto): void {
    this.props.estado = nuevoEstado;
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get personaId(): number {
    return this.props.personaId;
  }

  get nombre(): string {
    return this.props.nombre;
  }

  get parentesco(): string {
    return this.props.parentesco;
  }

  get telefono(): string {
    return this.props.telefono;
  }

  get estado(): EstadoContacto {
    return this.props.estado;
  }
}
