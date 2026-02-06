import { EstadoCuota } from '../enums/estado-cuota';

export interface CuotaProps {
  id?: number;
  numeroCuota: number;
  fechaVencimiento: Date;
  capitalOriginal: number;
  saldoCapital: number;
  interesMoratorioAcumulado: number;
  interesPunitorioAcumulado: number;
  estadoCuota: EstadoCuota;
  fechaUltimoPago: Date | null;
  montoCuota: number | null;
}

export class Cuota {
  private constructor(private props: CuotaProps) {}

  public static crear(props: Omit<CuotaProps, 'saldoCapital' | 'interesMoratorioAcumulado' | 'interesPunitorioAcumulado' | 'estadoCuota' | 'fechaUltimoPago'>): Cuota {
    const defaultProps: Partial<CuotaProps> = {
      saldoCapital: props.capitalOriginal,
      interesMoratorioAcumulado: 0,
      interesPunitorioAcumulado: 0,
      estadoCuota: EstadoCuota.PENDIENTE,
      fechaUltimoPago: null,
    };
    const mergedProps: CuotaProps = {
      ...defaultProps,
      ...props,
    } as CuotaProps;
    return new Cuota(mergedProps);
  }

  public static reconstruir(props: CuotaProps): Cuota {
    return new Cuota(props);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get numeroCuota(): number {
    return this.props.numeroCuota;
  }

  get fechaVencimiento(): Date {
    return this.props.fechaVencimiento;
  }

  get capitalOriginal(): number {
    return this.props.capitalOriginal;
  }

  get saldoCapital(): number {
    return this.props.saldoCapital;
  }

  get interesMoratorioAcumulado(): number {
    return this.props.interesMoratorioAcumulado;
  }

  get interesPunitorioAcumulado(): number {
    return this.props.interesPunitorioAcumulado;
  }

  get estadoCuota(): EstadoCuota {
    return this.props.estadoCuota;
  }

  get fechaUltimoPago(): Date | null {
    return this.props.fechaUltimoPago;
  }

  get montoCuota(): number | null {
    return this.props.montoCuota;
  }
}
