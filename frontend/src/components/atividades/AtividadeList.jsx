import {
  formatarData,
  PRIORIDADES,
  rotuloDe,
  STATUS,
} from "../../services/atividades";
import { Botao } from "../ui/Botao";

const COR_PRIORIDADE = {
  baixa: "bg-slate-100 text-slate-700",
  media: "bg-amber-100 text-amber-800",
  alta: "bg-red-100 text-red-800",
};

const COR_STATUS = {
  pendente: "bg-slate-100 text-slate-700",
  em_andamento: "bg-sky-100 text-sky-800",
  concluida: "bg-emerald-100 text-emerald-800",
};

function Etiqueta({ cor, children }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${cor}`}>
      {children}
    </span>
  );
}

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
                <Etiqueta cor={COR_PRIORIDADE[atividade.prioridade]}>
                  Prioridade{" "}
                  {rotuloDe(PRIORIDADES, atividade.prioridade).toLowerCase()}
                </Etiqueta>
                <Etiqueta cor={COR_STATUS[atividade.status]}>
                  {rotuloDe(STATUS, atividade.status)}
                </Etiqueta>
                {atividade.atrasada && (
                  <Etiqueta cor="bg-red-600 text-white">Atrasada</Etiqueta>
                )}
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
