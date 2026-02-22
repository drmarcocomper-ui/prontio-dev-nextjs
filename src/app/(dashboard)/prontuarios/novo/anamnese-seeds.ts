export interface AnamneseTemplate {
  id: string;
  nome: string;
  texto: string;
}

export const SEED_EMAIL = "marcocomper@yahoo.com.br";

export const SEED_TEMPLATES: AnamneseTemplate[] = [
  {
    id: "seed-1",
    nome: "Adenoma de Adrenal",
    texto: `Atividade Plasmática da Renina, Testosterona
Cortisol livre urinário
Cortisol sérico
Aldosterona
Metanefrinas urinárias
Ácido Vanil Mandélico.`,
  },
  {
    id: "seed-2",
    nome: "Balanopostite",
    texto: `Paciente com queixa de irritação em região do pênis.
Medicação usada: nenhuma.
Nega relação extraconjugal.
Parceira assintomática.

Ao exame físico:
Escroto normal
Testículo direito normal.
Testículo esquerdo normal.
Pênis com hiperemia e descamativo.

Conduta:
Prescrevo Pronazol 150 mg, repetir com 01 semana.
Prescrevo Quadriderm creme por 05 a 07 dias.
Prescrevo Soapex para lavar.
Orientações gerais e sobre higiene íntima.`,
  },
  {
    id: "seed-3",
    nome: "DE",
    texto: `Casado, IMC normal, profissão:

Nega HAS. Nega DM. Medicação em uso: não.
Nega câncer de próstata na família. Nega etilismo. Nega tabagismo. Exercício Físico: não realiza.

Disfunção erétil. Libido diminuído. Masturbação regular. Relação com outra parceira: não. Medicação para ereção: não.

Conduta:
Orientações. Estimulo prática de exercício físico.
Prescrevo Tadalafila de 5,0 mg (oriento possíveis efeitos colaterais da medicação).
Prescrevo fórmula: Tribulus terrestris, Lepídium meyenii (maca), Yoimbina.
Solicito exames.`,
  },
  {
    id: "seed-4",
    nome: "EP",
    texto: `Casado, IMC normal, profissão:

Nega HAS.
Nega DM.
Medicação em uso: não.
Nega etilismo.
Nega tabagismo.
Exercício Físico: não realiza.

Paciente com queixa de ejaculação precoce de início há 06 meses.
Alega ser ansioso.
Nega disfunção erétil e diminuição da libido.

Conduta:
Prescrevo Paroxetina 20 mg.
Prescrevo fórmula: Tribulus terrestris, Lepídium meyenii (maca), Yoimbina.
Orientações sexuais e sobre ansiedade.
Estimulo realização de exercício físico.
Oriento Técnicas de treinamento do controle ejaculatório, como a de Semanas (stop-start).`,
  },
  {
    id: "seed-5",
    nome: "Hematospermia",
    texto: `Casado, IMC normal, profissão:

Nega HAS.
Nega DM.
Medicação em uso: não. Nega uso de anticoagulante
História Familiar: Nega câncer de próstata.
Nega etilismo.
Nega tabagismo.
Exercício Físico: não realiza.

Nega Luts.
Paciente com queixa de hematospermia (01 episódio).

Conduta:
Orientações.
Solicito exames.
Estimulo prática do exercício físico.`,
  },
  {
    id: "seed-6",
    nome: "Hemorroida",
    texto: `Paciente com queixa de dor em região anal.
Alega ainda aparecimento de "caroço" em região perianal.
Nega hematoquezia.
Ao exame presença de hemorróida.
Conduta:
Orientações.
Banho de assento com água morna.
Prescrevo Proctyl, Diosmin.
Encaminho ao proctologista para seguimento.`,
  },
  {
    id: "seed-7",
    nome: "Herpes - Aciclovir",
    texto: `Paciente com história de lesões vesiculares em Pênis de início há 01 semana.
Evoluindo com ruptura das vesículas para feridas ulceradas.
Ao exame físico: ferida ulceradas em pênis.
Conduta:
Orientações.
Prescrevo Aciclovir oral e tópico.
Solicito sorologia para DST.`,
  },
  {
    id: "seed-8",
    nome: "HPV + Eletrocauterização",
    texto: `Paciente com queixa de verruga em pênis.
Ao exame presença de verrugas em pênis.
Conduta: indico Eletrocauterização e Biópsia de Pênis, solicito sorologia DST.
Oriento que parceira deva ir ao Ginecologista.`,
  },
  {
    id: "seed-9",
    nome: "Incontinência Urinária - BH",
    texto: `Casado, IMC normal, profissão:
G00/A00/P00.

Nega glaucoma.
Nega constipação intestinal.
Nega HAS.
Nega DM.
Exercício físico: não realiza.
Ao exame: sem alterações.

Paciente com queixa de urgência e urge-incontinência miccional.
Nega perda urinárias aos esforços (tosse, espirros, gargalhada)

Conduta:
Orientações.
Solicito exames.
Prescrevo Retemic UD.`,
  },
  {
    id: "seed-10",
    nome: "Incontinência Urinária - IUE",
    texto: `Casado, IMC normal, profissão:
G00/A00/P00.

Nega glaucoma.
Nega constipação intestinal.
Nega HAS.
Nega DM.
Exercício físico: não realiza.
Ao exame: sem alterações.

Paciente com queixa de perda urinárias aos esforços (tosse, espirros, gargalhada).
Nega urgência e urge-incontinência.

Conduta:
Orientações.
Solicito exames.`,
  },
  {
    id: "seed-11",
    nome: "Incontinência Urinária - Mista",
    texto: `Casado, IMC normal, profissão:
G00/A00/P00.

Nega glaucoma.
Nega constipação intestinal.
Nega HAS.
Nega DM.
Exercício físico: não realiza.
Ao exame: sem alterações.

Paciente com queixa de perda urinárias aos esforços (tosse, espirros, gargalhada).
Alega ainda urgência e urge-incontinência.

Conduta:
Orientações.
Solicito exames.
Prescrevo Retemic UD.
Encaminho para Fisioterapia (20 sessões).`,
  },
  {
    id: "seed-12",
    nome: "Infertilidade",
    texto: `Esposa  anos e não possui filho. Último método anticoncepcional usado: ACO.
IMC:
Nega HAS
Nega DM

Ao exame físico: escroto, testículos e pênis sem alterações.

Queixa: infertilidade.
Não possui filho.
Nega DE, com libido normal.
Nega alteração no aspecto e volume do esperma.

Conduta:
Solicito exames.
Orientações.`,
  },
  {
    id: "seed-13",
    nome: "ITU",
    texto: `Paciente com queixa de disúria.
Nega outras queixas.
Ao exame físico sem alterações.
Conduta:
Solicito USG de Abdome.
Solicito EAS, Cultura de Urina, TSA.
Prescrevo Ciprofloxacino por 7 dias.`,
  },
  {
    id: "seed-14",
    nome: "Lombalgia",
    texto: `Casado, IMC normal, profissão:

Nega HAS.
Nega DM.
Medicação em uso: não.
História Familiar: Nega câncer de próstata.
Nega etilismo.
Nega tabagismo.
Exercício Físico: não realiza.

Lombalgia de início há 20 dias, relacionada aos esforços.

Conduta:
Orientações.
Solicito exames.`,
  },
  {
    id: "seed-15",
    nome: "Peyronie",
    texto: `Paciente com história de curvatura em pênis de início há
Ao exame físico: presença de placa em dorso do pênis.
Nega DM.
Conduta: prescrevo Vitamina E e Colchicina.`,
  },
  {
    id: "seed-16",
    nome: "Próstata",
    texto: `Casado, IMC normal, profissão:

Nega HAS. Nega DM. Medicação em uso: não.
Nega câncer de próstata na família. Nega etilismo. Nega tabagismo. Exercício Físico: não realiza.

Nega Luts.

Conduta:
Orientações. Estimulo prática do exercício físico. Solicito exames.`,
  },
  {
    id: "seed-17",
    nome: "Sífilis",
    texto: `Paciente com queixa de ferida em pênis de início há 02 semanas após relação sexual.
Ao exame físico: pênis com úlcera com boradas regulares e elevada em pênis.
Conduta: solicito exame de sorologia (VDRL, HCV, HBSAG, HIV), prescrevo Penicilina Benzatina 1.200.000 UI x 2 e retorno com exames.`,
  },
  {
    id: "seed-18",
    nome: "Testículo",
    texto: `Paciente com queixa de dor em testículo.
Nega outras queixas.
Nega uso de moto e bicicleta.
Esperma de coloração normal.
Exercício Físico: não.

Ao exame físico:
Escroto normal.
Testículo direito normal.
Testículo esquerdo normal.
Pênis normal.

Conduta:
Orientações.
Solicito exames.Prescrevo Tropinal e Oxotron.`,
  },
  {
    id: "seed-19",
    nome: "Uretrite",
    texto: `Paciente com história de relação sexual sem preservativo e queixa de corrimento uretral de início há 30 dias.
Nega outras queixas.
Ao exame pênis, escroto e testículos sem alterações.
Conduta: prescrevo Azitromicina 1g dose única e Ciprofloxacin.
Idem para parceira caso não tenha alergia.
Solicito exame de sorologia para DST.`,
  },
  {
    id: "seed-20",
    nome: "Vasectomia",
    texto: `Casado, esposa com  anos.
Método anticoncepcional usado: anticoncepcional oral.

História da Doença Atual:
Paciente vem solicitar operação de vasectomia, alega prole constituída.
Possui 02 filhos.

História Patológica Pregressa:
Nega HAS.
Nega DM.

Conduta:
Oriento sobre outros métodos anticoncepcionais;
Oriento riscos e possíveis complicações da cirurgia (hematoma, sangramento, dor, infecção, abscesso),
Oriento sobre possibilidade de reversão espontânea,
Oriento sobre necessidade de espermograma (após 25 ejaculações) pós vasectomia para liberação de relação sexual sem método anticoncepcional, até lá há risco de engravidar;
Encaminho ao psicólogo;
Forneço consentimento informado.`,
  },
  {
    id: "seed-21",
    nome: "Escabiose",
    texto: `Paciente com prurido, tipicamente pior à noite em genitália.
Ao exame físico: Pápulas eritematosas pequenas.
Conduta: Ivermectina e permetrina.`,
  },
];
