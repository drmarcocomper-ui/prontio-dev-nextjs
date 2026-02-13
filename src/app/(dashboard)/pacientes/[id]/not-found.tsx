import { ModuleNotFound } from "@/components/module-not-found";

export default function PacienteNotFound() {
  return <ModuleNotFound backHref="/pacientes" backLabel="Voltar a pacientes" />;
}
