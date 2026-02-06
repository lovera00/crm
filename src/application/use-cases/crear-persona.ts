import { PersonaRepository } from '../../domain/repositories/persona-repository';
import { Persona } from '../../domain/entities/persona';
import { EstadoVerificacion } from '../../domain/enums/estado-verificacion';

export interface CrearPersonaInput {
  nombres: string;
  apellidos: string;
  documento: string;
  funcionarioPublico?: EstadoVerificacion;
  jubilado?: EstadoVerificacion;
  ipsActivo?: EstadoVerificacion;
  datosVarios?: any;
}

export interface CrearPersonaOutput {
  personaId: number;
  documento: string;
}

export class CrearPersonaUseCase {
  constructor(private personaRepository: PersonaRepository) {}

  async execute(input: CrearPersonaInput): Promise<CrearPersonaOutput> {
    // Validar que no exista persona con mismo documento
    const existente = await this.personaRepository.buscarPorDocumento(input.documento);
    if (existente) {
      throw new Error(`Ya existe una persona con documento ${input.documento}`);
    }

    const persona = Persona.crear({
      nombres: input.nombres,
      apellidos: input.apellidos,
      documento: input.documento,
      funcionarioPublico: input.funcionarioPublico,
      jubilado: input.jubilado,
      ipsActivo: input.ipsActivo,
      datosVarios: input.datosVarios,
    });

    await this.personaRepository.guardar(persona);

    if (!persona.id) {
      throw new Error('Error al guardar persona: ID no generado');
    }

    return {
      personaId: persona.id,
      documento: persona.documento,
    };
  }
}
