import { EstadoContacto } from '../enums/estado-contacto';

export interface ReferenciaLaboralProps {
  id?: number;
  personaId: number;
  nombre: string;
  empresa?: string;
  telefono: string;
  estado: EstadoContacto;
}

export class ReferenciaLaboral {
  private constructor(private props: ReferenciaLaboralProps) {}

  public static crear(props: Omit<ReferenciaLaboralProps, 'estado'> & {
    estado?: EstadoContacto;
  }): ReferenciaLaboral {
    const defaultProps: Partial<ReferenciaLaboralProps> = {
      estado: EstadoContacto.PENDIENTE_DE_VERIFICACION,
    };
    const mergedProps: ReferenciaLaboralProps = {
      ...defaultProps,
      ...props,
    } as ReferenciaLaboralProps;
    
    if (!mergedProps.nombre.trim()) {
      throw new Error('Nombre es requerido');
    }
    if (!mergedProps.telefono.trim()) {
      throw new Error('Teléfono es requerido');
    }
    
    return new ReferenciaLaboral(mergedProps);
  }

  public static reconstruir(props: ReferenciaLaboralProps): ReferenciaLaboral {
    return new ReferenciaLaboral(props);
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

  get empresa(): string | undefined {
    return this.props.empresa;
  }

  get telefono(): string {
    return this.props.telefono;
  }

  get estado(): EstadoContacto {
    return this.props.estado;
  }
}
