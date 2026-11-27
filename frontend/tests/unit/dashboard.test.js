import { describe, expect, it } from "vitest";
import {
  percentualConcluido,
  separarEntregas,
} from "../../src/services/dashboard";

describe("percentualConcluido", () => {
  it.each([
    [0, 0, 0],
    [0, 4, 0],
    [1, 4, 25],
    [1, 3, 33],
    [2, 3, 67],
    [5, 5, 100],
  ])("%i de %i -> %i%%", (concluidas, total_atividades, esperado) => {
    expect(percentualConcluido({ concluidas, total_atividades })).toBe(
      esperado,
    );
  });
});

describe("separarEntregas", () => {
  const a = (id, data_entrega, status = "pendente", atrasada = false) => ({
    id,
    data_entrega,
    status,
    atrasada,
  });

  it("ordena por prazo, separa atrasadas e ignora concluidas", () => {
    const resultado = separarEntregas([
      a(1, "2026-07-10"),
      a(2, "2026-06-01", "concluida"),
      a(3, "2026-06-05", "pendente", true),
      a(4, "2026-06-20", "em_andamento"),
      a(5, "2026-06-20"),
      a(6, "2026-05-30", "em_andamento", true),
    ]);

    expect(resultado.atrasadas.map((x) => x.id)).toEqual([6, 3]);
    // Mesmo prazo: desempata pelo id para a ordem ser estavel.
    expect(resultado.proximas.map((x) => x.id)).toEqual([4, 5, 1]);
  });

  it("respeita o limite e aceita lista vazia", () => {
    const muitas = Array.from({ length: 8 }, (_, i) => a(i, `2026-07-1${i}`));

    expect(separarEntregas(muitas, 3).proximas).toHaveLength(3);
    expect(separarEntregas([])).toEqual({ atrasadas: [], proximas: [] });
  });
});
