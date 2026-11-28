import { formatarData } from "../../services/atividades";
import { Botao } from "../ui/Botao";
import { EtiquetasAtividade } from "./EtiquetasAtividade";

export function AtividadeList({
  atividades,
  disciplinas,
  onEditar,
  onExcluir,
}) {
  const disciplinaPorId = new Map(disciplinas.map((d) => [d.id, d]));

  return (
    <ul
      aria-label="Atividades cadastradas"
      className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {atividades.map((atividade) => {
        const disciplina = disciplinaPorId.get(atividade.disciplina_id);
        return (
          <li
            key={atividade.id}
            className={`flex flex-wrap items-start justify-between gap-3 border-l-4 p-4 ${
              atividade.atrasada ? "border-l-red-500" : "border-l-transparent"
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-900">{atividade.titulo}</p>
              <p className="mt-0.5 text-sm text-slate-600">
                {disciplina
                  ? `${disciplina.codigo} — ${disciplina.nome}`
                  : `Disciplina #${atividade.disciplina_id}`}
              </p>
              {atividade.descricao && (
                <p className="mt-1 whitespace-pre-line text-sm text-slate-500">
                  {atividade.descricao}
                </p>
              )}
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span>Entrega: {formatarData(atividade.data_entrega)}</span>
                <EtiquetasAtividade atividade={atividade} />
              </p>
            </div>
            <div className="flex gap-2">
              <Botao
                variante="secundario"
                onClick={() => onEditar(atividade)}
                aria-label={`Editar ${atividade.titulo}`}
              >
                Editar
              </Botao>
              <Botao
                variante="secundario"
                className="text-red-700"
                onClick={() => onExcluir(atividade)}
                aria-label={`Excluir ${atividade.titulo}`}
              >
                Excluir
              </Botao>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
