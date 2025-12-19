/**
 * ============================================================
 * PRONTIO - Schema.gs (FASE 2)
 * ============================================================
 * Schema oficial das entidades (contrato interno backend).
 * - Serve para consistência e base de validação.
 * - O front NÃO conhece abas/colunas; isso é só para o backend.
 *
 * Este Schema é sobre o "modelo de dados" (DTO).
 * O mapeamento para planilha ficará no Repository/Migrations (Fase 4).
 */

function Schema_get_(entityName) {
  var schemas = Schema_all_();
  return schemas[entityName] || null;
}

function Schema_all_() {
  // Convenção:
  // - fields: { nomeCampo: { type, required?, maxLength?, enum?, description? } }
  // - idField: nome do campo de ID estável gerado no backend
  // - softDelete: campos usados para inativação
  return {
    Paciente: {
      entity: "Paciente",
      idField: "idPaciente",
      softDelete: { field: "ativo", inactiveValue: false },
      fields: {
        idPaciente: { type: "string", required: true, description: "ID estável gerado no backend." },
        ativo: { type: "boolean", required: true },

        nome: { type: "string", required: true, maxLength: 120 },
        nascimento: { type: "date", required: false },
        sexo: { type: "string", required: false, enum: ["M", "F", "O", "NI"] },

        cpf: { type: "string", required: false, maxLength: 14 },
        telefone: { type: "string", required: false, maxLength: 30 },
        email: { type: "string", required: false, maxLength: 120 },

        endereco: { type: "object", required: false },
        observacoes: { type: "string", required: false, maxLength: 2000 },

        criadoEm: { type: "date", required: true },
        atualizadoEm: { type: "date", required: true }
      }
    },

    Agenda: {
      entity: "Agenda",
      idField: "idAgenda",
      softDelete: { field: "status", inactiveValue: "CANCELADO" },
      fields: {
        idAgenda: { type: "string", required: true },

        // Relações por ID (nunca por nome)
        idPaciente: { type: "string", required: false, description: "Opcional para bloqueios/slots sem paciente." },

        // Core
        inicio: { type: "date", required: true },
        fim: { type: "date", required: true },

        titulo: { type: "string", required: false, maxLength: 120 },
        notas: { type: "string", required: false, maxLength: 2000 },

        tipo: { type: "string", required: false, enum: ["CONSULTA", "RETORNO", "PROCEDIMENTO", "BLOQUEIO", "OUTRO"] },
        status: { type: "string", required: true, enum: ["AGENDADO", "CANCELADO", "CONCLUIDO", "FALTOU"] },

        origem: { type: "string", required: false, enum: ["RECEPCAO", "MEDICO", "SISTEMA"] },

        criadoEm: { type: "date", required: true },
        atualizadoEm: { type: "date", required: true },
        canceladoEm: { type: "date", required: false },
        canceladoMotivo: { type: "string", required: false, maxLength: 500 }
      }
    },

    Evolucao: {
      entity: "Evolucao",
      idField: "idEvolucao",
      softDelete: { field: "ativo", inactiveValue: false },
      fields: {
        idEvolucao: { type: "string", required: true },
        idPaciente: { type: "string", required: true },

        data: { type: "date", required: true },
        texto: { type: "string", required: true, maxLength: 20000 },

        // Metadados
        criadoEm: { type: "date", required: true },
        atualizadoEm: { type: "date", required: true },
        ativo: { type: "boolean", required: true }
      }
    }
  };
}

/**
 * Gera uma lista de validações (Validators spec) a partir do schema.
 * Útil para ações Create/Update.
 *
 * mode:
 * - "create": aplica required=true
 * - "update": não aplica required (exceto id, se indicado externamente)
 */
function Schema_buildValidations_(entityName, mode) {
  var s = Schema_get_(entityName);
  if (!s) return [];

  mode = mode || "create";
  var fields = s.fields || {};
  var validations = [];

  for (var f in fields) {
    if (!fields.hasOwnProperty(f)) continue;
    var def = fields[f];

    if (mode === "create" && def.required) {
      validations.push({ field: f, rule: "required" });
    }

    if (def.type) {
      if (def.type === "date") validations.push({ field: f, rule: "date" });
      else if (def.type === "object") validations.push({ field: f, rule: "object" });
      else if (def.type === "array") validations.push({ field: f, rule: "array" });
      else validations.push({ field: f, rule: "type", value: def.type });
    }

    if (def.maxLength) validations.push({ field: f, rule: "maxLength", value: def.maxLength });
    if (def.enum) validations.push({ field: f, rule: "enum", values: def.enum });
  }

  return validations;
}
