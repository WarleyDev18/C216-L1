import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DisciplinasPage } from "../../src/pages/DisciplinasPage";
import { BD, criarApiFalsa, SD } from "../helpers/apiFalsa";

// `preparar` roda antes do render, para mockar ja o GET da montagem.
function montar(opcoes, preparar = () => {}) {
  const api = criarApiFalsa(opcoes);
  preparar(api);
  vi.stubGlobal("fetch", api.fetch);
  const user = userEvent.setup();
  render(<DisciplinasPage />);
  return { api, user };
}

const campo = (nome) => screen.getByLabelText(nome);
const lista = () =>
  screen.findByRole("list", { name: "Disciplinas cadastradas" });

async function preencher(user, { nome, codigo, semestre }) {
  for (const [label, valor] of [
    ["Nome", nome],
    ["Código", codigo],
    ["Semestre", semestre],
  ]) {
    await user.clear(campo(label));
    if (valor) await user.type(campo(label), valor);
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DisciplinasPage", () => {
  it("renderiza titulo, formulario e mostra o carregamento inicial", async () => {
    montar();

    expect(
      screen.getByRole("heading", { level: 2, name: "Disciplinas" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Carregando disciplinas...")).toBeInTheDocument();
    expect(campo("Nome")).toBeInTheDocument();
    expect(campo("Código")).toBeInTheDocument();
    expect(campo("Semestre")).toBeInTheDocument();

    await screen.findByText(/Nenhuma disciplina cadastrada/);
    expect(
      screen.queryByText("Carregando disciplinas..."),
    ).not.toBeInTheDocument();
  });

  it("mostra mensagem quando nao ha disciplinas", async () => {
    montar();

    expect(
      await screen.findByText(/Nenhuma disciplina cadastrada ainda/),
    ).toBeInTheDocument();
  });

  it("lista as disciplinas com nome, codigo, semestre e acoes", async () => {
    montar({ disciplinas: [SD, BD] });

    const itens = within(await lista()).getAllByRole("listitem");
    expect(itens).toHaveLength(2);
    expect(itens[0]).toHaveTextContent("Sistemas Distribuídos");
    expect(itens[0]).toHaveTextContent("C216");
    expect(itens[0]).toHaveTextContent("Semestre 2026.2");
    expect(
      within(itens[0]).getByRole("button", {
        name: "Editar Sistemas Distribuídos",
      }),
    ).toBeInTheDocument();
    expect(
      within(itens[0]).getByRole("button", {
        name: "Excluir Sistemas Distribuídos",
      }),
    ).toBeInTheDocument();
  });

  it("cadastra, confirma, limpa o formulario e atualiza a lista", async () => {
    const { api, user } = montar();
    await screen.findByText(/Nenhuma disciplina cadastrada/);

    await preencher(user, {
      nome: "  Sistemas Distribuídos ",
      codigo: "c216",
      semestre: "2026.2",
    });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Disciplina "Sistemas Distribuídos" cadastrada.',
    );
    // Envia os dados normalizados como o backend espera.
    const [, { body }] = api.chamadas("POST")[0];
    expect(JSON.parse(body)).toEqual({
      nome: "Sistemas Distribuídos",
      codigo: "C216",
      semestre: "2026.2",
    });
    expect(campo("Nome")).toHaveValue("");
    expect(campo("Código")).toHaveValue("");
    expect(campo("Semestre")).toHaveValue("");
    // A lista vem de um novo GET, nao de um "chute" local.
    expect(api.chamadas("GET")).toHaveLength(2);
    expect(
      within(await lista()).getByText("Sistemas Distribuídos"),
    ).toBeInTheDocument();
  });

  it("valida campos obrigatorios e o formato do semestre sem chamar a API", async () => {
    const { api, user } = montar();
    await screen.findByText(/Nenhuma disciplina cadastrada/);

    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );

    expect(campo("Nome")).toHaveAccessibleDescription(
      "Informe o nome da disciplina (até 120 caracteres).",
    );
    expect(campo("Código")).toHaveAttribute("aria-invalid", "true");
    expect(campo("Semestre")).toHaveAccessibleDescription(
      "Informe o semestre no formato AAAA.1 ou AAAA.2 (ex.: 2026.2).",
    );

    await preencher(user, { nome: "SD", codigo: "C216", semestre: "2026.3" });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );

    expect(campo("Semestre")).toHaveAttribute("aria-invalid", "true");
    expect(campo("Nome")).not.toHaveAttribute("aria-invalid");
    expect(api.chamadas("POST")).toHaveLength(0);
  });

  it("recusa cadastro duplicado (409) e preserva os dados digitados", async () => {
    const { user } = montar({ disciplinas: [SD] });
    await lista();

    await preencher(user, {
      nome: "Outra",
      codigo: "C216",
      semestre: "2026.2",
    });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe uma disciplina com esse código nesse semestre",
    );
    expect(campo("Nome")).toHaveValue("Outra");
    expect(campo("Código")).toHaveValue("C216");
    expect(campo("Semestre")).toHaveValue("2026.2");
    expect(within(await lista()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("preserva os dados e destaca o campo quando a API recusa com 422", async () => {
    const { api, user } = montar();
    await screen.findByText(/Nenhuma disciplina cadastrada/);
    api.fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: [{ loc: ["body", "codigo"], msg: "String too long" }],
        }),
        { status: 422 },
      ),
    );

    await preencher(user, { nome: "SD", codigo: "C216", semestre: "2026.2" });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Dados inválidos. Verifique os campos destacados.",
    );
    expect(campo("Código")).toHaveAttribute("aria-invalid", "true");
    expect(campo("Nome")).toHaveValue("SD");
    expect(campo("Código")).toHaveValue("C216");
  });

  it("impede envio duplicado enquanto a requisicao esta em andamento", async () => {
    const { api, user } = montar();
    await screen.findByText(/Nenhuma disciplina cadastrada/);
    let liberar;
    api.fetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          liberar = () =>
            resolve(new Response(JSON.stringify(SD), { status: 201 }));
        }),
    );

    await preencher(user, { nome: "SD", codigo: "C216", semestre: "2026.2" });
    await user.click(
      screen.getByRole("button", { name: "Cadastrar disciplina" }),
    );

    const botao = screen.getByRole("button", { name: "Salvando..." });
    expect(botao).toBeDisabled();
    expect(campo("Nome")).toBeDisabled();
    await user.click(botao);
    expect(api.chamadas("POST")).toHaveLength(1);

    liberar();
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("edita uma disciplina carregando os valores atuais", async () => {
    const { api, user } = montar({ disciplinas: [SD, BD] });
    await lista();

    await user.click(
      screen.getByRole("button", { name: "Editar Sistemas Distribuídos" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Editar disciplina" }),
    ).toBeInTheDocument();
    expect(campo("Nome")).toHaveValue("Sistemas Distribuídos");
    expect(campo("Nome")).toHaveFocus();
    expect(campo("Código")).toHaveValue("C216");
    expect(campo("Semestre")).toHaveValue("2026.2");

    await preencher(user, {
      nome: "Sistemas Distribuídos II",
      codigo: "C216",
      semestre: "2026.1",
    });
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Disciplina "Sistemas Distribuídos II" atualizada.',
    );
    const [url, { method }] = api.chamadas("PUT")[0];
    expect([url, method]).toEqual(["/api/disciplinas/1", "PUT"]);
    expect(
      within(await lista()).getByText("Sistemas Distribuídos II"),
    ).toBeInTheDocument();
    expect(
      within(await lista()).getByText("Semestre 2026.1"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Nova disciplina" }),
    ).toBeInTheDocument();
  });

  it("cancela a edicao sem enviar nada", async () => {
    const { api, user } = montar({ disciplinas: [SD] });
    await lista();

    await user.click(
      screen.getByRole("button", { name: "Editar Sistemas Distribuídos" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Cancelar edição" }),
    );

    expect(
      screen.getByRole("heading", { name: "Nova disciplina" }),
    ).toBeInTheDocument();
    expect(campo("Nome")).toHaveValue("");
    expect(api.chamadas("PUT")).toHaveLength(0);
  });

  it("exclui apos confirmar e atualiza a lista", async () => {
    const { api, user } = montar({ disciplinas: [SD, BD] });
    await lista();

    await user.click(
      screen.getByRole("button", { name: "Excluir Sistemas Distribuídos" }),
    );
    const dialogo = screen.getByRole("alertdialog", {
      name: "Excluir disciplina?",
    });
    expect(dialogo).toHaveTextContent("Sistemas Distribuídos");
    expect(
      within(dialogo).getByRole("button", { name: "Cancelar" }),
    ).toHaveFocus();

    await user.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      'Disciplina "Sistemas Distribuídos" excluída.',
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(api.chamadas("DELETE")).toHaveLength(1);
    const itens = within(await lista()).getAllByRole("listitem");
    expect(itens).toHaveLength(1);
    expect(itens[0]).toHaveTextContent("Banco de Dados");
  });

  it("cancela a exclusao pelo botao ou pela tecla Esc sem enviar DELETE", async () => {
    const { api, user } = montar({ disciplinas: [SD] });
    await lista();

    await user.click(
      screen.getByRole("button", { name: "Excluir Sistemas Distribuídos" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Excluir Sistemas Distribuídos" }),
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    expect(api.chamadas("DELETE")).toHaveLength(0);
    expect(within(await lista()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("explica o bloqueio quando a disciplina tem atividades (409)", async () => {
    const { user } = montar({ disciplinas: [SD], comAtividades: [SD.id] });
    await lista();

    await user.click(
      screen.getByRole("button", { name: "Excluir Sistemas Distribuídos" }),
    );
    await user.click(screen.getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não é possível excluir a disciplina: existem atividades vinculadas a ela",
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(within(await lista()).getAllByRole("listitem")).toHaveLength(1);
  });

  it("mostra erro de conexao e permite tentar novamente", async () => {
    const { user } = montar({ disciplinas: [SD] }, (api) =>
      api.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch")),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API. Verifique se o backend está em execução.",
    );
    expect(screen.queryByText(/Nenhuma disciplina/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(
      within(await lista()).getByText("Sistemas Distribuídos"),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
  });
});
