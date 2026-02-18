import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import type { UsuarioListItem } from "@/app/(dashboard)/usuarios/types";

vi.mock("@/components/pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

vi.mock("@/components/search-input", () => ({
  SearchInput: ({ defaultValue }: { defaultValue?: string }) => (
    <input data-testid="search-input" defaultValue={defaultValue} />
  ),
}));

vi.mock("@/components/empty-state", () => ({
  EmptyStateIllustration: () => <div data-testid="empty-illustration" />,
}));

vi.mock("@/app/(dashboard)/usuarios/filters", () => ({
  PapelFilter: () => <div data-testid="papel-filter" />,
}));

vi.mock("./usuario-item", () => ({
  UsuarioItem: ({ usuario, isSelf }: { usuario: UsuarioListItem; isSelf: boolean }) => (
    <div data-testid="usuario-item" data-email={usuario.email} data-self={isSelf} />
  ),
}));

vi.mock("./novo-usuario-form", () => ({
  NovoUsuarioForm: () => <div data-testid="novo-usuario-form" />,
}));

import { UsuariosTab } from "./usuarios-tab";

const makeUsuario = (overrides: Partial<UsuarioListItem> = {}): UsuarioListItem => ({
  vinculo_id: "v-1",
  user_id: "u-1",
  email: "user@test.com",
  papel: "secretaria",
  clinica_id: "c-1",
  clinica_nome: "Clínica Teste",
  created_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const clinicas = [{ id: "c-1", nome: "Clínica Teste" }];

describe("UsuariosTab", () => {
  it("renderiza header com contagem singular", () => {
    render(
      <UsuariosTab items={[makeUsuario()]} totalItems={1} currentPage={1} q={undefined} papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    expect(screen.getByText("Seus usuários")).toBeInTheDocument();
    expect(screen.getByText("1 usuário vinculado")).toBeInTheDocument();
  });

  it("renderiza header com contagem plural", () => {
    render(
      <UsuariosTab items={[makeUsuario()]} totalItems={3} currentPage={1} q={undefined} papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    expect(screen.getByText("3 usuários vinculados")).toBeInTheDocument();
  });

  it("renderiza search input e filtro de papel", () => {
    render(
      <UsuariosTab items={[]} totalItems={0} currentPage={1} q={undefined} papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("papel-filter")).toBeInTheDocument();
  });

  it("renderiza UsuarioItem para cada usuário", () => {
    const items = [
      makeUsuario({ vinculo_id: "v-1", user_id: "u-1", email: "a@test.com" }),
      makeUsuario({ vinculo_id: "v-2", user_id: "u-2", email: "b@test.com" }),
    ];
    render(
      <UsuariosTab items={items} totalItems={2} currentPage={1} q={undefined} papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    const rendered = screen.getAllByTestId("usuario-item");
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveAttribute("data-email", "a@test.com");
    expect(rendered[1]).toHaveAttribute("data-email", "b@test.com");
  });

  it("passa isSelf=true quando user_id corresponde ao currentUserId", () => {
    render(
      <UsuariosTab items={[makeUsuario({ user_id: "u-me" })]} totalItems={1} currentPage={1} q={undefined} papel={undefined} currentUserId="u-me" clinicas={clinicas} />
    );
    expect(screen.getByTestId("usuario-item")).toHaveAttribute("data-self", "true");
  });

  it("passa isSelf=false quando user_id não corresponde", () => {
    render(
      <UsuariosTab items={[makeUsuario({ user_id: "u-other" })]} totalItems={1} currentPage={1} q={undefined} papel={undefined} currentUserId="u-me" clinicas={clinicas} />
    );
    expect(screen.getByTestId("usuario-item")).toHaveAttribute("data-self", "false");
  });

  it("mostra empty state quando não há itens", () => {
    render(
      <UsuariosTab items={[]} totalItems={0} currentPage={1} q={undefined} papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    expect(screen.getByText("Nenhum usuário encontrado")).toBeInTheDocument();
    expect(screen.getByText("Comece criando o primeiro usuário no formulário abaixo.")).toBeInTheDocument();
    expect(screen.getByTestId("empty-illustration")).toBeInTheDocument();
  });

  it("mostra mensagem de busca no empty state quando q é definido", () => {
    render(
      <UsuariosTab items={[]} totalItems={0} currentPage={1} q="teste" papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    expect(screen.getByText("Tente buscar com outros termos.")).toBeInTheDocument();
  });

  it("renderiza Pagination e NovoUsuarioForm", () => {
    render(
      <UsuariosTab items={[]} totalItems={0} currentPage={1} q={undefined} papel={undefined} currentUserId="u-99" clinicas={clinicas} />
    );
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(screen.getByTestId("novo-usuario-form")).toBeInTheDocument();
  });
});
