import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";
import { criarApiFalsa, LISTA, SD } from "../helpers/apiFalsa";

function montar(opcoes) {
  vi.stubGlobal("fetch", criarApiFalsa(opcoes).fetch);
  const user = userEvent.setup();
  render(<App />);
  return { user };
}

const menu = (nome) =>
  within(
    screen.getByRole("navigation", { name: "Navegação principal" }),
  ).getByRole("button", { name: nome });
const indicador = (rotulo) =>
  screen.getByText(rotulo, { selector: "dt" }).parentElement.querySelector("dd")
    .textContent;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("renderiza o nome do sistema e abre no Dashboard", async () => {
    montar();

    expect(
      screen.getByRole("heading", { level: 1, name: "Gestor Acadêmico" }),
    ).toBeInTheDocument();
    expect(menu("Dashboard")).toHaveAttribute("aria-current", "page");
    expect(
      await screen.findByRole("heading", { name: "Próximas Entregas" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Dashboard · Gestor Acadêmico");
  });

  it("navega entre Dashboard, Disciplinas e Atividades", async () => {
    const { user } = montar();
    await screen.findByRole("heading", { name: "Próximas Entregas" });

    await user.click(menu("Disciplinas"));
    expect(menu("Disciplinas")).toHaveAttribute("aria-current", "page");
    expect(menu("Dashboard")).not.toHaveAttribute("aria-current");
    expect(
      await screen.findByText(/Nenhuma disciplina cadastrada ainda/),
    ).toBeInTheDocument();
    expect(document.title).toBe("Disciplinas · Gestor Acadêmico");

    await user.click(menu("Atividades"));
    expect(
      screen.getByRole("heading", { level: 2, name: "Atividades" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Cadastre uma disciplina primeiro/),
    ).toBeInTheDocument();

    await user.click(menu("Dashboard"));
    expect(
      screen.getByRole("heading", { level: 2, name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("funciona pelo teclado: atalho para o conteudo e foco apos navegar", async () => {
    const { user } = montar();
    await screen.findByRole("heading", { name: "Próximas Entregas" });

    await user.tab();
    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo" }),
    ).toHaveFocus();

    await user.tab();
    expect(menu("Dashboard")).toHaveFocus();
    await user.tab();
    await user.keyboard("{Enter}");

    expect(menu("Disciplinas")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main")).toHaveFocus();
  });

  it("leva de Atividades para Disciplinas quando nao ha disciplinas", async () => {
    const { user } = montar();

    await user.click(menu("Atividades"));
    await user.click(
      await screen.findByRole("button", { name: "Ir para Disciplinas" }),
    );

    expect(menu("Disciplinas")).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", { name: "Nova disciplina" }),
    ).toBeInTheDocument();
  });

  it("o Dashboard reflete o que mudou nas outras paginas", async () => {
    const { user } = montar({ disciplinas: [SD], atividades: [LISTA] });
    await screen.findByRole("heading", { name: "Próximas Entregas" });
    expect(indicador("Atividades")).toBe("1");
    expect(indicador("Atrasadas")).toBe("1");

    await user.click(menu("Atividades"));
    await user.click(
      await screen.findByRole("button", { name: "Excluir Lista 1" }),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    await screen.findByText('Atividade "Lista 1" excluída.');

    await user.click(menu("Dashboard"));
    await screen.findByRole("heading", { name: "Próximas Entregas" });
    await waitFor(() => expect(indicador("Atividades")).toBe("0"));
    expect(indicador("Atrasadas")).toBe("0");
  });
});
