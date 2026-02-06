import { Deuda } from '../entities/deuda';

export interface DeudaRepository {
  buscarPorId(id: number): Promise<Deuda | null>;
  guardar(deuda: Deuda): Promise<void>;
  buscarPorGestor(gestorId: number): Promise<Deuda[]>;
}
