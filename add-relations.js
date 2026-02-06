const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Encontrar el modelo Usuario y agregar relaciones faltantes
let lines = content.split('\n');
let newLines = [];
let inUsuario = false;
let usuarioEndIndex = -1;
let i = 0;
while (i < lines.length) {
  let line = lines[i];
  if (line.trim().startsWith('model Usuario {')) {
    inUsuario = true;
    newLines.push(line);
    i++;
    continue;
  }
  if (inUsuario && line.trim() === '}') {
    // Antes de cerrar, agregar relaciones faltantes
    newLines.push('  // Relaciones adicionales');
    newLines.push('  cuotasCreadas Cuota[] @relation("CuotaCreadoPor")');
    newLines.push('  cuotasModificadas Cuota[] @relation("CuotaModificadoPor")');
    newLines.push('  personasDeudasCreadas PersonaDeuda[] @relation("PersonaDeudaCreadoPor")');
    newLines.push('  seguimientosGestor Seguimiento[] @relation("SeguimientoGestor")');
    newLines.push('  solicitudesAutorizacionSolicitante SolicitudAutorizacion[] @relation("SolicitudAutorizacionSolicitante")');
    newLines.push('  solicitudesAutorizacionSupervisor SolicitudAutorizacion[] @relation("SolicitudAutorizacionSupervisor")');
    newLines.push('  asignacionesCarteraGestor AsignacionCartera[] @relation("AsignacionCarteraGestor")');
    newLines.push('  asignacionesCarteraSupervisor AsignacionCartera[] @relation("AsignacionCarteraSupervisor")');
    newLines.push('  // Fin relaciones adicionales');
    newLines.push(line);
    inUsuario = false;
    i++;
    continue;
  }
  newLines.push(line);
  i++;
}

// También agregar relación inversa en Persona para Seguimiento
let newContent = newLines.join('\n');
let personLines = newContent.split('\n');
let newPersonLines = [];
let inPersona = false;
let j = 0;
while (j < personLines.length) {
  let line = personLines[j];
  if (line.trim().startsWith('model Persona {')) {
    inPersona = true;
    newPersonLines.push(line);
    j++;
    continue;
  }
  if (inPersona && line.trim() === '}') {
    // Agregar relación
    newPersonLines.push('  seguimientos Seguimiento[] @relation("SeguimientoPersona")');
    newPersonLines.push(line);
    inPersona = false;
    j++;
    continue;
  }
  newPersonLines.push(line);
  j++;
}

fs.writeFileSync(schemaPath, newPersonLines.join('\n'));
console.log('Added missing relations');
