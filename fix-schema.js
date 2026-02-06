const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Lista de modelos que tienen creadoPor y modificadoPor
const models = ['Cuota', 'PersonaDeuda', 'SeguimientoDeuda', 'ReglaTransicion', 'TransicionEstado', 'SolicitudAutorizacion', 'AsignacionCartera'];
// Pero también hay otros modelos con relaciones a Usuario. Vamos a hacerlo general.

// Patrón: línea que contiene "creadoPor" y "@relation(fields: [creadoPorId]"
// Reemplazar con nombre de relación basado en el modelo actual.
let lines = content.split('\n');
let currentModel = '';
let newLines = [];
for (let line of lines) {
  // Detectar inicio de modelo
  if (line.startsWith('model ')) {
    currentModel = line.split(' ')[1];
  }
  // Reemplazar relaciones sin nombre
  if (line.includes('creadoPor') && line.includes('@relation(fields: [creadoPorId]') && !line.includes('@relation("')) {
    line = line.replace('@relation(fields: [creadoPorId], references: [id])', `@relation("${currentModel}CreadoPor", fields: [creadoPorId], references: [id])`);
  }
  if (line.includes('modificadoPor') && line.includes('@relation(fields: [modificadoPorId]') && !line.includes('@relation("')) {
    line = line.replace('@relation(fields: [modificadoPorId], references: [id])', `@relation("${currentModel}ModificadoPor", fields: [modificadoPorId], references: [id])`);
  }
  newLines.push(line);
}

fs.writeFileSync(schemaPath, newLines.join('\n'));
console.log('Schema fixed');
