/**
 * ============================================================
 * PRONTIO - ChatCompat.gs
 * ============================================================
 * Handlers de compatibilidade usados pelo chat.html.
 *
 * Estratégia:
 * - usuarios.listAll → Delega para Usuarios_Listar_
 * - agenda.peekNextPatient → Peek do próximo (sem modificar)
 * - agenda.nextPatient → Delega para Atendimento_Action_ChamarProximo_
 *
 * Estes handlers são registrados em Registry.Chat.gs.
 */

/**
 * usuarios.listAll - Lista todos os usuários do sistema
 * Retorna { users: [...] } com dados básicos (sem senhas)
 */
function ChatCompat_Usuarios_ListAll_(ctx, payload) {
  // Verifica se Usuarios_Listar_ existe
  if (typeof Usuarios_Listar_ === "function") {
    try {
      var lista = Usuarios_Listar_(payload || {});
      // Normaliza para o formato esperado pelo chat
      var users = (Array.isArray(lista) ? lista : []).map(function(u) {
        return {
          id: String(u.id || u.idUsuario || u.ID_Usuario || ""),
          nome: String(u.nome || u.nomeCompleto || u.NomeCompleto || ""),
          login: String(u.login || u.Login || ""),
          email: String(u.email || u.Email || ""),
          perfil: String(u.perfil || u.Perfil || ""),
          ativo: u.ativo !== false
        };
      }).filter(function(u) {
        return u.id && u.ativo;
      });
      return { users: users };
    } catch (e) {
      console.warn("[ChatCompat] Erro ao listar usuários:", e);
      return { users: [], error: String(e.message || e) };
    }
  }

  // Fallback se Usuarios_Listar_ não existir
  console.warn("[ChatCompat] Usuarios_Listar_ não disponível.");
  return { users: [] };
}

/**
 * agenda.peekNextPatient - Visualiza o próximo paciente SEM modificar
 * Retorna { hasPatient: bool, patient: {...} | null }
 */
function ChatCompat_Agenda_PeekNextPatient_(ctx, payload) {
  payload = payload || {};

  // Verifica se as funções de Atendimento existem
  if (typeof Repo_list_ !== "function") {
    console.warn("[ChatCompat] Repo_list_ não disponível.");
    return { hasPatient: false, patient: null };
  }

  try {
    // Normaliza data de referência (hoje por padrão)
    var dataRef = _chatCompatNormalizeDateRef_(payload.dataRef);

    // Lista atendimentos
    var all = Repo_list_("Atendimento") || [];
    var candidates = [];

    for (var i = 0; i < all.length; i++) {
      var a = all[i] || {};

      // Verifica se está ativo
      var ativo = a.ativo !== false && a.Ativo !== false;
      if (!ativo) continue;

      // Verifica data
      var aDataRef = String(a.dataRef || a.DataRef || "").trim();
      if (aDataRef !== dataRef) continue;

      // Normaliza status
      var status = String(a.status || a.Status || "").toUpperCase().trim();

      // Ignora status finalizados
      if (status === "ATENDIDO" || status === "CANCELADO" ||
          status === "FALTOU" || status === "REMARCADO" ||
          status === "EM_ATENDIMENTO") continue;

      candidates.push({
        idAtendimento: String(a.idAtendimento || a.ID_Atendimento || ""),
        idAgenda: String(a.idAgenda || a.ID_Agenda || ""),
        idPaciente: String(a.idPaciente || a.ID_Paciente || ""),
        status: status,
        ordem: parseInt(a.ordem || a.Ordem || 0, 10) || 0,
        chegadaEm: a.chegadaEm || a.ChegadaEm || null
      });
    }

    if (!candidates.length) {
      return { hasPatient: false, patient: null, message: "Fila vazia." };
    }

    // Ordena: quem chegou primeiro tem prioridade, depois por ordem
    candidates.sort(function(x, y) {
      var xArrived = x.chegadaEm ? 0 : 1;
      var yArrived = y.chegadaEm ? 0 : 1;
      if (xArrived !== yArrived) return xArrived - yArrived;
      return (x.ordem || 0) - (y.ordem || 0);
    });

    var next = candidates[0];

    // Tenta buscar dados do paciente
    var pacienteInfo = null;
    if (next.idPaciente && typeof Repo_getById_ === "function") {
      try {
        var pac = Repo_getById_("Pacientes", "idPaciente", next.idPaciente);
        if (pac) {
          pacienteInfo = {
            id: next.idPaciente,
            nome: String(pac.nomeCompleto || pac.NomeCompleto || pac.Nome || ""),
            telefone: String(pac.telefone || pac.Telefone || "")
          };
        }
      } catch (_) {}
    }

    return {
      hasPatient: true,
      patient: {
        idAtendimento: next.idAtendimento,
        idAgenda: next.idAgenda,
        idPaciente: next.idPaciente,
        status: next.status,
        nome: pacienteInfo ? pacienteInfo.nome : "",
        telefone: pacienteInfo ? pacienteInfo.telefone : ""
      }
    };
  } catch (e) {
    console.warn("[ChatCompat] Erro em peekNextPatient:", e);
    return { hasPatient: false, patient: null, error: String(e.message || e) };
  }
}

/**
 * agenda.nextPatient - Chama o próximo paciente (modifica dados)
 * Delega para Atendimento_Action_ChamarProximo_ se existir
 */
function ChatCompat_Agenda_NextPatient_(ctx, payload) {
  payload = payload || {};

  // Delega para o handler real de Atendimento
  if (typeof Atendimento_Action_ChamarProximo_ === "function") {
    try {
      var result = Atendimento_Action_ChamarProximo_(ctx, payload);

      // Adapta resposta para o formato esperado pelo chat
      if (result && result.item) {
        var item = result.item;

        // Tenta buscar dados do paciente
        var pacienteInfo = null;
        var idPaciente = String(item.idPaciente || item.ID_Paciente || "");
        if (idPaciente && typeof Repo_getById_ === "function") {
          try {
            var pac = Repo_getById_("Pacientes", "idPaciente", idPaciente);
            if (pac) {
              pacienteInfo = {
                id: idPaciente,
                nome: String(pac.nomeCompleto || pac.NomeCompleto || pac.Nome || ""),
                telefone: String(pac.telefone || pac.Telefone || "")
              };
            }
          } catch (_) {}
        }

        return {
          hasPatient: true,
          patient: {
            idAtendimento: String(item.idAtendimento || ""),
            idAgenda: String(item.idAgenda || ""),
            idPaciente: idPaciente,
            status: String(item.status || ""),
            nome: pacienteInfo ? pacienteInfo.nome : "",
            telefone: pacienteInfo ? pacienteInfo.telefone : ""
          }
        };
      }

      return { hasPatient: false, patient: null, message: result.message || "Fila vazia." };
    } catch (e) {
      console.warn("[ChatCompat] Erro em nextPatient:", e);
      return { hasPatient: false, patient: null, error: String(e.message || e) };
    }
  }

  // Fallback se Atendimento_Action_ChamarProximo_ não existir
  console.warn("[ChatCompat] Atendimento_Action_ChamarProximo_ não disponível.");
  return { hasPatient: false, patient: null };
}

// ============================================================
// Helpers internos
// ============================================================

function _chatCompatNormalizeDateRef_(dataRef) {
  if (dataRef) {
    var s = String(dataRef).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }
  // Hoje no fuso local
  var now = new Date();
  var y = now.getFullYear();
  var m = String(now.getMonth() + 1).padStart(2, "0");
  var d = String(now.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + d;
}
