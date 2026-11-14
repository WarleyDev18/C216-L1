import { afterEach, describe, expect, it, vi } from "vitest";
import {
  API_URL,
  CONNECTION_ERROR,
  createItem,
  INVALID_DATA_ERROR,
  listItems,
} from "../../src/services/items";

const ITEMS_URL = `${API_URL}/items/`;

function mockResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      body === undefined
        ? Promise.reject(new SyntaxError("corpo vazio"))
        : Promise.resolve(body),
  };
}

function mockFetch(implementation) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("services/items", () => {
  it("usa a API local por padrão (sem VITE_API_URL)", () => {
    expect(API_URL).toBe("http://localhost:8000");
  });

  it("listItems faz GET em /items/ e devolve o JSON", async () => {
    const items = [{ id: 1, name: "Caneta", description: null }];
    const fetchMock = mockFetch(async () => mockResponse(200, items));

    await expect(listItems()).resolves.toEqual(items);
    expect(fetchMock).toHaveBeenCalledWith(ITEMS_URL, undefined);
  });

  it("createItem faz POST com JSON e devolve o item criado", async () => {
    const created = { id: 7, name: "Notebook", description: null };
    const fetchMock = mockFetch(async () => mockResponse(201, created));

    await expect(
      createItem({ name: "Notebook", description: "" }),
    ).resolves.toEqual(created);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(ITEMS_URL);
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({
      name: "Notebook",
      description: null,
    });
  });

  it("repassa a mensagem do backend no 409 (nome duplicado)", async () => {
    mockFetch(async () =>
      mockResponse(409, { detail: "Já existe um item com esse nome" }),
    );

    await expect(createItem({ name: "Notebook" })).rejects.toThrow(
      "Já existe um item com esse nome",
    );
  });

  it("traduz o 422 do FastAPI (detail em lista) para dados inválidos", async () => {
    mockFetch(async () =>
      mockResponse(422, {
        detail: [{ loc: ["body", "name"], msg: "Field required" }],
      }),
    );

    await expect(createItem({ name: "" })).rejects.toThrow(INVALID_DATA_ERROR);
  });

  it("usa mensagem padrão com o status quando o erro não tem JSON", async () => {
    mockFetch(async () => mockResponse(500));

    await expect(listItems()).rejects.toThrow(
      "Erro ao carregar os itens. (HTTP 500)",
    );
  });

  it("informa falha de conexão quando o fetch é rejeitado", async () => {
    mockFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(listItems()).rejects.toThrow(CONNECTION_ERROR);
  });
});
