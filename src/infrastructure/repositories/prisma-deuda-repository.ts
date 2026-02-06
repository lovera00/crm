import { Deuda } from '../../domain/entities/deuda';
import { DeudaRepository } from '../../domain/repositories/deuda-repository';
import { PrismaClient } from '../../generated/prisma';
import { EstadoDeuda } from '../../domain/enums/estado-deuda';

export class PrismaDeudaRepository implements DeudaRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<Deuda | null> {
    const deudaData = await this.prisma.deudaMaestra.findUnique({
      where: { id },
      include: { cuotas: true },
    });
    if (!deudaData) return null;

    // Mapear cuotas
    const cuotas = deudaData.cuotas.map(cuota => ({
      id: cuota.id,
      numeroCuota: cuota.numeroCuota,
      fechaVencimiento: cuota.fechaVencimiento,
      capitalOriginal: cuota.capitalOriginal,
      saldoCapital: cuota.saldoCapital,
      interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
      interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
      estadoCuota: cuota.estadoCuota,
      fechaUltimoPago: cuota.fechaUltimoPago,
      montoCuota: cuota.montoCuota,
    }));

    return Deuda.crear({
      id: deudaData.id,
      acreedor: deudaData.acreedor,
      concepto: deudaData.concepto,
      estadoActual: deudaData.estadoActual.nombre as EstadoDeuda,
      gestorAsignadoId: deudaData.gestorAsignadoId,
      diasMora: deudaData.diasMora,
      diasGestion: deudaData.diasGestion,
      saldoCapitalTotal: deudaData.saldoCapitalTotal,
      deudaTotal: deudaData.deudaTotal,
      gastosCobranza: deudaData.gastosCobranza,
      interesMoratorio: deudaData.interesMoratorio,
      interesPunitorio: deudaData.interesPunitorio,
      fechaUltimoPago: deudaData.fechaUltimoPago,
      montoCuota: deudaData.montoCuota,
      fechaAsignacionGestor: deudaData.fechaAsignacionGestor,
      cuotas,
    });
  }

  async guardar(deuda: Deuda): Promise<void> {
    // Implementación pendiente (upsert)
    throw new Error('Method not implemented.');
  }

  async buscarPorGestor(gestorId: number): Promise<Deuda[]> {
    const deudasData = await this.prisma.deudaMaestra.findMany({
      where: { gestorAsignadoId: gestorId },
      include: { cuotas: true },
    });
    return deudasData.map(deudaData => {
      const cuotas = deudaData.cuotas.map(cuota => ({
        id: cuota.id,
        numeroCuota: cuota.numeroCuota,
        fechaVencimiento: cuota.fechaVencimiento,
        capitalOriginal: cuota.capitalOriginal,
        saldoCapital: cuota.saldoCapital,
        interesMoratorioAcumulado: cuota.interesMoratorioAcumulado,
        interesPunitorioAcumulado: cuota.interesPunitorioAcumulado,
        estadoCuota: cuota.estadoCuota,
        fechaUltimoPago: cuota.fechaUltimoPago,
        montoCuota: cuota.montoCuota,
      }));
      return Deuda.crear({
        id: deudaData.id,
        acreedor: deudaData.acreedor,
        concepto: deudaData.concepto,
        estadoActual: deudaData.estadoActual.nombre as EstadoDeuda,
        gestorAsignadoId: deudaData.gestorAsignadoId,
        diasMora: deudaData.diasMora,
        diasGestion: deudaData.diasGestion,
        saldoCapitalTotal: deudaData.saldoCapitalTotal,
        deudaTotal: deudaData.deudaTotal,
        gastosCobranza: deudaData.gastosCobranza,
        interesMoratorio: deudaData.interesMoratorio,
        interesPunitorio: deudaData.interesPunitorio,
        fechaUltimoPago: deudaData.fechaUltimoPago,
        montoCuota: deudaData.montoCuota,
        fechaAsignacionGestor: deudaData.fechaAsignacionGestor,
        cuotas,
      });
    });
  }
}
