import { Email } from '../../domain/entities/email';
import { EmailRepository } from '../../domain/repositories/email-repository';
import { EstadoContacto } from '../../domain/enums/estado-contacto';
import { PrismaClient } from '../../generated/prisma';

export class PrismaEmailRepository implements EmailRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarPorId(id: number): Promise<Email | null> {
    const emailData = await this.prisma.email.findUnique({
      where: { id },
    });
    if (!emailData) return null;

    return Email.reconstruir({
      id: emailData.id,
      personaId: emailData.personaId,
      email: emailData.email,
      estado: emailData.estado as EstadoContacto,
      fechaModificacion: emailData.fechaModificacion,
    });
  }

  async buscarPorPersona(personaId: number): Promise<Email[]> {
    const emailsData = await this.prisma.email.findMany({
      where: { personaId },
      orderBy: { id: 'asc' },
    });

    return emailsData.map(e =>
      Email.reconstruir({
        id: e.id,
        personaId: e.personaId,
        email: e.email,
        estado: e.estado as EstadoContacto,
        fechaModificacion: e.fechaModificacion,
      })
    );
  }

  async guardar(email: Email): Promise<void> {
    const data = {
      personaId: email.personaId,
      email: email.email,
      estado: email.estado as any, // Prisma enum
      fechaModificacion: email.fechaModificacion ?? new Date(),
    };

    if (email.id) {
      await this.prisma.email.update({
        where: { id: email.id },
        data,
      });
    } else {
      await this.prisma.email.create({
        data,
      });
    }
  }

  async cambiarEstado(id: number, estado: EstadoContacto): Promise<void> {
    await this.prisma.email.update({
      where: { id },
      data: {
        estado: estado as any,
        fechaModificacion: new Date(),
      },
    });
  }

  async eliminar(id: number): Promise<void> {
    await this.prisma.email.delete({
      where: { id },
    });
  }
}