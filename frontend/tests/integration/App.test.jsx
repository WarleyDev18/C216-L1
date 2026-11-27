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

  it("abre em Disciplinas e navega entre as secoes", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText(/Nenhuma disciplina cadastrada/);

    expect(screen.getByRole("button", { name: "Disciplinas" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await user.click(screen.getByRole("button", { name: "Atividades" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Atividades" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Nenhuma atividade cadastrada ainda."),
    ).toBeInTheDocument();

    // Dashboard ainda nao existe: aparece como em desenvolvimento, sem dados falsos.
    await user.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(
      screen.getByRole("heading", { level: 2, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Em desenvolvimento")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Disciplinas" }));
    expect(
      await screen.findByRole("heading", { level: 2, name: "Disciplinas" }),
    ).toBeInTheDocument();
  });

  it("leva de Atividades para Disciplinas quando nao ha disciplinas", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Atividades" }));
    await user.click(
      await screen.findByRole("button", { name: "Ir para Disciplinas" }),
    );

    expect(screen.getByRole("button", { name: "Disciplinas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("heading", { name: "Nova disciplina" }),
    ).toBeInTheDocument();
  });
});
