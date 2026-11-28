import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "../../src/pages/DashboardPage";
import {
  BD,
  criarApiFalsa,
  LISTA,
  PROJETO,
  PROVA,
  SD,
} from "../helpers/apiFalsa";

// Com HOJE = 2026-06-15: LISTA atrasada, PROVA concluida, PROJETO vence hoje.
const SEMINARIO = {
  ...PROJETO,
  id: 4,
  disciplina_id: 1,
  titulo: "Seminário",
  data_entrega: "2026-06-30",
  prioridade: "media",
  status: "pendente",
};
const RELATORIO = {
  ...PROJETO,
  id: 5,
  disciplina_id: 2,
  titulo: "Relatório",
  data_entrega: "2026-06-20",
  prioridade: "baixa",
  status: "pendente",
};
const COMPLETO = {
  disciplinas: [SD, BD],
  atividades: [LISTA, PROVA, PROJETO, SEMINARIO, RELATORIO],
};

function montar(opcoes, { preparar = () => {} } = {}) {
  const api = criarApiFalsa(opcoes);
  preparar(api);
  vi.stubGlobal("fetch", api.fetch);
  const onNavegar = vi.fn();
  const user = userEvent.setup();
  render(<DashboardPage onNavegar={onNavegar} />);
  return { api, user, onNavegar };
}

// Faz so as URLs que contem `trecho` responderem com `resposta()`.
function falharEm(api, trecho, resposta) {
  const original = api.fetch.getMockImplementation();
  api.fetch.mockImplementation((url, opcoes) =>
    url.includes(trecho) ? resposta() : original(url, opcoes),
  );
}

const indicador = (rotulo) =>
  screen.getByText(rotulo, { selector: "dt" }).parentElement.querySelector("dd")
    .textContent;
const carregado = () =>
  screen.findByRole("heading", { name: "Próximas Entregas" });
const titulos = (nomeLista) =>
  within(screen.getByRole("list", { name: nomeLista }))
    .getAllByRole("listitem")
    .map((li) => li.querySelector("p").textContent);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DashboardPage - indicadores", () => {
  it("renderiza o titulo e mostra o carregamento inicial", async () => {
    const { api } = montar(COMPLETO);

    expect(
      screen.getByRole("heading", { level: 2, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Carregando indicadores...")).toBeInTheDocument();

    await carregado();
    expect(
      screen.queryByText("Carregando indicadores..."),
    ).not.toBeInTheDocument();
    expect(api.chamadas("GET").map(([url]) => url)).toEqual([
      "/api/dashboard/resumo",
      "/api/atividades/",
      "/api/atividades/?atrasadas=true",
      "/api/disciplinas/",
    ]);
  });

  it("mostra os numeros devolvidos pela API", async () => {
    montar(COMPLETO);
    await carregado();

    expect(indicador("Disciplinas")).toBe("2");
    expect(indicador("Atividades")).toBe("5");
    expect(indicador("Pendentes")).toBe("3");
    expect(indicador("Em andamento")).toBe("1");
    expect(indicador("Concluídas")).toBe("1");
    expect(indicador("Atrasadas")).toBe("1");
  });

  it("calcula o percentual concluido a partir do resumo", async () => {
    montar(COMPLETO);
    await carregado();

    const barra = screen.getByRole("progressbar", {
      name: "Progresso acadêmico",
    });
    expect(barra).toHaveAttribute("aria-valuenow", "20");
    expect(screen.getByText("20% concluído")).toBeInTheDocument();
    expect(
      screen.getByText("1 de 5 atividades concluídas"),
    ).toBeInTheDocument();
  });

  it("mostra zeros, 0% e orienta o cadastro com o banco vazio", async () => {
    const { user, onNavegar } = montar({});
    await carregado();

    for (const rotulo of [
      "Disciplinas",
      "Atividades",
      "Pendentes",
      "Em andamento",
      "Concluídas",
      "Atrasadas",
    ]) {
      expect(indicador(rotulo)).toBe("0");
    }
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    expect(screen.getByText("0% concluído")).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma disciplina cadastrada/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Nenhuma entrega pendente a partir de hoje."),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );
    expect(onNavegar).toHaveBeenCalledWith("disciplinas");
  });

  it("mostra 0% e orienta quando ha disciplinas mas nenhuma atividade", async () => {
    const { user, onNavegar } = montar({ disciplinas: [SD] });
    await carregado();

    expect(indicador("Disciplinas")).toBe("1");
    expect(screen.getByText("0% concluído")).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma atividade cadastrada/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Nenhuma disciplina cadastrada/),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    );
    expect(onNavegar).toHaveBeenCalledWith("atividades");
  });
});

