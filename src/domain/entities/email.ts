import { EstadoContacto } from '../enums/estado-contacto';

export interface EmailProps {
  id?: number;
  personaId: number;
  email: string;
  estado: EstadoContacto;
  fechaModificacion?: Date;
}

export class Email {
  private constructor(private props: EmailProps) {}

  public static crear(props: Omit<EmailProps, 'estado' | 'fechaModificacion'> & {
    estado?: EstadoContacto;
  }): Email {
    const defaultProps: Partial<EmailProps> = {
      estado: EstadoContacto.PENDIENTE_DE_VERIFICACION,
    };
    const mergedProps: EmailProps = {
      ...defaultProps,
      ...props,
    } as EmailProps;
    
    if (!mergedProps.email.trim()) {
      throw new Error('Email es requerido');
    }
    
    // Validación simple de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mergedProps.email)) {
      throw new Error('Email inválido');
    }
    
    return new Email(mergedProps);
  }

  public static reconstruir(props: EmailProps): Email {
    return new Email(props);
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

  get email(): string {
    return this.props.email;
  }

  get estado(): EstadoContacto {
    return this.props.estado;
  }

  get fechaModificacion(): Date | undefined {
    return this.props.fechaModificacion;
  }
}
