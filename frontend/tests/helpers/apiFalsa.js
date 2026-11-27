import { vi } from "vitest";

// "Hoje" fixo da API falsa: os testes nao dependem do dia em que rodam.
export const HOJE = "2026-06-15";

// Imita /disciplinas e /atividades do FastAPI em memoria (status, mensagens e
// filtros iguais aos do backend), para os testes de componente nao dependerem
// de rede nem tocarem dados reais.
export function criarApiFalsa({
  disciplinas = [],
  atividades = [],
  comAtividades = [],
} = {}) {
  const registros = disciplinas.map((d) => ({ ...d }));
  const tarefas = atividades.map((a) => ({ ...a }));
  const proximo = (lista) => Math.max(0, ...lista.map((r) => r.id)) + 1;
  let proximaDisciplina = proximo(registros);
  let proximaAtividade = proximo(tarefas);

  const responder = (status, body) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
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
  // Mesma regra do backend (Atividade.atrasada_em); datas ISO comparam como texto.
  const atrasada = (a) => a.data_entrega < HOJE && a.status !== "concluida";

  function rotaDisciplinas(id, method, dados) {
    const indice = registros.findIndex((d) => d.id === id);
    if (id === null && method === "GET") return responder(200, registros);
    if (id === null && method === "POST") {
      if (duplicada(dados)) return responder(409, DUPLICADA);
      const nova = {
        ...dados,
        id: proximaDisciplina++,
        created_at: "2026-06-15T12:00:00Z",
      };
      registros.push(nova);
      return responder(201, nova);
    }
    if (indice === -1)
      return responder(404, { detail: "Disciplina não encontrada" });
    if (method === "GET") return responder(200, registros[indice]);
    if (method === "PUT") {
      if (duplicada(dados, id)) return responder(409, DUPLICADA);
      registros[indice] = { ...registros[indice], ...dados };
      return responder(200, registros[indice]);
    }
    if (method === "DELETE") {
      const temAtividades =
        comAtividades.includes(id) ||
        tarefas.some((a) => a.disciplina_id === id);
      if (temAtividades) {
        return responder(409, {
          detail:
            "Não é possível excluir a disciplina: existem atividades vinculadas a ela",
        });
      }
      registros.splice(indice, 1);
      return responder(204);
    }
    return responder(405, { detail: "Method Not Allowed" });
  }

  function rotaAtividades(id, method, dados, query) {
    const indice = tarefas.findIndex((a) => a.id === id);
    const disciplinaExiste = () =>
      registros.some((d) => d.id === dados.disciplina_id);
    const DISCIPLINA_INEXISTENTE = {
      detail: "Disciplina informada não existe",
    };

    if (id === null && method === "GET") {
      const f = Object.fromEntries(query);
      const filtradas = tarefas.filter(
        (a) =>
          (!f.disciplina_id || a.disciplina_id === Number(f.disciplina_id)) &&
          (!f.prioridade || a.prioridade === f.prioridade) &&
          (!f.status || a.status === f.status) &&
          (!f.atrasadas || atrasada(a) === (f.atrasadas === "true")),
      );
      return responder(200, filtradas);
    }
    if (id === null && method === "POST") {
      if (!disciplinaExiste()) return responder(422, DISCIPLINA_INEXISTENTE);
      const nova = {
        prioridade: "media",
        status: "pendente",
        descricao: null,
        ...dados,
        id: proximaAtividade++,
        created_at: "2026-06-15T12:00:00Z",
        updated_at: "2026-06-15T12:00:00Z",
      };
      tarefas.push(nova);
      return responder(201, nova);
    }
    if (indice === -1)
      return responder(404, { detail: "Atividade não encontrada" });
    if (method === "GET") return responder(200, tarefas[indice]);
    if (method === "PUT") {
      if (!disciplinaExiste()) return responder(422, DISCIPLINA_INEXISTENTE);
      tarefas[indice] = { ...tarefas[indice], ...dados };
      return responder(200, tarefas[indice]);
    }
    if (method === "DELETE") {
      tarefas.splice(indice, 1);
      return responder(204);
    }
    return responder(405, { detail: "Method Not Allowed" });
  }

  const fetch = vi.fn(async (url, { method = "GET", body } = {}) => {
    const { pathname, searchParams } = new URL(url, "http://teste");
    const rota = pathname.match(/^\/api\/(disciplinas|atividades)\/(\d+)?$/);
    if (!rota) return responder(404, { detail: "Not Found" });
    const id = rota[2] ? Number(rota[2]) : null;
    const dados = body ? JSON.parse(body) : null;
    return rota[1] === "disciplinas"
      ? rotaDisciplinas(id, method, dados)
      : rotaAtividades(id, method, dados, searchParams);
  });

  // `recurso` opcional ("disciplinas" | "atividades") restringe pela URL.
  const chamadas = (metodo, recurso) =>
    fetch.mock.calls.filter(
      ([url, opcoes = {}]) =>
        (opcoes.method ?? "GET") === metodo &&
        (!recurso || url.startsWith(`/api/${recurso}/`)),
    );

  return { fetch, registros, tarefas, chamadas };
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

const atividade = (campos) => ({
  descricao: null,
  created_at: "2026-06-01T12:00:00Z",
  updated_at: "2026-06-01T12:00:00Z",
  ...campos,
});

// Com HOJE = 2026-06-15: so "Lista 1" esta atrasada (vencida e nao concluida).
export const LISTA = atividade({
  id: 1,
  disciplina_id: 1,
  titulo: "Lista 1",
  data_entrega: "2026-06-10",
  prioridade: "alta",
  status: "pendente",
});

export const PROVA = atividade({
  id: 2,
  disciplina_id: 1,
  titulo: "Prova 1",
  descricao: "Capítulos 1 a 3",
  data_entrega: "2026-06-01",
  prioridade: "alta",
  status: "concluida",
});

export const PROJETO = atividade({
  id: 3,
  disciplina_id: 2,
  titulo: "Projeto",
  data_entrega: "2026-06-15",
  prioridade: "baixa",
  status: "em_andamento",
});
