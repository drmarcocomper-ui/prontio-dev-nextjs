import type { Metadata } from "next";
import { EsqueciSenhaForm } from "./esqueci-senha-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function EsqueciSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold text-white">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Recuperar senha
          </h1>
          <p className="text-center text-sm text-gray-500">
            Informe seu e-mail para receber um link de redefinição de senha
          </p>
        </div>

        <EsqueciSenhaForm />
      </div>
    </div>
  );
}
