import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatarData,
  listAtividades,
  listAtividadesComAtraso,
} from "../../src/services/atividades";

function apiDevolve(porUrl) {
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url) =>
        new Response(JSON.stringify(porUrl[url] ?? []), { status: 200 }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("servico de atividades", () => {
  it("monta a URL so com os filtros preenchidos", async () => {
    apiDevolve({});

    await listAtividades({
      disciplina_id: "2",
      prioridade: "",
      status: "pendente",
      atrasadas: "",
    });
    await listAtividades();

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      "/api/atividades/?disciplina_id=2&status=pendente",
      "/api/atividades/",
    ]);
  });

  it("marca o atraso pela 2a consulta quando o filtro de prazo esta vazio", async () => {
    apiDevolve({
      "/api/atividades/?status=pendente": [{ id: 1 }, { id: 2 }],
      "/api/atividades/?status=pendente&atrasadas=true": [{ id: 2 }],
    });

    const atividades = await listAtividadesComAtraso({
      status: "pendente",
      atrasadas: "",
    });

    expect(atividades).toEqual([
      { id: 1, atrasada: false },
      { id: 2, atrasada: true },
    ]);
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("com atrasadas=%s faz uma unica consulta", async (valor, esperado) => {
    apiDevolve({ [`/api/atividades/?atrasadas=${valor}`]: [{ id: 7 }] });

    const atividades = await listAtividadesComAtraso({ atrasadas: valor });

    expect(fetch).toHaveBeenCalledOnce();
    expect(atividades).toEqual([{ id: 7, atrasada: esperado }]);
  });

  it("formata a data sem converter fuso horario", () => {
    expect(formatarData("2026-01-01")).toBe("01/01/2026");
    expect(formatarData("2026-12-31")).toBe("31/12/2026");
  });
});
