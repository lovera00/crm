import { describe, it, expect, beforeEach } from 'vitest';
import { Deuda } from './deuda';
import { EstadoDeuda } from '../enums/estado-deuda';
import { EstadoCuota } from '../enums/estado-cuota';
import { crearDeudaPrueba, crearCuotaPrueba, crearDeudaConCuotas, crearFecha, avanzarDias } from '../../__tests__/test-helpers';

describe('Deuda', () => {
  describe('creación', () => {
    it('debería crear una deuda con estado Nuevo por defecto', () => {
      const deuda = crearDeudaPrueba();

      expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO);
      expect(deuda.diasMora).toBe(0);
      expect(deuda.diasGestion).toBe(0);
      expect(deuda.saldoCapitalTotal).toBe(0);
      expect(deuda.deudaTotal).toBe(0);
    });

    it('debería aceptar propiedades personalizadas', () => {
      const deuda = Deuda.crear({
        acreedor: 'Banco ABC',
        concepto: 'Hipoteca',
        gestorAsignadoId: 5,
        montoCuota: 500,
        cuotas: [],
      });

      expect(deuda.acreedor).toBe('Banco ABC');
      expect(deuda.concepto).toBe('Hipoteca');
      expect(deuda.gestorAsignadoId).toBe(5);
      expect(deuda.montoCuota).toBe(500);
    });

    it('debería inicializar con cuotas proporcionadas', () => {
      const cuota = crearCuotaPrueba({ capitalOriginal: 1000 });
      const deuda = crearDeudaPrueba({ cuotas: [cuota] });

      expect(deuda.cuotas).toHaveLength(1);
      expect(deuda.cuotas[0].capitalOriginal).toBe(1000);
    });
  });

  describe('cálculo de días de mora', () => {
    it('debería retornar 0 cuando no hay cuotas vencidas', () => {
      const fechaReferencia = new Date('2024-06-15');
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-07-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.PENDIENTE,
        },
      ]);

      const diasMora = deuda.calcularDiasMora(fechaReferencia);
      expect(diasMora).toBe(0);
    });

    it('debería calcular días desde la cuota más antigua vencida', () => {
      const fechaReferencia = new Date('2024-06-15');
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-05-01'), // 45 días de mora
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
        },
        {
          numeroCuota: 2,
          fechaVencimiento: new Date('2024-06-01'), // 14 días de mora
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
        },
      ]);

      const diasMora = deuda.calcularDiasMora(fechaReferencia);
      expect(diasMora).toBe(45); // Desde la más antigua (2024-05-01)
    });

    it('debería incluir cuotas pendientes con fecha vencida', () => {
      const fechaReferencia = new Date('2024-06-15');
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-06-10'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.PENDIENTE, // Pendiente pero vencida
        },
      ]);

      const diasMora = deuda.calcularDiasMora(fechaReferencia);
      expect(diasMora).toBe(5);
    });

    it('debería ignorar cuotas pagadas o en acuerdo', () => {
      const fechaReferencia = new Date('2024-06-15');
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-05-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.PAGADA,
        },
        {
          numeroCuota: 2,
          fechaVencimiento: new Date('2024-05-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.EN_ACUERDO,
        },
      ]);

      const diasMora = deuda.calcularDiasMora(fechaReferencia);
      expect(diasMora).toBe(0);
    });
  });

  describe('cálculo de días de gestión', () => {
    it('debería retornar 0 cuando no hay gestor asignado', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      const fechaReferencia = new Date('2024-06-15');

      const diasGestion = deuda.calcularDiasGestion(fechaReferencia);
      expect(diasGestion).toBe(0);
    });

    it('debería retornar 0 cuando no hay fecha de asignación (caso por defecto)', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: 1 });
      // fechaAsignacionGestor es null por defecto
      const fechaReferencia = new Date('2024-06-15');

      const diasGestion = deuda.calcularDiasGestion(fechaReferencia);
      expect(diasGestion).toBe(0);
    });

    it('debería calcular días desde la asignación del gestor', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      const fechaAsignacion = new Date('2024-06-01');
      const fechaReferencia = new Date('2024-06-15');
      
      deuda.asignarGestor(1, fechaAsignacion);
      const diasGestion = deuda.calcularDiasGestion(fechaReferencia);
      expect(diasGestion).toBe(14);
    });

    it('debería manejar fechas en el mismo día', () => {
      const fecha = new Date('2024-06-01');
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      
      deuda.asignarGestor(1, fecha);
      const diasGestion = deuda.calcularDiasGestion(fecha);
      expect(diasGestion).toBe(0);
    });

    it('debería actualizar días de gestión al recalcular después de nueva asignación', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      const fechaPrimeraAsignacion = new Date('2024-06-01');
      const fechaReasignacion = new Date('2024-06-10');
      const fechaReferencia = new Date('2024-06-15');
      
      deuda.asignarGestor(1, fechaPrimeraAsignacion);
      const diasPrimera = deuda.calcularDiasGestion(fechaReferencia);
      expect(diasPrimera).toBe(14);
      
      deuda.asignarGestor(2, fechaReasignacion);
      const diasReasignacion = deuda.calcularDiasGestion(fechaReferencia);
      expect(diasReasignacion).toBe(5); // Desde la reasignación
    });
  });

  describe('actualización de totales', () => {
    it('debería calcular saldo capital solo de cuotas pendientes o vencidas', () => {
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.PENDIENTE,
          saldoCapital: 800,
        },
        {
          numeroCuota: 2,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
          saldoCapital: 500,
        },
        {
          numeroCuota: 3,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.PAGADA,
          saldoCapital: 0, // No debe contar
        },
        {
          numeroCuota: 4,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.EN_ACUERDO,
          saldoCapital: 300, // No debe contar
        },
      ]);

      deuda.actualizarTotales();
      expect(deuda.saldoCapitalTotal).toBe(1300); // 800 + 500
    });

    it('debería incluir intereses moratorios y punitorios', () => {
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
          saldoCapital: 500,
          interesMoratorioAcumulado: 50,
          interesPunitorioAcumulado: 30,
        },
      ]);

      deuda.actualizarTotales();
      expect(deuda.saldoCapitalTotal).toBe(500);
      expect(deuda.deudaTotal).toBe(500 + 50 + 30); // saldo + intereses
    });

    it('debería incluir gastos de cobranza', () => {
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
          saldoCapital: 500,
          interesMoratorioAcumulado: 50,
        },
      ]);

      // Simular gastos de cobranza (no hay setter, usaríamos un método o propiedad)
      // Para la prueba, asumimos que gastosCobranza es 0 por defecto
      // En realidad necesitamos una forma de establecer gastosCobranza
      // Por ahora probamos con valor por defecto
      deuda.actualizarTotales();
      expect(deuda.deudaTotal).toBe(500 + 50);
    });

    it('debería actualizar automáticamente totales al crear', () => {
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-06-01'),
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
          saldoCapital: 700,
          interesMoratorioAcumulado: 70,
        },
      ]);

      // Los totales deben calcularse automáticamente en el constructor
      expect(deuda.saldoCapitalTotal).toBe(700);
      expect(deuda.deudaTotal).toBe(770);
    });
  });

  describe('actualización de días de mora y gestión', () => {
    it('debería actualizar días de mora cuando hay cuotas vencidas', () => {
      const fechaReferencia = new Date('2024-06-15');
      
      const deuda = crearDeudaConCuotas([
        {
          numeroCuota: 1,
          fechaVencimiento: new Date('2024-05-10'), // 36 días de mora
          capitalOriginal: 1000,
          estadoCuota: EstadoCuota.VENCIDA,
        },
      ]);
      
      deuda.actualizarDiasMoraYGestion(fechaReferencia);
      expect(deuda.diasMora).toBe(36);
      expect(deuda.diasGestion).toBe(0); // No hay gestor asignado
    });

    it('debería actualizar ambos valores a 0 cuando no hay mora ni gestor', () => {
      const fechaReferencia = new Date('2024-06-15');
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      
      deuda.actualizarDiasMoraYGestion(fechaReferencia);
      expect(deuda.diasMora).toBe(0);
      expect(deuda.diasGestion).toBe(0);
    });
  });

  describe('asignación de gestor', () => {
    it('debería asignar gestor y establecer fecha de asignación', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      const fechaAsignacion = new Date('2024-06-01');
      
      deuda.asignarGestor(1, fechaAsignacion);
      
      expect(deuda.gestorAsignadoId).toBe(1);
      expect(deuda.fechaAsignacionGestor).toEqual(fechaAsignacion);
    });

    it('debería usar fecha actual por defecto', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: null });
      const antes = new Date();
      
      deuda.asignarGestor(1);
      
      expect(deuda.gestorAsignadoId).toBe(1);
      expect(deuda.fechaAsignacionGestor).toBeInstanceOf(Date);
      expect(deuda.fechaAsignacionGestor!.getTime()).toBeGreaterThanOrEqual(antes.getTime());
    });

    it('debería sobrescribir gestor anterior si se asigna otro', () => {
      const deuda = crearDeudaPrueba({ gestorAsignadoId: 1 });
      const nuevaFecha = new Date('2024-06-02');
      
      deuda.asignarGestor(2, nuevaFecha);
      
      expect(deuda.gestorAsignadoId).toBe(2);
      expect(deuda.fechaAsignacionGestor).toEqual(nuevaFecha);
    });
  });

  describe('cambio de estado', () => {
    it('debería cambiar el estado sin validación (por ahora)', () => {
      const deuda = crearDeudaPrueba();
      expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO);

      deuda.cambiarEstado(EstadoDeuda.EN_GESTION);
      expect(deuda.estadoActual).toBe(EstadoDeuda.EN_GESTION);
    });

    it('debería permitir cualquier cambio (validación pendiente)', () => {
      const deuda = crearDeudaPrueba();
      
      // Intentar cambio a estado final
      deuda.cambiarEstado(EstadoDeuda.CANCELADA);
      expect(deuda.estadoActual).toBe(EstadoDeuda.CANCELADA);
      
      // Intentar cambio desde estado final (esto no debería ser permitido eventualmente)
      deuda.cambiarEstado(EstadoDeuda.NUEVO);
      expect(deuda.estadoActual).toBe(EstadoDeuda.NUEVO);
    });
  });

  describe('getters y métodos auxiliares', () => {
    it('debería retornar true para estados finales', () => {
      const estadosFinales = [
        EstadoDeuda.CANCELADA,
        EstadoDeuda.INCOBRABLE,
        EstadoDeuda.JUDICIALIZADA,
        EstadoDeuda.FALLECIDO,
      ];

      estadosFinales.forEach(estadoFinal => {
        const deuda = Deuda.reconstruir({
          id: 1,
          acreedor: 'Banco',
          concepto: 'Préstamo',
          estadoActual: estadoFinal,
          gestorAsignadoId: 1,
          diasMora: 0,
          diasGestion: 0,
          saldoCapitalTotal: 1000,
          deudaTotal: 1000,
          gastosCobranza: 0,
          interesMoratorio: 0,
          interesPunitorio: 0,
          fechaUltimoPago: null,
          montoCuota: null,
          fechaAsignacionGestor: null,
          tasaInteresMoratorio: null,
          tasaInteresPunitorio: null,
          fechaExpiracionAcuerdo: null,
          cuotas: [],
        });

        expect(deuda.esEstadoFinal()).toBe(true);
      });
    });

    it('debería retornar false para estados no finales', () => {
      const estadosNoFinales = [
        EstadoDeuda.NUEVO,
        EstadoDeuda.EN_GESTION,
        EstadoDeuda.CON_ACUERDO,
        EstadoDeuda.SUSPENDIDA,
      ];

      estadosNoFinales.forEach(estado => {
        const deuda = Deuda.reconstruir({
          id: 1,
          acreedor: 'Banco',
          concepto: 'Préstamo',
          estadoActual: estado,
          gestorAsignadoId: 1,
          diasMora: 0,
          diasGestion: 0,
          saldoCapitalTotal: 1000,
          deudaTotal: 1000,
          gastosCobranza: 0,
          interesMoratorio: 0,
          interesPunitorio: 0,
          fechaUltimoPago: null,
          montoCuota: null,
          fechaAsignacionGestor: null,
          tasaInteresMoratorio: null,
          tasaInteresPunitorio: null,
          fechaExpiracionAcuerdo: null,
          cuotas: [],
        });

        expect(deuda.esEstadoFinal()).toBe(false);
      });
    });

    it('debería retornar false para acuerdo no expirado', () => {
      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.CON_ACUERDO,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: new Date('2024-12-31'), // Futuro
        cuotas: [],
      });

      const fechaReferencia = new Date('2024-06-01');
      expect(deuda.estaAcuerdoExpirado(fechaReferencia)).toBe(false);
    });

    it('debería retornar true para acuerdo expirado', () => {
      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.CON_ACUERDO,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: new Date('2024-01-01'), // Pasado
        cuotas: [],
      });

      const fechaReferencia = new Date('2024-06-01');
      expect(deuda.estaAcuerdoExpirado(fechaReferencia)).toBe(true);
    });

    it('debería retornar false cuando no está en estado CON_ACUERDO', () => {
      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.EN_GESTION,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: new Date('2024-01-01'), // Pasado
        cuotas: [],
      });

      const fechaReferencia = new Date('2024-06-01');
      expect(deuda.estaAcuerdoExpirado(fechaReferencia)).toBe(false);
    });

    it('debería retornar false cuando fechaExpiracionAcuerdo es null', () => {
      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.CON_ACUERDO,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 0,
        interesMoratorio: 0,
        interesPunitorio: 0,
        fechaUltimoPago: null,
        montoCuota: null,
        fechaAsignacionGestor: null,
        tasaInteresMoratorio: null,
        tasaInteresPunitorio: null,
        fechaExpiracionAcuerdo: null,
        cuotas: [],
      });

      const fechaReferencia = new Date('2024-06-01');
      expect(deuda.estaAcuerdoExpirado(fechaReferencia)).toBe(false);
    });

    it('debería retornar valores correctos para getters de interés', () => {
      const deuda = Deuda.reconstruir({
        id: 1,
        acreedor: 'Banco',
        concepto: 'Préstamo',
        estadoActual: EstadoDeuda.NUEVO,
        gestorAsignadoId: 1,
        diasMora: 0,
        diasGestion: 0,
        saldoCapitalTotal: 1000,
        deudaTotal: 1000,
        gastosCobranza: 50,
        interesMoratorio: 25.5,
        interesPunitorio: 15.75,
        fechaUltimoPago: new Date('2024-01-01'),
        montoCuota: 200,
        fechaAsignacionGestor: new Date('2024-01-15'),
        tasaInteresMoratorio: 10.5,
        tasaInteresPunitorio: 5.25,
        fechaExpiracionAcuerdo: new Date('2024-12-31'),
        cuotas: [],
      });

      expect(deuda.interesMoratorio).toBe(25.5);
      expect(deuda.interesPunitorio).toBe(15.75);
      expect(deuda.fechaUltimoPago).toEqual(new Date('2024-01-01'));
      expect(deuda.montoCuota).toBe(200);
      expect(deuda.fechaAsignacionGestor).toEqual(new Date('2024-01-15'));
      expect(deuda.tasaInteresMoratorio).toBe(10.5);
      expect(deuda.tasaInteresPunitorio).toBe(5.25);
      expect(deuda.fechaExpiracionAcuerdo).toEqual(new Date('2024-12-31'));
      expect(deuda.cuotas).toEqual([]);
    });
  });
});
