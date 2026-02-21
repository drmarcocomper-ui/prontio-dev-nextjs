import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidade — Prontio",
  description: "Política de privacidade e proteção de dados do sistema Prontio, em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/login" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-600 text-sm font-bold text-white">
              P
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">Prontio</span>
          </Link>
          <Link href="/termos" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
            Termos de Uso
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900">Política de Privacidade</h1>
          <p className="mt-2 text-sm text-gray-500">Última atualização: 21 de fevereiro de 2026</p>

          <div className="mt-6 rounded-lg border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm text-sky-800">
              Esta política foi elaborada em conformidade com a Lei Geral de Proteção de Dados
              Pessoais (LGPD — Lei nº 13.709/2018) e aplica-se ao tratamento de dados pessoais
              e dados sensíveis de saúde realizados pelo sistema Prontio.
            </p>
          </div>

          <section className="mt-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">1. Dados Coletados</h2>
              <p className="mt-2 text-gray-600">
                O Prontio coleta e trata as seguintes categorias de dados:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li>
                  <strong>Dados pessoais dos pacientes:</strong> nome, CPF, RG, data de nascimento,
                  sexo, estado civil, telefone, e-mail, endereço completo e convênio médico.
                </li>
                <li>
                  <strong>Dados sensíveis de saúde (Art. 5°, II):</strong> prontuários médicos
                  (evolução clínica no modelo SOAP), receitas médicas, solicitações de exames,
                  atestados e encaminhamentos.
                </li>
                <li>
                  <strong>Dados dos profissionais:</strong> nome, e-mail, papel/função na clínica
                  e registros de acesso ao sistema.
                </li>
                <li>
                  <strong>Dados financeiros:</strong> registros de transações (receitas e despesas)
                  vinculados à clínica.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">2. Base Legal para Tratamento (Art. 7° e Art. 11)</h2>
              <p className="mt-2 text-gray-600">O tratamento de dados pessoais no Prontio fundamenta-se nas seguintes bases legais:</p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li>
                  <strong>Tutela da saúde (Art. 7°, VIII e Art. 11, II, &quot;f&quot;):</strong> para
                  dados sensíveis de saúde tratados por profissionais de saúde no exercício de
                  suas atividades.
                </li>
                <li>
                  <strong>Execução de contrato (Art. 7°, V):</strong> para dados necessários à
                  prestação dos serviços contratados.
                </li>
                <li>
                  <strong>Obrigação legal/regulatória (Art. 7°, II):</strong> para cumprimento de
                  normas do CFM, incluindo a guarda de prontuários por 20 anos.
                </li>
                <li>
                  <strong>Legítimo interesse (Art. 7°, IX):</strong> para registros de auditoria
                  e segurança do sistema.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">3. Direitos do Titular (Art. 18)</h2>
              <p className="mt-2 text-gray-600">
                O titular dos dados pessoais tem direito a, mediante requisição:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li><strong>Confirmação e acesso:</strong> confirmar a existência e acessar seus dados pessoais.</li>
                <li><strong>Correção:</strong> solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
                <li><strong>Anonimização ou eliminação:</strong> solicitar a anonimização ou eliminação de dados desnecessários ou excessivos.</li>
                <li><strong>Portabilidade:</strong> solicitar a portabilidade dos dados a outro fornecedor (exportação em CSV).</li>
                <li><strong>Informação sobre compartilhamento:</strong> saber com quais entidades seus dados são compartilhados.</li>
                <li><strong>Revogação do consentimento:</strong> revogar o consentimento a qualquer momento, quando aplicável.</li>
              </ul>
              <p className="mt-2 text-gray-600">
                <strong>Nota importante:</strong> A eliminação de prontuários médicos está sujeita ao
                prazo legal de guarda de 20 anos (Resolução CFM nº 1.821/2007), não podendo ser
                realizada antes deste prazo.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">4. Segurança dos Dados</h2>
              <p className="mt-2 text-gray-600">
                O Prontio adota medidas técnicas e organizacionais para proteger os dados pessoais:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li><strong>Criptografia:</strong> todas as comunicações são protegidas por HTTPS/TLS.</li>
                <li><strong>Controle de acesso (Row Level Security):</strong> cada clínica acessa apenas seus próprios dados, com isolamento completo entre clínicas.</li>
                <li><strong>Papéis e permissões:</strong> acesso granular por função (profissional de saúde, gestor, financeiro, secretária).</li>
                <li><strong>Registros de auditoria:</strong> todas as operações sensíveis são registradas com identificação do usuário, data/hora e ação realizada.</li>
                <li><strong>Autenticação segura:</strong> autenticação via e-mail/senha com tokens seguros gerenciados pelo Supabase Auth.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">5. Retenção e Eliminação de Dados</h2>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li><strong>Prontuários médicos:</strong> 20 anos após o último registro (Resolução CFM nº 1.821/2007).</li>
                <li><strong>Dados financeiros:</strong> 5 anos, conforme legislação tributária.</li>
                <li><strong>Registros de auditoria:</strong> 5 anos para fins de segurança e conformidade.</li>
                <li><strong>Dados cadastrais:</strong> mantidos enquanto o vínculo com a clínica estiver ativo, podendo ser eliminados mediante solicitação.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">6. Compartilhamento de Dados</h2>
              <p className="mt-2 text-gray-600">
                Os dados pessoais tratados no Prontio não são comercializados ou compartilhados com
                terceiros para fins de marketing. O compartilhamento ocorre apenas:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li>Entre profissionais da mesma clínica, conforme seus papéis e permissões.</li>
                <li>Com o provedor de infraestrutura (Supabase/AWS), que atua como operador dos dados sob termos de processamento adequados.</li>
                <li>Quando exigido por ordem judicial ou autoridade competente.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">7. Transferência Internacional de Dados</h2>
              <p className="mt-2 text-gray-600">
                Os dados podem ser armazenados em servidores localizados fora do Brasil (infraestrutura
                Supabase/AWS). Esta transferência é realizada com base no Art. 33 da LGPD, garantindo
                nível adequado de proteção de dados.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">8. Contato do Encarregado (DPO)</h2>
              <p className="mt-2 text-gray-600">
                Para exercer seus direitos como titular de dados ou esclarecer dúvidas sobre esta
                política, entre em contato com o encarregado de proteção de dados (DPO) através
                do e-mail disponibilizado pela clínica responsável pelo seu atendimento.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">9. Alterações nesta Política</h2>
              <p className="mt-2 text-gray-600">
                Esta política pode ser atualizada periodicamente. As alterações entrarão em vigor
                após publicação no Sistema. Recomendamos a revisão periódica desta página.
              </p>
            </div>
          </section>
        </article>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Prontio. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/termos" className="text-sky-600 hover:text-sky-700 hover:underline">
              Termos de Uso
            </Link>
            <Link href="/login" className="text-sky-600 hover:text-sky-700 hover:underline">
              Voltar ao login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
