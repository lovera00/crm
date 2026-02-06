import { Seguimiento } from '../entities/seguimiento';

export interface SeguimientoRepository {
  guardar(seguimiento: Seguimiento): Promise<void>;
}
