import { formatarData } from "../../services/atividades";
import { EtiquetasAtividade } from "../atividades/EtiquetasAtividade";

function ListaEntregas({ titulo, atividades, disciplinas, vazio }) {
  const disciplinaPorId = new Map(disciplinas.map((d) => [d.id, d]));

  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
        {titulo}
      </h4>
      {atividades.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">{vazio}</p>
      ) : (
        <ul
          aria-label={titulo}
          className="mt-2 divide-y divide-slate-200 rounded-md border border-slate-200"
        >
          {atividades.map((atividade) => {
            const disciplina = disciplinaPorId.get(atividade.disciplina_id);
            return (
              <li
                key={atividade.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">
                    {atividade.titulo}
                  </p>
                  <p className="text-sm text-slate-600">
                    {disciplina
                      ? `${disciplina.codigo} — ${disciplina.nome}`
                      : `Disciplina #${atividade.disciplina_id}`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-slate-700">
                    {formatarData(atividade.data_entrega)}
                  </span>
                  <EtiquetasAtividade atividade={atividade} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function UpcomingActivities({ entregas, disciplinas }) {
  return (
    <div className="flex flex-col gap-5">
      {entregas.atrasadas.length > 0 && (
        <ListaEntregas
          titulo="Atrasadas"
          atividades={entregas.atrasadas}
          disciplinas={disciplinas}
        />
      )}
      <ListaEntregas
        titulo="A vencer"
        atividades={entregas.proximas}
        disciplinas={disciplinas}
        vazio="Nenhuma entrega pendente a partir de hoje."
      />
    </div>
  );
}
