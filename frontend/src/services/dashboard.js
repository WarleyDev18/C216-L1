import { request } from "./api";

// Contadores calculados no banco (GET /dashboard/resumo, Etapa 04).
export const getResumo = () => request("/dashboard/resumo");

export const percentualConcluido = ({ concluidas, total_atividades }) =>
  total_atividades > 0 ? Math.round((concluidas / total_atividades) * 100) : 0;

// A API nao ordena nem exclui status; aqui so organizamos o que ela devolveu.
// Abertas = nao concluidas, por prazo (datas ISO ordenam como texto).
export function separarEntregas(atividades, limite = 5) {
  const abertas = atividades
    .filter((a) => a.status !== "concluida")
    .sort(
      (a, b) => a.data_entrega.localeCompare(b.data_entrega) || a.id - b.id,
    );
  return {
    atrasadas: abertas.filter((a) => a.atrasada).slice(0, limite),
    proximas: abertas.filter((a) => !a.atrasada).slice(0, limite),
  };
}
