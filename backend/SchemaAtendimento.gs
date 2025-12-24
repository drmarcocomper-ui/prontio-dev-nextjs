/**
 * ============================================================
 * PRONTIO - SchemaAtendimento.gs
 * ============================================================
 * Adiciona schema da entidade Atendimento sem editar Schema.gs.
 * Patch em Schema_all_ retornando schema original + Atendimento.
 */

(function () {
  if (typeof Schema_all_ !== "function") return;
  if (Schema_all_._atdPatched) return;

  var _orig = Schema_all_;

  Schema_all_ = function () {
    var all = _orig() || {};

    if (!all.Atendimento) {
      all.Atendimento = {
        entity: "Atendimento",
        idField: "idAtendimento",
        softDelete: { field: "ativo", inactiveValue: false },
        fields: {
          idAtendimento: { type: "string", required: true },
          idAgenda: { type: "string", required: true },
          idPaciente: { type: "string", required: false },
          dataRef: { type: "string", required: true, maxLength: 10 }, // YYYY-MM-DD
          status: { type: "string", required: true, enum: ["AGUARDANDO", "CHEGOU", "CHAMADO", "EM_ATENDIMENTO", "CONCLUIDO", "CANCELADO"] },
          ordem: { type: "string", required: false },
          chegadaEm: { type: "date", required: false },
          chamadoEm: { type: "date", required: false },
          inicioAtendimentoEm: { type: "date", required: false },
          concluidoEm: { type: "date", required: false },
          sala: { type: "string", required: false, maxLength: 60 },
          observacoes: { type: "string", required: false, maxLength: 2000 },
          criadoEm: { type: "date", required: true },
          atualizadoEm: { type: "date", required: true },
          ativo: { type: "boolean", required: true }
        }
      };
    }

    return all;
  };

  Schema_all_._atdPatched = true;
})();
