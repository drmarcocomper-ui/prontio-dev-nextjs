import LoginForm from "./login-form";

const ERROR_MESSAGES: Record<string, string> = {
  auth_erro: "Erro ao autenticar. Tente novamente.",
};
const FALLBACK_ERROR = "Ocorreu um erro. Tente novamente.";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? FALLBACK_ERROR) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-xl font-bold text-white">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Prontio
          </h1>
          <p className="text-sm text-gray-500">
            Entre para acessar o sistema
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  );
}
