export interface SeguimientoProps {
  id?: number;
  gestorId: number;
  personaId: number;
  tipoGestionId: number;
  fechaHora: Date;
  observacion?: string;
  requiereSeguimiento: boolean;
  fechaProximoSeguimiento?: Date;
}

export class Seguimiento {
  private constructor(private props: SeguimientoProps) {}

  public static crear(props: Omit<SeguimientoProps, 'fechaHora' | 'requiereSeguimiento'>): Seguimiento {
    const defaultProps: Partial<SeguimientoProps> = {
      fechaHora: new Date(),
      requiereSeguimiento: false,
    };
    const mergedProps: SeguimientoProps = {
      ...defaultProps,
      ...props,
    } as SeguimientoProps;
    return new Seguimiento(mergedProps);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get gestorId(): number {
    return this.props.gestorId;
  }

  get personaId(): number {
    return this.props.personaId;
  }

  get tipoGestionId(): number {
    return this.props.tipoGestionId;
  }

  get fechaHora(): Date {
    return this.props.fechaHora;
  }

  get observacion(): string | undefined {
    return this.props.observacion;
  }

  get requiereSeguimiento(): boolean {
    return this.props.requiereSeguimiento;
  }

  get fechaProximoSeguimiento(): Date | undefined {
    return this.props.fechaProximoSeguimiento;
  }
}
