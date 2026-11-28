import { PRIORIDADES, STATUS } from "../../services/atividades";
import { Botao } from "../ui/Botao";
import { Campo } from "../ui/Campo";

// Os nomes batem com os query parameters de GET /atividades/.
export const FILTROS_VAZIOS = {
  disciplina_id: "",
  prioridade: "",
  status: "",
  atrasadas: "",
};

export function AtividadeFilters({ filtros, disciplinas, onChange }) {
  const ativos = Object.values(filtros).some((v) => v !== "");

  function handleChange(event) {
    onChange({ ...filtros, [event.target.name]: event.target.value });
  }

  const select = (nome) => ({
    as: "select",
    name: nome,
    value: filtros[nome],
    onChange: handleChange,
  });

  return (
    <fieldset className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <legend className="px-1 text-sm font-semibold text-slate-700">
        Filtros
      </legend>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end">
        <Campo {...select("disciplina_id")} label="Filtrar por disciplina">
          <option value="">Todas as disciplinas</option>
          {disciplinas.map((d) => (
            <option key={d.id} value={d.id}>
              {d.codigo} — {d.nome}
            </option>
          ))}
        </Campo>
        <Campo {...select("prioridade")} label="Filtrar por prioridade">
          <option value="">Todas</option>
          {PRIORIDADES.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </Campo>
        <Campo {...select("status")} label="Filtrar por status">
          <option value="">Todos</option>
          {STATUS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.rotulo}
            </option>
          ))}
        </Campo>
        <Campo {...select("atrasadas")} label="Filtrar por prazo">
          <option value="">Todos os prazos</option>
          <option value="true">Somente atrasadas</option>
          <option value="false">Sem atraso</option>
        </Campo>
        <Botao
          variante="secundario"
          onClick={() => onChange(FILTROS_VAZIOS)}
          disabled={!ativos}
        >
          Limpar filtros
        </Botao>
      </div>
    </fieldset>
  );
}
