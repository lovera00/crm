import { ReglaTransicion } from '../entities/regla-transicion';

export interface ReglaTransicionRepository {
  buscarPorTipoGestion(tipoGestionId: number): Promise<ReglaTransicion[]>;
}