describe("DashboardPage - proximas entregas", () => {
  it("lista as abertas por prazo, com disciplina, data, prioridade e status", async () => {
    montar(COMPLETO);
    await carregado();

    // Ordem por data, nao pela ordem de cadastro (Seminario foi cadastrado antes).
    expect(titulos("A vencer")).toEqual(["Projeto", "Relatório", "Seminário"]);
    const projeto = within(screen.getByRole("list", { name: "A vencer" }))
      .getAllByRole("listitem")
      .at(0);
    expect(projeto).toHaveTextContent("C215 — Banco de Dados");
    expect(projeto).toHaveTextContent("15/06/2026");
    expect(projeto).toHaveTextContent("Prioridade baixa");
    expect(projeto).toHaveTextContent("Em andamento");
  });

  it("separa as atrasadas e deixa as concluidas de fora", async () => {
    montar(COMPLETO);
    await carregado();

    expect(titulos("Atrasadas")).toEqual(["Lista 1"]);
    expect(
      within(screen.getByRole("list", { name: "Atrasadas" })).getByText(
        "Atrasada",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Prova 1")).not.toBeInTheDocument();
  });

  it("mostra mensagem quando todas as atividades estao concluidas", async () => {
    montar({ disciplinas: [SD], atividades: [PROVA] });
    await carregado();

    expect(
      screen.getByText("Nenhuma entrega pendente a partir de hoje."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("list", { name: "Atrasadas" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("100% concluído")).toBeInTheDocument();
  });

  it("limita cada lista as 5 entregas mais proximas", async () => {
    const muitas = Array.from({ length: 7 }, (_, i) => ({
      ...SEMINARIO,
      id: 10 + i,
      titulo: `Tarefa ${7 - i}`,
      data_entrega: `2026-07-0${7 - i}`,
    }));
    montar({ disciplinas: [SD], atividades: muitas });
    await carregado();

    expect(titulos("A vencer")).toEqual([
      "Tarefa 1",
      "Tarefa 2",
      "Tarefa 3",
      "Tarefa 4",
      "Tarefa 5",
    ]);
  });
});

describe("DashboardPage - erros", () => {
  it("nao inventa indicadores quando o resumo falha, e permite tentar de novo", async () => {
    const { user, api } = montar(COMPLETO, {
      preparar: (api) =>
        falharEm(
          api,
          "/dashboard/resumo",
          () => new Response("erro", { status: 500 }),
        ),
    });
    await carregado();

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Erro inesperado na API (HTTP 500).",
    );
    expect(screen.queryByText("Disciplinas", { selector: "dt" })).toBeNull();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    // As entregas carregaram normalmente.
    expect(titulos("A vencer")).toHaveLength(3);

    // A API volta: proximas chamadas respondem normalmente.
    api.fetch.mockImplementation(criarApiFalsa(COMPLETO).fetch);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(indicador("Atividades")).toBe("5"));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra o erro so na secao de entregas quando as atividades falham", async () => {
    montar(COMPLETO, {
      preparar: (api) =>
        falharEm(api, "/api/atividades/", () =>
          Promise.reject(new TypeError("Failed to fetch")),
        ),
    });
    await carregado();

    const secao = screen
      .getByRole("heading", { name: "Próximas Entregas" })
      .closest("section");
    expect(within(secao).getByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API",
    );
    expect(indicador("Atividades")).toBe("5");
  });

  it("mostra erro de conexao sem numeros quando a API esta fora do ar", async () => {
    montar(COMPLETO, {
      preparar: (api) =>
        api.fetch.mockImplementation(() =>
          Promise.reject(new TypeError("Failed to fetch")),
        ),
    });
    await carregado();

    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("Atividades", { selector: "dt" })).toBeNull();
  });
});
