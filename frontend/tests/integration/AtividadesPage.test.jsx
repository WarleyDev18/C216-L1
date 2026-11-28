import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AtividadesPage } from "../../src/pages/AtividadesPage";
import {
  BD,
  criarApiFalsa,
  LISTA,
  PROJETO,
  PROVA,
  SD,
} from "../helpers/apiFalsa";

const TODAS = { disciplinas: [SD, BD], atividades: [LISTA, PROVA, PROJETO] };

// `preparar` roda antes do render, para mockar ja as chamadas da montagem.
function montar(opcoes, { preparar = () => {}, ...props } = {}) {
  const api = criarApiFalsa(opcoes);
  preparar(api);
  vi.stubGlobal("fetch", api.fetch);
  const user = userEvent.setup();
  render(<AtividadesPage {...props} />);
  return { api, user };
}

const campo = (label) => screen.getByLabelText(label);
const lista = () =>
  screen.findByRole("list", { name: "Atividades cadastradas" });
const titulosNaLista = async () =>
  within(await lista())
    .getAllByRole("listitem")
    .map((item) => item.querySelector("p").textContent);
const item = async (titulo) =>
  within(await lista())
    .getAllByRole("listitem")
    .find((li) => li.querySelector("p").textContent === titulo);
const ultimaUrl = (api) => api.chamadas("GET", "atividades").at(-1)[0];

