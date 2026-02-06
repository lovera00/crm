import { Deuda } from '../entities/deuda';
import { EstadoDeuda } from '../enums/estado-deuda';

export interface DeudaRepository {
  buscarPorId(id: number): Promise<Deuda | null>;
  guardar(deuda: Deuda): Promise<void>;
  buscarPorGestor(gestorId: number): Promise<Deuda[]>;
  obtenerDeudasParaActualizacionDiaria(): Promise<Deuda[]>;
  obtenerDeudasConEstado(estados: EstadoDeuda[]): Promise<Deuda[]>;
}
