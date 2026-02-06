import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidadorTransicionEstado } from './validador-transicion-estado';
import { TransicionEstadoRepository } from '../repositories/transicion-estado-repository';
import { EstadoDeuda } from '../enums/estado-deuda';

describe('ValidadorTransicionEstado', () => {
  let transicionRepository: TransicionEstadoRepository;
  let validador: ValidadorTransicionEstado;

  beforeEach(() => {
    transicionRepository = {
      esTransicionValida: vi.fn(),
      obtenerTransicionesDesde: vi.fn(),
      obtenerTransicion: vi.fn(),
    };
    validador = new ValidadorTransicionEstado(transicionRepository);
  });

  describe('validarTransicion', () => {
    it('debería retornar válida cuando origen y destino son iguales', async () => {
      const resultado = await validador.validarTransicion(EstadoDeuda.NUEVO, EstadoDeuda.NUEVO);
      
      expect(resultado.valida).toBe(true);
      expect(resultado.requiereAutorizacion).toBe(false);
      expect(transicionRepository.obtenerTransicion).not.toHaveBeenCalled();
    });

    it('debería retornar inválida cuando no hay transición definida', async () => {
      vi.mocked(transicionRepository.obtenerTransicion).mockResolvedValue(null);

      const resultado = await validador.validarTransicion(EstadoDeuda.NUEVO, EstadoDeuda.EN_GESTION);
      
      expect(resultado.valida).toBe(false);
      expect(resultado.requiereAutorizacion).toBe(false);
      expect(transicionRepository.obtenerTransicion).toHaveBeenCalledWith(
        EstadoDeuda.NUEVO,
        EstadoDeuda.EN_GESTION
      );
    });

    it('debería retornar válida con requerimiento de autorización cuando la transición lo requiere', async () => {
      vi.mocked(transicionRepository.obtenerTransicion).mockResolvedValue({
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.JUDICIALIZADA,
        requiereAutorizacion: true,
        descripcion: 'Requiere autorización de supervisor',
      });

      const resultado = await validador.validarTransicion(EstadoDeuda.NUEVO, EstadoDeuda.JUDICIALIZADA);
      
      expect(resultado.valida).toBe(true);
      expect(resultado.requiereAutorizacion).toBe(true);
      expect(resultado.descripcion).toBe('Requiere autorización de supervisor');
    });

    it('debería retornar válida sin requerimiento de autorización cuando la transición no lo requiere', async () => {
      vi.mocked(transicionRepository.obtenerTransicion).mockResolvedValue({
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
        descripcion: 'Transición automática',
      });

      const resultado = await validador.validarTransicion(EstadoDeuda.NUEVO, EstadoDeuda.EN_GESTION);
      
      expect(resultado.valida).toBe(true);
      expect(resultado.requiereAutorizacion).toBe(false);
      expect(resultado.descripcion).toBe('Transición automática');
    });
  });

  describe('esTransicionValida', () => {
    it('debería retornar true cuando validarTransicion retorna válida', async () => {
      vi.mocked(transicionRepository.obtenerTransicion).mockResolvedValue({
        estadoOrigen: EstadoDeuda.NUEVO,
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
      });

      const esValida = await validador.esTransicionValida(EstadoDeuda.NUEVO, EstadoDeuda.EN_GESTION);
      expect(esValida).toBe(true);
    });

    it('debería retornar false cuando validarTransicion retorna inválida', async () => {
      vi.mocked(transicionRepository.obtenerTransicion).mockResolvedValue(null);

      const esValida = await validador.esTransicionValida(EstadoDeuda.NUEVO, EstadoDeuda.JUDICIALIZADA);
      expect(esValida).toBe(false);
    });
  });

  describe('obtenerTransicionesPermitidas', () => {
    it('debería retornar transiciones desde un estado origen', async () => {
      const transicionesMock = [
        {
          estadoOrigen: EstadoDeuda.NUEVO,
          estadoDestino: EstadoDeuda.EN_GESTION,
          requiereAutorizacion: false,
          descripcion: 'Iniciar gestión',
        },
        {
          estadoOrigen: EstadoDeuda.NUEVO,
          estadoDestino: EstadoDeuda.SUSPENDIDA,
          requiereAutorizacion: true,
          descripcion: 'Suspender deuda',
        },
      ];
      vi.mocked(transicionRepository.obtenerTransicionesDesde).mockResolvedValue(transicionesMock);

      const transiciones = await validador.obtenerTransicionesPermitidas(EstadoDeuda.NUEVO);
      
      expect(transiciones).toHaveLength(2);
      expect(transiciones[0]).toEqual({
        estadoDestino: EstadoDeuda.EN_GESTION,
        requiereAutorizacion: false,
        descripcion: 'Iniciar gestión',
      });
      expect(transiciones[1]).toEqual({
        estadoDestino: EstadoDeuda.SUSPENDIDA,
        requiereAutorizacion: true,
        descripcion: 'Suspender deuda',
      });
      expect(transicionRepository.obtenerTransicionesDesde).toHaveBeenCalledWith(EstadoDeuda.NUEVO);
    });

    it('debería retornar array vacío cuando no hay transiciones', async () => {
      vi.mocked(transicionRepository.obtenerTransicionesDesde).mockResolvedValue([]);

      const transiciones = await validador.obtenerTransicionesPermitidas(EstadoDeuda.CANCELADA);
      expect(transiciones).toHaveLength(0);
    });
  });
});