import { EstadoDeuda } from '../enums/estado-deuda';
import { TransicionEstadoRepository } from '../repositories/transicion-estado-repository';

export class ValidadorTransicionEstado {
  constructor(private transicionRepository: TransicionEstadoRepository) {}

  async validarTransicion(estadoOrigen: EstadoDeuda, estadoDestino: EstadoDeuda): Promise<{
    valida: boolean;
    requiereAutorizacion: boolean;
    descripcion?: string;
  }> {
    // Si el origen y destino son iguales, es válido (no hay cambio)
    if (estadoOrigen === estadoDestino) {
      return { valida: true, requiereAutorizacion: false };
    }

    const transicion = await this.transicionRepository.obtenerTransicion(estadoOrigen, estadoDestino);
    
    if (!transicion) {
      return { valida: false, requiereAutorizacion: false };
    }

    return {
      valida: true,
      requiereAutorizacion: transicion.requiereAutorizacion,
      descripcion: transicion.descripcion,
    };
  }

  async esTransicionValida(estadoOrigen: EstadoDeuda, estadoDestino: EstadoDeuda): Promise<boolean> {
    return (await this.validarTransicion(estadoOrigen, estadoDestino)).valida;
  }

  async obtenerTransicionesPermitidas(estadoOrigen: EstadoDeuda): Promise<Array<{
    estadoDestino: EstadoDeuda;
    requiereAutorizacion: boolean;
    descripcion?: string;
  }>> {
    const transiciones = await this.transicionRepository.obtenerTransicionesDesde(estadoOrigen);
    return transiciones.map(t => ({
      estadoDestino: t.estadoDestino,
      requiereAutorizacion: t.requiereAutorizacion,
      descripcion: t.descripcion,
    }));
  }
}