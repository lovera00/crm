const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Reemplazos
content = content.replace(
  /gestor\s+Usuario\s+@relation\(fields: \[gestorId\], references: \[id\]\)/,
  'gestor                  Usuario       @relation("SeguimientoGestor", fields: [gestorId], references: [id])'
);
content = content.replace(
  /persona\s+Persona\s+@relation\(fields: \[personaId\], references: \[id\]\)/,
  'persona                 Persona       @relation("SeguimientoPersona", fields: [personaId], references: [id])'
);
content = content.replace(
  /gestorSolicitante\s+Usuario\s+@relation\(fields: \[gestorSolicitanteId\], references: \[id\]\)/,
  'gestorSolicitante       Usuario             @relation("SolicitudAutorizacionSolicitante", fields: [gestorSolicitanteId], references: [id])'
);
content = content.replace(
  /gestor\s+Usuario\s+@relation\(fields: \[gestorId\], references: \[id\]\)/g,
  'gestor                  Usuario       @relation("AsignacionCarteraGestor", fields: [gestorId], references: [id])'
);
// supervisorAsignador (si existe)
content = content.replace(
  /supervisorAsignador\s+Usuario\?\s+@relation\(fields: \[supervisorAsignadorId\], references: \[id\]\)/,
  'supervisorAsignador     Usuario?      @relation("AsignacionCarteraSupervisor", fields: [supervisorAsignadorId], references: [id])'
);

fs.writeFileSync(schemaPath, content);
console.log('Fixed relation names');
