import { EstadoDeuda } from '../enums/estado-deuda';
import { Cuota } from './cuota';
import { EstadoCuota } from '../enums/estado-cuota';

export interface DeudaProps {
  id?: number;
  acreedor: string;
  concepto: string;
  estadoActual: EstadoDeuda;
  gestorAsignadoId: number | null;
  diasMora: number;
  diasGestion: number;
  saldoCapitalTotal: number;
  deudaTotal: number;
  gastosCobranza: number;
  interesMoratorio: number;
  interesPunitorio: number;
  fechaUltimoPago: Date | null;
  montoCuota: number | null;
  fechaAsignacionGestor: Date | null;
  tasaInteresMoratorio: number | null;
  tasaInteresPunitorio: number | null;
  fechaExpiracionAcuerdo: Date | null;
  cuotas: Cuota[];
}

export class Deuda {
  private constructor(private props: DeudaProps) {}

  public static crear(props: Omit<DeudaProps, 'estadoActual' | 'diasMora' | 'diasGestion' | 'saldoCapitalTotal' | 'deudaTotal' | 'gastosCobranza' | 'interesMoratorio' | 'interesPunitorio' | 'fechaUltimoPago' | 'fechaAsignacionGestor' | 'tasaInteresMoratorio' | 'tasaInteresPunitorio' | 'fechaExpiracionAcuerdo' | 'cuotas'> & {
    cuotas?: Cuota[];
  }): Deuda {
    const defaultProps: Partial<DeudaProps> = {
      estadoActual: EstadoDeuda.NUEVO,
      diasMora: 0,
      diasGestion: 0,
      saldoCapitalTotal: 0,
      deudaTotal: 0,
      gastosCobranza: 0,
      interesMoratorio: 0,
      interesPunitorio: 0,
      fechaUltimoPago: null,
      fechaAsignacionGestor: null,
      tasaInteresMoratorio: null,
      tasaInteresPunitorio: null,
      fechaExpiracionAcuerdo: null,
      cuotas: [],
    };
    const mergedProps: DeudaProps = {
      ...defaultProps,
      ...props,
    } as DeudaProps;
    const deuda = new Deuda(mergedProps);
    deuda.actualizarTotales();
    return deuda;
  }

  public static reconstruir(props: DeudaProps): Deuda {
    return new Deuda(props);
  }

  cambiarEstado(nuevoEstado: EstadoDeuda): void {
    // Validar transición permitida (pendiente de implementar)
    this.props.estadoActual = nuevoEstado;
  }

  asignarGestor(gestorId: number, fechaAsignacion: Date = new Date()): void {
    this.props.gestorAsignadoId = gestorId;
    this.props.fechaAsignacionGestor = fechaAsignacion;
  }

  calcularDiasMora(fechaReferencia: Date): number {
    const cuotasVencidas = this.cuotas.filter(cuota => 
      cuota.estadoCuota === EstadoCuota.VENCIDA ||
      (cuota.estadoCuota === EstadoCuota.PENDIENTE && cuota.fechaVencimiento < fechaReferencia)
    );
    if (cuotasVencidas.length === 0) return 0;
    const cuotaMasAntigua = cuotasVencidas.reduce((antigua, actual) => 
      antigua.fechaVencimiento < actual.fechaVencimiento ? antigua : actual
    );
    const diffMs = fechaReferencia.getTime() - cuotaMasAntigua.fechaVencimiento.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  calcularDiasGestion(fechaReferencia: Date): number {
    if (!this.fechaAsignacionGestor) return 0;
    const diffMs = fechaReferencia.getTime() - this.fechaAsignacionGestor.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  actualizarTotales(): void {
    const cuotasPendientes = this.cuotas.filter(cuota => 
      cuota.estadoCuota === EstadoCuota.PENDIENTE || cuota.estadoCuota === EstadoCuota.VENCIDA
    );
    const saldoCapital = cuotasPendientes.reduce((sum, cuota) => sum + cuota.saldoCapital, 0);
    const intereses = cuotasPendientes.reduce((sum, cuota) => 
      sum + cuota.interesMoratorioAcumulado + cuota.interesPunitorioAcumulado, 0);
    
    this.props.saldoCapitalTotal = saldoCapital;
    this.props.deudaTotal = saldoCapital + intereses + this.gastosCobranza;
  }

  actualizarDiasMoraYGestion(fechaReferencia: Date): void {
    this.props.diasMora = this.calcularDiasMora(fechaReferencia);
    this.props.diasGestion = this.calcularDiasGestion(fechaReferencia);
  }

  estaAcuerdoExpirado(fechaReferencia: Date): boolean {
    if (this.estadoActual !== EstadoDeuda.CON_ACUERDO || !this.fechaExpiracionAcuerdo) {
      return false;
    }
    return fechaReferencia > this.fechaExpiracionAcuerdo;
  }

  esEstadoFinal(): boolean {
    const estadosFinales = [
      EstadoDeuda.CANCELADA,
      EstadoDeuda.INCOBRABLE,
      EstadoDeuda.JUDICIALIZADA,
      EstadoDeuda.FALLECIDO,
    ];
    return estadosFinales.includes(this.estadoActual);
  }

  get id(): number | undefined {
    return this.props.id;
  }

  get acreedor(): string {
    return this.props.acreedor;
  }

  get concepto(): string {
    return this.props.concepto;
  }

  get estadoActual(): EstadoDeuda {
    return this.props.estadoActual;
  }

  get gestorAsignadoId(): number | null {
    return this.props.gestorAsignadoId;
  }

  get diasMora(): number {
    return this.props.diasMora;
  }

  get diasGestion(): number {
    return this.props.diasGestion;
  }

  get saldoCapitalTotal(): number {
    return this.props.saldoCapitalTotal;
  }

  get deudaTotal(): number {
    return this.props.deudaTotal;
  }

  get gastosCobranza(): number {
    return this.props.gastosCobranza;
  }

  get interesMoratorio(): number {
    return this.props.interesMoratorio;
  }

  get interesPunitorio(): number {
    return this.props.interesPunitorio;
  }

  get fechaUltimoPago(): Date | null {
    return this.props.fechaUltimoPago;
  }

  get montoCuota(): number | null {
    return this.props.montoCuota;
  }

  get fechaAsignacionGestor(): Date | null {
    return this.props.fechaAsignacionGestor;
  }

  get tasaInteresMoratorio(): number | null {
    return this.props.tasaInteresMoratorio;
  }

  get tasaInteresPunitorio(): number | null {
    return this.props.tasaInteresPunitorio;
  }

  get fechaExpiracionAcuerdo(): Date | null {
    return this.props.fechaExpiracionAcuerdo;
  }

  get cuotas(): Cuota[] {
    return this.props.cuotas;
  }
}
