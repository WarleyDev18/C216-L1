import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../../src/App";

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

// GET /items/ responde com `initialItems`; POST usa `onPost` (sucesso ou erro).
function mockApi({ initialItems = [], onPost } = {}) {
  const fetchMock = vi.fn((_url, options) =>
    options?.method === "POST"
      ? onPost(JSON.parse(options.body))
      : Promise.resolve(mockResponse(200, initialItems)),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function fillAndSubmit(user, name, description) {
  await user.type(screen.getByLabelText("Nome"), name);
  if (description)
    await user.type(screen.getByLabelText("Descrição"), description);
  await user.click(screen.getByRole("button", { name: "Adicionar" }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("App (formulário + lista + API mockada)", () => {
  it("mostra o carregamento enquanto a API não responde", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {})),
    );
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando itens...");
  });

  it("mostra a lista vazia quando a API não tem itens", async () => {
    mockApi();
    render(<App />);

    expect(
      await screen.findByText("Nenhum item cadastrado."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("lista os itens vindos da API", async () => {
    mockApi({
      initialItems: [
        { id: 1, name: "Caneta", description: "Azul" },
        { id: 2, name: "Caderno", description: null },
      ],
    });
    render(<App />);

    const rows = await screen.findAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Caneta");
    expect(rows[0]).toHaveTextContent("Azul");
    expect(rows[1]).toHaveTextContent("Caderno");
  });

  it("mostra erro quando não consegue conectar à API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API.",
    );
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("cadastra pela API, mostra o item e limpa o formulário", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi({
      onPost: async (body) => mockResponse(201, { id: 10, ...body }),
    });
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await fillAndSubmit(user, "Notebook", "16GB de RAM");

    const row = await screen.findByRole("listitem");
    expect(row).toHaveTextContent("Notebook");
    expect(row).toHaveTextContent("16GB de RAM");
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Descrição")).toHaveValue("");

    const postCall = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "POST",
    );
    expect(JSON.parse(postCall[1].body)).toEqual({
      name: "Notebook",
      description: "16GB de RAM",
    });
  });

  it("desabilita o botão enquanto o cadastro está em andamento", async () => {
    const user = userEvent.setup();
    mockApi({ onPost: () => new Promise(() => {}) });
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await fillAndSubmit(user, "Notebook");

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
  });

  it("mostra o erro de nome duplicado e preserva o que foi digitado", async () => {
    const user = userEvent.setup();
    mockApi({
      onPost: async () =>
        mockResponse(409, { detail: "Já existe um item com esse nome" }),
    });
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await fillAndSubmit(user, "Notebook", "repetido");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um item com esse nome",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Notebook");
    expect(screen.getByLabelText("Descrição")).toHaveValue("repetido");
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled();
  });

  it("preserva os dados quando a conexão cai durante o cadastro", async () => {
    const user = userEvent.setup();
    mockApi({
      onPost: () => Promise.reject(new TypeError("Failed to fetch")),
    });
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await fillAndSubmit(user, "Mouse");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível conectar à API.",
    );
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
  });

  it("não chama a API quando o nome é inválido", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi();
    render(<App />);
    await screen.findByText("Nenhum item cadastrado.");

    await fillAndSubmit(user, "   ");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "O nome é obrigatório.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1); // apenas o GET inicial
  });
});
