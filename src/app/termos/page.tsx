import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Uso — Prontio",
  description: "Termos de uso do sistema Prontio para gestão de consultórios médicos.",
};

export default function TermosPage() {
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
          <Link href="/privacidade" className="text-sm text-sky-600 hover:text-sky-700 hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <article className="prose prose-gray max-w-none">
          <h1 className="text-3xl font-bold text-gray-900">Termos de Uso</h1>
          <p className="mt-2 text-sm text-gray-500">Última atualização: 21 de fevereiro de 2026</p>

          <section className="mt-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">1. Aceitação dos Termos</h2>
              <p className="mt-2 text-gray-600">
                Ao acessar e utilizar o sistema Prontio (&quot;Sistema&quot;), você concorda com estes Termos de Uso.
                O Sistema é destinado exclusivamente a profissionais de saúde e clínicas médicas para gestão
                de consultórios, incluindo agenda, prontuários eletrônicos, receitas, exames e controle financeiro.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">2. Descrição do Serviço</h2>
              <p className="mt-2 text-gray-600">
                O Prontio é um sistema web de gestão para consultórios médicos que oferece:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
                <li>Gerenciamento de pacientes e prontuários eletrônicos (modelo SOAP)</li>
                <li>Agendamento de consultas e controle de agenda</li>
                <li>Emissão de receitas médicas e solicitações de exames</li>
                <li>Controle financeiro de receitas e despesas</li>
                <li>Relatórios e exportação de dados</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">3. Cadastro e Responsabilidades do Usuário</h2>
              <p className="mt-2 text-gray-600">
                O usuário é responsável por manter a confidencialidade de suas credenciais de acesso
                e por todas as atividades realizadas em sua conta. Cada usuário possui um papel
                definido (profissional de saúde, gestor, financeiro, secretária) que determina
                seu nível de acesso no Sistema.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">4. Dados de Saúde e Sigilo Profissional</h2>
              <p className="mt-2 text-gray-600">
                O Sistema armazena dados sensíveis de saúde, conforme definido pelo Art. 5°, II da
                Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). O profissional de saúde
                é responsável pelo sigilo médico conforme o Código de Ética Médica (CFM) e deve
                garantir que o uso do Sistema esteja em conformidade com as normas do Conselho
                Federal de Medicina.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">5. Retenção de Dados</h2>
              <p className="mt-2 text-gray-600">
                Os prontuários médicos são mantidos pelo prazo mínimo de 20 (vinte) anos após o
                último registro, conforme Resolução CFM nº 1.821/2007. Demais dados serão mantidos
                pelo tempo necessário ao cumprimento das finalidades para as quais foram coletados.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">6. Propriedade Intelectual</h2>
              <p className="mt-2 text-gray-600">
                Todo o conteúdo do Sistema, incluindo interface, código-fonte, marcas e logotipos,
                são de propriedade exclusiva do Prontio. O uso do Sistema não confere ao usuário
                qualquer direito de propriedade intelectual.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">7. Limitação de Responsabilidade</h2>
              <p className="mt-2 text-gray-600">
                O Prontio não substitui o julgamento clínico do profissional de saúde. As decisões
                médicas são de responsabilidade exclusiva do profissional. O Sistema é fornecido
                &quot;como está&quot;, sem garantias de disponibilidade ininterrupta.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">8. Modificações dos Termos</h2>
              <p className="mt-2 text-gray-600">
                Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações
                entrarão em vigor após publicação no Sistema. O uso continuado após as alterações
                constitui aceitação dos novos Termos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">9. Foro</h2>
              <p className="mt-2 text-gray-600">
                Fica eleito o foro da comarca de Vitória/ES para dirimir quaisquer controvérsias
                decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.
              </p>
            </div>
          </section>
        </article>

        <div className="mt-10 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Prontio. Todos os direitos reservados.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/privacidade" className="text-sky-600 hover:text-sky-700 hover:underline">
              Política de Privacidade
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
