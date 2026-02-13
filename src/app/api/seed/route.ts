import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Bloqueia em produção
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Rota desabilitada em produção" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "true";
  const supabase = await createClient();

  // Verifica se está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Verifica se já tem dados
  const { count } = await supabase
    .from("pacientes")
    .select("*", { count: "exact", head: true });
  if (count && count > 0 && !force) {
    return NextResponse.json({
      message: `Banco já possui ${count} pacientes. Acesse /api/seed?force=true para inserir mesmo assim.`,
    });
  }

  // Limpa dados existentes se force=true (ordem respeita FKs)
  if (force) {
    await supabase.from("transacoes").delete().gte("created_at", "2000-01-01");
    await supabase.from("prontuarios").delete().gte("created_at", "2000-01-01");
    await supabase.from("agendamentos").delete().gte("created_at", "2000-01-01");
    await supabase.from("pacientes").delete().gte("created_at", "2000-01-01");
  }

  const hoje = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (d: Date, n: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };

  // ===== PACIENTES =====
  const pacientesData = [
    {
      nome: "Maria Silva Santos",
      cpf: "123.456.789-00",
      data_nascimento: "1985-03-15",
      sexo: "feminino",
      estado_civil: "casado",
      telefone: "(11) 99876-5432",
      email: "maria.silva@email.com",
      cep: "01001-000",
      endereco: "Rua Augusta",
      numero: "1200",
      bairro: "Consolação",
      cidade: "São Paulo",
      estado: "SP",
      convenio: "Unimed",
    },
    {
      nome: "João Pedro Oliveira",
      cpf: "987.654.321-00",
      data_nascimento: "1978-07-22",
      sexo: "masculino",
      estado_civil: "solteiro",
      telefone: "(11) 98765-4321",
      email: "joao.oliveira@email.com",
      cep: "04001-000",
      endereco: "Av. Paulista",
      numero: "900",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
    },
    {
      nome: "Ana Carolina Ferreira",
      cpf: "456.789.123-00",
      data_nascimento: "1992-11-08",
      sexo: "feminino",
      estado_civil: "solteiro",
      telefone: "(11) 97654-3210",
      email: "ana.ferreira@email.com",
      cep: "05001-000",
      endereco: "Rua Oscar Freire",
      numero: "450",
      bairro: "Jardins",
      cidade: "São Paulo",
      estado: "SP",
      convenio: "Bradesco Saúde",
    },
    {
      nome: "Carlos Eduardo Lima",
      cpf: "321.654.987-00",
      data_nascimento: "1965-01-30",
      sexo: "masculino",
      estado_civil: "casado",
      telefone: "(11) 96543-2109",
      email: "carlos.lima@email.com",
      cep: "02001-000",
      endereco: "Rua Voluntários da Pátria",
      numero: "300",
      bairro: "Santana",
      cidade: "São Paulo",
      estado: "SP",
    },
    {
      nome: "Beatriz Mendes Costa",
      cpf: "654.321.987-00",
      data_nascimento: "2000-05-12",
      sexo: "feminino",
      estado_civil: "solteiro",
      telefone: "(11) 95432-1098",
      email: "beatriz.costa@email.com",
      cep: "03001-000",
      endereco: "Rua da Mooca",
      numero: "180",
      bairro: "Mooca",
      cidade: "São Paulo",
      estado: "SP",
      convenio: "SulAmérica",
    },
    {
      nome: "Roberto Alves Souza",
      cpf: "789.123.456-00",
      data_nascimento: "1958-09-03",
      sexo: "masculino",
      estado_civil: "viuvo",
      telefone: "(11) 94321-0987",
      email: "roberto.souza@email.com",
      cidade: "São Paulo",
      estado: "SP",
    },
    {
      nome: "Fernanda Rodrigues",
      cpf: "111.222.333-00",
      data_nascimento: "1990-12-25",
      sexo: "feminino",
      estado_civil: "uniao_estavel",
      telefone: "(11) 93210-9876",
      email: "fernanda.rodrigues@email.com",
      cidade: "Guarulhos",
      estado: "SP",
      convenio: "Amil",
    },
    {
      nome: "Pedro Henrique Barbosa",
      cpf: "444.555.666-00",
      data_nascimento: "1973-04-18",
      sexo: "masculino",
      estado_civil: "divorciado",
      telefone: "(11) 92109-8765",
      cidade: "Osasco",
      estado: "SP",
    },
  ];

  const { data: pacientes, error: errPacientes } = await supabase
    .from("pacientes")
    .insert(pacientesData)
    .select("id, nome");

  if (errPacientes) {
    return NextResponse.json(
      { error: "Erro ao inserir pacientes", detail: errPacientes.message },
      { status: 500 }
    );
  }

  const pIds = pacientes!.map((p) => p.id);

  // ===== AGENDAMENTOS =====
  const agendamentosData = [
    // Hoje
    { paciente_id: pIds[0], data: formatDate(hoje), hora_inicio: "08:00", hora_fim: "08:30", tipo: "consulta", status: "atendido" },
    { paciente_id: pIds[1], data: formatDate(hoje), hora_inicio: "09:00", hora_fim: "09:30", tipo: "retorno", status: "atendido" },
    { paciente_id: pIds[2], data: formatDate(hoje), hora_inicio: "10:00", hora_fim: "10:45", tipo: "consulta", status: "confirmado" },
    { paciente_id: pIds[3], data: formatDate(hoje), hora_inicio: "11:00", hora_fim: "11:30", tipo: "avaliacao", status: "agendado" },
    { paciente_id: pIds[4], data: formatDate(hoje), hora_inicio: "14:00", hora_fim: "14:30", tipo: "consulta", status: "agendado" },
    { paciente_id: pIds[5], data: formatDate(hoje), hora_inicio: "15:00", hora_fim: "15:45", tipo: "procedimento", status: "agendado" },
    // Ontem
    { paciente_id: pIds[6], data: formatDate(addDays(hoje, -1)), hora_inicio: "09:00", hora_fim: "09:30", tipo: "consulta", status: "atendido" },
    { paciente_id: pIds[7], data: formatDate(addDays(hoje, -1)), hora_inicio: "10:00", hora_fim: "10:30", tipo: "retorno", status: "atendido" },
    { paciente_id: pIds[0], data: formatDate(addDays(hoje, -1)), hora_inicio: "14:00", hora_fim: "14:30", tipo: "exame", status: "faltou" },
    // Dias anteriores deste mês
    { paciente_id: pIds[1], data: formatDate(addDays(hoje, -3)), hora_inicio: "08:30", hora_fim: "09:00", tipo: "consulta", status: "atendido" },
    { paciente_id: pIds[2], data: formatDate(addDays(hoje, -5)), hora_inicio: "11:00", hora_fim: "11:30", tipo: "consulta", status: "atendido" },
    { paciente_id: pIds[3], data: formatDate(addDays(hoje, -7)), hora_inicio: "09:00", hora_fim: "09:30", tipo: "retorno", status: "atendido" },
    { paciente_id: pIds[4], data: formatDate(addDays(hoje, -10)), hora_inicio: "14:00", hora_fim: "14:45", tipo: "procedimento", status: "atendido" },
    { paciente_id: pIds[5], data: formatDate(addDays(hoje, -12)), hora_inicio: "10:00", hora_fim: "10:30", tipo: "consulta", status: "cancelado" },
    // Amanhã
    { paciente_id: pIds[6], data: formatDate(addDays(hoje, 1)), hora_inicio: "08:00", hora_fim: "08:30", tipo: "retorno", status: "agendado" },
    { paciente_id: pIds[7], data: formatDate(addDays(hoje, 1)), hora_inicio: "09:00", hora_fim: "09:30", tipo: "consulta", status: "confirmado" },
  ];

  const { error: errAgendamentos } = await supabase
    .from("agendamentos")
    .insert(agendamentosData);

  if (errAgendamentos) {
    return NextResponse.json(
      { error: "Erro ao inserir agendamentos", detail: errAgendamentos.message },
      { status: 500 }
    );
  }

  // ===== PRONTUÁRIOS =====
  const prontuariosData = [
    {
      paciente_id: pIds[0],
      data: formatDate(hoje),
      tipo: "consulta",
      cid: "J06",
      queixa_principal: "Dor de garganta e febre há 3 dias",
      historia_doenca: "Paciente refere odinofagia intensa, febre de 38.5°C e mal-estar geral. Nega tosse ou dispneia.",
      exame_fisico: "Orofaringe hiperemiada com pontos purulentos em amígdalas bilateralmente. Linfonodos cervicais palpáveis.",
      hipotese_diagnostica: "Amigdalite bacteriana aguda",
      conduta: "Amoxicilina 500mg 8/8h por 7 dias. Ibuprofeno 600mg 8/8h por 3 dias. Retorno em 7 dias.",
    },
    {
      paciente_id: pIds[1],
      data: formatDate(hoje),
      tipo: "retorno",
      cid: "I10",
      queixa_principal: "Retorno para controle de hipertensão",
      historia_doenca: "Paciente em uso regular de Losartana 50mg. Refere boa adesão ao tratamento. PA em casa variando de 130-140/80-90.",
      exame_fisico: "PA: 135/85 mmHg. FC: 72 bpm. Ausculta cardíaca e pulmonar sem alterações.",
      hipotese_diagnostica: "Hipertensão arterial sistêmica em controle parcial",
      conduta: "Aumentar Losartana para 100mg/dia. Manter dieta hipossódica e atividade física. Retorno em 30 dias com exames.",
    },
    {
      paciente_id: pIds[2],
      data: formatDate(addDays(hoje, -5)),
      tipo: "consulta",
      cid: "M54.5",
      queixa_principal: "Lombalgia há 2 semanas",
      historia_doenca: "Dor lombar que piora ao longo do dia, sem irradiação. Relaciona com postura no trabalho (home office).",
      exame_fisico: "Dor à palpação em musculatura paravertebral L4-L5. Sem déficit neurológico. Lasègue negativo.",
      hipotese_diagnostica: "Lombalgia mecânica",
      conduta: "Ciclobenzaprina 10mg à noite por 10 dias. Orientação postural. Encaminhamento para fisioterapia.",
    },
    {
      paciente_id: pIds[3],
      data: formatDate(addDays(hoje, -7)),
      tipo: "retorno",
      cid: "E11",
      queixa_principal: "Controle de diabetes tipo 2",
      exame_fisico: "Glicemia de jejum: 145 mg/dL. HbA1c: 7.8%. IMC: 29.5.",
      hipotese_diagnostica: "Diabetes mellitus tipo 2 em controle parcial",
      conduta: "Ajustar Metformina para 850mg 2x/dia. Reforçar orientação dietética. Solicitar exames de controle. Retorno em 60 dias.",
    },
    {
      paciente_id: pIds[6],
      data: formatDate(addDays(hoje, -1)),
      tipo: "consulta",
      cid: "F41.1",
      queixa_principal: "Ansiedade e dificuldade para dormir",
      historia_doenca: "Há 2 meses com preocupação excessiva, tensão muscular e insônia inicial. Nega ideação suicida.",
      hipotese_diagnostica: "Transtorno de ansiedade generalizada",
      conduta: "Sertralina 50mg/dia. Orientação sobre higiene do sono. Encaminhamento para psicoterapia. Retorno em 30 dias.",
    },
    {
      paciente_id: pIds[7],
      data: formatDate(addDays(hoje, -1)),
      tipo: "retorno",
      queixa_principal: "Acompanhamento pós-operatório",
      exame_fisico: "Ferida operatória em boa cicatrização. Sem sinais flogísticos.",
      conduta: "Manter curativos diários. Retirada de pontos em 5 dias. Alta do acompanhamento cirúrgico.",
    },
  ];

  const { error: errProntuarios } = await supabase
    .from("prontuarios")
    .insert(prontuariosData);

  if (errProntuarios) {
    return NextResponse.json(
      { error: "Erro ao inserir prontuários", detail: errProntuarios.message },
      { status: 500 }
    );
  }

  // ===== TRANSAÇÕES =====
  const transacoesData = [
    // Receitas deste mês
    { tipo: "receita", categoria: "consulta", descricao: "Consulta - Maria Silva Santos", valor: 350, data: formatDate(hoje), paciente_id: pIds[0], forma_pagamento: "convenio", status: "pago" },
    { tipo: "receita", categoria: "retorno", descricao: "Retorno - João Pedro Oliveira", valor: 200, data: formatDate(hoje), paciente_id: pIds[1], forma_pagamento: "pix", status: "pago" },
    { tipo: "receita", categoria: "consulta", descricao: "Consulta - Ana Carolina Ferreira", valor: 350, data: formatDate(addDays(hoje, -5)), paciente_id: pIds[2], forma_pagamento: "cartao_credito", status: "pago" },
    { tipo: "receita", categoria: "retorno", descricao: "Retorno - Carlos Eduardo Lima", valor: 200, data: formatDate(addDays(hoje, -7)), paciente_id: pIds[3], forma_pagamento: "dinheiro", status: "pago" },
    { tipo: "receita", categoria: "procedimento", descricao: "Procedimento - Beatriz Mendes Costa", valor: 800, data: formatDate(addDays(hoje, -10)), paciente_id: pIds[4], forma_pagamento: "convenio", status: "pago" },
    { tipo: "receita", categoria: "consulta", descricao: "Consulta - Fernanda Rodrigues", valor: 350, data: formatDate(addDays(hoje, -1)), paciente_id: pIds[6], forma_pagamento: "pix", status: "pago" },
    { tipo: "receita", categoria: "consulta", descricao: "Consulta - João Pedro Oliveira", valor: 350, data: formatDate(addDays(hoje, -3)), paciente_id: pIds[1], forma_pagamento: "cartao_debito", status: "pago" },
    { tipo: "receita", categoria: "consulta", descricao: "Consulta - Roberto Alves Souza", valor: 350, data: formatDate(addDays(hoje, -12)), paciente_id: pIds[5], forma_pagamento: "pix", status: "cancelado" },
    // Receitas pendentes
    { tipo: "receita", categoria: "consulta", descricao: "Consulta - Ana Carolina Ferreira (hoje)", valor: 350, data: formatDate(hoje), paciente_id: pIds[2], forma_pagamento: "convenio", status: "pendente" },
    // Despesas
    { tipo: "despesa", categoria: "aluguel", descricao: "Aluguel do consultório", valor: 3500, data: formatDate(addDays(hoje, -15)), forma_pagamento: "boleto", status: "pago" },
    { tipo: "despesa", categoria: "material", descricao: "Material de escritório e descartáveis", valor: 420, data: formatDate(addDays(hoje, -8)), forma_pagamento: "cartao_credito", status: "pago" },
    { tipo: "despesa", categoria: "imposto", descricao: "ISS mensal", valor: 280, data: formatDate(addDays(hoje, -5)), forma_pagamento: "boleto", status: "pago" },
    { tipo: "despesa", categoria: "salario", descricao: "Salário secretária", valor: 2800, data: formatDate(addDays(hoje, -2)), forma_pagamento: "transferencia", status: "pago" },
    { tipo: "despesa", categoria: "equipamento", descricao: "Manutenção do ar condicionado", valor: 350, data: formatDate(addDays(hoje, -4)), forma_pagamento: "pix", status: "pago" },
  ];

  const { error: errTransacoes } = await supabase
    .from("transacoes")
    .insert(transacoesData);

  if (errTransacoes) {
    return NextResponse.json(
      { error: "Erro ao inserir transações", detail: errTransacoes.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Seed concluído com sucesso!",
    totais: {
      pacientes: pacientesData.length,
      agendamentos: agendamentosData.length,
      prontuarios: prontuariosData.length,
      transacoes: transacoesData.length,
    },
  });
}
