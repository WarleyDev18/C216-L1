import { Botao } from "../ui/Botao";

export function DisciplinaList({ disciplinas, onEditar, onExcluir }) {
  return (
    <ul
      aria-label="Disciplinas cadastradas"
      className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {disciplinas.map((disciplina) => (
        <li
          key={disciplina.id}
          className="flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{disciplina.nome}</p>
            <p className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="rounded bg-indigo-50 px-2 py-0.5 font-mono text-indigo-700">
                {disciplina.codigo}
              </span>
              <span>Semestre {disciplina.semestre}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Botao
              variante="secundario"
              onClick={() => onEditar(disciplina)}
              aria-label={`Editar ${disciplina.nome}`}
            >
              Editar
            </Botao>
            <Botao
              variante="secundario"
              className="text-red-700"
              onClick={() => onExcluir(disciplina)}
              aria-label={`Excluir ${disciplina.nome}`}
            >
              Excluir
            </Botao>
          </div>
        </li>
      ))}
    </ul>
  );
}
