import { Persona } from '../../domain/entities/persona';
import { Telefono } from '../../domain/entities/telefono';
import { Email } from '../../domain/entities/email';
import { ReferenciaPersonal } from '../../domain/entities/referencia-personal';
import { ReferenciaLaboral } from '../../domain/entities/referencia-laboral';
import { PersonaRepository } from '../../domain/repositories/persona-repository';
import { PrismaClient, EstadoVerificacion as PrismaEstadoVerificacion } from '../../generated/prisma';
import { EstadoVerificacion } from '../../domain/enums/estado-verificacion';
import { EstadoContacto } from '../../domain/enums/estado-contacto';

export class PrismaPersonaRepository implements PersonaRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<Persona | null> {
    const personaData = await this.prisma.persona.findUnique({
      where: { id },
      include: {
        telefonos: true,
        emails: true,
        referenciasPersonales: true,
        referenciasLaborales: true,
      },
    });
    if (!personaData) return null;

    const telefonosRecuperados = personaData.telefonos.map(t =>
      Telefono.reconstruir({
        id: t.id,
        personaId: t.personaId,
        numero: t.numero,
        estado: t.estado as EstadoContacto,
        fechaModificacion: t.fechaModificacion,
      })
    );

    const emailsRecuperados = personaData.emails.map(e =>
      Email.reconstruir({
        id: e.id,
        personaId: e.personaId,
        email: e.email,
        estado: e.estado as EstadoContacto,
        fechaModificacion: e.fechaModificacion,
      })
    );

    const referenciasPersonalesRecuperadas = personaData.referenciasPersonales.map(rp =>
      ReferenciaPersonal.reconstruir({
        id: rp.id,
        personaId: rp.personaId,
        nombre: rp.nombre,
        parentesco: rp.parentesco,
        telefono: rp.telefono,
        estado: rp.estado as EstadoContacto,
      })
    );

    const referenciasLaboralesRecuperadas = personaData.referenciasLaborales.map(rl =>
      ReferenciaLaboral.reconstruir({
        id: rl.id,
        personaId: rl.personaId,
        nombre: rl.nombre,
        empresa: rl.empresa ?? undefined,
        telefono: rl.telefono,
        estado: rl.estado as EstadoContacto,
      })
    );

    return Persona.reconstruir({
      id: personaData.id,
      nombres: personaData.nombres,
      apellidos: personaData.apellidos,
      documento: personaData.documento,
      funcionarioPublico: personaData.funcionarioPublico as EstadoVerificacion,
      fechaModFuncionario: personaData.fechaModFuncionario,
      jubilado: personaData.jubilado as EstadoVerificacion,
      fechaModJubilado: personaData.fechaModJubilado,
      ipsActivo: personaData.ipsActivo as EstadoVerificacion,
      fechaModIps: personaData.fechaModIps,
      datosVarios: personaData.datosVarios,
      telefonos: telefonosRecuperados,
      emails: emailsRecuperados,
      referenciasPersonales: referenciasPersonalesRecuperadas,
      referenciasLaborales: referenciasLaboralesRecuperadas,
    });
  }

  async buscarPorDocumento(documento: string): Promise<Persona | null> {
    const personaData = await this.prisma.persona.findUnique({
      where: { documento },
      include: {
        telefonos: true,
        emails: true,
        referenciasPersonales: true,
        referenciasLaborales: true,
      },
    });
    if (!personaData) return null;

    // Reutilizar mapeo de buscarPorId (podríamos extraer a método privado)
    // Por simplicidad, llamaremos a buscarPorId con el ID encontrado
    return this.buscarPorId(personaData.id);
  }

  async buscarPorNombreOApellido(termino: string): Promise<Persona[]> {
    const personasData = await this.prisma.persona.findMany({
      where: {
        OR: [
          { nombres: { contains: termino, mode: 'insensitive' } },
          { apellidos: { contains: termino, mode: 'insensitive' } },
        ],
      },
      include: {
        telefonos: true,
        emails: true,
        referenciasPersonales: true,
        referenciasLaborales: true,
      },
      take: 50,
    });

    const personas: Persona[] = [];
    for (const personaData of personasData) {
      const persona = await this.buscarPorId(personaData.id);
      if (persona) personas.push(persona);
    }
    return personas;
  }

  async guardar(persona: Persona): Promise<void> {
    // Mapear enums de dominio a enums de Prisma
    const funcionarioPublico = persona.funcionarioPublico as PrismaEstadoVerificacion;
    const jubilado = persona.jubilado as PrismaEstadoVerificacion;
    const ipsActivo = persona.ipsActivo as PrismaEstadoVerificacion;

    const personaData = {
      nombres: persona.nombres,
      apellidos: persona.apellidos,
      documento: persona.documento,
      funcionarioPublico,
      fechaModFuncionario: persona.fechaModFuncionario,
      jubilado,
      fechaModJubilado: persona.fechaModJubilado,
      ipsActivo,
      fechaModIps: persona.fechaModIps,
      datosVarios: persona.datosVarios,
    };

    // Upsert de persona
    const personaGuardada = await this.prisma.persona.upsert({
      where: { id: persona.id ?? -1 },
      update: personaData,
      create: { ...personaData, id: persona.id },
    });

    // Guardar teléfonos, emails, referencias (simplificado: eliminar todos y recrear)
    // En una implementación real deberíamos manejar cambios incrementales
    await this.prisma.telefono.deleteMany({ where: { personaId: personaGuardada.id } });
    await this.prisma.email.deleteMany({ where: { personaId: personaGuardada.id } });
    await this.prisma.referenciaPersonal.deleteMany({ where: { personaId: personaGuardada.id } });
    await this.prisma.referenciaLaboral.deleteMany({ where: { personaId: personaGuardada.id } });

    // Crear teléfonos
    for (const telefono of persona.telefonos) {
      await this.prisma.telefono.create({
        data: {
          personaId: personaGuardada.id,
          numero: telefono.numero,
          estado: telefono.estado as any,
          fechaModificacion: telefono.fechaModificacion,
        },
      });
    }

    // Crear emails
    for (const email of persona.emails) {
      await this.prisma.email.create({
        data: {
          personaId: personaGuardada.id,
          email: email.email,
          estado: email.estado as any,
          fechaModificacion: email.fechaModificacion,
        },
      });
    }

    // Crear referencias personales
    for (const refPersonal of persona.referenciasPersonales) {
      await this.prisma.referenciaPersonal.create({
        data: {
          personaId: personaGuardada.id,
          nombre: refPersonal.nombre,
          parentesco: refPersonal.parentesco,
          telefono: refPersonal.telefono,
          estado: refPersonal.estado as any,
        },
      });
    }

    // Crear referencias laborales
    for (const refLaboral of persona.referenciasLaborales) {
      await this.prisma.referenciaLaboral.create({
        data: {
          personaId: personaGuardada.id,
          nombre: refLaboral.nombre,
          empresa: refLaboral.empresa,
          telefono: refLaboral.telefono,
          estado: refLaboral.estado as any,
        },
      });
    }
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.persona.delete({ where: { id } });
  }
}
