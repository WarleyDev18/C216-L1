import { vi } from "vitest";

// Imita /disciplinas do FastAPI em memoria (status e mensagens iguais aos do backend),
// para os testes de componente nao dependerem de rede nem tocarem dados reais.
export function criarApiFalsa({ disciplinas = [], comAtividades = [] } = {}) {
  const registros = disciplinas.map((d) => ({ ...d }));
  let proximoId = Math.max(0, ...registros.map((d) => d.id)) + 1;

  const responder = (status, body) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  const naoEncontrada = () =>
    responder(404, { detail: "Disciplina não encontrada" });
  const duplicada = (dados, ignorarId) =>
    registros.some(
      (d) =>
        d.id !== ignorarId &&
        d.codigo === dados.codigo &&
        d.semestre === dados.semestre,
    );
  const DUPLICADA = {
    detail: "Já existe uma disciplina com esse código nesse semestre",
  };

  const fetch = vi.fn(async (url, { method = "GET", body } = {}) => {
    const rota = url.match(/^\/api\/disciplinas\/(\d+)?$/);
    if (!rota) return responder(404, { detail: "Not Found" });
    const id = rota[1] ? Number(rota[1]) : null;
    const dados = body ? JSON.parse(body) : null;
    const indice = registros.findIndex((d) => d.id === id);

    if (id === null && method === "GET") return responder(200, registros);
    if (id === null && method === "POST") {
      if (duplicada(dados)) return responder(409, DUPLICADA);
      const nova = {
        ...dados,
        id: proximoId++,
        created_at: "2026-06-15T12:00:00Z",
      };
      registros.push(nova);
      return responder(201, nova);
    }
    if (indice === -1) return naoEncontrada();
    if (method === "GET") return responder(200, registros[indice]);
    if (method === "PUT") {
      if (duplicada(dados, id)) return responder(409, DUPLICADA);
      registros[indice] = { ...registros[indice], ...dados };
      return responder(200, registros[indice]);
    }
    if (method === "DELETE") {
      if (comAtividades.includes(id)) {
        return responder(409, {
          detail:
            "Não é possível excluir a disciplina: existem atividades vinculadas a ela",
        });
      }
      registros.splice(indice, 1);
      return responder(204);
    }
    return responder(405, { detail: "Method Not Allowed" });
  });

  const chamadas = (metodo) =>
    fetch.mock.calls.filter(
      ([, opcoes = {}]) => (opcoes.method ?? "GET") === metodo,
    );

  return { fetch, registros, chamadas };
}

export const SD = {
  id: 1,
  nome: "Sistemas Distribuídos",
  codigo: "C216",
  semestre: "2026.2",
  created_at: "2026-06-01T12:00:00Z",
};

export const BD = {
  id: 2,
  nome: "Banco de Dados",
  codigo: "C215",
  semestre: "2026.2",
  created_at: "2026-06-01T12:00:00Z",
};
