import { request } from "./api";

const PATH = "/atividades/";

// Mesmos valores do backend (backend/src/app/models/atividade.py); so o rotulo e daqui.
export const PRIORIDADES = [
  { valor: "baixa", rotulo: "Baixa" },
  { valor: "media", rotulo: "Média" },
  { valor: "alta", rotulo: "Alta" },
];

export const STATUS = [
  { valor: "pendente", rotulo: "Pendente" },
  { valor: "em_andamento", rotulo: "Em andamento" },
  { valor: "concluida", rotulo: "Concluída" },
];

export const rotuloDe = (opcoes, valor) =>
  opcoes.find((o) => o.valor === valor)?.rotulo ?? valor;

// Filtros vazios ficam fora da URL: a API so filtra pelo que for enviado.
function comFiltros(filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(
      ([, valor]) => valor !== "" && valor != null,
    ),
  );
  return params.size > 0 ? `${PATH}?${params}` : PATH;
}

export const listAtividades = (filtros) => request(comFiltros(filtros));

export const getAtividade = (id) => request(`${PATH}${id}`);

export const createAtividade = (dados) =>
  request(PATH, { method: "POST", body: dados });

export const updateAtividade = (id, dados) =>
  request(`${PATH}${id}`, { method: "PUT", body: dados });

export const deleteAtividade = (id) =>
  request(`${PATH}${id}`, { method: "DELETE" });

// A resposta nao traz "atrasada": quem decide e o filtro `atrasadas` do backend
// (regra e "hoje" de Brasilia ficam so la). Sem esse filtro na tela, uma 2a
// consulta com atrasadas=true marca quais itens da lista estao atrasados.
export async function listAtividadesComAtraso(filtros = {}) {
  if (filtros.atrasadas === "true" || filtros.atrasadas === "false") {
    const atividades = await listAtividades(filtros);
    const atrasada = filtros.atrasadas === "true";
    return atividades.map((a) => ({ ...a, atrasada }));
  }
  const [atividades, atrasadas] = await Promise.all([
    listAtividades(filtros),
    listAtividades({ ...filtros, atrasadas: "true" }),
  ]);
  const ids = new Set(atrasadas.map((a) => a.id));
  return atividades.map((a) => ({ ...a, atrasada: ids.has(a.id) }));
}

// "2026-12-10" -> "10/12/2026" sem passar por Date (evita trocar o dia pelo fuso).
export const formatarData = (iso) => iso.split("-").reverse().join("/");