async function preencher(user, valores) {
  if (valores.titulo !== undefined) {
    await user.clear(campo("Título"));
    if (valores.titulo) await user.type(campo("Título"), valores.titulo);
  }
  if (valores.disciplina !== undefined)
    await user.selectOptions(campo("Disciplina"), valores.disciplina);
  // jsdom nao digita em <input type="date">: o valor chega pronto, como no navegador.
  if (valores.data !== undefined)
    fireEvent.change(campo("Data de entrega"), {
      target: { value: valores.data },
    });
  if (valores.prioridade)
    await user.selectOptions(campo("Prioridade"), valores.prioridade);
  if (valores.status) await user.selectOptions(campo("Status"), valores.status);
  if (valores.descricao !== undefined) {
    await user.clear(campo("Descrição (opcional)"));
    if (valores.descricao)
      await user.type(campo("Descrição (opcional)"), valores.descricao);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AtividadesPage - listagem", () => {
  it("renderiza a pagina e mostra o carregamento inicial", async () => {
    const { api } = montar(TODAS);

    expect(
      screen.getByRole("heading", { level: 2, name: "Atividades" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Carregando atividades...")).toBeInTheDocument();

    await lista();
    expect(
      screen.queryByText("Carregando atividades..."),
    ).not.toBeInTheDocument();
    // Lista + 2a consulta do atraso + disciplinas (para o select e os nomes).
    expect(api.chamadas("GET", "atividades").map(([url]) => url)).toEqual([
      "/api/atividades/",
      "/api/atividades/?atrasadas=true",
    ]);
    expect(api.chamadas("GET", "disciplinas")).toHaveLength(1);
  });

  it("mostra mensagem quando nao ha atividades", async () => {
    montar({ disciplinas: [SD] });

    expect(
      await screen.findByText("Nenhuma atividade cadastrada ainda."),
    ).toBeInTheDocument();
  });

  it("lista titulo, disciplina, data, prioridade, status e atraso", async () => {
    montar(TODAS);

    expect(await titulosNaLista()).toEqual(["Lista 1", "Prova 1", "Projeto"]);

    const lista1 = await item("Lista 1");
    expect(lista1).toHaveTextContent("C216 — Sistemas Distribuídos");
    expect(lista1).toHaveTextContent("Entrega: 10/06/2026");
    expect(lista1).toHaveTextContent("Prioridade alta");
    expect(lista1).toHaveTextContent("Pendente");
    expect(within(lista1).getByText("Atrasada")).toBeInTheDocument();

    // Vencida mas concluida nao e atrasada; entrega hoje tambem nao.
    const prova = await item("Prova 1");
    expect(prova).toHaveTextContent("Capítulos 1 a 3");
    expect(prova).toHaveTextContent("Concluída");
    expect(within(prova).queryByText("Atrasada")).not.toBeInTheDocument();
    const projeto = await item("Projeto");
    expect(projeto).toHaveTextContent("C215 — Banco de Dados");
    expect(projeto).toHaveTextContent("Em andamento");
    expect(within(projeto).queryByText("Atrasada")).not.toBeInTheDocument();
  });

  it("mostra erro de conexao e permite tentar novamente", async () => {
    const { user } = montar(TODAS, {
      preparar: (api) =>
        api.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch")),
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API. Verifique se o backend está em execução.",
    );

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await titulosNaLista()).toHaveLength(3);
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});

describe("AtividadesPage - cadastro", () => {
  it("cadastra com a disciplina selecionada, limpa o form e atualiza a lista", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await preencher(user, {
      titulo: "  Seminário ",
      disciplina: "2",
      data: "2026-12-10",
      prioridade: "alta",
      descricao: "Apresentar em dupla",
    });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Atividade "Seminário" cadastrada.',
    );
    const [, { body }] = api.chamadas("POST", "atividades")[0];
    expect(JSON.parse(body)).toEqual({
      titulo: "Seminário",
      descricao: "Apresentar em dupla",
      disciplina_id: 2,
      data_entrega: "2026-12-10",
      prioridade: "alta",
      status: "pendente",
    });
    expect(campo("Título")).toHaveValue("");
    expect(campo("Disciplina")).toHaveValue("");
    expect(campo("Data de entrega")).toHaveValue("");
    expect(campo("Prioridade")).toHaveValue("media");
    // A lista vem de um novo GET, nao de um "chute" local.
    expect(await titulosNaLista()).toContain("Seminário");
    expect(await item("Seminário")).toHaveTextContent("C215 — Banco de Dados");
  });

  it("envia descricao vazia como null", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await preencher(user, {
      titulo: "Lista 2",
      disciplina: "1",
      data: "2026-07-01",
    });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    );

    await screen.findByRole("status");
    const [, { body }] = api.chamadas("POST", "atividades")[0];
    expect(JSON.parse(body).descricao).toBeNull();
  });

  it("valida campos obrigatorios sem chamar a API", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.click(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    );

    expect(campo("Título")).toHaveAccessibleDescription(
      "Informe o título (até 200 caracteres).",
    );
    expect(campo("Disciplina")).toHaveAccessibleDescription(
      "Selecione a disciplina da atividade.",
    );
    expect(campo("Data de entrega")).toHaveAccessibleDescription(
      "Informe uma data de entrega válida.",
    );
    expect(campo("Prioridade")).not.toHaveAttribute("aria-invalid");
    expect(api.chamadas("POST")).toHaveLength(0);
  });

  it("bloqueia o cadastro e orienta quando nao ha disciplinas", async () => {
    const irParaDisciplinas = vi.fn();
    const { api, user } = montar(
      {},
      { onIrParaDisciplinas: irParaDisciplinas },
    );

    expect(
      await screen.findByText(/Cadastre uma disciplina primeiro/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    ).toBeDisabled();
    expect(campo("Título")).toBeDisabled();
    expect(api.chamadas("POST")).toHaveLength(0);

    await user.click(
      screen.getByRole("button", { name: "Ir para Disciplinas" }),
    );
    expect(irParaDisciplinas).toHaveBeenCalledOnce();
  });

  it("mostra o erro da API e preserva o formulario (disciplina removida: 422)", async () => {
    const { api, user } = montar(TODAS);
    await lista();
    // Outra aba excluiu a disciplina depois que a pagina carregou.
    api.registros.splice(1, 1);

    await preencher(user, {
      titulo: "Seminário",
      disciplina: "2",
      data: "2026-12-10",
    });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Disciplina informada não existe",
    );
    expect(campo("Título")).toHaveValue("Seminário");
    expect(campo("Disciplina")).toHaveValue("2");
    expect(campo("Data de entrega")).toHaveValue("2026-12-10");
    expect(await titulosNaLista()).toHaveLength(3);
  });

  it("impede envio duplicado enquanto a requisicao esta em andamento", async () => {
    const { api, user } = montar(TODAS);
    await lista();
    let liberar;
    api.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          liberar = () =>
            resolve(new Response(JSON.stringify(LISTA), { status: 201 }));
        }),
    );

    await preencher(user, {
      titulo: "Seminário",
      disciplina: "1",
      data: "2026-12-10",
    });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar atividade" }),
    );

    const botao = screen.getByRole("button", { name: "Salvando..." });
    expect(botao).toBeDisabled();
    await user.click(botao);
    expect(api.chamadas("POST")).toHaveLength(1);

    liberar();
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});

