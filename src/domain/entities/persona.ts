import { EstadoVerificacion } from '../enums/estado-verificacion';
import { Telefono } from './telefono';
import { Email } from './email';
import { ReferenciaPersonal } from './referencia-personal';
import { ReferenciaLaboral } from './referencia-laboral';

export interface PersonaProps {
  id?: number;
  nombres: string;
  apellidos: string;
  documento: string;
  funcionarioPublico: EstadoVerificacion;
  fechaModFuncionario: Date | null;
  jubilado: EstadoVerificacion;
  fechaModJubilado: Date | null;
  ipsActivo: EstadoVerificacion;
  fechaModIps: Date | null;
  datosVarios: any | null;
  telefonos: Telefono[];
  emails: Email[];
  referenciasPersonales: ReferenciaPersonal[];
  referenciasLaborales: ReferenciaLaboral[];
}

export class Persona {
  private constructor(private props: PersonaProps) {}

  public static crear(props: Omit<PersonaProps, 'funcionarioPublico' | 'fechaModFuncionario' | 'jubilado' | 'fechaModJubilado' | 'ipsActivo' | 'fechaModIps' | 'datosVarios' | 'telefonos' | 'emails' | 'referenciasPersonales' | 'referenciasLaborales'> & {
    funcionarioPublico?: EstadoVerificacion;
    jubilado?: EstadoVerificacion;
    ipsActivo?: EstadoVerificacion;
    datosVarios?: any;
    telefonos?: Telefono[];
    emails?: Email[];
    referenciasPersonales?: ReferenciaPersonal[];
    referenciasLaborales?: ReferenciaLaboral[];
  }): Persona {
    const defaultProps: Partial<PersonaProps> = {
      funcionarioPublico: EstadoVerificacion.PENDIENTE,
      fechaModFuncionario: null,
      jubilado: EstadoVerificacion.PENDIENTE,
      fechaModJubilado: null,
      ipsActivo: EstadoVerificacion.PENDIENTE,
      fechaModIps: null,
      datosVarios: null,
      telefonos: [],
      emails: [],
      referenciasPersonales: [],
      referenciasLaborales: [],
    };
    const mergedProps: PersonaProps = {
      ...defaultProps,
      ...props,
    } as PersonaProps;
    
    // Validaciones
    if (!mergedProps.documento.trim()) {
      throw new Error('Documento es requerido');
    }
    
    return new Persona(mergedProps);
  }

  public static reconstruir(props: PersonaProps): Persona {
    return new Persona(props);
  }

  // Métodos de negocio
  actualizarFuncionarioPublico(estado: EstadoVerificacion, fechaMod: Date = new Date()): void {
    this.props.funcionarioPublico = estado;
    this.props.fechaModFuncionario = fechaMod;
  }

  actualizarJubilado(estado: EstadoVerificacion, fechaMod: Date = new Date()): void {
    this.props.jubilado = estado;
    this.props.fechaModJubilado = fechaMod;
  }

  actualizarIpsActivo(estado: EstadoVerificacion, fechaMod: Date = new Date()): void {
    this.props.ipsActivo = estado;
    this.props.fechaModIps = fechaMod;
  }

  agregarTelefono(telefono: Telefono): void {
    this.props.telefonos.push(telefono);
  }

  agregarEmail(email: Email): void {
    this.props.emails.push(email);
  }

  agregarReferenciaPersonal(referencia: ReferenciaPersonal): void {
    this.props.referenciasPersonales.push(referencia);
  }

  agregarReferenciaLaboral(referencia: ReferenciaLaboral): void {
    this.props.referenciasLaborales.push(referencia);
  }

  // Getters
  get id(): number | undefined {
    return this.props.id;
  }

  get nombres(): string {
    return this.props.nombres;
  }

  get apellidos(): string {
    return this.props.apellidos;
  }

  get documento(): string {
    return this.props.documento;
  }

  get funcionarioPublico(): EstadoVerificacion {
    return this.props.funcionarioPublico;
  }

  get fechaModFuncionario(): Date | null {
    return this.props.fechaModFuncionario;
  }

  get jubilado(): EstadoVerificacion {
    return this.props.jubilado;
  }

  get fechaModJubilado(): Date | null {
    return this.props.fechaModJubilado;
  }

  get ipsActivo(): EstadoVerificacion {
    return this.props.ipsActivo;
  }

  get fechaModIps(): Date | null {
    return this.props.fechaModIps;
  }

  get datosVarios(): any | null {
    return this.props.datosVarios;
  }

  get telefonos(): Telefono[] {
    return this.props.telefonos;
  }

  get emails(): Email[] {
    return this.props.emails;
  }

  get referenciasPersonales(): ReferenciaPersonal[] {
    return this.props.referenciasPersonales;
  }

  get referenciasLaborales(): ReferenciaLaboral[] {
    return this.props.referenciasLaborales;
  }
}
