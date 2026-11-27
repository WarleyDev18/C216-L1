import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { criarApiFalsa } from "../helpers/apiFalsa";

beforeEach(() => {
  vi.stubGlobal("fetch", criarApiFalsa().fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renderiza o nome do sistema", async () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Gestor Acadêmico" }),
    ).toBeInTheDocument();
    await screen.findByText(/Nenhuma disciplina cadastrada/);
  });

  it("abre em Disciplinas e navega para as secoes futuras sem simular dados", async () => {
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole("navigation", { name: "Navegação principal" });
    await screen.findByText(/Nenhuma disciplina cadastrada/);

    expect(screen.getByRole("button", { name: "Disciplinas" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("button", { name: "Atividades" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Atividades" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Em desenvolvimento")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Dashboard" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disciplinas" }));
    expect(
      await screen.findByRole("heading", { level: 2, name: "Disciplinas" }),
    ).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });
});
