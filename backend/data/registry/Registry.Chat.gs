// backend/data/registry/Registry.Chat.gs
/**
 * Registry padrão para o módulo Chat.
 *
 * Actions principais (lowercase - padrão do frontend):
 * - chat.sendMessage
 * - chat.listMessages
 * - chat.listMessagesSince
 * - chat.markAsRead
 * - chat.getUnreadSummary
 * - chat.listByPaciente
 * - chat.sendByPaciente
 *
 * Aliases PascalCase (padrão do Prontuário):
 * - Chat.SendMessage
 * - Chat.ListMessages
 * - Chat.ListMessagesSince
 * - Chat.MarkAsRead
 * - Chat.GetUnreadSummary
 * - Chat.ListByPaciente
 * - Chat.SendByPaciente
 *
 * Compat actions (integração com outros módulos):
 * - usuarios.listAll → ChatCompat_Usuarios_ListAll_
 * - agenda.peekNextPatient → ChatCompat_Agenda_PeekNextPatient_
 * - agenda.nextPatient → ChatCompat_Agenda_NextPatient_
 */

function Registry_RegisterChat_(map) {
  // ===================== AÇÕES PRINCIPAIS (lowercase) =====================

  map["chat.sendMessage"] = {
    action: "chat.sendMessage",
    handler: (typeof Chat_Action_SendMessage_ === "function")
      ? Chat_Action_SendMessage_
      : _Registry_missingHandler_("Chat_Action_SendMessage_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  map["chat.listMessages"] = {
    action: "chat.listMessages",
    handler: (typeof Chat_Action_ListMessages_ === "function")
      ? Chat_Action_ListMessages_
      : _Registry_missingHandler_("Chat_Action_ListMessages_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["chat.listMessagesSince"] = {
    action: "chat.listMessagesSince",
    handler: (typeof Chat_Action_ListMessagesSince_ === "function")
      ? Chat_Action_ListMessagesSince_
      : _Registry_missingHandler_("Chat_Action_ListMessagesSince_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["chat.markAsRead"] = {
    action: "chat.markAsRead",
    handler: (typeof Chat_Action_MarkAsRead_ === "function")
      ? Chat_Action_MarkAsRead_
      : _Registry_missingHandler_("Chat_Action_MarkAsRead_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  map["chat.getUnreadSummary"] = {
    action: "chat.getUnreadSummary",
    handler: (typeof Chat_Action_GetUnreadSummary_ === "function")
      ? Chat_Action_GetUnreadSummary_
      : _Registry_missingHandler_("Chat_Action_GetUnreadSummary_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["chat.listByPaciente"] = {
    action: "chat.listByPaciente",
    handler: (typeof Chat_Action_ListByPaciente_ === "function")
      ? Chat_Action_ListByPaciente_
      : _Registry_missingHandler_("Chat_Action_ListByPaciente_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["chat.sendByPaciente"] = {
    action: "chat.sendByPaciente",
    handler: (typeof Chat_Action_SendByPaciente_ === "function")
      ? Chat_Action_SendByPaciente_
      : _Registry_missingHandler_("Chat_Action_SendByPaciente_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  // ===================== ALIASES PASCALCASE (Prontuário) =====================

  map["Chat.SendMessage"] = {
    action: "Chat.SendMessage",
    handler: map["chat.sendMessage"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  map["Chat.ListMessages"] = {
    action: "Chat.ListMessages",
    handler: map["chat.listMessages"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Chat.ListMessagesSince"] = {
    action: "Chat.ListMessagesSince",
    handler: map["chat.listMessagesSince"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Chat.MarkAsRead"] = {
    action: "Chat.MarkAsRead",
    handler: map["chat.markAsRead"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  map["Chat.GetUnreadSummary"] = {
    action: "Chat.GetUnreadSummary",
    handler: map["chat.getUnreadSummary"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Chat.ListByPaciente"] = {
    action: "Chat.ListByPaciente",
    handler: map["chat.listByPaciente"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["Chat.SendByPaciente"] = {
    action: "Chat.SendByPaciente",
    handler: map["chat.sendByPaciente"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  // ===================== COMPAT ACTIONS =====================
  // Integração com Usuarios e Atendimento para o chat.html

  map["usuarios.listAll"] = {
    action: "usuarios.listAll",
    handler: (typeof ChatCompat_Usuarios_ListAll_ === "function")
      ? ChatCompat_Usuarios_ListAll_
      : _Registry_missingHandler_("ChatCompat_Usuarios_ListAll_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["agenda.peekNextPatient"] = {
    action: "agenda.peekNextPatient",
    handler: (typeof ChatCompat_Agenda_PeekNextPatient_ === "function")
      ? ChatCompat_Agenda_PeekNextPatient_
      : _Registry_missingHandler_("ChatCompat_Agenda_PeekNextPatient_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["agenda.nextPatient"] = {
    action: "agenda.nextPatient",
    handler: (typeof ChatCompat_Agenda_NextPatient_ === "function")
      ? ChatCompat_Agenda_NextPatient_
      : _Registry_missingHandler_("ChatCompat_Agenda_NextPatient_"),
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "ATENDIMENTO"
  };

  // ===================== ALIASES UNDERSCORE (fallback) =====================

  map["chat_sendMessage"] = {
    action: "chat_sendMessage",
    handler: map["chat.sendMessage"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };

  map["chat_listMessages"] = {
    action: "chat_listMessages",
    handler: map["chat.listMessages"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["chat_listByPaciente"] = {
    action: "chat_listByPaciente",
    handler: map["chat.listByPaciente"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: false,
    lockKey: null
  };

  map["chat_sendByPaciente"] = {
    action: "chat_sendByPaciente",
    handler: map["chat.sendByPaciente"].handler,
    requiresAuth: true,
    roles: [],
    validations: [],
    requiresLock: true,
    lockKey: "CHAT"
  };
}
