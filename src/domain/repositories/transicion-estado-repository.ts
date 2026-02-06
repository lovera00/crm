import { EstadoDeuda } from '../enums/estado-deuda';

export interface TransicionEstado {
  estadoOrigen: EstadoDeuda;
  estadoDestino: EstadoDeuda;
  requiereAutorizacion: boolean;
  descripcion?: string;
}

export interface TransicionEstadoRepository {
  esTransicionValida(estadoOrigen: EstadoDeuda, estadoDestino: EstadoDeuda): Promise<boolean>;
  obtenerTransicionesDesde(estadoOrigen: EstadoDeuda): Promise<TransicionEstado[]>;
  obtenerTransicion(estadoOrigen: EstadoDeuda, estadoDestino: EstadoDeuda): Promise<TransicionEstado | null>;
}