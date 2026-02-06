import { UsuarioRepository, Usuario } from '../../domain/repositories/usuario-repository';
import { PrismaClient } from '../../generated/prisma';

export class PrismaUsuarioRepository implements UsuarioRepository {
  constructor(private prisma: PrismaClient) {}

  async buscarSupervisoresActivos(): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        rol: 'supervisor',
        activo: true,
      },
    });

    return usuarios.map(usuario => ({
      id: usuario.id,
      rol: usuario.rol,
    }));
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) return null;

    return {
      id: usuario.id,
      rol: usuario.rol,
    };
  }
}