describe("AtividadesPage - edicao e exclusao", () => {
  it("edita carregando os valores atuais e atualiza a lista", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.click(screen.getByRole("button", { name: "Editar Lista 1" }));

    expect(
      await screen.findByRole("heading", { name: "Editar atividade" }),
    ).toBeInTheDocument();
    expect(campo("Título")).toHaveValue("Lista 1");
    expect(campo("Título")).toHaveFocus();
    expect(campo("Disciplina")).toHaveValue("1");
    expect(campo("Data de entrega")).toHaveValue("2026-06-10");
    expect(campo("Prioridade")).toHaveValue("alta");
    expect(campo("Status")).toHaveValue("pendente");

    await preencher(user, {
      titulo: "Lista 1 (revisada)",
      status: "concluida",
    });
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Atividade "Lista 1 (revisada)" atualizada.',
    );
    const [url, { body }] = api.chamadas("PUT", "atividades")[0];
    expect(url).toBe("/api/atividades/1");
    expect(JSON.parse(body)).toMatchObject({
      titulo: "Lista 1 (revisada)",
      status: "concluida",
      disciplina_id: 1,
    });
    // Concluida deixa de estar atrasada (vem do backend na nova busca).
    const atualizada = await item("Lista 1 (revisada)");
    expect(atualizada).toHaveTextContent("Concluída");
    expect(within(atualizada).queryByText("Atrasada")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nova atividade" }),
    ).toBeInTheDocument();
  });

  it("preserva o formulario quando a atualizacao falha", async () => {
    const { api, user } = montar(TODAS);
    await lista();
    await user.click(screen.getByRole("button", { name: "Editar Lista 1" }));
    await screen.findByRole("heading", { name: "Editar atividade" });
    api.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: [{ loc: ["body", "titulo"], msg: "String too long" }],
        }),
        { status: 422 },
      ),
    );

    await preencher(user, { titulo: "Outro título" });
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dados inválidos. Verifique os campos destacados.",
    );
    expect(campo("Título")).toHaveAttribute("aria-invalid", "true");
    expect(campo("Título")).toHaveValue("Outro título");
    expect(
      screen.getByRole("heading", { name: "Editar atividade" }),
    ).toBeInTheDocument();
  });

  it("avisa quando a atividade nao existe mais ao editar (404)", async () => {
    const { api, user } = montar(TODAS);
    await lista();
    api.tarefas.splice(0, 1);

    await user.click(screen.getByRole("button", { name: "Editar Lista 1" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Atividade não encontrada",
    );
    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Prova 1", "Projeto"]),
    );
  });

  it("exclui apos confirmar e atualiza a lista", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.click(screen.getByRole("button", { name: "Excluir Prova 1" }));
    const dialogo = screen.getByRole("alertdialog", {
      name: "Excluir atividade?",
    });
    expect(dialogo).toHaveTextContent("Prova 1");
    expect(dialogo).toHaveTextContent("01/06/2026");

    await user.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Atividade "Prova 1" excluída.',
    );
    expect(api.chamadas("DELETE", "atividades")[0][0]).toBe(
      "/api/atividades/2",
    );
    expect(await titulosNaLista()).toEqual(["Lista 1", "Projeto"]);
  });

  it("cancela a exclusao sem enviar DELETE", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.click(screen.getByRole("button", { name: "Excluir Prova 1" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(api.chamadas("DELETE")).toHaveLength(0);
    expect(await titulosNaLista()).toHaveLength(3);
  });

  it("mantem a atividade e mostra o erro quando a exclusao falha", async () => {
    const { api, user } = montar(TODAS);
    await lista();
    api.fetch.mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 }),
    );

    await user.click(screen.getByRole("button", { name: "Excluir Prova 1" }));
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Erro inesperado na API (HTTP 500).",
    );
    expect(await titulosNaLista()).toContain("Prova 1");
  });
});

describe("AtividadesPage - filtros", () => {
  it("filtra por disciplina usando o query parameter da API", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.selectOptions(campo("Filtrar por disciplina"), "2");

    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Projeto"]),
    );
    expect(api.chamadas("GET", "atividades").map(([url]) => url)).toContain(
      "/api/atividades/?disciplina_id=2",
    );
  });

  it("filtra por prioridade", async () => {
    const { user } = montar(TODAS);
    await lista();

    await user.selectOptions(campo("Filtrar por prioridade"), "alta");

    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Lista 1", "Prova 1"]),
    );
  });

  it("filtra por status", async () => {
    const { user } = montar(TODAS);
    await lista();

    await user.selectOptions(campo("Filtrar por status"), "em_andamento");

    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Projeto"]),
    );
  });

  it("filtra atrasadas e sem atraso pela regra do backend", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.selectOptions(campo("Filtrar por prazo"), "true");
    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Lista 1"]),
    );
    expect(ultimaUrl(api)).toBe("/api/atividades/?atrasadas=true");
    expect(within(await item("Lista 1")).getByText("Atrasada")).toBeVisible();

    await user.selectOptions(campo("Filtrar por prazo"), "false");
    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Prova 1", "Projeto"]),
    );
    expect(ultimaUrl(api)).toBe("/api/atividades/?atrasadas=false");
  });

  it("combina filtros, mostra estado vazio e limpa os filtros", async () => {
    const { api, user } = montar(TODAS);
    await lista();

    await user.selectOptions(campo("Filtrar por disciplina"), "1");
    await user.selectOptions(campo("Filtrar por prioridade"), "alta");
    await user.selectOptions(campo("Filtrar por status"), "concluida");
    await waitFor(async () =>
      expect(await titulosNaLista()).toEqual(["Prova 1"]),
    );
    expect(api.chamadas("GET", "atividades").map(([url]) => url)).toContain(
      "/api/atividades/?disciplina_id=1&prioridade=alta&status=concluida",
    );

    await user.selectOptions(campo("Filtrar por prazo"), "true");
    expect(
      await screen.findByText(
        "Nenhuma atividade corresponde aos filtros selecionados.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar filtros" }));

    await waitFor(async () => expect(await titulosNaLista()).toHaveLength(3));
    expect(campo("Filtrar por disciplina")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Limpar filtros" }),
    ).toBeDisabled();
  });
});
