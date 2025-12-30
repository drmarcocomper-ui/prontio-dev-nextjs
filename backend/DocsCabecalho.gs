/**
 * PRONTIO - Helper de Cabeçalho para Documentos (Receita, Laudo, Atestado, etc.)
 *
 * Origem preferencial dos dados:
 * - AgendaConfig.gs → agendaConfigObter_()
 *
 * ✅ Mantém compatibilidade:
 * - getCabecalhoDocumento_()
 * - buildCabecalhoHtml_()
 * - safeHtml_()
 *
 * ✅ Melhorias:
 * - fallback seguro se agendaConfigObter_ não existir
 * - cache em memória (evita recomputar/relêr config em chamadas repetidas)
 * - escape de HTML mais completo (inclui aspas)
 * - escape separado para atributos HTML (src/href)
 * - helper opcional: buildRodapeHtml_() (não interfere se não for usado)
 */

// Cache simples em memória (por execução)
var __DOC_CABECALHO_CACHE__ = null;

/**
 * Retorna um objeto com os dados de cabeçalho para documentos.
 *
 * {
 *   medicoNome,
 *   medicoCRM,
 *   medicoEspecialidade,
 *   clinicaNome,
 *   clinicaEndereco,
 *   clinicaTelefone,
 *   clinicaEmail,
 *   logoUrl
 * }
 */
function getCabecalhoDocumento_() {
  if (__DOC_CABECALHO_CACHE__) return __DOC_CABECALHO_CACHE__;

  var cfg = {};
  try {
    if (typeof agendaConfigObter_ === "function") {
      cfg = agendaConfigObter_() || {};
    }
  } catch (e) {
    cfg = {};
  }

  // Normalização defensiva (evita undefined/null)
  var out = {
    medicoNome: String(cfg.medicoNomeCompleto || cfg.medicoNome || "").trim(),
    medicoCRM: String(cfg.medicoCRM || cfg.crm || "").trim(),
    medicoEspecialidade: String(cfg.medicoEspecialidade || cfg.especialidade || "").trim(),

    clinicaNome: String(cfg.clinicaNome || cfg.nomeClinica || "").trim(),
    clinicaEndereco: String(cfg.clinicaEndereco || cfg.enderecoClinica || "").trim(),
    clinicaTelefone: String(cfg.clinicaTelefone || cfg.telefoneClinica || "").trim(),
    clinicaEmail: String(cfg.clinicaEmail || cfg.emailClinica || "").trim(),

    logoUrl: String(cfg.logoUrl || cfg.logoURL || cfg.logo || "").trim()
  };

  __DOC_CABECALHO_CACHE__ = out;
  return out;
}

/**
 * Permite limpar o cache (útil em testes ou quando atualizar config na mesma execução).
 */
function clearCabecalhoDocumentoCache_() {
  __DOC_CABECALHO_CACHE__ = null;
}

/**
 * Monta um HTML de cabeçalho para ser usado em documentos (HTML/PDF).
 * Retorna apenas o bloco do cabeçalho (sem <html>, sem <body>).
 */
function buildCabecalhoHtml_() {
  var c = getCabecalhoDocumento_();

  var logoHtml = "";
  if (c.logoUrl) {
    logoHtml =
      '<div style="flex:0 0 auto;margin-right:16px;">' +
        '<img src="' + safeAttr_(c.logoUrl) + '" alt="Logo" ' +
        'style="max-height:70px;max-width:160px;object-fit:contain;display:block;" />' +
      "</div>";
  }

  var medicoLinha2 = [];
  if (c.medicoEspecialidade) medicoLinha2.push(c.medicoEspecialidade);
  if (c.medicoCRM) medicoLinha2.push(c.medicoCRM);

  var medicoHtml =
    '<div style="flex:1 1 auto;min-width:0;">' +
      '<div style="font-size:14px;font-weight:bold;line-height:1.25;">' + safeHtml_(c.medicoNome) + "</div>" +
      '<div style="font-size:11px;color:#555;margin-top:2px;line-height:1.25;">' +
        safeHtml_(medicoLinha2.join(" • ")) +
      "</div>" +
    "</div>";

  var clinicaHtml = "";
  if (c.clinicaNome || c.clinicaEndereco || c.clinicaTelefone || c.clinicaEmail) {
    var partes = [];
    if (c.clinicaEndereco) partes.push(safeHtml_(c.clinicaEndereco));
    if (c.clinicaTelefone) partes.push("Tel: " + safeHtml_(c.clinicaTelefone));
    if (c.clinicaEmail) partes.push("E-mail: " + safeHtml_(c.clinicaEmail));

    clinicaHtml =
      '<div style="margin-top:6px;font-size:10px;color:#555;line-height:1.25;">' +
        (c.clinicaNome ? '<div style="font-weight:bold;">' + safeHtml_(c.clinicaNome) + "</div>" : "") +
        (partes.length ? "<div>" + partes.join(" • ") + "</div>" : "") +
      "</div>";
  }

  var html =
    '<div style="width:100%;border-bottom:1px solid #ccc;padding:8px 0 6px 0;margin-bottom:10px;">' +
      '<div style="display:flex;align-items:center;">' +
        logoHtml +
        medicoHtml +
      "</div>" +
      clinicaHtml +
    "</div>";

  return html;
}

/**
 * (Opcional) Rodapé padrão para documentos.
 * Retorna apenas o bloco do rodapé (sem <html>, sem <body>).
 */
function buildRodapeHtml_() {
  var c = getCabecalhoDocumento_();
  var linha = [];

  if (c.clinicaTelefone) linha.push("Tel: " + safeHtml_(c.clinicaTelefone));
  if (c.clinicaEmail) linha.push("E-mail: " + safeHtml_(c.clinicaEmail));

  var html =
    '<div style="width:100%;border-top:1px solid #e5e7eb;margin-top:14px;padding-top:8px;font-size:10px;color:#555;line-height:1.25;">' +
      (c.clinicaNome ? '<div style="font-weight:bold;">' + safeHtml_(c.clinicaNome) + "</div>" : "") +
      (c.clinicaEndereco ? "<div>" + safeHtml_(c.clinicaEndereco) + "</div>" : "") +
      (linha.length ? "<div>" + linha.join(" • ") + "</div>" : "") +
    "</div>";

  return html;
}

/**
 * Escape básico de HTML (texto).
 */
function safeHtml_(str) {
  if (str === null || typeof str === "undefined") return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Escape para atributos HTML (src/href).
 * Mantém compatibilidade e evita quebrar HTML com aspas.
 */
function safeAttr_(str) {
  // Usa safeHtml_ e remove quebras de linha (atributos)
  return safeHtml_(str).replace(/[\r\n]+/g, "");
}
