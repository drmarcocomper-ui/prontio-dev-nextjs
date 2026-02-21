import type { Metadata } from "next";
import SignupForm from "./signup-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignupPage() {
  return (
    <div className="flex min-h-screen font-[family-name:var(--font-geist-sans)]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-gradient-to-br from-primary-600 to-primary-700 p-12 text-white">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur-sm">
              P
            </div>
            <span className="text-xl font-bold tracking-tight">Prontio</span>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl font-bold leading-tight xl:text-4xl">
            Gestão simples e eficiente para seu consultório
          </h2>
          <p className="text-lg text-white/80">
            Agenda, prontuários, financeiro e muito mais em um só lugar.
          </p>

          <div className="space-y-4 pt-4">
            {[
              { icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5", label: "Agenda inteligente" },
              { icon: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z", label: "Prontuário eletrônico" },
              { icon: "M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z", label: "Controle financeiro" },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/90">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/50">
          &copy; {new Date().getFullYear()} Prontio
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-6 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold text-white">
              P
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Prontio
            </h1>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Crie sua conta
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Comece a usar o Prontio gratuitamente
            </p>
          </div>

          {/* Mobile subheading */}
          <p className="text-center text-sm text-gray-500 lg:hidden">
            Crie sua conta para começar
          </p>

          <SignupForm />

          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <a href="/termos" className="hover:text-gray-600 hover:underline">Termos de Uso</a>
            <span>&middot;</span>
            <a href="/privacidade" className="hover:text-gray-600 hover:underline">Política de Privacidade</a>
          </div>
        </div>
      </div>
    </div>
  );
}
