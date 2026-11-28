import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "../../src/services/api";

function respostaFalsa(status, body) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      body === undefined
        ? new Response(null, { status })
        : new Response(JSON.stringify(body), { status }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request", () => {
  it("usa /api como base e envia JSON", async () => {
    respostaFalsa(201, { id: 1 });

    expect(
      await request("/disciplinas/", { method: "POST", body: { a: 1 } }),
    ).toEqual({
      id: 1,
    });
    expect(fetch).toHaveBeenCalledWith("/api/disciplinas/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"a":1}',
    });
  });

  it("devolve null em 204", async () => {
    respostaFalsa(204);

    expect(await request("/disciplinas/1", { method: "DELETE" })).toBeNull();
  });

  it("transforma falha de rede em erro com status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    const erro = await request("/disciplinas/").catch((e) => e);

    expect(erro).toBeInstanceOf(ApiError);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch(/Não foi possível conectar à API/);
  });

  it.each([404, 409])(
    "repassa a mensagem do backend no HTTP %i",
    async (status) => {
      respostaFalsa(status, { detail: "Mensagem do backend" });

      const erro = await request("/disciplinas/1").catch((e) => e);

      expect([erro.status, erro.message]).toEqual([
        status,
        "Mensagem do backend",
      ]);
    },
  );

  it("mapeia os erros de validacao 422 por campo", async () => {
    respostaFalsa(422, {
      detail: [
        { loc: ["body", "semestre"], msg: "String should match pattern" },
        { loc: ["query", "x"], msg: "ignorado" },
      ],
    });

    const erro = await request("/disciplinas/").catch((e) => e);

    expect(erro.status).toBe(422);
    expect(erro.campos).toEqual({ semestre: "String should match pattern" });
  });

  it.each([
    [502, /Não foi possível conectar à API/],
    [503, /indisponível/],
    [500, "Erro inesperado na API (HTTP 500)."],
  ])("trata HTTP %i sem corpo JSON", async (status, mensagem) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Internal Server Error", { status })),
    );

    const erro = await request("/disciplinas/").catch((e) => e);

    expect(erro.status).toBe(status);
    expect(erro.message).toMatch(mensagem);
  });
});
